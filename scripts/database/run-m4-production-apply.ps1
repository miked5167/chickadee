[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('APPROVE M4 PRODUCTION MIGRATION')]
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
$M3Sha256 = 'a968f41fb10e6ecbe1ff8363abe0322031defd6aa361ce3c98498603ade55f6d'
$M4Version = '20260719000003'
$M4Name = 'company_reviews'
$M4Filename = "${M4Version}_${M4Name}.sql"
$M4Sha256 = '05bbef023d1b74e5707d801554e2839248d9a976f71fea41155167b69f8f69f7'
$PreM4HistorySignature = "${M1Version}:${M1Name},${M2Version}:${M2Name},${M3Version}:${M3Name}"
$PostM4HistorySignature = "${PreM4HistorySignature},${M4Version}:${M4Name}"
$SupabaseCliVersion = '2.109.1'
$ExpectedBranch = 'codex/restart-foundation'
$RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$PostgresBin = 'C:\Program Files\PostgreSQL\18\bin'
$Psql = Join-Path $PostgresBin 'psql.exe'
$PgDump = Join-Path $PostgresBin 'pg_dump.exe'
$PgDumpAll = Join-Path $PostgresBin 'pg_dumpall.exe'
$PgRestore = Join-Path $PostgresBin 'pg_restore.exe'
$ProtectedRootName = @('HockeyAdvisorDirectory','Backups') -join '-'
$BackupRoot = Join-Path $env:USERPROFILE (Join-Path $ProtectedRootName 'production')
$Timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$PostName = "advisor-directory-production-post-m4-$Timestamp"
$PostDirectory = Join-Path $BackupRoot $PostName
$ArchivePath = Join-Path $PostDirectory "production-$Timestamp.dump"
$SchemaPath = Join-Path $PostDirectory "production-schema-$Timestamp.sql"
$DataStreamPath = Join-Path $PostDirectory 'data-stream-validation.sql'
$ArchiveContentsPath = Join-Path $PostDirectory 'archive-contents.txt'
$RolesPath = Join-Path $PostDirectory "roles-$Timestamp.sql"
$CliWorkDirectory = Join-Path $PostDirectory 'm4-cli-work'
$PasswordPointer = [IntPtr]::Zero
$SecurePassword = $null
$ApplySucceeded = $false

function Assert-LastExitCode([string]$Message) {
  if ($LASTEXITCODE -ne 0) { throw $Message }
}

function Invoke-ReadOnlyScalar([string]$Sql) {
  $Output = & $Psql @script:PsqlArguments -Atq --command "BEGIN READ ONLY; $Sql; ROLLBACK;"
  Assert-LastExitCode 'Read-only production verification query failed.'
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

if ($ApprovalPhrase -ne 'APPROVE M4 PRODUCTION MIGRATION') { throw 'Exact M4 production approval phrase is required.' }
foreach ($Tool in @($Psql,$PgDump,$PgDumpAll,$PgRestore)) {
  if (-not (Test-Path -LiteralPath $Tool)) { throw "Required PostgreSQL tool is missing: $Tool" }
}
if (-not (Test-Path -LiteralPath $BackupRoot)) { throw 'Protected production backup root does not exist.' }
$BackupRootResolved = [IO.Path]::GetFullPath($BackupRoot)
$RepositoryResolved = [IO.Path]::GetFullPath($RepositoryRoot)
if ($BackupRootResolved.StartsWith($RepositoryResolved,[StringComparison]::OrdinalIgnoreCase) -or $BackupRootResolved -like '*OneDrive*') {
  throw 'Protected backup root is not isolated from the repository and OneDrive.'
}
if (Test-Path -LiteralPath $PostDirectory) { throw 'Fresh post-M4 evidence directory is not unused.' }

Push-Location $RepositoryRoot
try {
  # Approval never skips the gate: capture a new pre-M4 backup and dry run in the approved window.
  $PreflightStartedAtUtc = (Get-Date).ToUniversalTime()
  & (Join-Path $PSScriptRoot 'run-m3-production-preflight.ps1') -Target M4
  Assert-LastExitCode 'Immediate approved-window M4 preflight failed.'

  $ApprovedPreflightDirectory = Get-ChildItem -LiteralPath $BackupRoot -Directory -Filter 'advisor-directory-production-pre-m4-*' |
    Where-Object { $_.CreationTimeUtc -ge $PreflightStartedAtUtc } |
    Sort-Object CreationTimeUtc -Descending | Select-Object -First 1
  if ($null -eq $ApprovedPreflightDirectory) { throw 'Fresh successful pre-M4 evidence package was not found.' }
  & node scripts/database/validate-production-evidence.mjs $ApprovedPreflightDirectory.FullName --target m3
  Assert-LastExitCode 'Approved-window pre-M4 evidence validation failed.'
  $CandidateSummary = Get-Content -Raw -LiteralPath (Join-Path $ApprovedPreflightDirectory.FullName 'preflight-summary.json') | ConvertFrom-Json
  if ($CandidateSummary.production_changes_made -ne $false -or $CandidateSummary.m3_objects_exact -ne $true -or
      $CandidateSummary.m4_objects_absent -ne $true -or @($CandidateSummary.dry_run_migrations).Count -ne 1 -or
      $CandidateSummary.dry_run_migrations[0] -ne $M4Filename) {
    throw 'Approved-window preflight summary is not the exact no-mutation M4 candidate.'
  }

  if ((git branch --show-current).Trim() -ne $ExpectedBranch) { throw "Branch differs from $ExpectedBranch." }
  if (@(git diff --cached --name-only).Count -ne 0) { throw 'Repository has staged files.' }
  $WorktreeBeforeText = @(git status --porcelain=v1) -join "`n"
  $M1Path = Join-Path $RepositoryRoot "supabase\migrations\${M1Version}_${M1Name}.sql"
  $M2Path = Join-Path $RepositoryRoot "supabase\migrations\${M2Version}_${M2Name}.sql"
  $M3Path = Join-Path $RepositoryRoot "supabase\migrations\${M3Version}_${M3Name}.sql"
  $M4Path = Join-Path $RepositoryRoot "supabase\migrations\$M4Filename"
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $M1Path).Hash.ToLowerInvariant() -ne $M1Sha256) { throw 'M1 hash differs immediately before M4.' }
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $M2Path).Hash.ToLowerInvariant() -ne $M2Sha256) { throw 'M2 hash differs immediately before M4.' }
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $M3Path).Hash.ToLowerInvariant() -ne $M3Sha256) { throw 'M3 hash differs immediately before M4.' }
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $M4Path).Hash.ToLowerInvariant() -ne $M4Sha256) { throw 'M4 hash differs immediately before application.' }
  & node scripts/database/validate-migrations.mjs
  Assert-LastExitCode 'Repository validation failed immediately before M4.'

  $SecurePassword = Read-Host 'Enter the PRODUCTION Supabase database password for the APPROVED M4 migration' -AsSecureString
  $PasswordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($PasswordPointer)
  $script:PsqlArguments = @('-X','-w','-h',$PoolerHost,'-p',$PoolerPort,'-U',$DatabaseUser,'-d',$DatabaseName,'--set','ON_ERROR_STOP=1','--set','VERBOSITY=terse')

  $Immediate = (Invoke-ReadOnlyScalar @"
SELECT json_build_object(
  'database',current_database(), 'connected_user',current_user,
  'history_signature',(SELECT coalesce(string_agg(version || ':' || name, ',' ORDER BY version), '') FROM supabase_migrations.schema_migrations),
  'counts_signature',concat_ws(',',(SELECT count(*) FROM public.companies),(SELECT count(*) FROM public.advisors),(SELECT count(*) FROM public.listing_claims),(SELECT count(*) FROM public.media_content),(SELECT count(*) FROM public.users),(SELECT count(*) FROM public.admin_users)),
  'm3_exact',to_regclass('public.admin_users') IS NOT NULL AND to_regprocedure('public.is_admin()') IS NOT NULL
    AND EXISTS(SELECT 1 FROM pg_catalog.pg_proc p WHERE p.oid=to_regprocedure('public.is_admin()') AND p.prosecdef AND p.provolatile='s' AND cardinality(p.proconfig)=1 AND split_part(p.proconfig[array_lower(p.proconfig,1)],'=',1)='search_path' AND pg_catalog.pg_get_functiondef(p.oid) LIKE '%SET search_path TO ''''%'),
  'm4_absent',to_regclass('public.reviews') IS NULL
    AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('reviews_pkey','reviews_company_reviewer_key','reviews_company_published_idx','reviews_reviewer_idx'))
    AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_policy WHERE polname IN ('Published company reviews are public','Users can create own company reviews','Users can update own company reviews','Users can delete own company reviews'))
    AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_trigger WHERE tgname='update_reviews_updated_at' AND NOT tgisinternal)
)::text
"@) | ConvertFrom-Json
  if ($Immediate.database -ne $DatabaseName -or $Immediate.connected_user -ne 'postgres' -or $Immediate.m3_exact -ne $true -or $Immediate.m4_absent -ne $true) { throw 'Immediate production identity/object precheck failed.' }
  if ($Immediate.history_signature -ne $PreM4HistorySignature) { throw 'Immediate production history is not exact M1+M2+M3.' }
  if ($Immediate.counts_signature -ne '202,177,0,0,0,0') { throw 'Immediate production counts differ.' }

  New-Item -ItemType Directory -Path $PostDirectory | Out-Null
  New-Item -ItemType Directory -Path $CliWorkDirectory | Out-Null
  [void](Invoke-SupabaseCli @('--yes',"supabase@$SupabaseCliVersion",'--workdir',$CliWorkDirectory,'init') 'Could not initialize isolated M4 apply work directory.')
  New-Item -ItemType Directory -Path (Join-Path $CliWorkDirectory 'supabase\migrations') -Force | Out-Null
  Copy-Item -LiteralPath $M1Path,$M2Path,$M3Path,$M4Path -Destination (Join-Path $CliWorkDirectory 'supabase\migrations')
  $DatabaseUrlScheme = @('postgresql','://') -join ''
  $PasswordlessDbUrl = "${DatabaseUrlScheme}${DatabaseUser}@${PoolerHost}:${PoolerPort}/${DatabaseName}?sslmode=require"
  $DryRunText = (Invoke-SupabaseCli @('--yes',"supabase@$SupabaseCliVersion",'--workdir',$CliWorkDirectory,'db','push','--dry-run','--db-url',$PasswordlessDbUrl) 'Immediate pinned M4 dry run failed.') -join "`n"
  $DryRunMigrations = @([regex]::Matches($DryRunText,'\b\d{14}_[a-z0-9_]+\.sql\b') | ForEach-Object { $_.Value } | Sort-Object -Unique)
  if ($DryRunMigrations.Count -ne 1 -or $DryRunMigrations[0] -ne $M4Filename) { throw 'Immediate pinned dry run does not contain only M4.' }
  $DryRunText | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'supabase-dry-run.txt')

  $ApplyOutput = Invoke-SupabaseCli @('--yes',"supabase@$SupabaseCliVersion",'--workdir',$CliWorkDirectory,'db','push','--yes','--db-url',$PasswordlessDbUrl) 'Pinned M4 application failed.'
  $ApplySucceeded = $true
  ($ApplyOutput -join "`n") | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'supabase-apply.txt')

  $PostState = (Invoke-ReadOnlyScalar @"
SELECT json_build_object(
  'history_signature',(SELECT coalesce(string_agg(version || ':' || name, ',' ORDER BY version), '') FROM supabase_migrations.schema_migrations),
  'counts_signature',concat_ws(',',(SELECT count(*) FROM public.companies),(SELECT count(*) FROM public.advisors),(SELECT count(*) FROM public.listing_claims),(SELECT count(*) FROM public.media_content),(SELECT count(*) FROM public.users),(SELECT count(*) FROM public.admin_users),(SELECT count(*) FROM public.reviews)),
  'reviews_table_exact',EXISTS(SELECT 1 FROM pg_catalog.pg_class c WHERE c.oid=to_regclass('public.reviews') AND c.relkind='r' AND c.relrowsecurity AND NOT c.relforcerowsecurity AND pg_catalog.pg_get_userbyid(c.relowner)='postgres'),
  'reviews_constraints_exact',(SELECT count(*)=8 AND bool_and(conname IN ('reviews_pkey','reviews_company_id_fkey','reviews_reviewer_user_id_fkey','reviews_company_reviewer_key','reviews_rating_check','reviews_title_length_check','reviews_text_length_check','reviews_confirmation_check')) FROM pg_catalog.pg_constraint WHERE conrelid=to_regclass('public.reviews')),
  'reviews_indexes_exact',(SELECT count(*)=4 AND bool_and(c.relname IN ('reviews_pkey','reviews_company_reviewer_key','reviews_company_published_idx','reviews_reviewer_idx')) FROM pg_catalog.pg_index i JOIN pg_catalog.pg_class c ON c.oid=i.indexrelid WHERE i.indrelid=to_regclass('public.reviews')),
  'reviews_policies_exact',(SELECT count(*)=4 AND bool_and(polname IN ('Published company reviews are public','Users can create own company reviews','Users can update own company reviews','Users can delete own company reviews')) AND bool_and(NOT ((SELECT oid FROM pg_catalog.pg_roles WHERE rolname='service_role')=ANY(polroles))) FROM pg_catalog.pg_policy WHERE polrelid=to_regclass('public.reviews')),
  'reviews_trigger_exact',EXISTS(SELECT 1 FROM pg_catalog.pg_trigger t WHERE t.tgrelid=to_regclass('public.reviews') AND t.tgname='update_reviews_updated_at' AND t.tgfoid=to_regprocedure('public.update_updated_at_column()') AND t.tgtype=19 AND t.tgenabled='O' AND NOT t.tgisinternal),
  'reviews_table_grants_exact',NOT EXISTS(SELECT 1 FROM information_schema.table_privileges WHERE table_schema='public' AND table_name='reviews' AND grantee IN ('PUBLIC','anon'))
    AND (SELECT coalesce(array_agg(privilege_type ORDER BY privilege_type),ARRAY[]::text[])=ARRAY['DELETE']::text[] FROM information_schema.table_privileges WHERE table_schema='public' AND table_name='reviews' AND grantee='authenticated')
    AND (SELECT count(*)=7 FROM information_schema.table_privileges WHERE table_schema='public' AND table_name='reviews' AND grantee='service_role'),
  'reviews_column_grants_exact',(SELECT coalesce(array_agg(column_name::text ORDER BY column_name),ARRAY[]::text[])=ARRAY['company_id','created_at','experience_confirmed_at','id','rating','review_text','title','updated_at']::text[] FROM information_schema.column_privileges WHERE table_schema='public' AND table_name='reviews' AND grantee='anon' AND privilege_type='SELECT')
    AND (SELECT coalesce(array_agg(column_name::text ORDER BY column_name),ARRAY[]::text[])=ARRAY['company_id','created_at','experience_confirmed_at','id','rating','review_text','title','updated_at']::text[] FROM information_schema.column_privileges WHERE table_schema='public' AND table_name='reviews' AND grantee='authenticated' AND privilege_type='SELECT')
    AND (SELECT coalesce(array_agg(column_name::text ORDER BY column_name),ARRAY[]::text[])=ARRAY['company_id','experience_confirmed_at','rating','review_text','reviewer_user_id','title']::text[] FROM information_schema.column_privileges WHERE table_schema='public' AND table_name='reviews' AND grantee='authenticated' AND privilege_type='INSERT')
    AND (SELECT coalesce(array_agg(column_name::text ORDER BY column_name),ARRAY[]::text[])=ARRAY['experience_confirmed_at','rating','review_text','title']::text[] FROM information_schema.column_privileges WHERE table_schema='public' AND table_name='reviews' AND grantee='authenticated' AND privilege_type='UPDATE'),
  'm3_still_exact',(SELECT count(*)=0 FROM public.admin_users) AND EXISTS(SELECT 1 FROM pg_catalog.pg_proc p WHERE p.oid=to_regprocedure('public.is_admin()') AND p.prosecdef AND p.provolatile='s' AND cardinality(p.proconfig)=1 AND pg_catalog.pg_get_functiondef(p.oid) LIKE '%SET search_path TO ''''%')
)::text
"@) | ConvertFrom-Json
  if ($PostState.history_signature -ne $PostM4HistorySignature -or $PostState.counts_signature -ne '202,177,0,0,0,0,0') { throw 'Post-M4 history, counts, or zero-row invariant failed.' }
  foreach ($Property in @('reviews_table_exact','reviews_constraints_exact','reviews_indexes_exact','reviews_policies_exact','reviews_trigger_exact','reviews_table_grants_exact','reviews_column_grants_exact','m3_still_exact')) {
    if ($PostState.$Property -ne $true) { throw "Post-M4 review verification failed: $Property" }
  }

  [pscustomobject]@{database_name=$DatabaseName;connected_user='postgres';captured_at_utc=(Get-Date).ToUniversalTime().ToString('o');expected_project_ref=$ProjectRef;pooler_route=$PoolerHost;identity_match=$true} | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'server-info.csv')
  & $PgDump -w -h $PoolerHost -p $PoolerPort -U $DatabaseUser -d $DatabaseName --format=custom --compress=9 --file=$ArchivePath
  Assert-LastExitCode 'Post-M4 protected archive failed.'
  & $PgDumpAll -w -h $PoolerHost -p $PoolerPort -U $DatabaseUser -l $DatabaseName --roles-only --no-role-passwords --file=$RolesPath
  Assert-LastExitCode 'Post-M4 roles export failed.'
  & $PgRestore --list --file=$ArchiveContentsPath $ArchivePath
  Assert-LastExitCode 'Post-M4 archive listing failed.'
  & $PgRestore --schema-only --file=$SchemaPath $ArchivePath
  Assert-LastExitCode 'Post-M4 schema stream failed.'
  & $PgRestore --data-only --file=$DataStreamPath $ArchivePath
  Assert-LastExitCode 'Post-M4 data stream failed.'

  Export-ReadOnlyCsv 'tables.csv' "SELECT n.nspname schema_name,c.relname table_name,CASE c.relkind WHEN 'r' THEN 'table' WHEN 'p' THEN 'partitioned table' ELSE c.relkind::text END table_type,pg_catalog.pg_get_userbyid(c.relowner) owner,c.relrowsecurity rls_enabled,c.relforcerowsecurity rls_forced,c.reltuples::bigint estimated_rows,pg_catalog.pg_total_relation_size(c.oid) total_bytes FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p') ORDER BY 1,2"
  Export-ReadOnlyCsv 'columns.csv' "SELECT table_schema schema_name,table_name,ordinal_position,column_name,data_type,udt_schema,udt_name,is_nullable,column_default FROM information_schema.columns ORDER BY 1,2,3"
  Export-ReadOnlyCsv 'relationships-and-constraints.csv' "SELECT n.nspname schema_name,c.relname table_name,con.conname constraint_name,CASE con.contype WHEN 'c' THEN 'check' WHEN 'f' THEN 'foreign key' WHEN 'p' THEN 'primary key' WHEN 'u' THEN 'unique' WHEN 'x' THEN 'exclusion' ELSE con.contype::text END constraint_type,rn.nspname referenced_schema,rc.relname referenced_table,pg_catalog.pg_get_constraintdef(con.oid,true) definition FROM pg_catalog.pg_constraint con JOIN pg_catalog.pg_class c ON c.oid=con.conrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_catalog.pg_class rc ON rc.oid=con.confrelid LEFT JOIN pg_catalog.pg_namespace rn ON rn.oid=rc.relnamespace ORDER BY 1,2,3"
  Export-ReadOnlyCsv 'rls-policies.csv' "SELECT n.nspname schema_name,c.relname table_name,p.polname policy_name,p.polpermissive permissive,ARRAY(SELECT pg_catalog.pg_get_userbyid(role_oid) FROM unnest(p.polroles) role_oid ORDER BY 1)::text roles,p.polcmd cmd,pg_catalog.pg_get_expr(p.polqual,p.polrelid) qual,pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid) with_check FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid=p.polrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace ORDER BY 1,2,3"
  Export-ReadOnlyCsv 'functions.csv' "SELECT n.nspname schema_name,p.proname function_name,pg_catalog.pg_get_function_identity_arguments(p.oid) identity_arguments,pg_catalog.pg_get_function_result(p.oid) result_type,l.lanname language,p.prosecdef security_definer,p.provolatile volatility,pg_catalog.pg_get_userbyid(p.proowner) owner,pg_catalog.pg_get_functiondef(p.oid) definition FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace JOIN pg_catalog.pg_language l ON l.oid=p.prolang WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND p.prokind='f' ORDER BY 1,2,3"
  Export-ReadOnlyCsv 'function-privileges.csv' "SELECT routine_schema function_schema,routine_name function_name,grantee,privilege_type,is_grantable FROM information_schema.routine_privileges ORDER BY 1,2,3,4"
  Export-ReadOnlyCsv 'triggers.csv' "SELECT n.nspname schema_name,c.relname table_name,t.tgname trigger_name,t.tgenabled enabled_state,pg_catalog.pg_get_triggerdef(t.oid,true) definition FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_class c ON c.oid=t.tgrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE NOT t.tgisinternal ORDER BY 1,2,3"
  Export-ReadOnlyCsv 'table-privileges.csv' "SELECT grantor,grantee,table_schema,table_name,privilege_type,is_grantable FROM information_schema.table_privileges ORDER BY 3,4,2,5"
  Export-ReadOnlyCsv 'column-privileges.csv' "SELECT grantor,grantee,table_schema,table_name,column_name,privilege_type,is_grantable FROM information_schema.column_privileges ORDER BY 3,4,5,2,6"
  Export-ReadOnlyCsv 'exact-row-counts.csv' "SELECT 'public'::text schema_name,'admin_users'::text table_name,count(*)::bigint exact_row_count FROM public.admin_users UNION ALL SELECT 'public','advisors',count(*) FROM public.advisors UNION ALL SELECT 'public','companies',count(*) FROM public.companies UNION ALL SELECT 'public','listing_claims',count(*) FROM public.listing_claims UNION ALL SELECT 'public','media_content',count(*) FROM public.media_content UNION ALL SELECT 'public','reviews',count(*) FROM public.reviews UNION ALL SELECT 'public','users',count(*) FROM public.users ORDER BY 1,2"
  Export-ReadOnlyCsv 'migration-history-status.csv' "SELECT (to_regclass('supabase_migrations.schema_migrations') IS NOT NULL)::text standard_migration_table_present,'supabase_migrations.schema_migrations'::text expected_relation"
  Export-ReadOnlyCsv 'migration-history-versions.csv' "SELECT version,name FROM supabase_migrations.schema_migrations ORDER BY version"

  $SiteResponse = Invoke-WebRequest -Uri 'https://www.thehockeydirectory.com/' -UseBasicParsing -TimeoutSec 30
  $ApiResponse = Invoke-RestMethod -Uri 'https://www.thehockeydirectory.com/api/advisors?limit=1' -Method Get -TimeoutSec 30
  if ($SiteResponse.StatusCode -ne 200 -or [int64]$ApiResponse.pagination.total -ne 202 -or @($ApiResponse.advisors).Count -ne 1) { throw 'Post-M4 public smokes failed.' }
  if (@(git diff --cached --name-only).Count -ne 0 -or (@(git status --porcelain=v1) -join "`n") -ne $WorktreeBeforeText) { throw 'Repository staging/worktree changed during M4 application.' }
  $ArchiveEntries = @(Get-Content -LiteralPath $ArchiveContentsPath | Where-Object { $_.Trim() -and -not $_.StartsWith(';') }).Count
  if ($ArchiveEntries -ne 1356) { throw "Post-M4 archive has $ArchiveEntries entries instead of exact target count 1356." }

  [ordered]@{
    status='success';captured_at_utc=(Get-Date).ToUniversalTime().ToString('o');project_ref=$ProjectRef
    migration_history=@(@{version=$M1Version;name=$M1Name},@{version=$M2Version;name=$M2Name},@{version=$M3Version;name=$M3Name},@{version=$M4Version;name=$M4Name})
    admin_rows=0;review_rows=0;application_counts=[ordered]@{companies=202;advisors=177;listing_claims=0;media_content=0;users=0}
    m1_sha256=$M1Sha256;m2_sha256=$M2Sha256;m3_sha256=$M3Sha256;m4_sha256=$M4Sha256;supabase_cli_version=$SupabaseCliVersion
    dry_run_migrations=$DryRunMigrations;apply_migrations=@($M4Filename);archive_bytes=(Get-Item -LiteralPath $ArchivePath).Length
    archive_entries=$ArchiveEntries;review_catalog='passed';review_grants='passed';site_smoke_status=200;api_total=202
    production_changes_made=$true;baseline_ddl_executed=$false;first_admin_created=$false;review_rows_created=0
  } | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'post-m4-summary.json')
  @{success=$true;status='success';production_changes_made=$true;baseline_ddl_executed=$false;first_admin_created=$false;review_rows_created=0} | ConvertTo-Json | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'status.json')
  Write-EvidenceChecksumManifest
  & node scripts/database/validate-production-evidence.mjs $PostDirectory --target m4
  Assert-LastExitCode 'Post-M4 evidence validation failed.'
  & node scripts/database/validate-migrations.mjs
  Assert-LastExitCode 'Final post-M4 repository validation failed.'

  Write-Output "M4 applied and verified. Post evidence package: $PostName"
  Write-Output 'Exact M1+M2+M3+M4 history; zero review/admin rows; unchanged 202/177/0/0/0 application counts.'
} catch {
  $Failure = $_
  if (Test-Path -LiteralPath $PostDirectory) {
    try {
      @{success=$false;status='failed';production_changes_made=$ApplySucceeded;baseline_ddl_executed=$false;first_admin_created=$false;review_rows_created=0;error=$Failure.Exception.Message} | ConvertTo-Json | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'status.json')
      Write-EvidenceChecksumManifest
    } catch { Write-Warning 'Could not finalize failed post-M4 evidence status/checksums.' }
  }
  throw $Failure
} finally {
  Pop-Location
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  if ($PasswordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($PasswordPointer) }
  $SecurePassword = $null
}
