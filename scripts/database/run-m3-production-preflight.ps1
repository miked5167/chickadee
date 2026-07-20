[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$ProjectRef = 'dqskdrqubqnhdssxpryx'
$PoolerHost = 'aws-1-ca-central-1.pooler.supabase.com'
$PoolerPort = 5432
$DatabaseUser = "postgres.$ProjectRef"
$DatabaseName = 'postgres'
$M1Version = '20260719000000'
$M1Name = 'production_company_baseline'
$M1Sha256 = '4b65fa234b56534985f249cc8061efd98b05ba927c5de130839b8fd35c1d1db8'
$M2Version = '20260719000001'
$M2Name = 'add_companies_updated_at_trigger'
$M2Sha256 = '95fb374bb07c5a4941b3dd78e6a6db9bf5b4b456c15670fb3ac9805e3a81b547'
$M3Version = '20260719000002'
$M3Name = 'administrator_authorization_foundation'
$M3Filename = "${M3Version}_${M3Name}.sql"
$M3Sha256 = 'a968f41fb10e6ecbe1ff8363abe0322031defd6aa361ce3c98498603ade55f6d'
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
$Timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$BackupName = "advisor-directory-production-pre-m3-$Timestamp"
$BackupDirectory = Join-Path $BackupRoot $BackupName
$ArchivePath = Join-Path $BackupDirectory "production-$Timestamp.dump"
$SchemaPath = Join-Path $BackupDirectory "production-schema-$Timestamp.sql"
$DataStreamPath = Join-Path $BackupDirectory 'data-stream-validation.sql'
$ArchiveContentsPath = Join-Path $BackupDirectory 'archive-contents.txt'
$RolesPath = Join-Path $BackupDirectory "roles-$Timestamp.sql"
$CliWorkDirectory = Join-Path $BackupDirectory 'm3-cli-work'
$PasswordPointer = [IntPtr]::Zero
$SecurePassword = $null

function Assert-LastExitCode([string]$Message) {
  if ($LASTEXITCODE -ne 0) { throw $Message }
}

function Invoke-ReadOnlyScalar([string]$Sql) {
  $Output = & $Psql @script:PsqlArguments -Atq --command "BEGIN READ ONLY; $Sql; ROLLBACK;"
  Assert-LastExitCode 'Read-only production query failed.'
  return (($Output | Where-Object { $_ -ne '' }) -join "`n").Trim()
}

function Export-ReadOnlyCsv([string]$Name, [string]$Query) {
  $Path = Join-Path $BackupDirectory $Name
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
  Get-ChildItem -LiteralPath $BackupDirectory -File -Recurse | Where-Object { $_.Name -ne 'SHA256SUMS.txt' } |
    Sort-Object FullName | ForEach-Object {
      $Hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()
      $RelativeName = $_.FullName.Substring($BackupDirectory.Length + 1)
      "$Hash *$RelativeName"
    } | Set-Content -Encoding ascii -LiteralPath (Join-Path $BackupDirectory 'SHA256SUMS.txt')
}

foreach ($Tool in @($Psql, $PgDump, $PgDumpAll, $PgRestore)) {
  if (-not (Test-Path -LiteralPath $Tool)) { throw "Required PostgreSQL tool is missing: $Tool" }
}

$BackupRootResolved = [IO.Path]::GetFullPath($BackupRoot)
$RepositoryResolved = [IO.Path]::GetFullPath($RepositoryRoot)
if ($BackupRootResolved.StartsWith($RepositoryResolved, [StringComparison]::OrdinalIgnoreCase)) { throw 'Protected backup root must be outside the repository.' }
if ($BackupRootResolved -like '*OneDrive*') { throw 'Protected backup root must be outside OneDrive.' }
if (-not (Test-Path -LiteralPath $BackupRoot)) { throw 'Protected production backup root does not exist.' }
if (Test-Path -LiteralPath $BackupDirectory) { throw 'Fresh timestamped backup directory is not unused.' }

Push-Location $RepositoryRoot
try {
  $Branch = (git branch --show-current).Trim()
  if ($Branch -ne $ExpectedBranch) { throw "Branch differs from $ExpectedBranch." }
  $StagedBefore = @(git diff --cached --name-only)
  if ($StagedBefore.Count -ne 0) { throw 'Repository has staged files.' }
  $WorktreeBeforeText = @(git status --porcelain=v1) -join "`n"

  $M1Path = Join-Path $RepositoryRoot "supabase\migrations\${M1Version}_${M1Name}.sql"
  $M2Path = Join-Path $RepositoryRoot "supabase\migrations\${M2Version}_${M2Name}.sql"
  $M3Path = Join-Path $RepositoryRoot "supabase\migrations\$M3Filename"
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $M1Path).Hash.ToLowerInvariant() -ne $M1Sha256) { throw 'M1 hash differs from the adopted hash.' }
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $M2Path).Hash.ToLowerInvariant() -ne $M2Sha256) { throw 'M2 hash differs from the applied hash.' }
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $M3Path).Hash.ToLowerInvariant() -ne $M3Sha256) { throw 'M3 hash differs from the reviewed hash.' }

  & node scripts/database/validate-migrations.mjs
  Assert-LastExitCode 'Repository migration validation failed.'
  & node scripts/database/test-validation-rules.mjs
  Assert-LastExitCode 'Repository negative-rule validation failed.'

  $SecurePassword = Read-Host 'Enter the PRODUCTION Supabase database password for the READ-ONLY M3 preflight' -AsSecureString
  $PasswordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($PasswordPointer)
  $script:PsqlArguments = @('-X', '-w', '-h', $PoolerHost, '-p', $PoolerPort, '-U', $DatabaseUser, '-d', $DatabaseName, '--set', 'ON_ERROR_STOP=1', '--set', 'VERBOSITY=terse')

  $IdentityObject = (Invoke-ReadOnlyScalar @"
SELECT json_build_object(
  'database', current_database(), 'connected_user', current_user,
  'server_version', current_setting('server_version'),
  'server_address', inet_server_addr()::text, 'server_port', inet_server_port()
)::text
"@) | ConvertFrom-Json
  if ($IdentityObject.database -ne $DatabaseName -or $IdentityObject.connected_user -ne 'postgres') { throw 'Routed production database identity is ambiguous.' }

  $ExpectedHistorySignature = "${M1Version}:${M1Name},${M2Version}:${M2Name}"
  $HistorySignature = Invoke-ReadOnlyScalar "SELECT coalesce(string_agg(version || ':' || name, ',' ORDER BY version), '') FROM supabase_migrations.schema_migrations"
  if ($HistorySignature -ne $ExpectedHistorySignature) {
    Write-Output "Observed migration history signature: $HistorySignature"
    throw 'Production migration history differs from exact M1+M2 state.'
  }

  $Prerequisites = (Invoke-ReadOnlyScalar @"
SELECT json_build_object(
  'm2_trigger_exact', EXISTS (
    SELECT 1 FROM pg_catalog.pg_trigger t
     WHERE t.tgrelid = to_regclass('public.companies')
       AND t.tgname = 'update_companies_updated_at'
       AND t.tgfoid = to_regprocedure('public.update_updated_at_column()')
       AND t.tgtype = 19 AND t.tgenabled = 'O' AND NOT t.tgisinternal
  ),
  'timestamp_function_exact', EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_language l ON l.oid = p.prolang
     WHERE p.oid = to_regprocedure('public.update_updated_at_column()')
       AND p.prokind = 'f' AND p.pronargs = 0 AND NOT p.proretset
       AND p.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype
       AND l.lanname = 'plpgsql' AND p.provolatile = 'v' AND p.proparallel = 'u'
       AND NOT p.proisstrict AND NOT p.prosecdef AND NOT p.proleakproof AND p.proconfig IS NULL
       AND pg_catalog.pg_get_userbyid(p.proowner) = 'postgres'
       AND pg_catalog.replace(pg_catalog.btrim(p.prosrc, E' \t\r\n'), E'\r\n', E'\n') = E'BEGIN\n  NEW.updated_at := NOW();\n  RETURN NEW;\nEND;'
  ),
  'auth_identity_exact', to_regclass('auth.users') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_catalog.pg_attribute a
     WHERE a.attrelid = to_regclass('auth.users') AND a.attname = 'id' AND a.attnum > 0
       AND NOT a.attisdropped AND a.atttypid = 'pg_catalog.uuid'::pg_catalog.regtype AND a.attnotnull
  ) AND EXISTS (
    SELECT 1 FROM pg_catalog.pg_index i
     WHERE i.indrelid = to_regclass('auth.users') AND i.indisunique AND i.indisvalid AND i.indisready
       AND i.indnkeyatts = 1 AND i.indkey[0] = (
         SELECT a.attnum FROM pg_catalog.pg_attribute a
          WHERE a.attrelid = to_regclass('auth.users') AND a.attname = 'id' AND a.attnum > 0 AND NOT a.attisdropped
       )
  ),
  'auth_uid_exact', EXISTS (
    SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_language l ON l.oid = p.prolang
     WHERE p.oid = to_regprocedure('auth.uid()') AND p.prokind = 'f' AND p.pronargs = 0
       AND NOT p.proretset AND p.prorettype = 'pg_catalog.uuid'::pg_catalog.regtype
       AND l.lanname = 'sql' AND p.provolatile = 's' AND NOT p.prosecdef
       AND pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ),
  'api_roles_exact', NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles r
     WHERE (r.rolname IN ('anon','authenticated') AND (r.rolsuper OR r.rolbypassrls))
        OR (r.rolname = 'service_role' AND (r.rolsuper OR NOT r.rolbypassrls))
  ) AND (SELECT count(*) FROM pg_catalog.pg_roles WHERE rolname IN ('anon','authenticated','service_role')) = 3,
  'public_create_revoked', NOT pg_catalog.has_schema_privilege('anon','public','CREATE')
    AND NOT pg_catalog.has_schema_privilege('authenticated','public','CREATE'),
  'm3_objects_absent', to_regclass('public.admin_users') IS NULL
    AND to_regprocedure('public.is_admin()') IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relname IN ('admin_users_pkey','admin_users_user_id_key','admin_users_granted_by_idx','admin_users_revoked_by_idx')
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_namespace n ON n.oid = c.connamespace
       WHERE n.nspname = 'public' AND c.conname LIKE 'admin_users_%'
    )
    AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policy WHERE polname = 'Users can inspect own administrator status')
    AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_trigger WHERE tgname = 'update_admin_users_updated_at' AND NOT tgisinternal)
)::text
"@) | ConvertFrom-Json
  foreach ($Property in @('m2_trigger_exact','timestamp_function_exact','auth_identity_exact','auth_uid_exact','api_roles_exact','public_create_revoked','m3_objects_absent')) {
    if ($Prerequisites.$Property -ne $true) { throw "Production M3 prerequisite failed: $Property" }
  }

  $ExpectedCounts = [ordered]@{ companies = 202; advisors = 177; listing_claims = 0; media_content = 0; users = 0 }
  $CountsBefore = (Invoke-ReadOnlyScalar @"
SELECT json_build_object(
  'companies',(SELECT count(*) FROM public.companies), 'advisors',(SELECT count(*) FROM public.advisors),
  'listing_claims',(SELECT count(*) FROM public.listing_claims), 'media_content',(SELECT count(*) FROM public.media_content),
  'users',(SELECT count(*) FROM public.users)
)::text
"@) | ConvertFrom-Json
  foreach ($Name in $ExpectedCounts.Keys) { if ([int64]$CountsBefore.$Name -ne $ExpectedCounts[$Name]) { throw "Production count differs for public.$Name." } }

  New-Item -ItemType Directory -Path $BackupDirectory | Out-Null
  [pscustomobject]@{
    database_name = $IdentityObject.database; connected_user = $IdentityObject.connected_user
    server_version = $IdentityObject.server_version; captured_at_utc = (Get-Date).ToUniversalTime().ToString('o')
    expected_project_ref = $ProjectRef; pooler_route = $PoolerHost; identity_match = $true
  } | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath (Join-Path $BackupDirectory 'server-info.csv')

  & $PgDump -w -h $PoolerHost -p $PoolerPort -U $DatabaseUser -d $DatabaseName --format=custom --compress=9 --file=$ArchivePath
  Assert-LastExitCode 'Fresh protected production archive failed.'
  & $PgDumpAll -w -h $PoolerHost -p $PoolerPort -U $DatabaseUser -l $DatabaseName --roles-only --no-role-passwords --file=$RolesPath
  Assert-LastExitCode 'Production roles export failed.'
  & $PgRestore --list --file=$ArchiveContentsPath $ArchivePath
  Assert-LastExitCode 'Archive listing validation failed.'
  & $PgRestore --schema-only --file=$SchemaPath $ArchivePath
  Assert-LastExitCode 'Archive schema stream validation failed.'
  & $PgRestore --data-only --file=$DataStreamPath $ArchivePath
  Assert-LastExitCode 'Archive data stream validation failed.'

  Export-ReadOnlyCsv 'tables.csv' "SELECT n.nspname schema_name,c.relname table_name,CASE c.relkind WHEN 'r' THEN 'table' WHEN 'p' THEN 'partitioned table' ELSE c.relkind::text END table_type,pg_catalog.pg_get_userbyid(c.relowner) owner,c.relrowsecurity rls_enabled,c.relforcerowsecurity rls_forced,c.reltuples::bigint estimated_rows,pg_catalog.pg_total_relation_size(c.oid) total_bytes FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p') ORDER BY 1,2"
  Export-ReadOnlyCsv 'columns.csv' "SELECT table_schema schema_name,table_name,ordinal_position,column_name,data_type,udt_schema,udt_name,is_nullable,column_default FROM information_schema.columns ORDER BY 1,2,3"
  Export-ReadOnlyCsv 'relationships-and-constraints.csv' "SELECT n.nspname schema_name,c.relname table_name,con.conname constraint_name,CASE con.contype WHEN 'c' THEN 'check' WHEN 'f' THEN 'foreign key' WHEN 'p' THEN 'primary key' WHEN 'u' THEN 'unique' WHEN 'x' THEN 'exclusion' ELSE con.contype::text END constraint_type,rn.nspname referenced_schema,rc.relname referenced_table,pg_catalog.pg_get_constraintdef(con.oid,true) definition FROM pg_catalog.pg_constraint con JOIN pg_catalog.pg_class c ON c.oid=con.conrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_catalog.pg_class rc ON rc.oid=con.confrelid LEFT JOIN pg_catalog.pg_namespace rn ON rn.oid=rc.relnamespace ORDER BY 1,2,3"
  Export-ReadOnlyCsv 'rls-policies.csv' "SELECT n.nspname schema_name,c.relname table_name,p.polname policy_name,p.polpermissive permissive,ARRAY(SELECT pg_catalog.pg_get_userbyid(role_oid) FROM unnest(p.polroles) role_oid ORDER BY 1)::text roles,p.polcmd cmd,pg_catalog.pg_get_expr(p.polqual,p.polrelid) qual,pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid) with_check FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid=p.polrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace ORDER BY 1,2,3"
  Export-ReadOnlyCsv 'functions.csv' "SELECT n.nspname schema_name,p.proname function_name,pg_catalog.pg_get_function_identity_arguments(p.oid) identity_arguments,pg_catalog.pg_get_function_result(p.oid) result_type,l.lanname language,p.prosecdef security_definer,p.provolatile volatility,pg_catalog.pg_get_userbyid(p.proowner) owner,pg_catalog.pg_get_functiondef(p.oid) definition FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace JOIN pg_catalog.pg_language l ON l.oid=p.prolang WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND p.prokind='f' ORDER BY 1,2,3"
  Export-ReadOnlyCsv 'function-privileges.csv' "SELECT routine_schema function_schema,routine_name function_name,grantee,privilege_type,is_grantable FROM information_schema.routine_privileges ORDER BY 1,2,3,4"
  Export-ReadOnlyCsv 'triggers.csv' "SELECT n.nspname schema_name,c.relname table_name,t.tgname trigger_name,t.tgenabled enabled_state,pg_catalog.pg_get_triggerdef(t.oid,true) definition FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_class c ON c.oid=t.tgrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE NOT t.tgisinternal ORDER BY 1,2,3"
  Export-ReadOnlyCsv 'table-privileges.csv' "SELECT grantor,grantee,table_schema,table_name,privilege_type,is_grantable FROM information_schema.table_privileges ORDER BY 3,4,2,5"
  Export-ReadOnlyCsv 'exact-row-counts.csv' "SELECT 'public'::text schema_name,'advisors'::text table_name,count(*)::bigint exact_row_count FROM public.advisors UNION ALL SELECT 'public','companies',count(*) FROM public.companies UNION ALL SELECT 'public','listing_claims',count(*) FROM public.listing_claims UNION ALL SELECT 'public','media_content',count(*) FROM public.media_content UNION ALL SELECT 'public','users',count(*) FROM public.users ORDER BY 1,2"
  Export-ReadOnlyCsv 'migration-history-status.csv' "SELECT (to_regclass('supabase_migrations.schema_migrations') IS NOT NULL)::text standard_migration_table_present,'supabase_migrations.schema_migrations'::text expected_relation"
  Export-ReadOnlyCsv 'migration-history-versions.csv' "SELECT version,name FROM supabase_migrations.schema_migrations ORDER BY version"

  $CountsAfter = (Invoke-ReadOnlyScalar "SELECT json_build_object('companies',(SELECT count(*) FROM public.companies),'advisors',(SELECT count(*) FROM public.advisors),'listing_claims',(SELECT count(*) FROM public.listing_claims),'media_content',(SELECT count(*) FROM public.media_content),'users',(SELECT count(*) FROM public.users))::text") | ConvertFrom-Json
  foreach ($Name in $ExpectedCounts.Keys) {
    if ([int64]$CountsAfter.$Name -ne $ExpectedCounts[$Name] -or [int64]$CountsAfter.$Name -ne [int64]$CountsBefore.$Name) { throw "Production count changed during preflight for public.$Name." }
  }

  New-Item -ItemType Directory -Path $CliWorkDirectory | Out-Null
  [void](Invoke-SupabaseCli @('--yes', "supabase@$SupabaseCliVersion", '--workdir', $CliWorkDirectory, 'init') 'Could not initialize isolated Supabase CLI work directory.')
  New-Item -ItemType Directory -Path (Join-Path $CliWorkDirectory 'supabase\migrations') -Force | Out-Null
  Copy-Item -LiteralPath $M1Path,$M2Path,$M3Path -Destination (Join-Path $CliWorkDirectory 'supabase\migrations')
  $DatabaseUrlScheme = @('postgresql', '://') -join ''
  $PasswordlessDbUrl = "${DatabaseUrlScheme}${DatabaseUser}@${PoolerHost}:${PoolerPort}/${DatabaseName}?sslmode=require"
  $DryRunText = (Invoke-SupabaseCli @('--yes', "supabase@$SupabaseCliVersion", '--workdir', $CliWorkDirectory, 'db', 'push', '--dry-run', '--db-url', $PasswordlessDbUrl) 'Pinned Supabase CLI dry run failed.') -join "`n"
  $DryRunMigrations = @([regex]::Matches($DryRunText, '\b\d{14}_[a-z0-9_]+\.sql\b') | ForEach-Object { $_.Value } | Sort-Object -Unique)
  if ($DryRunMigrations.Count -ne 1 -or $DryRunMigrations[0] -ne $M3Filename) { throw 'Pinned CLI dry run does not contain exactly M3.' }
  $DryRunText | Set-Content -Encoding utf8 -LiteralPath (Join-Path $BackupDirectory 'supabase-dry-run.txt')

  $SiteResponse = Invoke-WebRequest -Uri 'https://www.thehockeydirectory.com/' -UseBasicParsing -TimeoutSec 30
  $ApiResponse = Invoke-RestMethod -Uri 'https://www.thehockeydirectory.com/api/advisors?limit=1' -Method Get -TimeoutSec 30
  if ($SiteResponse.StatusCode -ne 200 -or $SiteResponse.Content -notmatch 'The Hockey Directory') { throw 'Public site smoke test failed.' }
  if ([int64]$ApiResponse.pagination.total -ne 202 -or @($ApiResponse.advisors).Count -ne 1) { throw 'Public advisor API smoke test failed.' }

  if (@(git diff --cached --name-only).Count -ne 0) { throw 'Preflight unexpectedly staged repository files.' }
  if ((@(git status --porcelain=v1) -join "`n") -ne $WorktreeBeforeText) { throw 'Repository worktree changed during production preflight.' }
  if ((git branch --show-current).Trim() -ne $ExpectedBranch) { throw 'Branch changed during production preflight.' }
  $ArchiveEntries = @(Get-Content -LiteralPath $ArchiveContentsPath | Where-Object { $_.Trim() -and -not $_.StartsWith(';') }).Count
  if ($ArchiveEntries -ne 1322) { throw "Protected pre-M3 archive has $ArchiveEntries entries instead of exact M2 count 1322." }

  [ordered]@{
    status='success'; captured_at_utc=(Get-Date).ToUniversalTime().ToString('o'); project_ref=$ProjectRef
    routed_identity_match=$true; migration_history=@(@{version=$M1Version;name=$M1Name},@{version=$M2Version;name=$M2Name})
    m3_objects_absent=$true; m3_prerequisites_match=$true; application_counts=$ExpectedCounts
    m1_sha256=$M1Sha256; m2_sha256=$M2Sha256; m3_sha256=$M3Sha256
    supabase_cli_version=$SupabaseCliVersion; dry_run_migrations=$DryRunMigrations
    archive_bytes=(Get-Item -LiteralPath $ArchivePath).Length; archive_entries=$ArchiveEntries
    archive_list_validation='passed'; schema_stream_validation='passed'; data_stream_validation='passed'
    site_smoke_status=200; api_total=202; production_changes_made=$false; baseline_ddl_executed=$false
  } | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 -LiteralPath (Join-Path $BackupDirectory 'preflight-summary.json')
  @{success=$true;status='success';production_changes_made=$false;baseline_ddl_executed=$false} | ConvertTo-Json | Set-Content -Encoding utf8 -LiteralPath (Join-Path $BackupDirectory 'status.json')
  Write-EvidenceChecksumManifest

  & node scripts/database/validate-production-evidence.mjs $BackupDirectory --target m2
  Assert-LastExitCode 'Fresh protected pre-M3 evidence validation failed.'
  & node scripts/database/validate-migrations.mjs
  Assert-LastExitCode 'Final repository validation failed.'

  Write-Output "M3 production preflight passed with no production mutation. Evidence package: $BackupName"
  Write-Output "History: exact M1+M2; M3 objects: absent; counts: 202/177/0/0/0."
  Write-Output "Pinned CLI dry run: $M3Filename only."
} catch {
  $Failure = $_
  if (Test-Path -LiteralPath $BackupDirectory) {
    try {
      @{success=$false;status='failed';production_changes_made=$false;baseline_ddl_executed=$false;error=$Failure.Exception.Message} | ConvertTo-Json | Set-Content -Encoding utf8 -LiteralPath (Join-Path $BackupDirectory 'status.json')
      Write-EvidenceChecksumManifest
    } catch { Write-Warning 'Could not finalize failed evidence-package status/checksums.' }
  }
  throw $Failure
} finally {
  Pop-Location
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  if ($PasswordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($PasswordPointer) }
  $SecurePassword = $null
}
