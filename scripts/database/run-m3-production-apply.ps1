[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('APPROVE M3 PRODUCTION MIGRATION')]
  [string]$ApprovalPhrase
)

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
$PreM3HistorySignature = "${M1Version}:${M1Name},${M2Version}:${M2Name}"
$PostM3HistorySignature = "${PreM3HistorySignature},${M3Version}:${M3Name}"
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
$PostName = "advisor-directory-production-post-m3-$Timestamp"
$PostDirectory = Join-Path $BackupRoot $PostName
$ArchivePath = Join-Path $PostDirectory "production-$Timestamp.dump"
$SchemaPath = Join-Path $PostDirectory "production-schema-$Timestamp.sql"
$DataStreamPath = Join-Path $PostDirectory 'data-stream-validation.sql'
$ArchiveContentsPath = Join-Path $PostDirectory 'archive-contents.txt'
$RolesPath = Join-Path $PostDirectory "roles-$Timestamp.sql"
$CliWorkDirectory = Join-Path $PostDirectory 'm3-cli-work'
$PasswordPointer = [IntPtr]::Zero
$SecurePassword = $null
$ApplySucceeded = $false

function Assert-LastExitCode([string]$Message) { if ($LASTEXITCODE -ne 0) { throw $Message } }

function Invoke-Scalar([string]$Sql, [switch]$ReadOnly) {
  $Command = if ($ReadOnly) { "BEGIN READ ONLY; $Sql; ROLLBACK;" } else { $Sql }
  $Output = & $Psql @script:PsqlArguments -Atq --command $Command
  Assert-LastExitCode 'Production verification query failed.'
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
  } finally { $ErrorActionPreference = $PreviousErrorActionPreference }
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

if ($ApprovalPhrase -ne 'APPROVE M3 PRODUCTION MIGRATION') { throw 'Exact M3 production approval phrase is required.' }
foreach ($Tool in @($Psql,$PgDump,$PgDumpAll,$PgRestore)) { if (-not (Test-Path -LiteralPath $Tool)) { throw "Required PostgreSQL tool is missing: $Tool" } }
if (-not (Test-Path -LiteralPath $BackupRoot)) { throw 'Protected production backup root does not exist.' }
$BackupRootResolved = [IO.Path]::GetFullPath($BackupRoot)
if ($BackupRootResolved.StartsWith([IO.Path]::GetFullPath($RepositoryRoot),[StringComparison]::OrdinalIgnoreCase) -or $BackupRootResolved -like '*OneDrive*') { throw 'Protected backup root is not isolated from the repository and OneDrive.' }
if (Test-Path -LiteralPath $PostDirectory) { throw 'Fresh post-M3 evidence directory is not unused.' }

Push-Location $RepositoryRoot
try {
  # Approval does not waive any gate: create a new pre-M3 backup and dry-run now.
  & (Join-Path $PSScriptRoot 'run-m3-production-preflight.ps1')
  Assert-LastExitCode 'Immediate approved-window M3 preflight failed.'

  $ApprovedPreflightDirectory = Get-ChildItem -LiteralPath $BackupRoot -Directory -Filter 'advisor-directory-production-pre-m3-*' |
    Sort-Object CreationTime -Descending | Select-Object -First 1
  if ($null -eq $ApprovedPreflightDirectory) { throw 'Fresh successful pre-M3 evidence package was not found.' }
  & node scripts/database/validate-production-evidence.mjs $ApprovedPreflightDirectory.FullName --target m2
  Assert-LastExitCode 'Approved-window pre-M3 evidence validation failed.'
  $CandidateSummary = Get-Content -Raw -LiteralPath (Join-Path $ApprovedPreflightDirectory.FullName 'preflight-summary.json') | ConvertFrom-Json
  if ($CandidateSummary.production_changes_made -ne $false -or @($CandidateSummary.dry_run_migrations).Count -ne 1 -or $CandidateSummary.dry_run_migrations[0] -ne $M3Filename) {
    throw 'Approved-window preflight summary is not the exact no-mutation M3 candidate.'
  }

  if ((git branch --show-current).Trim() -ne $ExpectedBranch) { throw "Branch differs from $ExpectedBranch." }
  if (@(git diff --cached --name-only).Count -ne 0) { throw 'Repository has staged files.' }
  $WorktreeBeforeText = @(git status --porcelain=v1) -join "`n"
  $M1Path = Join-Path $RepositoryRoot "supabase\migrations\${M1Version}_${M1Name}.sql"
  $M2Path = Join-Path $RepositoryRoot "supabase\migrations\${M2Version}_${M2Name}.sql"
  $M3Path = Join-Path $RepositoryRoot "supabase\migrations\$M3Filename"
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $M1Path).Hash.ToLowerInvariant() -ne $M1Sha256) { throw 'M1 hash differs immediately before M3.' }
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $M2Path).Hash.ToLowerInvariant() -ne $M2Sha256) { throw 'M2 hash differs immediately before M3.' }
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $M3Path).Hash.ToLowerInvariant() -ne $M3Sha256) { throw 'M3 hash differs immediately before application.' }
  & node scripts/database/validate-migrations.mjs
  Assert-LastExitCode 'Repository validation failed immediately before M3.'

  $SecurePassword = Read-Host 'Enter the PRODUCTION Supabase database password for the APPROVED M3 migration' -AsSecureString
  $PasswordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($PasswordPointer)
  $script:PsqlArguments = @('-X','-w','-h',$PoolerHost,'-p',$PoolerPort,'-U',$DatabaseUser,'-d',$DatabaseName,'--set','ON_ERROR_STOP=1','--set','VERBOSITY=terse')

  $Immediate = (Invoke-Scalar -ReadOnly @"
SELECT json_build_object(
  'database',current_database(), 'connected_user',current_user,
  'history_signature', (SELECT coalesce(string_agg(version || ':' || name, ',' ORDER BY version), '') FROM supabase_migrations.schema_migrations),
  'm3_absent',to_regclass('public.admin_users') IS NULL AND to_regprocedure('public.is_admin()') IS NULL,
  'm2_trigger_exact',EXISTS(SELECT 1 FROM pg_catalog.pg_trigger t WHERE t.tgrelid=to_regclass('public.companies') AND t.tgname='update_companies_updated_at' AND t.tgfoid=to_regprocedure('public.update_updated_at_column()') AND t.tgtype=19 AND t.tgenabled='O' AND NOT t.tgisinternal),
  'counts_signature',concat_ws(',',(SELECT count(*) FROM public.companies),(SELECT count(*) FROM public.advisors),(SELECT count(*) FROM public.listing_claims),(SELECT count(*) FROM public.media_content),(SELECT count(*) FROM public.users))
)::text
"@) | ConvertFrom-Json
  if ($Immediate.database -ne $DatabaseName -or $Immediate.connected_user -ne 'postgres' -or $Immediate.m3_absent -ne $true -or $Immediate.m2_trigger_exact -ne $true) { throw 'Immediate production identity/object precheck failed.' }
  if ($Immediate.history_signature -ne $PreM3HistorySignature) { throw 'Immediate production history is not exact M1+M2.' }
  if ($Immediate.counts_signature -ne '202,177,0,0,0') { throw 'Immediate production counts differ.' }

  New-Item -ItemType Directory -Path $PostDirectory | Out-Null
  New-Item -ItemType Directory -Path $CliWorkDirectory | Out-Null
  [void](Invoke-SupabaseCli @('--yes',"supabase@$SupabaseCliVersion",'--workdir',$CliWorkDirectory,'init') 'Could not initialize isolated M3 apply work directory.')
  New-Item -ItemType Directory -Path (Join-Path $CliWorkDirectory 'supabase\migrations') -Force | Out-Null
  Copy-Item -LiteralPath $M1Path,$M2Path,$M3Path -Destination (Join-Path $CliWorkDirectory 'supabase\migrations')
  $DatabaseUrlScheme = @('postgresql','://') -join ''
  $PasswordlessDbUrl = "${DatabaseUrlScheme}${DatabaseUser}@${PoolerHost}:${PoolerPort}/${DatabaseName}?sslmode=require"
  $DryRunText = (Invoke-SupabaseCli @('--yes',"supabase@$SupabaseCliVersion",'--workdir',$CliWorkDirectory,'db','push','--dry-run','--db-url',$PasswordlessDbUrl) 'Immediate pinned M3 dry run failed.') -join "`n"
  $DryRunMigrations = @([regex]::Matches($DryRunText,'\b\d{14}_[a-z0-9_]+\.sql\b') | ForEach-Object {$_.Value} | Sort-Object -Unique)
  if ($DryRunMigrations.Count -ne 1 -or $DryRunMigrations[0] -ne $M3Filename) { throw 'Immediate pinned dry run does not contain only M3.' }
  $DryRunText | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'supabase-dry-run.txt')

  $ApplyOutput = Invoke-SupabaseCli @('--yes',"supabase@$SupabaseCliVersion",'--workdir',$CliWorkDirectory,'db','push','--yes','--db-url',$PasswordlessDbUrl) 'Pinned M3 application failed.'
  $ApplySucceeded = $true
  ($ApplyOutput -join "`n") | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'supabase-apply.txt')

  $PostState = (Invoke-Scalar -ReadOnly @"
SELECT json_build_object(
  'history_signature',(SELECT coalesce(string_agg(version || ':' || name, ',' ORDER BY version), '') FROM supabase_migrations.schema_migrations),
  'admin_rows',(SELECT count(*) FROM public.admin_users),
  'counts_signature',concat_ws(',',(SELECT count(*) FROM public.companies),(SELECT count(*) FROM public.advisors),(SELECT count(*) FROM public.listing_claims),(SELECT count(*) FROM public.media_content),(SELECT count(*) FROM public.users)),
  'table_exact',EXISTS(SELECT 1 FROM pg_catalog.pg_class c WHERE c.oid=to_regclass('public.admin_users') AND c.relkind='r' AND c.relrowsecurity AND NOT c.relforcerowsecurity AND pg_catalog.pg_get_userbyid(c.relowner)='postgres'),
  'function_exact',EXISTS(SELECT 1 FROM pg_catalog.pg_proc p WHERE p.oid=to_regprocedure('public.is_admin()') AND p.prosecdef AND p.provolatile='s' AND p.proparallel='s' AND p.proconfig IS NOT NULL AND cardinality(p.proconfig)=1 AND p.proconfig[1]=('search_path=' || chr(34) || chr(34)) AND pg_catalog.pg_get_userbyid(p.proowner)='postgres'),
  'function_grants',NOT pg_catalog.has_function_privilege('anon','public.is_admin()','EXECUTE') AND pg_catalog.has_function_privilege('authenticated','public.is_admin()','EXECUTE') AND pg_catalog.has_function_privilege('service_role','public.is_admin()','EXECUTE'),
  'table_grants',NOT pg_catalog.has_table_privilege('anon','public.admin_users','SELECT') AND pg_catalog.has_table_privilege('authenticated','public.admin_users','SELECT') AND NOT pg_catalog.has_table_privilege('authenticated','public.admin_users','INSERT,UPDATE,DELETE') AND pg_catalog.has_table_privilege('service_role','public.admin_users','SELECT,INSERT,UPDATE,DELETE'),
  'policy_exact',EXISTS(SELECT 1 FROM pg_catalog.pg_policy p WHERE p.polrelid=to_regclass('public.admin_users') AND p.polname='Users can inspect own administrator status' AND p.polcmd='r' AND pg_catalog.pg_get_expr(p.polqual,p.polrelid)='(user_id = auth.uid())'),
  'trigger_exact',EXISTS(SELECT 1 FROM pg_catalog.pg_trigger t WHERE t.tgrelid=to_regclass('public.admin_users') AND t.tgname='update_admin_users_updated_at' AND t.tgfoid=to_regprocedure('public.update_updated_at_column()') AND t.tgtype=19 AND t.tgenabled='O' AND NOT t.tgisinternal)
)::text
"@) | ConvertFrom-Json
  if ($PostState.history_signature -ne $PostM3HistorySignature -or $PostState.counts_signature -ne '202,177,0,0,0' -or [int64]$PostState.admin_rows -ne 0) { throw 'Post-M3 history, counts, or empty-admin invariant failed.' }
  foreach ($Property in @('table_exact','function_exact','function_grants','table_grants','policy_exact','trigger_exact')) { if ($PostState.$Property -ne $true) { throw "Post-M3 authorization verification failed: $Property" } }

  [pscustomobject]@{database_name=$DatabaseName;connected_user='postgres';captured_at_utc=(Get-Date).ToUniversalTime().ToString('o');expected_project_ref=$ProjectRef;pooler_route=$PoolerHost;identity_match=$true} | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'server-info.csv')
  & $PgDump -w -h $PoolerHost -p $PoolerPort -U $DatabaseUser -d $DatabaseName --format=custom --compress=9 --file=$ArchivePath
  Assert-LastExitCode 'Post-M3 protected archive failed.'
  & $PgDumpAll -w -h $PoolerHost -p $PoolerPort -U $DatabaseUser -l $DatabaseName --roles-only --no-role-passwords --file=$RolesPath
  Assert-LastExitCode 'Post-M3 roles export failed.'
  & $PgRestore --list --file=$ArchiveContentsPath $ArchivePath
  Assert-LastExitCode 'Post-M3 archive listing failed.'
  & $PgRestore --schema-only --file=$SchemaPath $ArchivePath
  Assert-LastExitCode 'Post-M3 schema stream failed.'
  & $PgRestore --data-only --file=$DataStreamPath $ArchivePath
  Assert-LastExitCode 'Post-M3 data stream failed.'

  Export-ReadOnlyCsv 'tables.csv' "SELECT n.nspname schema_name,c.relname table_name,CASE c.relkind WHEN 'r' THEN 'table' WHEN 'p' THEN 'partitioned table' ELSE c.relkind::text END table_type,pg_catalog.pg_get_userbyid(c.relowner) owner,c.relrowsecurity rls_enabled,c.relforcerowsecurity rls_forced,c.reltuples::bigint estimated_rows,pg_catalog.pg_total_relation_size(c.oid) total_bytes FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p') ORDER BY 1,2"
  Export-ReadOnlyCsv 'columns.csv' "SELECT table_schema schema_name,table_name,ordinal_position,column_name,data_type,udt_schema,udt_name,is_nullable,column_default FROM information_schema.columns ORDER BY 1,2,3"
  Export-ReadOnlyCsv 'relationships-and-constraints.csv' "SELECT n.nspname schema_name,c.relname table_name,con.conname constraint_name,CASE con.contype WHEN 'c' THEN 'check' WHEN 'f' THEN 'foreign key' WHEN 'p' THEN 'primary key' WHEN 'u' THEN 'unique' WHEN 'x' THEN 'exclusion' ELSE con.contype::text END constraint_type,rn.nspname referenced_schema,rc.relname referenced_table,pg_catalog.pg_get_constraintdef(con.oid,true) definition FROM pg_catalog.pg_constraint con JOIN pg_catalog.pg_class c ON c.oid=con.conrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_catalog.pg_class rc ON rc.oid=con.confrelid LEFT JOIN pg_catalog.pg_namespace rn ON rn.oid=rc.relnamespace ORDER BY 1,2,3"
  Export-ReadOnlyCsv 'rls-policies.csv' "SELECT n.nspname schema_name,c.relname table_name,p.polname policy_name,p.polpermissive permissive,ARRAY(SELECT pg_catalog.pg_get_userbyid(role_oid) FROM unnest(p.polroles) role_oid ORDER BY 1)::text roles,p.polcmd cmd,pg_catalog.pg_get_expr(p.polqual,p.polrelid) qual,pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid) with_check FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid=p.polrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace ORDER BY 1,2,3"
  Export-ReadOnlyCsv 'functions.csv' "SELECT n.nspname schema_name,p.proname function_name,pg_catalog.pg_get_function_identity_arguments(p.oid) identity_arguments,pg_catalog.pg_get_function_result(p.oid) result_type,l.lanname language,p.prosecdef security_definer,p.provolatile volatility,pg_catalog.pg_get_userbyid(p.proowner) owner,pg_catalog.pg_get_functiondef(p.oid) definition FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace JOIN pg_catalog.pg_language l ON l.oid=p.prolang WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND p.prokind='f' ORDER BY 1,2,3"
  Export-ReadOnlyCsv 'function-privileges.csv' "SELECT routine_schema function_schema,routine_name function_name,grantee,privilege_type,is_grantable FROM information_schema.routine_privileges ORDER BY 1,2,3,4"
  Export-ReadOnlyCsv 'triggers.csv' "SELECT n.nspname schema_name,c.relname table_name,t.tgname trigger_name,t.tgenabled enabled_state,pg_catalog.pg_get_triggerdef(t.oid,true) definition FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_class c ON c.oid=t.tgrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE NOT t.tgisinternal ORDER BY 1,2,3"
  Export-ReadOnlyCsv 'table-privileges.csv' "SELECT grantor,grantee,table_schema,table_name,privilege_type,is_grantable FROM information_schema.table_privileges ORDER BY 3,4,2,5"
  Export-ReadOnlyCsv 'exact-row-counts.csv' "SELECT 'public'::text schema_name,'admin_users'::text table_name,count(*)::bigint exact_row_count FROM public.admin_users UNION ALL SELECT 'public','advisors',count(*) FROM public.advisors UNION ALL SELECT 'public','companies',count(*) FROM public.companies UNION ALL SELECT 'public','listing_claims',count(*) FROM public.listing_claims UNION ALL SELECT 'public','media_content',count(*) FROM public.media_content UNION ALL SELECT 'public','users',count(*) FROM public.users ORDER BY 1,2"
  Export-ReadOnlyCsv 'migration-history-status.csv' "SELECT (to_regclass('supabase_migrations.schema_migrations') IS NOT NULL)::text standard_migration_table_present,'supabase_migrations.schema_migrations'::text expected_relation"
  Export-ReadOnlyCsv 'migration-history-versions.csv' "SELECT version,name FROM supabase_migrations.schema_migrations ORDER BY version"

  $SiteResponse = Invoke-WebRequest -Uri 'https://www.thehockeydirectory.com/' -UseBasicParsing -TimeoutSec 30
  $ApiResponse = Invoke-RestMethod -Uri 'https://www.thehockeydirectory.com/api/advisors?limit=1' -Method Get -TimeoutSec 30
  if ($SiteResponse.StatusCode -ne 200 -or [int64]$ApiResponse.pagination.total -ne 202 -or @($ApiResponse.advisors).Count -ne 1) { throw 'Post-M3 public smokes failed.' }
  if (@(git diff --cached --name-only).Count -ne 0 -or (@(git status --porcelain=v1) -join "`n") -ne $WorktreeBeforeText) { throw 'Repository staging/worktree changed during M3 application.' }
  $ArchiveEntries = @(Get-Content -LiteralPath $ArchiveContentsPath | Where-Object {$_.Trim() -and -not $_.StartsWith(';')}).Count
  if ($ArchiveEntries -ne 1337) { throw "Post-M3 archive has $ArchiveEntries entries instead of exact target count 1337." }

  [ordered]@{
    status='success';captured_at_utc=(Get-Date).ToUniversalTime().ToString('o');project_ref=$ProjectRef
    migration_history=@(@{version=$M1Version;name=$M1Name},@{version=$M2Version;name=$M2Name},@{version=$M3Version;name=$M3Name})
    admin_rows=0;application_counts=[ordered]@{companies=202;advisors=177;listing_claims=0;media_content=0;users=0}
    m1_sha256=$M1Sha256;m2_sha256=$M2Sha256;m3_sha256=$M3Sha256;supabase_cli_version=$SupabaseCliVersion
    dry_run_migrations=$DryRunMigrations;apply_migrations=@($M3Filename);archive_bytes=(Get-Item -LiteralPath $ArchivePath).Length
    archive_entries=$ArchiveEntries;authorization_catalog='passed';site_smoke_status=200;api_total=202
    production_changes_made=$true;baseline_ddl_executed=$false;first_admin_created=$false
  } | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'post-m3-summary.json')
  @{success=$true;status='success';production_changes_made=$true;baseline_ddl_executed=$false;first_admin_created=$false} | ConvertTo-Json | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'status.json')
  Write-EvidenceChecksumManifest
  & node scripts/database/validate-production-evidence.mjs $PostDirectory --target current
  Assert-LastExitCode 'Post-M3 evidence validation failed.'
  & node scripts/database/validate-migrations.mjs
  Assert-LastExitCode 'Final post-M3 repository validation failed.'

  Write-Output "M3 applied and verified. Post evidence package: $PostName"
  Write-Output 'Exact M1+M2+M3 history; zero admin rows; unchanged 202/177/0/0/0 application counts.'
} catch {
  $Failure = $_
  if (Test-Path -LiteralPath $PostDirectory) {
    try {
      @{success=$false;status='failed';production_changes_made=$ApplySucceeded;baseline_ddl_executed=$false;first_admin_created=$false;error=$Failure.Exception.Message} | ConvertTo-Json | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'status.json')
      Write-EvidenceChecksumManifest
    } catch { Write-Warning 'Could not finalize failed post-M3 evidence status/checksums.' }
  }
  throw $Failure
} finally {
  Pop-Location
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  if ($PasswordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($PasswordPointer) }
  $SecurePassword = $null
}
