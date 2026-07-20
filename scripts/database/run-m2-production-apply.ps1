[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('APPROVE M2 PRODUCTION MIGRATION')]
  [string]$Approval,
  [switch]$ResumePostVerification
)

$ErrorActionPreference = 'Stop'

$ProjectRef = 'dqskdrqubqnhdssxpryx'
$PoolerHost = 'aws-1-ca-central-1.pooler.supabase.com'
$PoolerPort = 5432
$DatabaseUser = "postgres.$ProjectRef"
$DatabaseName = 'postgres'
$M1Version = '20260719000000'
$M1Name = 'production_company_baseline'
$M1Filename = "${M1Version}_${M1Name}.sql"
$M1Sha256 = '4b65fa234b56534985f249cc8061efd98b05ba927c5de130839b8fd35c1d1db8'
$M2Version = '20260719000001'
$M2Name = 'add_companies_updated_at_trigger'
$M2Filename = "${M2Version}_${M2Name}.sql"
$M2Sha256 = '95fb374bb07c5a4941b3dd78e6a6db9bf5b4b456c15670fb3ac9805e3a81b547'
$SupabaseCliVersion = '2.109.1'
$ExpectedBranch = 'codex/restart-foundation'
$RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$PostgresBin = 'C:\Program Files\PostgreSQL\18\bin'
$Psql = Join-Path $PostgresBin 'psql.exe'
$PgDump = Join-Path $PostgresBin 'pg_dump.exe'
$PgDumpAll = Join-Path $PostgresBin 'pg_dumpall.exe'
$PgRestore = Join-Path $PostgresBin 'pg_restore.exe'
$ProtectedRootName = @('HockeyAdvisorDirectory', 'Backups') -join '-'
$BackupRoot = Join-Path $env:USERPROFILE (Join-Path $ProtectedRootName 'production')
$ApprovedPreflightDirectory = $null
$CliWorkDirectory = $null
$CredentialUrlPattern = @('postgres', '(?:ql)?', '://[^\s@]+:[^\s@]+@') -join ''
$Timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$PostPackageName = "advisor-directory-production-post-m2-$Timestamp"
$PostDirectory = Join-Path $BackupRoot $PostPackageName
$ArchivePath = Join-Path $PostDirectory "production-post-m2-$Timestamp.dump"
$SchemaPath = Join-Path $PostDirectory "production-schema-$Timestamp.sql"
$DataStreamPath = Join-Path $PostDirectory 'data-stream-validation.sql'
$ArchiveContentsPath = Join-Path $PostDirectory 'archive-contents.txt'
$RolesPath = Join-Path $PostDirectory "roles-$Timestamp.sql"
$PasswordPointer = [IntPtr]::Zero
$SecurePassword = $null
$ApplySucceeded = $false

function Assert-LastExitCode([string]$Message) {
  if ($LASTEXITCODE -ne 0) { throw $Message }
}

function Invoke-ReadOnlyScalar([string]$Sql) {
  $Output = & $Psql @script:PsqlArguments -Atq --command "BEGIN READ ONLY; $Sql; ROLLBACK;"
  Assert-LastExitCode 'Read-only production query failed.'
  return (($Output | Where-Object { $_ -ne '' }) -join "`n").Trim()
}

function Export-ReadOnlyCsv([string]$Name, [string]$Query) {
  $Path = Join-Path $PostDirectory $Name
  $Output = & $Psql @script:PsqlArguments -q --command "BEGIN READ ONLY; COPY ($Query) TO STDOUT WITH (FORMAT csv, HEADER true); ROLLBACK;"
  Assert-LastExitCode "Could not export $Name."
  $Output | Set-Content -Encoding utf8 -LiteralPath $Path
  if (-not (Test-Path -LiteralPath $Path) -or (Get-Item -LiteralPath $Path).Length -eq 0) { throw "Empty catalog export: $Name" }
}

function Invoke-SupabaseCli([string[]]$CliArguments, [string]$FailureMessage) {
  $PreviousErrorActionPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    $Output = & npx @CliArguments 2>&1
    $ExitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $PreviousErrorActionPreference
  }
  if ($ExitCode -ne 0) { throw "$FailureMessage Native exit code: $ExitCode." }
  return @($Output | ForEach-Object { $_.ToString() })
}

function Write-EvidenceChecksumManifest {
  Get-ChildItem -LiteralPath $PostDirectory -File -Recurse | Where-Object { $_.Name -ne 'SHA256SUMS.txt' } |
    Sort-Object FullName | ForEach-Object {
      $Hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()
      $RelativeName = $_.FullName.Substring($PostDirectory.Length + 1)
      "$Hash *$RelativeName"
    } | Set-Content -Encoding ascii -LiteralPath (Join-Path $PostDirectory 'SHA256SUMS.txt')
}

function Get-ApplicationCounts {
  return (Invoke-ReadOnlyScalar @"
SELECT json_build_object(
  'companies', (SELECT count(*) FROM public.companies),
  'advisors', (SELECT count(*) FROM public.advisors),
  'listing_claims', (SELECT count(*) FROM public.listing_claims),
  'media_content', (SELECT count(*) FROM public.media_content),
  'users', (SELECT count(*) FROM public.users)
)::text
"@) | ConvertFrom-Json
}

function Assert-ExpectedCounts($Counts, [string]$Phase) {
  $ExpectedCounts = [ordered]@{ companies = 202; advisors = 177; listing_claims = 0; media_content = 0; users = 0 }
  foreach ($Name in $ExpectedCounts.Keys) {
    if ([int64]$Counts.$Name -ne $ExpectedCounts[$Name]) { throw "$Phase count differs for public.$Name." }
  }
}

function Get-TimestampFunctionObservation {
  return (Invoke-ReadOnlyScalar @"
SELECT json_build_object(
  'exists', p.oid IS NOT NULL,
  'kind_matches', p.prokind = 'f',
  'argument_count_matches', p.pronargs = 0 AND p.pronargdefaults = 0,
  'return_matches', NOT p.proretset AND p.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype,
  'language_matches', l.lanname = 'plpgsql',
  'volatility_matches', p.provolatile = 'v',
  'parallel_safety_matches', p.proparallel = 'u',
  'strictness_matches', NOT p.proisstrict,
  'security_matches', NOT p.prosecdef,
  'leakproof_matches', NOT p.proleakproof,
  'configuration_matches', p.proconfig IS NULL,
  'owner_matches', pg_catalog.pg_get_userbyid(p.proowner) = 'postgres',
  'body_matches', pg_catalog.replace(pg_catalog.btrim(p.prosrc, E' \t\r\n'), E'\r\n', E'\n') = E'BEGIN\n  NEW.updated_at := NOW();\n  RETURN NEW;\nEND;'
)
  FROM (SELECT to_regprocedure('public.update_updated_at_column()') AS oid) target
  LEFT JOIN pg_catalog.pg_proc p ON p.oid = target.oid
  LEFT JOIN pg_catalog.pg_language l ON l.oid = p.prolang
"@) | ConvertFrom-Json
}

function Assert-TimestampFunction([string]$Phase) {
  $Observation = Get-TimestampFunctionObservation
  $Properties = @(
    'exists', 'kind_matches', 'argument_count_matches', 'return_matches', 'language_matches',
    'volatility_matches', 'parallel_safety_matches', 'strictness_matches', 'security_matches',
    'leakproof_matches', 'configuration_matches', 'owner_matches', 'body_matches'
  )
  $Mismatches = @($Properties | Where-Object { $Observation.$_ -ne $true })
  if ($Mismatches.Count -ne 0) { throw "$Phase timestamp function mismatch: $($Mismatches -join ', ')." }
}

foreach ($Tool in @($Psql, $PgDump, $PgDumpAll, $PgRestore)) {
  if (-not (Test-Path -LiteralPath $Tool)) { throw "Required PostgreSQL tool is missing: $Tool" }
}
if ($Approval -ne 'APPROVE M2 PRODUCTION MIGRATION') { throw 'Exact M2 approval phrase was not supplied.' }

$BackupRootResolved = [IO.Path]::GetFullPath($BackupRoot)
$RepositoryResolved = [IO.Path]::GetFullPath($RepositoryRoot)
if ($BackupRootResolved.StartsWith($RepositoryResolved, [StringComparison]::OrdinalIgnoreCase)) { throw 'Protected backup root must be outside the repository.' }
if ($BackupRootResolved -like '*OneDrive*') { throw 'Protected backup root must be outside OneDrive.' }
if (Test-Path -LiteralPath $PostDirectory) { throw 'Fresh post-M2 evidence directory is not unused.' }

$PreflightCandidates = @(Get-ChildItem -LiteralPath $BackupRoot -Directory | Sort-Object CreationTime -Descending)
foreach ($Candidate in $PreflightCandidates) {
  $CandidateSummaryPath = Join-Path $Candidate.FullName 'preflight-summary.json'
  if (-not (Test-Path -LiteralPath $CandidateSummaryPath)) { continue }
  try { $CandidateSummary = Get-Content -Raw -LiteralPath $CandidateSummaryPath | ConvertFrom-Json } catch { continue }
  if ($CandidateSummary.status -eq 'success' -and
      $CandidateSummary.project_ref -eq $ProjectRef -and
      $CandidateSummary.m1_sha256 -eq $M1Sha256 -and $CandidateSummary.m2_sha256 -eq $M2Sha256 -and
      $CandidateSummary.production_changes_made -eq $false -and
      @($CandidateSummary.migration_history).Count -eq 1 -and
      $CandidateSummary.migration_history[0].version -eq $M1Version -and
      @($CandidateSummary.dry_run_migrations).Count -eq 1 -and
      $CandidateSummary.dry_run_migrations[0] -eq $M2Filename) {
    $ApprovedPreflightDirectory = $Candidate.FullName
    break
  }
}
if ($null -eq $ApprovedPreflightDirectory) { throw 'Validated successful M2 preflight package is missing.' }
$CliWorkDirectory = Join-Path $ApprovedPreflightDirectory 'm2-cli-work'
if (-not (Test-Path -LiteralPath $CliWorkDirectory)) { throw 'Validated M2 CLI work directory is missing.' }

Push-Location $RepositoryRoot
try {
  $Branch = (git branch --show-current).Trim()
  if ($Branch -ne $ExpectedBranch) { throw "Branch differs from $ExpectedBranch." }
  $StagedBefore = @(git diff --cached --name-only)
  if ($StagedBefore.Count -ne 0) { throw 'Repository has staged files.' }
  $WorktreeBeforeText = @(git status --porcelain=v1) -join "`n"

  $M1Path = Join-Path $RepositoryRoot "supabase\migrations\$M1Filename"
  $M2Path = Join-Path $RepositoryRoot "supabase\migrations\$M2Filename"
  $CliM1Path = Join-Path $CliWorkDirectory "supabase\migrations\$M1Filename"
  $CliM2Path = Join-Path $CliWorkDirectory "supabase\migrations\$M2Filename"
  foreach ($HashCheck in @(
    @($M1Path, $M1Sha256, 'Repository M1'), @($M2Path, $M2Sha256, 'Repository M2'),
    @($CliM1Path, $M1Sha256, 'CLI-work M1'), @($CliM2Path, $M2Sha256, 'CLI-work M2')
  )) {
    if (-not (Test-Path -LiteralPath $HashCheck[0]) -or (Get-FileHash -Algorithm SHA256 -LiteralPath $HashCheck[0]).Hash.ToLowerInvariant() -ne $HashCheck[1]) {
      throw "$($HashCheck[2]) hash differs from the reviewed value."
    }
  }

  & node scripts/database/validate-production-evidence.mjs $ApprovedPreflightDirectory --target baseline
  Assert-LastExitCode 'Approved M2 preflight evidence no longer validates.'
  & node scripts/database/validate-migrations.mjs
  Assert-LastExitCode 'Repository migration validation failed.'
  & node scripts/database/test-validation-rules.mjs
  Assert-LastExitCode 'Repository negative-rule validation failed.'

  $SecurePassword = Read-Host 'Enter the PRODUCTION Supabase database password for the APPROVED M2 migration' -AsSecureString
  $PasswordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($PasswordPointer)

  $script:PsqlArguments = @(
    '-X', '-w', '-h', $PoolerHost, '-p', $PoolerPort, '-U', $DatabaseUser,
    '-d', $DatabaseName, '--set', 'ON_ERROR_STOP=1', '--set', 'VERBOSITY=terse'
  )

  $IdentityBefore = (Invoke-ReadOnlyScalar @"
SELECT json_build_object(
  'database', current_database(), 'connected_user', current_user,
  'server_version', current_setting('server_version'),
  'server_address', inet_server_addr()::text, 'server_port', inet_server_port()
)::text
"@) | ConvertFrom-Json
  if ($IdentityBefore.database -ne $DatabaseName -or $IdentityBefore.connected_user -ne 'postgres') { throw 'Pre-apply production identity is ambiguous.' }

  $HistoryBefore = (Invoke-ReadOnlyScalar "SELECT coalesce(json_agg(json_build_object('version', version, 'name', name) ORDER BY version)::text, '[]') FROM supabase_migrations.schema_migrations") | ConvertFrom-Json
  $HistoryBeforeCount = @($HistoryBefore).Count
  $HistoryIsM1Only = $HistoryBeforeCount -eq 1 -and $HistoryBefore[0].version -eq $M1Version -and $HistoryBefore[0].name -eq $M1Name
  $HistoryIsM1M2 = $HistoryBeforeCount -eq 2 -and
    $HistoryBefore[0].version -eq $M1Version -and $HistoryBefore[0].name -eq $M1Name -and
    $HistoryBefore[1].version -eq $M2Version -and $HistoryBefore[1].name -eq $M2Name
  if ($ResumePostVerification) {
    if (-not $HistoryIsM1M2) { throw 'Verification-resume mode requires exact already-applied M1+M2 history.' }
    $ApplySucceeded = $true
  } elseif (-not $HistoryIsM1Only) {
    throw 'Apply mode requires exact M1-only history; use verification-resume mode only for exact M1+M2 state.'
  }

  $CompaniesShapeMatches = Invoke-ReadOnlyScalar @"
SELECT to_regclass('public.companies') IS NOT NULL
   AND EXISTS (
     SELECT 1 FROM pg_catalog.pg_attribute
      WHERE attrelid = to_regclass('public.companies') AND attname = 'updated_at'
        AND attnum > 0 AND NOT attisdropped
        AND atttypid = 'pg_catalog.timestamptz'::pg_catalog.regtype AND atttypmod = -1
   )
"@
  if ($CompaniesShapeMatches -ne 't') { throw 'Pre-apply companies/updated_at prerequisite differs.' }
  Assert-TimestampFunction 'Pre-apply'

  $CountsBefore = Get-ApplicationCounts
  Assert-ExpectedCounts $CountsBefore 'Workflow-start'

  New-Item -ItemType Directory -Path $PostDirectory | Out-Null
  $MigrationCopies = Join-Path $PostDirectory 'applied-migrations'
  New-Item -ItemType Directory -Path $MigrationCopies | Out-Null
  Copy-Item -LiteralPath $M1Path,$M2Path -Destination $MigrationCopies

  if ($ResumePostVerification) {
    $PriorApplyDirectory = Get-ChildItem -LiteralPath $BackupRoot -Directory -Filter 'advisor-directory-production-post-m2-*' |
      Where-Object { $_.FullName -ne $PostDirectory -and (Test-Path -LiteralPath (Join-Path $_.FullName 'm2-apply-output.txt')) } |
      Sort-Object CreationTime -Descending | Select-Object -First 1
    if ($null -eq $PriorApplyDirectory) { throw 'Verification-resume mode cannot find the protected approved apply output.' }
    Copy-Item -LiteralPath (Join-Path $PriorApplyDirectory.FullName 'm2-apply-output.txt') -Destination (Join-Path $PostDirectory 'm2-apply-output.txt')
    $PriorDryRun = Join-Path $PriorApplyDirectory.FullName 'immediate-pre-apply-dry-run.txt'
    if (Test-Path -LiteralPath $PriorDryRun) { Copy-Item -LiteralPath $PriorDryRun -Destination (Join-Path $PostDirectory 'immediate-pre-apply-dry-run.txt') }
    @{
      success = $false; status = 'verifying_applied_m2'; production_changes_made = $true;
      approved_migration = $M2Filename; approval = $Approval; apply_reinvoked = $false
    } | ConvertTo-Json | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'status.json')
  } else {
    $TriggerCountBefore = [int](Invoke-ReadOnlyScalar @"
SELECT count(*) FROM pg_catalog.pg_trigger t
 WHERE t.tgrelid = to_regclass('public.companies') AND NOT t.tgisinternal
   AND (t.tgname = 'update_companies_updated_at'
        OR (t.tgfoid = to_regprocedure('public.update_updated_at_column()') AND (t.tgtype & 16) = 16))
"@)
    if ($TriggerCountBefore -ne 0) { throw 'Pre-apply intended or equivalent companies trigger already exists.' }

    $DatabaseUrlScheme = @('postgresql', '://') -join ''
    $PasswordlessDbUrl = "${DatabaseUrlScheme}${DatabaseUser}@${PoolerHost}:${PoolerPort}/${DatabaseName}?sslmode=require"
    $DryRunOutput = Invoke-SupabaseCli @(
      '--yes', "supabase@$SupabaseCliVersion", '--workdir', $CliWorkDirectory,
      'db', 'push', '--dry-run', '--db-url', $PasswordlessDbUrl
    ) 'Immediate pinned Supabase CLI dry run failed.'
    $DryRunText = $DryRunOutput -join "`n"
    $DryRunMigrations = @([regex]::Matches($DryRunText, '\b\d{14}_[a-z0-9_]+\.sql\b') | ForEach-Object { $_.Value } | Sort-Object -Unique)
    if ($DryRunMigrations.Count -ne 1 -or $DryRunMigrations[0] -ne $M2Filename) { throw 'Immediate dry run does not contain exactly reviewed M2.' }
    if ($DryRunText.Contains($env:PGPASSWORD) -or $DryRunText -match $CredentialUrlPattern) { throw 'Dry-run output unexpectedly contains credentials.' }

    $SiteBefore = Invoke-WebRequest -Uri 'https://www.thehockeydirectory.com/' -UseBasicParsing -TimeoutSec 30
    $ApiBefore = Invoke-RestMethod -Uri 'https://www.thehockeydirectory.com/api/advisors?limit=1' -Method Get -TimeoutSec 30
    if ($SiteBefore.StatusCode -ne 200 -or [int64]$ApiBefore.pagination.total -ne 202 -or @($ApiBefore.advisors).Count -ne 1) { throw 'Immediate pre-apply public smoke test failed.' }

    $DryRunText | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'immediate-pre-apply-dry-run.txt')
    @{
      success = $false; status = 'applying'; production_changes_made = $false;
      approved_migration = $M2Filename; approval = $Approval
    } | ConvertTo-Json | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'status.json')

    $ApplyOutput = Invoke-SupabaseCli @(
      '--yes', "supabase@$SupabaseCliVersion", '--workdir', $CliWorkDirectory,
      'db', 'push', '--db-url', $PasswordlessDbUrl
    ) 'Approved pinned Supabase CLI M2 application failed.'
    $ApplyText = $ApplyOutput -join "`n"
    if ($ApplyText.Contains($env:PGPASSWORD) -or $ApplyText -match $CredentialUrlPattern) { throw 'Apply output unexpectedly contains credentials.' }
    $AppliedMigrations = @([regex]::Matches($ApplyText, '\b\d{14}_[a-z0-9_]+\.sql\b') | ForEach-Object { $_.Value } | Sort-Object -Unique)
    if ($AppliedMigrations.Count -ne 1 -or $AppliedMigrations[0] -ne $M2Filename) { throw 'Apply output does not identify exactly reviewed M2.' }
    $ApplySucceeded = $true
    $ApplyText | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'm2-apply-output.txt')
  }

  $IdentityAfter = (Invoke-ReadOnlyScalar "SELECT json_build_object('database', current_database(), 'connected_user', current_user, 'server_version', current_setting('server_version'), 'server_address', inet_server_addr()::text, 'server_port', inet_server_port())::text") | ConvertFrom-Json
  if ($IdentityAfter.database -ne $DatabaseName -or $IdentityAfter.connected_user -ne 'postgres') { throw 'Post-apply production identity is ambiguous.' }
  $HistoryAfter = (Invoke-ReadOnlyScalar "SELECT coalesce(json_agg(json_build_object('version', version, 'name', name) ORDER BY version)::text, '[]') FROM supabase_migrations.schema_migrations") | ConvertFrom-Json
  if (@($HistoryAfter).Count -ne 2 -or
      $HistoryAfter[0].version -ne $M1Version -or $HistoryAfter[0].name -ne $M1Name -or
      $HistoryAfter[1].version -ne $M2Version -or $HistoryAfter[1].name -ne $M2Name) {
    throw 'Post-apply migration history is not exact M1+M2 state.'
  }
  Assert-TimestampFunction 'Post-apply'

  $TriggerAfter = (Invoke-ReadOnlyScalar @"
SELECT json_build_object(
  'count', count(*),
  'name_matches', bool_and(t.tgname = 'update_companies_updated_at'),
  'enabled_matches', bool_and(t.tgenabled = 'O'),
  'function_matches', bool_and(t.tgfoid = to_regprocedure('public.update_updated_at_column()')),
  'row_matches', bool_and((t.tgtype & 1) = 1),
  'before_matches', bool_and((t.tgtype & 2) = 2),
  'update_matches', bool_and((t.tgtype & 16) = 16),
  'other_events_absent', bool_and((t.tgtype & 108) = 0),
  'definition', max(pg_catalog.pg_get_triggerdef(t.oid, false))
)
  FROM pg_catalog.pg_trigger t
 WHERE t.tgrelid = to_regclass('public.companies') AND NOT t.tgisinternal
"@) | ConvertFrom-Json
  if ([int]$TriggerAfter.count -ne 1 -or
      $TriggerAfter.name_matches -ne $true -or $TriggerAfter.enabled_matches -ne $true -or
      $TriggerAfter.function_matches -ne $true -or $TriggerAfter.row_matches -ne $true -or
      $TriggerAfter.before_matches -ne $true -or $TriggerAfter.update_matches -ne $true -or
      $TriggerAfter.other_events_absent -ne $true) { throw 'Post-apply companies trigger metadata differs from exact M2.' }

  $CountsAfter = Get-ApplicationCounts
  Assert-ExpectedCounts $CountsAfter 'Post-apply'
  foreach ($Name in @('companies','advisors','listing_claims','media_content','users')) {
    if ([int64]$CountsAfter.$Name -ne [int64]$CountsBefore.$Name) { throw "Application count changed during M2 for public.$Name." }
  }

  [pscustomobject]@{
    database_name = $IdentityAfter.database; connected_user = $IdentityAfter.connected_user;
    server_version = $IdentityAfter.server_version; captured_at_utc = (Get-Date).ToUniversalTime().ToString('o');
    expected_project_ref = $ProjectRef; pooler_route = $PoolerHost; identity_match = $true
  } | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'server-info.csv')

  & $PgDump -w -h $PoolerHost -p $PoolerPort -U $DatabaseUser -d $DatabaseName --format=custom --compress=9 --file=$ArchivePath
  Assert-LastExitCode 'Post-M2 protected production archive failed.'
  & $PgDumpAll -w -h $PoolerHost -p $PoolerPort -U $DatabaseUser -l $DatabaseName --roles-only --no-role-passwords --file=$RolesPath
  Assert-LastExitCode 'Post-M2 roles export failed.'
  & $PgRestore --list --file=$ArchiveContentsPath $ArchivePath
  Assert-LastExitCode 'Post-M2 archive listing validation failed.'
  & $PgRestore --schema-only --file=$SchemaPath $ArchivePath
  Assert-LastExitCode 'Post-M2 archive schema stream validation failed.'
  & $PgRestore --data-only --file=$DataStreamPath $ArchivePath
  Assert-LastExitCode 'Post-M2 archive data stream validation failed.'

  Export-ReadOnlyCsv 'tables.csv' @"
SELECT n.nspname AS schema_name, c.relname AS table_name,
       CASE c.relkind WHEN 'r' THEN 'table' WHEN 'p' THEN 'partitioned table' ELSE c.relkind::text END AS table_type,
       pg_catalog.pg_get_userbyid(c.relowner) AS owner, c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced, c.reltuples::bigint AS estimated_rows,
       pg_catalog.pg_total_relation_size(c.oid) AS total_bytes
  FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
 WHERE c.relkind IN ('r','p') ORDER BY 1,2
"@
  Export-ReadOnlyCsv 'columns.csv' @"
SELECT table_schema AS schema_name, table_name, ordinal_position, column_name, data_type,
       udt_schema, udt_name, is_nullable, column_default
  FROM information_schema.columns ORDER BY 1,2,3
"@
  Export-ReadOnlyCsv 'relationships-and-constraints.csv' @"
SELECT n.nspname AS schema_name, c.relname AS table_name, con.conname AS constraint_name,
       CASE con.contype WHEN 'c' THEN 'check' WHEN 'f' THEN 'foreign key' WHEN 'p' THEN 'primary key'
            WHEN 'u' THEN 'unique' WHEN 'x' THEN 'exclusion' ELSE con.contype::text END AS constraint_type,
       rn.nspname AS referenced_schema, rc.relname AS referenced_table,
       pg_catalog.pg_get_constraintdef(con.oid, true) AS definition
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_catalog.pg_class rc ON rc.oid = con.confrelid
  LEFT JOIN pg_catalog.pg_namespace rn ON rn.oid = rc.relnamespace
 ORDER BY 1,2,3
"@
  Export-ReadOnlyCsv 'rls-policies.csv' @"
SELECT n.nspname AS schema_name, c.relname AS table_name, p.polname AS policy_name,
       p.polpermissive AS permissive,
       ARRAY(SELECT pg_catalog.pg_get_userbyid(role_oid) FROM unnest(p.polroles) role_oid ORDER BY 1)::text AS roles,
       p.polcmd AS cmd, pg_catalog.pg_get_expr(p.polqual, p.polrelid) AS qual,
       pg_catalog.pg_get_expr(p.polwithcheck, p.polrelid) AS with_check
  FROM pg_catalog.pg_policy p
  JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
 ORDER BY 1,2,3
"@
  Export-ReadOnlyCsv 'functions.csv' @"
SELECT n.nspname AS schema_name, p.proname AS function_name,
       pg_catalog.pg_get_function_identity_arguments(p.oid) AS identity_arguments,
       pg_catalog.pg_get_function_result(p.oid) AS result_type, l.lanname AS language,
       p.prosecdef AS security_definer, p.provolatile AS volatility,
       pg_catalog.pg_get_userbyid(p.proowner) AS owner, pg_catalog.pg_get_functiondef(p.oid) AS definition
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_catalog.pg_language l ON l.oid = p.prolang
 WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') AND p.prokind = 'f'
 ORDER BY 1,2,3
"@
  Export-ReadOnlyCsv 'triggers.csv' @"
SELECT n.nspname AS schema_name, c.relname AS table_name, t.tgname AS trigger_name,
       t.tgenabled AS enabled_state, pg_catalog.pg_get_triggerdef(t.oid, true) AS definition
  FROM pg_catalog.pg_trigger t
  JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
 WHERE NOT t.tgisinternal ORDER BY 1,2,3
"@
  Export-ReadOnlyCsv 'table-privileges.csv' @"
SELECT grantor, grantee, table_schema, table_name, privilege_type, is_grantable
  FROM information_schema.table_privileges ORDER BY 3,4,2,5
"@
  Export-ReadOnlyCsv 'exact-row-counts.csv' @"
SELECT 'public'::text AS schema_name, 'advisors'::text AS table_name, count(*)::bigint AS exact_row_count FROM public.advisors
UNION ALL SELECT 'public','companies',count(*) FROM public.companies
UNION ALL SELECT 'public','listing_claims',count(*) FROM public.listing_claims
UNION ALL SELECT 'public','media_content',count(*) FROM public.media_content
UNION ALL SELECT 'public','users',count(*) FROM public.users
ORDER BY 1,2
"@
  Export-ReadOnlyCsv 'migration-history-status.csv' @"
SELECT (to_regclass('supabase_migrations.schema_migrations') IS NOT NULL)::text AS standard_migration_table_present,
       'supabase_migrations.schema_migrations'::text AS expected_relation
"@
  Export-ReadOnlyCsv 'migration-history-versions.csv' @"
SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version
"@

  $ArchiveEntries = @(Get-Content -LiteralPath $ArchiveContentsPath | Where-Object { $_.Trim() -and -not $_.StartsWith(';') }).Count
  if ($ArchiveEntries -ne 1322) { throw "Post-M2 archive has $ArchiveEntries entries instead of exact current-target count 1322." }

  $SiteAfter = Invoke-WebRequest -Uri 'https://www.thehockeydirectory.com/' -UseBasicParsing -TimeoutSec 30
  $ApiAfter = Invoke-RestMethod -Uri 'https://www.thehockeydirectory.com/api/advisors?limit=1' -Method Get -TimeoutSec 30
  if ($SiteAfter.StatusCode -ne 200 -or [int64]$ApiAfter.pagination.total -ne 202 -or @($ApiAfter.advisors).Count -ne 1) { throw 'Post-M2 public smoke test failed.' }

  if (@(git diff --cached --name-only).Count -ne 0) { throw 'Apply workflow unexpectedly staged repository files.' }
  if ((@(git status --porcelain=v1) -join "`n") -ne $WorktreeBeforeText) { throw 'Repository worktree changed during M2 apply workflow.' }
  if ((git branch --show-current).Trim() -ne $ExpectedBranch) { throw 'Branch changed during M2 apply workflow.' }
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $M1Path).Hash.ToLowerInvariant() -ne $M1Sha256 -or
      (Get-FileHash -Algorithm SHA256 -LiteralPath $M2Path).Hash.ToLowerInvariant() -ne $M2Sha256) { throw 'Migration hashes changed during M2 apply workflow.' }

  & node scripts/database/validate-migrations.mjs
  Assert-LastExitCode 'Post-M2 repository validation failed.'
  & node scripts/database/test-validation-rules.mjs
  Assert-LastExitCode 'Post-M2 negative-rule validation failed.'

  $PostSummary = [ordered]@{
    status = 'success'; captured_at_utc = (Get-Date).ToUniversalTime().ToString('o');
    project_ref = $ProjectRef; routed_identity_match = $true;
    migration_history = @(
      @{ version = $M1Version; name = $M1Name },
      @{ version = $M2Version; name = $M2Name }
    );
    companies_trigger = [ordered]@{
      name = 'update_companies_updated_at'; enabled = 'O'; timing = 'BEFORE'; event = 'UPDATE'; level = 'ROW';
      function = 'public.update_updated_at_column()'; definition = $TriggerAfter.definition
    };
    application_counts = [ordered]@{ companies = 202; advisors = 177; listing_claims = 0; media_content = 0; users = 0 };
    m1_sha256 = $M1Sha256; m2_sha256 = $M2Sha256; supabase_cli_version = $SupabaseCliVersion;
    applied_migrations = @($M2Filename); archive_bytes = (Get-Item -LiteralPath $ArchivePath).Length;
    archive_entries = $ArchiveEntries; archive_list_validation = 'passed'; schema_stream_validation = 'passed'; data_stream_validation = 'passed';
    site_smoke_status = 200; api_total = 202; production_changes_made = $true; baseline_ddl_executed = $false
  }
  $PostSummary | ConvertTo-Json -Depth 7 | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'post-m2-summary.json')
  @{ success = $true; status = 'success'; production_changes_made = $true; baseline_ddl_executed = $false; applied_migration = $M2Filename } |
    ConvertTo-Json | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'status.json')
  Write-EvidenceChecksumManifest

  & node scripts/database/validate-production-evidence.mjs $PostDirectory --target current
  Assert-LastExitCode 'Fresh protected post-M2 evidence validation failed.'
  & node scripts/database/validate-migrations.mjs
  Assert-LastExitCode 'Final repository validation failed.'

  $ArchiveSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $ArchivePath).Hash.ToLowerInvariant()
  Write-Output "Approved M2 production migration applied and verified. Evidence package: $PostPackageName"
  Write-Output "History: ${M1Version}_${M1Name} + ${M2Version}_${M2Name}; trigger: enabled BEFORE UPDATE ROW; counts: 202/177/0/0/0."
  Write-Output "Post-M2 archive: $((Get-Item -LiteralPath $ArchivePath).Length) bytes; 1322 entries; SHA-256 $ArchiveSha256."
} catch {
  $Failure = $_
  if (Test-Path -LiteralPath $PostDirectory) {
    try {
      @{ success = $false; status = 'failed'; production_changes_made = $ApplySucceeded; baseline_ddl_executed = $false; error = $Failure.Exception.Message } |
        ConvertTo-Json | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'status.json')
      $SummaryPath = Join-Path $PostDirectory 'post-m2-summary.json'
      if (Test-Path -LiteralPath $SummaryPath) {
        $FailedSummary = Get-Content -Raw -LiteralPath $SummaryPath | ConvertFrom-Json
        $FailedSummary.status = 'failed'
        $FailedSummary | Add-Member -NotePropertyName validation_error -NotePropertyValue $Failure.Exception.Message -Force
        $FailedSummary | ConvertTo-Json -Depth 7 | Set-Content -Encoding utf8 -LiteralPath $SummaryPath
      }
      Write-EvidenceChecksumManifest
    } catch {
      Write-Warning 'Could not finalize failed post-M2 evidence status/checksums.'
    }
  }
  throw $Failure
} finally {
  Pop-Location
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  if ($PasswordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($PasswordPointer) }
  $SecurePassword = $null
}
