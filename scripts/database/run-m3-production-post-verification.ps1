[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ApplyEvidenceDirectory
)

$ErrorActionPreference = 'Stop'
$ProjectRef = 'dqskdrqubqnhdssxpryx'
$PoolerHost = 'aws-1-ca-central-1.pooler.supabase.com'
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
$ExpectedHistorySignature = "${M1Version}:${M1Name},${M2Version}:${M2Name},${M3Version}:${M3Name}"
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
$PostName = "advisor-directory-production-post-m3-$Timestamp"
$PostDirectory = Join-Path $BackupRoot $PostName
$ArchivePath = Join-Path $PostDirectory "production-$Timestamp.dump"
$SchemaPath = Join-Path $PostDirectory "production-schema-$Timestamp.sql"
$DataStreamPath = Join-Path $PostDirectory 'data-stream-validation.sql'
$ArchiveContentsPath = Join-Path $PostDirectory 'archive-contents.txt'
$RolesPath = Join-Path $PostDirectory "roles-$Timestamp.sql"
$PasswordPointer = [IntPtr]::Zero
$SecurePassword = $null

function Assert-LastExitCode([string]$Message) { if ($LASTEXITCODE -ne 0) { throw $Message } }

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

function Write-EvidenceChecksumManifest {
  Get-ChildItem -LiteralPath $PostDirectory -File -Recurse | Where-Object { $_.Name -ne 'SHA256SUMS.txt' } |
    Sort-Object FullName | ForEach-Object {
      $Hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()
      $RelativeName = $_.FullName.Substring($PostDirectory.Length + 1)
      "$Hash *$RelativeName"
    } | Set-Content -Encoding ascii -LiteralPath (Join-Path $PostDirectory 'SHA256SUMS.txt')
}

foreach ($Tool in @($Psql,$PgDump,$PgDumpAll,$PgRestore)) { if (-not (Test-Path -LiteralPath $Tool)) { throw "Required PostgreSQL tool is missing: $Tool" } }
$ApplyEvidenceDirectory = (Resolve-Path -LiteralPath $ApplyEvidenceDirectory).Path
if (-not $ApplyEvidenceDirectory.StartsWith([IO.Path]::GetFullPath($BackupRoot),[StringComparison]::OrdinalIgnoreCase)) { throw 'Apply evidence is outside the protected backup root.' }
$PriorStatus = Get-Content -Raw -LiteralPath (Join-Path $ApplyEvidenceDirectory 'status.json') | ConvertFrom-Json
if ($PriorStatus.production_changes_made -ne $true -or $PriorStatus.first_admin_created -ne $false) { throw 'Prior apply evidence does not prove M3 application without an administrator row.' }
$PriorApplyText = Get-Content -Raw -LiteralPath (Join-Path $ApplyEvidenceDirectory 'supabase-apply.txt')
$PriorDryRunText = Get-Content -Raw -LiteralPath (Join-Path $ApplyEvidenceDirectory 'supabase-dry-run.txt')
if ($PriorApplyText -notmatch 'Applying migration 20260719000002_administrator_authorization_foundation\.sql' -or $PriorApplyText -notmatch 'Finished supabase db push') { throw 'Prior apply output does not prove exact M3 completion.' }
if ((@([regex]::Matches($PriorDryRunText,'\b\d{14}_[a-z0-9_]+\.sql\b') | ForEach-Object {$_.Value} | Sort-Object -Unique) -join ',') -ne $M3Filename) { throw 'Prior dry run was not exact M3.' }
if (Test-Path -LiteralPath $PostDirectory) { throw 'Fresh post-verification directory is not unused.' }

Push-Location $RepositoryRoot
try {
  if ((git branch --show-current).Trim() -ne $ExpectedBranch) { throw 'Branch changed before post-M3 verification.' }
  if (@(git diff --cached --name-only).Count -ne 0) { throw 'Repository has staged files.' }
  $WorktreeBeforeText = @(git status --porcelain=v1) -join "`n"
  $M1Path = Join-Path $RepositoryRoot "supabase\migrations\${M1Version}_${M1Name}.sql"
  $M2Path = Join-Path $RepositoryRoot "supabase\migrations\${M2Version}_${M2Name}.sql"
  $M3Path = Join-Path $RepositoryRoot "supabase\migrations\$M3Filename"
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $M1Path).Hash.ToLowerInvariant() -ne $M1Sha256) { throw 'M1 hash differs.' }
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $M2Path).Hash.ToLowerInvariant() -ne $M2Sha256) { throw 'M2 hash differs.' }
  if ((Get-FileHash -Algorithm SHA256 -LiteralPath $M3Path).Hash.ToLowerInvariant() -ne $M3Sha256) { throw 'M3 hash differs.' }
  & node scripts/database/validate-migrations.mjs
  Assert-LastExitCode 'Repository validation failed before post-M3 verification.'

  $SecurePassword = Read-Host 'Enter the PRODUCTION Supabase database password for READ-ONLY M3 post-verification' -AsSecureString
  $PasswordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($PasswordPointer)
  $script:PsqlArguments = @('-X','-w','-h',$PoolerHost,'-p',5432,'-U',$DatabaseUser,'-d',$DatabaseName,'--set','ON_ERROR_STOP=1','--set','VERBOSITY=terse')

  $PostState = (Invoke-ReadOnlyScalar @"
SELECT json_build_object(
  'database',current_database(), 'connected_user',current_user,
  'history_signature',(SELECT coalesce(string_agg(version || ':' || name, ',' ORDER BY version), '') FROM supabase_migrations.schema_migrations),
  'admin_rows',(SELECT count(*) FROM public.admin_users),
  'counts_signature',concat_ws(',',(SELECT count(*) FROM public.companies),(SELECT count(*) FROM public.advisors),(SELECT count(*) FROM public.listing_claims),(SELECT count(*) FROM public.media_content),(SELECT count(*) FROM public.users)),
  'table_exact',EXISTS(SELECT 1 FROM pg_catalog.pg_class c WHERE c.oid=to_regclass('public.admin_users') AND c.relkind='r' AND c.relrowsecurity AND NOT c.relforcerowsecurity AND pg_catalog.pg_get_userbyid(c.relowner)='postgres'),
  'function',(SELECT json_build_object('kind',p.prokind,'argument_count',p.pronargs,'returns_set',p.proretset,'returns_boolean',p.prorettype='pg_catalog.bool'::pg_catalog.regtype,'language',l.lanname,'security_definer',p.prosecdef,'volatility',p.provolatile,'parallel_safety',p.proparallel,'strict',p.proisstrict,'leakproof',p.proleakproof,'configuration_text',array_to_string(p.proconfig,','),'configuration_cardinality',cardinality(p.proconfig),'owner',pg_catalog.pg_get_userbyid(p.proowner)) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_language l ON l.oid=p.prolang WHERE p.oid=to_regprocedure('public.is_admin()')),
  'function_grants',NOT pg_catalog.has_function_privilege('anon','public.is_admin()','EXECUTE') AND pg_catalog.has_function_privilege('authenticated','public.is_admin()','EXECUTE') AND pg_catalog.has_function_privilege('service_role','public.is_admin()','EXECUTE'),
  'table_grants',NOT pg_catalog.has_table_privilege('anon','public.admin_users','SELECT') AND pg_catalog.has_table_privilege('authenticated','public.admin_users','SELECT') AND NOT pg_catalog.has_table_privilege('authenticated','public.admin_users','INSERT,UPDATE,DELETE') AND pg_catalog.has_table_privilege('service_role','public.admin_users','SELECT,INSERT,UPDATE,DELETE'),
  'policy_exact',(SELECT count(*)=1 AND bool_and(p.polpermissive AND p.polcmd='r' AND p.polroles=ARRAY[(SELECT oid FROM pg_catalog.pg_roles WHERE rolname='authenticated')] AND pg_catalog.pg_get_expr(p.polqual,p.polrelid)='(user_id = auth.uid())' AND p.polwithcheck IS NULL) FROM pg_catalog.pg_policy p WHERE p.polrelid=to_regclass('public.admin_users')),
  'trigger_exact',EXISTS(SELECT 1 FROM pg_catalog.pg_trigger t WHERE t.tgrelid=to_regclass('public.admin_users') AND t.tgname='update_admin_users_updated_at' AND t.tgfoid=to_regprocedure('public.update_updated_at_column()') AND t.tgtype=19 AND t.tgenabled='O' AND NOT t.tgisinternal)
)::text
"@) | ConvertFrom-Json
  if ($PostState.database -ne $DatabaseName -or $PostState.connected_user -ne 'postgres') { throw 'Post-M3 routed identity mismatch.' }
  if ($PostState.history_signature -ne $ExpectedHistorySignature -or $PostState.counts_signature -ne '202,177,0,0,0' -or [int64]$PostState.admin_rows -ne 0) { throw 'Post-M3 history, counts, or empty-admin invariant failed.' }
  foreach ($Property in @('table_exact','function_grants','table_grants','policy_exact','trigger_exact')) { if ($PostState.$Property -ne $true) { throw "Post-M3 authorization verification failed: $Property" } }
  $ExpectedFunction = [ordered]@{kind='f';argument_count=0;returns_set=$false;returns_boolean=$true;language='sql';security_definer=$true;volatility='s';parallel_safety='s';strict=$false;leakproof=$false;configuration_text='search_path=""';configuration_cardinality=1;owner='postgres'}
  foreach ($Property in $ExpectedFunction.Keys) { if ($PostState.function.$Property -ne $ExpectedFunction[$Property]) { throw "Post-M3 function verification failed: $Property" } }

  $AuthenticatedBehavior = Invoke-ReadOnlyScalar "SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claim.sub='00000000-0000-4000-8000-000000000001'; SELECT public.is_admin()::text || '|' || (SELECT count(*) FROM public.admin_users)::text;"
  $ServiceBehavior = Invoke-ReadOnlyScalar "SET LOCAL ROLE service_role; RESET request.jwt.claim.sub; SELECT public.is_admin()::text || '|' || (SELECT count(*) FROM public.admin_users)::text;"
  if ($AuthenticatedBehavior -ne 'false|0' -or $ServiceBehavior -ne 'false|0') { throw 'Post-M3 empty-registry role behavior failed.' }

  New-Item -ItemType Directory -Path $PostDirectory | Out-Null
  Copy-Item -LiteralPath (Join-Path $ApplyEvidenceDirectory 'supabase-apply.txt'),(Join-Path $ApplyEvidenceDirectory 'supabase-dry-run.txt') -Destination $PostDirectory
  if (Test-Path -LiteralPath (Join-Path $ApplyEvidenceDirectory 'm3-cli-work')) { Copy-Item -Recurse -LiteralPath (Join-Path $ApplyEvidenceDirectory 'm3-cli-work') -Destination $PostDirectory }
  [ordered]@{authenticated_non_admin=$AuthenticatedBehavior;service_role_without_subject=$ServiceBehavior;anonymous_execute=$false;active_inactive_matrix='passed_disposable';production_admin_rows=0} | ConvertTo-Json | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'role-matrix-verification.json')
  [pscustomobject]@{database_name=$DatabaseName;connected_user='postgres';captured_at_utc=(Get-Date).ToUniversalTime().ToString('o');expected_project_ref=$ProjectRef;pooler_route=$PoolerHost;identity_match=$true} | Export-Csv -NoTypeInformation -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'server-info.csv')

  & $PgDump -w -h $PoolerHost -p 5432 -U $DatabaseUser -d $DatabaseName --format=custom --compress=9 --file=$ArchivePath
  Assert-LastExitCode 'Post-M3 protected archive failed.'
  & $PgDumpAll -w -h $PoolerHost -p 5432 -U $DatabaseUser -l $DatabaseName --roles-only --no-role-passwords --file=$RolesPath
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
  if (@(git diff --cached --name-only).Count -ne 0 -or (@(git status --porcelain=v1) -join "`n") -ne $WorktreeBeforeText) { throw 'Repository staging/worktree changed during post-M3 verification.' }
  $ArchiveEntries = @(Get-Content -LiteralPath $ArchiveContentsPath | Where-Object {$_.Trim() -and -not $_.StartsWith(';')}).Count
  if ($ArchiveEntries -ne 1337) { throw "Post-M3 archive has $ArchiveEntries entries instead of exact target count 1337." }

  [ordered]@{
    status='success';captured_at_utc=(Get-Date).ToUniversalTime().ToString('o');project_ref=$ProjectRef
    migration_history=@(@{version=$M1Version;name=$M1Name},@{version=$M2Version;name=$M2Name},@{version=$M3Version;name=$M3Name})
    admin_rows=0;application_counts=[ordered]@{companies=202;advisors=177;listing_claims=0;media_content=0;users=0}
    m1_sha256=$M1Sha256;m2_sha256=$M2Sha256;m3_sha256=$M3Sha256;supabase_cli_version='2.109.1'
    dry_run_migrations=@($M3Filename);apply_migrations=@($M3Filename);apply_reinvoked=$false
    archive_bytes=(Get-Item -LiteralPath $ArchivePath).Length;archive_entries=$ArchiveEntries;authorization_catalog='passed'
    role_matrix='production_empty_registry_and_disposable_full_matrix_passed';site_smoke_status=200;api_total=202
    production_changes_made=$true;baseline_ddl_executed=$false;first_admin_created=$false;verification_only=$true
  } | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'post-m3-summary.json')
  @{success=$true;status='success';production_changes_made=$true;baseline_ddl_executed=$false;first_admin_created=$false;apply_reinvoked=$false;verification_only=$true} | ConvertTo-Json | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'status.json')
  Write-EvidenceChecksumManifest
  & node scripts/database/validate-production-evidence.mjs $PostDirectory --target current
  Assert-LastExitCode 'Post-M3 evidence validation failed.'
  & node scripts/database/validate-migrations.mjs
  Assert-LastExitCode 'Final post-M3 repository validation failed.'
  Write-Output "M3 post-verification passed without reapplying. Evidence package: $PostName"
} catch {
  $Failure = $_
  try { @{success=$false;status='failed';production_changes_made=$true;apply_reinvoked=$false;verification_only=$true;error=$Failure.Exception.Message} | ConvertTo-Json | Set-Content -Encoding utf8 -LiteralPath (Join-Path $BackupRoot 'm3-post-verification-latest-status.json') } catch {}
  if (Test-Path -LiteralPath $PostDirectory) {
    try { @{success=$false;status='failed';production_changes_made=$true;baseline_ddl_executed=$false;first_admin_created=$false;apply_reinvoked=$false;verification_only=$true;error=$Failure.Exception.Message} | ConvertTo-Json | Set-Content -Encoding utf8 -LiteralPath (Join-Path $PostDirectory 'status.json'); Write-EvidenceChecksumManifest } catch {}
  }
  throw $Failure
} finally {
  Pop-Location
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  if ($PasswordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($PasswordPointer) }
  $SecurePassword = $null
}
