[CmdletBinding()]
param(
  [string]$Database = 'hockey_advisor_migration_validation_m4_20260719',
  [int]$Port = 55434
)

$ErrorActionPreference = 'Stop'

if ($Database -notmatch '^hockey_advisor_migration_validation_[a-z0-9_]+$') {
  throw 'Database must be a dedicated disposable validation database name.'
}
if ($Port -lt 1024 -or $Port -gt 65535) { throw 'Port must be an unprivileged TCP port.' }
if (Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue) { throw "Port $Port is already in use." }

$RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$InstalledPostgres = 'C:\Program Files\PostgreSQL\18'
$TempBase = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar)
$TempRoot = Join-Path $TempBase ('hockey-advisor-m4-validation-' + [guid]::NewGuid().ToString('N'))
$RuntimeRoot = Join-Path $TempRoot 'postgresql'
$PostgresBin = Join-Path $RuntimeRoot 'bin'
$InitDb = Join-Path $PostgresBin 'initdb.exe'
$PgCtl = Join-Path $PostgresBin 'pg_ctl.exe'
$CreateDb = Join-Path $PostgresBin 'createdb.exe'
$DataDirectory = Join-Path $TempRoot 'data'
$LogPath = Join-Path $TempRoot 'postgres.log'
$PostgisArchive = Join-Path $TempRoot 'postgis-bundle.zip'
$PostgisExtract = Join-Path $TempRoot 'postgis-bundle'
$PostgisUrl = 'https://download.osgeo.org/postgis/windows/pg18/postgis-bundle-pg18-3.6.2x64.zip'
$PostgisMd5 = '9e28723541938d1b1a8efb59a5922741'
$ServerStarted = $false
$ServerStopped = $false
$ValidationSucceeded = $false

foreach ($Tool in @('initdb.exe', 'pg_ctl.exe', 'createdb.exe', 'psql.exe', 'pg_dump.exe')) {
  $Tool = Join-Path (Join-Path $InstalledPostgres 'bin') $Tool
  if (-not (Test-Path -LiteralPath $Tool)) { throw "Required PostgreSQL tool is missing: $Tool" }
}

try {
  New-Item -ItemType Directory -Path $TempRoot -Force | Out-Null
  Copy-Item -LiteralPath $InstalledPostgres -Destination $RuntimeRoot -Recurse

  $CachedPostgisArchive = Get-ChildItem -LiteralPath $TempBase -Directory -Filter 'hockey-advisor-*-validation-*' -ErrorAction SilentlyContinue |
    ForEach-Object { Join-Path $_.FullName 'postgis-bundle.zip' } |
    Where-Object { $_ -ne $PostgisArchive -and (Test-Path -LiteralPath $_) } |
    Where-Object { (Get-FileHash -Algorithm MD5 -LiteralPath $_).Hash.ToLowerInvariant() -eq $PostgisMd5 } |
    Select-Object -First 1
  if ($CachedPostgisArchive) {
    Copy-Item -LiteralPath $CachedPostgisArchive -Destination $PostgisArchive
  } else {
    Invoke-WebRequest -Uri $PostgisUrl -OutFile $PostgisArchive -UseBasicParsing
  }
  $ActualPostgisMd5 = (Get-FileHash -Algorithm MD5 -LiteralPath $PostgisArchive).Hash.ToLowerInvariant()
  if ($ActualPostgisMd5 -ne $PostgisMd5) { throw 'Official PostGIS bundle checksum mismatch.' }
  Expand-Archive -LiteralPath $PostgisArchive -DestinationPath $PostgisExtract

  $PostgisControl = Get-ChildItem -LiteralPath $PostgisExtract -Filter 'postgis.control' -File -Recurse | Select-Object -First 1
  if ($null -eq $PostgisControl) { throw 'Verified PostGIS bundle does not contain postgis.control.' }
  $BundleRoot = Split-Path (Split-Path $PostgisControl.DirectoryName -Parent) -Parent
  Copy-Item -Path (Join-Path $BundleRoot '*') -Destination $RuntimeRoot -Recurse -Force
  if (-not (Test-Path -LiteralPath (Join-Path $RuntimeRoot 'share\extension\postgis.control'))) {
    throw 'PostGIS bundle did not overlay the disposable PostgreSQL runtime correctly.'
  }

  $env:PATH = $PostgresBin + [IO.Path]::PathSeparator + $env:PATH
  New-Item -ItemType Directory -Path $DataDirectory -Force | Out-Null
  & $InitDb --pgdata=$DataDirectory --username=postgres --auth=trust --encoding=UTF8 --no-locale | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Could not initialize the disposable PostgreSQL cluster.' }

  $StartArguments = @(
    '-D', ('"' + $DataDirectory + '"'),
    '-l', ('"' + $LogPath + '"'),
    '-o', ('"-h 127.0.0.1 -p ' + $Port + '"'),
    '-w', 'start'
  )
  $StartResult = Start-Process -FilePath $PgCtl -ArgumentList $StartArguments -NoNewWindow -PassThru
  $StartResult.WaitForExit()
  if ($StartResult.ExitCode -ne 0) { throw 'Could not start the disposable PostgreSQL cluster.' }
  $ServerStarted = $true

  & $CreateDb -w -h 127.0.0.1 -p $Port -U postgres $Database
  if ($LASTEXITCODE -ne 0) { throw 'Could not create the disposable validation database.' }

  Push-Location $RepositoryRoot
  try {
    $PreviousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & node scripts/database/validate-fresh-bootstrap.mjs --database $Database --port $Port
    $ValidationExitCode = $LASTEXITCODE
    $ErrorActionPreference = $PreviousErrorActionPreference
    if ($ValidationExitCode -ne 0) { throw "Fresh-bootstrap validation failed with exit code $ValidationExitCode." }
    $ValidationSucceeded = $true
  } finally {
    $ErrorActionPreference = 'Stop'
    Pop-Location
  }
} finally {
  if ($ServerStarted) {
    $StopArguments = @('-D', ('"' + $DataDirectory + '"'), '-w', 'stop', '-m', 'fast')
    $StopResult = Start-Process -FilePath $PgCtl -ArgumentList $StopArguments -NoNewWindow -PassThru
    $StopResult.WaitForExit()
    if ($StopResult.ExitCode -ne 0) { Write-Error 'Disposable PostgreSQL server did not stop cleanly.' }
    $ServerStopped = $StopResult.ExitCode -eq 0
  }

  $ResolvedTempRoot = [IO.Path]::GetFullPath($TempRoot)
  $ExpectedPrefix = $TempBase + [IO.Path]::DirectorySeparatorChar + 'hockey-advisor-m4-validation-'
  if (-not $ResolvedTempRoot.StartsWith($ExpectedPrefix, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Refusing to remove an unverified disposable-cluster path.'
  }
  if ($ValidationSucceeded -and $ServerStopped -and (Test-Path -LiteralPath $ResolvedTempRoot)) {
    Remove-Item -LiteralPath $ResolvedTempRoot -Recurse -Force
  } elseif (Test-Path -LiteralPath $ResolvedTempRoot) {
    Write-Warning "Preserved failed disposable runtime for diagnosis: $ResolvedTempRoot"
  }
}
