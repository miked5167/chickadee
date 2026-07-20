[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$ProjectRef = 'dqskdrqubqnhdssxpryx'
$PoolerHost = 'aws-1-ca-central-1.pooler.supabase.com'
$PoolerPort = 5432
$DatabaseUser = "postgres.$ProjectRef"
$DatabaseName = 'postgres'
$ExpectedHistory = '20260719000000:production_company_baseline,20260719000001:add_companies_updated_at_trigger,20260719000002:administrator_authorization_foundation'
$Psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
$ProtectedRootName = @('HockeyAdvisorDirectory', 'Backups') -join '-'
$EvidenceRoot = Join-Path $env:USERPROFILE (Join-Path $ProtectedRootName 'production')
$Timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$EvidencePath = Join-Path $EvidenceRoot "m4-is-admin-diagnostic-$Timestamp.json"
$PasswordPointer = [IntPtr]::Zero
$SecurePassword = $null

if (-not (Test-Path -LiteralPath $Psql)) { throw 'Required PostgreSQL client is missing.' }
if (-not (Test-Path -LiteralPath $EvidenceRoot)) { throw 'Protected production evidence root does not exist.' }
if ($EvidenceRoot -like '*OneDrive*') { throw 'Protected evidence root must be outside OneDrive.' }
if (Test-Path -LiteralPath $EvidencePath) { throw 'Fresh diagnostic evidence path is not unused.' }

try {
  $SecurePassword = Read-Host 'Enter the PRODUCTION Supabase database password for the READ-ONLY is_admin diagnostic' -AsSecureString
  $PasswordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($PasswordPointer)
  $PsqlArguments = @(
    '-X', '-w', '-h', $PoolerHost, '-p', $PoolerPort,
    '-U', $DatabaseUser, '-d', $DatabaseName,
    '--set', 'ON_ERROR_STOP=1', '--set', 'VERBOSITY=terse', '-Atq'
  )

  $Sql = @"
BEGIN READ ONLY;
SELECT json_build_object(
  'captured_at_utc', (now() AT TIME ZONE 'utc'),
  'database', current_database(),
  'connected_user', current_user,
  'server_version', current_setting('server_version'),
  'history_signature', (
    SELECT coalesce(string_agg(version || ':' || name, ',' ORDER BY version), '')
      FROM supabase_migrations.schema_migrations
  ),
  'function_exists', (p.oid IS NOT NULL),
  'owner', pg_catalog.pg_get_userbyid(p.proowner),
  'kind', p.prokind,
  'argument_count', p.pronargs,
  'argument_default_count', p.pronargdefaults,
  'returns_set', p.proretset,
  'result_type', pg_catalog.pg_get_function_result(p.oid),
  'language', l.lanname,
  'volatility', p.provolatile,
  'parallel_safety', p.proparallel,
  'is_strict', p.proisstrict,
  'security_definer', p.prosecdef,
  'leakproof', p.proleakproof,
  'configuration', p.proconfig,
  'configuration_text', p.proconfig::text,
  'config_matches_quoted_empty_path', (p.proconfig = ARRAY['search_path=""']),
  'config_matches_unquoted_empty_path', (p.proconfig = ARRAY['search_path=']),
  'authenticated_execute', pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE'),
  'service_role_execute', pg_catalog.has_function_privilege('service_role', p.oid, 'EXECUTE'),
  'anon_execute', pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE'),
  'public_execute', EXISTS (
    SELECT 1
      FROM pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) AS privilege
     WHERE privilege.grantee = 0
       AND privilege.privilege_type = 'EXECUTE'
  ),
  'definition', pg_catalog.pg_get_functiondef(p.oid)
)::text
FROM (SELECT to_regprocedure('public.is_admin()') AS oid) AS target
LEFT JOIN pg_catalog.pg_proc AS p ON p.oid = target.oid
LEFT JOIN pg_catalog.pg_language AS l ON l.oid = p.prolang;
ROLLBACK;
"@

  $Output = & $Psql @PsqlArguments --command $Sql
  if ($LASTEXITCODE -ne 0) { throw 'Read-only production function diagnostic failed.' }
  $JsonText = (($Output | Where-Object { $_ -ne '' }) -join "`n").Trim()
  $Diagnostic = $JsonText | ConvertFrom-Json
  if ($Diagnostic.database -ne $DatabaseName -or $Diagnostic.connected_user -ne 'postgres') {
    throw 'Routed production database identity is ambiguous.'
  }
  if ($Diagnostic.history_signature -ne $ExpectedHistory) {
    throw 'Production migration history differs from exact M1+M2+M3 state.'
  }

  $Diagnostic | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 -LiteralPath $EvidencePath
  Write-Output "Read-only is_admin diagnostic completed. Evidence: $EvidencePath"
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  if ($PasswordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($PasswordPointer) }
  $SecurePassword = $null
}
