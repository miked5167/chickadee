import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {
  buildFingerprint,
  projectFingerprint,
  repositoryRoot,
  targetFingerprintPath,
} from './generate-schema-fingerprint.mjs'

const productionProjectReference = 'dqskdrqubqnhdssxpryx'
const migrationsDirectory = path.join(repositoryRoot, 'supabase', 'migrations')
const prerequisitesPath = path.join(repositoryRoot, 'supabase', 'validation', 'local-platform-prerequisites.sql')
const baselineMigrationPath = path.join(migrationsDirectory, '20260719000000_production_company_baseline.sql')
const m2MigrationPath = path.join(migrationsDirectory, '20260719000001_add_companies_updated_at_trigger.sql')
const m3MigrationPath = path.join(migrationsDirectory, '20260719000002_administrator_authorization_foundation.sql')
const m4MigrationPath = path.join(migrationsDirectory, '20260719000003_company_reviews.sql')
const m5MigrationPath = path.join(migrationsDirectory, '20260821000000_company_profiles.sql')
const m6MigrationPath = path.join(migrationsDirectory, '20260821000001_company_leads_and_events.sql')
const m7MigrationPath = path.join(migrationsDirectory, '20260821000002_advisor_interest_submissions.sql')

function option(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function firstDifference(expected, actual, location = 'fingerprint') {
  if (Object.is(expected, actual)) return null
  if (typeof expected !== typeof actual || expected === null || actual === null) return `${location}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return `${location}: expected an array`
    if (expected.length !== actual.length) return `${location}.length: expected ${expected.length}, received ${actual.length}`
    for (let index = 0; index < expected.length; index += 1) {
      const difference = firstDifference(expected[index], actual[index], `${location}[${index}]`)
      if (difference) return difference
    }
    return null
  }
  if (typeof expected === 'object') {
    const expectedKeys = Object.keys(expected)
    const actualKeys = Object.keys(actual)
    if (JSON.stringify(expectedKeys) !== JSON.stringify(actualKeys)) return `${location} keys: expected ${JSON.stringify(expectedKeys)}, received ${JSON.stringify(actualKeys)}`
    for (const key of expectedKeys) {
      const difference = firstDifference(expected[key], actual[key], `${location}.${key}`)
      if (difference) return difference
    }
    return null
  }
  return `${location}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`
}

function executable(name) {
  return option(`--${name.replace('_', '-')}-path`) || path.join('C:\\Program Files\\PostgreSQL\\18\\bin', `${name}.exe`)
}

function connectionArguments() {
  const database = option('--database')
  const host = option('--host') || '127.0.0.1'
  const port = option('--port') || '5432'
  const user = option('--user') || 'postgres'
  assert(/^hockey_advisor_migration_validation_[a-z0-9_]+$/.test(database || ''), '--database must name a dedicated disposable local database')
  assert(['127.0.0.1', '::1'].includes(host), 'Fresh-bootstrap harness accepts loopback targets only')
  assert(user === 'postgres', 'Fresh-bootstrap harness requires the disposable local postgres owner')
  assert(!database.includes(productionProjectReference), 'Validation database identifier matches production')
  return { database, host, port, user, args: ['-X', '-w', '-h', host, '-p', port, '-U', user, '-d', database] }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    env: process.env,
    encoding: 'utf8',
    windowsHide: true,
    ...options,
  })
  if (result.error) throw result.error
  return result
}

function psql(connection, extra, { expectFailure = false, failureLabel = 'guarded SQL execution' } = {}) {
  const result = run(executable('psql'), [...connection.args, '--set', 'ON_ERROR_STOP=1', ...extra])
  if (!expectFailure && result.status !== 0) throw new Error(result.stderr.trim() || 'psql validation command failed')
  if (expectFailure && result.status === 0) throw new Error(`Expected ${failureLabel} to fail`)
  return result
}

function scalar(connection, sql) {
  return psql(connection, ['-qAt', '--command', sql]).stdout.trim()
}

function verifyIdentity(connection) {
  const identity = JSON.parse(scalar(connection, "SELECT json_build_object('database', current_database(), 'server_address', inet_server_addr()::text, 'server_port', inet_server_port(), 'user', current_user, 'server_version_num', current_setting('server_version_num'))::text;"))
  identity.server_address = identity.server_address.split('/')[0]
  assert(identity.database === connection.database, 'Connected database does not match the expected disposable database')
  assert(['127.0.0.1', '::1'].includes(identity.server_address), 'Database server did not independently report a loopback address')
  assert(String(identity.server_port) === connection.port, 'Database server port differs from the expected local port')
  assert(identity.user === connection.user, 'Connected database owner differs from the expected local owner')
  assert(Number(identity.server_version_num) >= 150000, 'Disposable PostgreSQL version is unsupported')
  return identity
}

function verifyBlankAndCapable(connection) {
  const available = scalar(connection, "SELECT string_agg(name, ',' ORDER BY name) FROM pg_available_extensions WHERE name IN ('postgis','uuid-ossp');")
  assert(available === 'postgis,uuid-ossp', 'Disposable server lacks required postgis and uuid-ossp extensions')
  const existing = Number(scalar(connection, "SELECT count(*) FROM (VALUES (to_regclass('public.users')), (to_regclass('public.companies')), (to_regclass('public.advisors')), (to_regclass('public.listing_claims')), (to_regclass('public.media_content')), (to_regclass('public.admin_users')), (to_regclass('public.reviews')), (to_regclass('public.company_profiles')), (to_regclass('public.company_leads')), (to_regclass('public.directory_events')), (to_regclass('public.advisor_interest_submissions'))) AS guarded(object) WHERE object IS NOT NULL;"))
  assert(existing === 0, 'Disposable database is not blank for application objects')
  assert(scalar(connection, "SELECT to_regprocedure('public.is_admin()') IS NULL;") === 't', 'Disposable database already contains public.is_admin()')
  const ledger = scalar(connection, "SELECT to_regclass('migration_validation.schema_migrations') IS NOT NULL;")
  assert(ledger === 'f', 'Disposable database already contains the validation migration ledger')
}

function installValidationSupport(connection) {
  psql(connection, ['--file', prerequisitesPath])
  psql(connection, ['--command', "CREATE SCHEMA migration_validation; CREATE TABLE migration_validation.schema_migrations (version text PRIMARY KEY, filename text NOT NULL, applied_at timestamp with time zone NOT NULL DEFAULT now());"])
}

async function migrationFiles() {
  const { readdir } = await import('node:fs/promises')
  return (await readdir(migrationsDirectory)).filter((name) => name.endsWith('.sql')).sort()
}

async function applyPending(connection) {
  let applied = 0
  for (const filename of await migrationFiles()) {
    const version = filename.slice(0, 14)
    const present = scalar(connection, `SELECT EXISTS (SELECT 1 FROM migration_validation.schema_migrations WHERE version = '${version}');`)
    if (present === 't') continue
    const file = path.join(migrationsDirectory, filename)
    psql(connection, [
      '--command', 'BEGIN;',
      '--file', file,
      '--command', `INSERT INTO migration_validation.schema_migrations(version, filename) VALUES ('${version}', '${filename}'); COMMIT;`,
    ])
    applied += 1
  }
  return applied
}

function validateCatalog(connection) {
  const result = scalar(connection, `
    SELECT json_build_object(
      'tables', (SELECT count(*) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname IN ('companies','advisors','listing_claims','media_content','users','admin_users','reviews','company_profiles','company_leads','directory_events','advisor_interest_submissions')),
      'policies', (SELECT count(*) FROM pg_catalog.pg_policy p JOIN pg_catalog.pg_class c ON c.oid = p.polrelid JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname IN ('companies','advisors','listing_claims','media_content','users','admin_users','reviews','company_profiles','company_leads','directory_events','advisor_interest_submissions')),
      'triggers', (SELECT count(*) FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname IN ('companies','advisors','listing_claims','media_content','users','admin_users','reviews','company_profiles','company_leads','directory_events','advisor_interest_submissions') AND NOT t.tgisinternal),
      'rls_enabled', (SELECT count(*) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname IN ('companies','advisors','listing_claims','media_content','users','admin_users','reviews','company_profiles','company_leads','directory_events','advisor_interest_submissions') AND c.relrowsecurity AND NOT c.relforcerowsecurity),
      'ambiguous_columns', (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('listing_claims','media_content') AND column_name = 'advisor_id')
    )::text;
  `)
  const checks = JSON.parse(result)
  assert(checks.tables === 11 && checks.policies === 22 && checks.triggers === 9 && checks.rls_enabled === 11 && checks.ambiguous_columns === 0, 'Representative catalog/RLS checks failed')
}

async function compareFingerprint(connection) {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'hockey-advisor-schema-validation-'))
  const dumpPath = path.join(temporaryDirectory, 'schema.sql')
  try {
    const dump = run(executable('pg_dump'), [...connection.args.filter((item) => item !== '-X' && item !== '-w'), '--schema-only', '--no-comments', '--file', dumpPath])
    if (dump.status !== 0) throw new Error(dump.stderr.trim() || 'Schema-only pg_dump failed')
    const expected = JSON.parse(await readFile(targetFingerprintPath, 'utf8'))
    const actual = projectFingerprint(buildFingerprint(await readFile(dumpPath, 'utf8')), expected)
    const difference = firstDifference(expected, actual)
    assert(!difference, `Bootstrapped target fingerprint differs from the canonical fingerprint: ${difference}`)
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
}

function validateCompaniesTimestampBehavior(connection) {
  psql(connection, ['--command', `
    BEGIN;
    INSERT INTO public.companies (name, slug, updated_at)
    VALUES ('M2 disposable behavior check', 'm2-disposable-behavior-check', '2000-01-01 00:00:00+00');
    UPDATE public.companies
       SET name = 'M2 disposable behavior check updated'
     WHERE slug = 'm2-disposable-behavior-check';
    DO $behavior$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
          FROM public.companies
         WHERE slug = 'm2-disposable-behavior-check'
           AND updated_at > '2000-01-01 00:00:00+00'::timestamp with time zone
      ) THEN
        RAISE EXCEPTION 'Companies updated_at trigger did not advance the timestamp';
      END IF;
    END
    $behavior$;
    ROLLBACK;
  `])
}

function validateFailClosedTriggerGuards(connection) {
  const duplicateAttempt = psql(connection, ['--file', m2MigrationPath], {
    expectFailure: true,
    failureLabel: 'direct M2 re-execution',
  })
  assert(duplicateAttempt.stderr.includes('M2 duplicate guard'), 'Direct M2 re-execution did not fail through the intended duplicate guard')

  psql(connection, ['--command', `
    DROP TRIGGER update_companies_updated_at ON public.companies;
    CREATE TRIGGER validation_differently_named_companies_timestamp
      BEFORE UPDATE ON public.companies
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  `])
  const equivalentAttempt = psql(connection, ['--file', m2MigrationPath], {
    expectFailure: true,
    failureLabel: 'M2 execution with a differently named equivalent trigger',
  })
  assert(equivalentAttempt.stderr.includes('M2 equivalent-trigger guard'), 'Differently named companies timestamp trigger was not rejected')
  psql(connection, ['--command', `
    DROP TRIGGER validation_differently_named_companies_timestamp ON public.companies;
    CREATE TRIGGER update_companies_updated_at
      BEFORE UPDATE ON public.companies
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  `])
}

function m3CatalogState(connection) {
  return JSON.parse(scalar(connection, `
    SELECT json_build_object(
      'table_owner', pg_catalog.pg_get_userbyid(table_class.relowner),
      'rls_enabled', table_class.relrowsecurity,
      'rls_forced', table_class.relforcerowsecurity,
      'policy_count', (
        SELECT count(*) FROM pg_catalog.pg_policy
         WHERE polrelid = table_class.oid
           AND polname = 'Users can inspect own administrator status'
           AND polcmd = 'r'
           AND pg_catalog.pg_get_expr(polqual, polrelid) = '(user_id = auth.uid())'
      ),
      'function_owner', pg_catalog.pg_get_userbyid(function_proc.proowner),
      'function_security_definer', function_proc.prosecdef,
      'function_volatility', function_proc.provolatile,
      'function_parallel', function_proc.proparallel,
      'function_search_path', array_to_string(function_proc.proconfig, ','),
      'anon_function_execute', pg_catalog.has_function_privilege('anon', function_proc.oid, 'EXECUTE'),
      'authenticated_function_execute', pg_catalog.has_function_privilege('authenticated', function_proc.oid, 'EXECUTE'),
      'service_function_execute', pg_catalog.has_function_privilege('service_role', function_proc.oid, 'EXECUTE'),
      'public_function_execute', EXISTS (
        SELECT 1 FROM pg_catalog.aclexplode(COALESCE(function_proc.proacl, pg_catalog.acldefault('f', function_proc.proowner)))
         WHERE grantee = 0 AND privilege_type = 'EXECUTE'
      ),
      'anon_table_select', pg_catalog.has_table_privilege('anon', table_class.oid, 'SELECT'),
      'authenticated_table_select', pg_catalog.has_table_privilege('authenticated', table_class.oid, 'SELECT'),
      'authenticated_table_insert', pg_catalog.has_table_privilege('authenticated', table_class.oid, 'INSERT'),
      'authenticated_table_update', pg_catalog.has_table_privilege('authenticated', table_class.oid, 'UPDATE'),
      'authenticated_table_delete', pg_catalog.has_table_privilege('authenticated', table_class.oid, 'DELETE'),
      'service_table_all',
        pg_catalog.has_table_privilege('service_role', table_class.oid, 'SELECT')
        AND pg_catalog.has_table_privilege('service_role', table_class.oid, 'INSERT')
        AND pg_catalog.has_table_privilege('service_role', table_class.oid, 'UPDATE')
        AND pg_catalog.has_table_privilege('service_role', table_class.oid, 'DELETE'),
      'admin_rows', (SELECT count(*) FROM public.admin_users)
    )::text
      FROM pg_catalog.pg_class AS table_class
      JOIN pg_catalog.pg_namespace AS table_namespace ON table_namespace.oid = table_class.relnamespace
      CROSS JOIN pg_catalog.pg_proc AS function_proc
      JOIN pg_catalog.pg_namespace AS function_namespace ON function_namespace.oid = function_proc.pronamespace
     WHERE table_namespace.nspname = 'public'
       AND table_class.relname = 'admin_users'
       AND function_namespace.nspname = 'public'
       AND function_proc.proname = 'is_admin'
       AND function_proc.pronargs = 0;
  `))
}

function assertM3Catalog(connection, { expectedRows = 0 } = {}) {
  const state = m3CatalogState(connection)
  assert(state.table_owner === 'postgres', 'M3 table ownership guard failed')
  assert(state.rls_enabled && !state.rls_forced && state.policy_count === 1, 'M3 RLS guard failed')
  assert(
    state.function_owner === 'postgres'
    && state.function_security_definer
    && state.function_volatility === 's'
    && state.function_parallel === 's'
    && state.function_search_path === 'search_path=""',
    'M3 security-function guard failed',
  )
  assert(
    !state.anon_function_execute
    && state.authenticated_function_execute
    && state.service_function_execute
    && !state.public_function_execute,
    'M3 function privilege guard failed',
  )
  assert(
    !state.anon_table_select
    && state.authenticated_table_select
    && !state.authenticated_table_insert
    && !state.authenticated_table_update
    && !state.authenticated_table_delete
    && state.service_table_all,
    'M3 table privilege guard failed',
  )
  assert(state.admin_rows === expectedRows, 'M3 administrator row count differs from the expected fixture state')
}

function expectAssertionFailure(label, action) {
  try {
    action()
  } catch {
    return
  }
  throw new Error(`Expected ${label} validation to fail closed`)
}

function validateM3RoleMatrix(connection) {
  const users = {
    nonAdmin: '10000000-0000-0000-0000-000000000001',
    activeAdmin: '10000000-0000-0000-0000-000000000002',
    inactiveAdmin: '10000000-0000-0000-0000-000000000003',
    operator: '10000000-0000-0000-0000-000000000004',
    serviceCandidate: '10000000-0000-0000-0000-000000000005',
  }
  psql(connection, ['--command', `
    INSERT INTO auth.users(id) VALUES
      ('${users.nonAdmin}'), ('${users.activeAdmin}'), ('${users.inactiveAdmin}'),
      ('${users.operator}'), ('${users.serviceCandidate}');
    INSERT INTO public.admin_users(user_id, is_active, granted_by, updated_at)
    VALUES ('${users.activeAdmin}', true, '${users.operator}', '2000-01-01 00:00:00+00');
    INSERT INTO public.admin_users(user_id, is_active, granted_by, revoked_by, revoked_at)
    VALUES ('${users.inactiveAdmin}', false, '${users.operator}', '${users.operator}', now());
  `])
  assertM3Catalog(connection, { expectedRows: 2 })

  assert(
    scalar(connection, `SET request.jwt.claim.sub = '${users.nonAdmin}'; SET ROLE authenticated; SELECT public.is_admin()::text || '|' || (SELECT count(*) FROM public.admin_users)::text;`) === 'false|0',
    'Authenticated non-admin behavior differs from deny/empty',
  )
  assert(
    scalar(connection, `SET request.jwt.claim.sub = '${users.activeAdmin}'; SET search_path = validation_hijack, public; SET ROLE authenticated; SELECT public.is_admin()::text || '|' || (SELECT count(*) FROM public.admin_users)::text;`) === 'true|1',
    'Active administrator behavior differs from allow/own-row',
  )
  assert(
    scalar(connection, `SET request.jwt.claim.sub = '${users.inactiveAdmin}'; SET ROLE authenticated; SELECT public.is_admin()::text || '|' || (SELECT count(*) FROM public.admin_users)::text;`) === 'false|1',
    'Inactive administrator behavior differs from deny/own-row',
  )

  const anonymousFunction = psql(connection, ['--command', 'SET ROLE anon; SELECT public.is_admin();'], { expectFailure: true, failureLabel: 'anonymous is_admin execution' })
  assert(anonymousFunction.stderr.includes('permission denied for function is_admin'), 'Anonymous function execution did not fail through the intended privilege guard')
  const anonymousTable = psql(connection, ['--command', 'SET ROLE anon; SELECT count(*) FROM public.admin_users;'], { expectFailure: true, failureLabel: 'anonymous admin_users read' })
  assert(anonymousTable.stderr.includes('permission denied for table admin_users'), 'Anonymous table read did not fail through the intended privilege guard')

  const selfGrant = psql(connection, ['--command', `SET request.jwt.claim.sub = '${users.activeAdmin}'; SET ROLE authenticated; INSERT INTO public.admin_users(user_id, granted_by) VALUES ('${users.serviceCandidate}', '${users.activeAdmin}');`], { expectFailure: true, failureLabel: 'authenticated administrator grant mutation' })
  assert(selfGrant.stderr.includes('permission denied for table admin_users'), 'Authenticated administrator mutation was not denied by table privileges')

  assert(
    scalar(connection, `SET ROLE service_role; BEGIN; INSERT INTO public.admin_users(user_id, granted_by) VALUES ('${users.serviceCandidate}', '${users.activeAdmin}'); UPDATE public.admin_users SET is_active = false, revoked_by = '${users.activeAdmin}', revoked_at = now() WHERE user_id = '${users.serviceCandidate}'; DELETE FROM public.admin_users WHERE user_id = '${users.serviceCandidate}'; SELECT public.is_admin()::text || '|' || (SELECT count(*) FROM public.admin_users)::text; ROLLBACK;`) === 'false|2',
    'Service-role maintenance behavior differs from explicit full-table access and null-subject denial',
  )

  const selfConstraint = psql(connection, ['--command', `INSERT INTO public.admin_users(user_id, granted_by) VALUES ('${users.serviceCandidate}', '${users.serviceCandidate}');`], { expectFailure: true, failureLabel: 'self-grant constraint' })
  assert(selfConstraint.stderr.includes('admin_users_no_self_grant_check'), 'Self-grant constraint did not fail closed')
  const lifecycleConstraint = psql(connection, ['--command', `INSERT INTO public.admin_users(user_id, is_active, granted_by) VALUES ('${users.serviceCandidate}', false, '${users.activeAdmin}');`], { expectFailure: true, failureLabel: 'inactive lifecycle constraint' })
  assert(lifecycleConstraint.stderr.includes('admin_users_lifecycle_check'), 'Inactive lifecycle constraint did not fail closed')

  assert(
    scalar(connection, `SET ROLE service_role; BEGIN; UPDATE public.admin_users SET is_active = false, revoked_by = '${users.operator}', revoked_at = now() WHERE user_id = '${users.activeAdmin}'; SELECT (updated_at > '2000-01-01 00:00:00+00'::timestamptz)::text FROM public.admin_users WHERE user_id = '${users.activeAdmin}'; ROLLBACK;`) === 'true',
    'M3 shared updated_at trigger did not advance on service-role maintenance',
  )

  psql(connection, ['--command', 'DELETE FROM public.admin_users; DELETE FROM auth.users;'])
  assertM3Catalog(connection)
}

function validateFailClosedM3Guards(connection) {
  const duplicateAttempt = psql(connection, ['--file', m3MigrationPath], { expectFailure: true, failureLabel: 'direct M3 re-execution' })
  assert(duplicateAttempt.stderr.includes('M3 duplicate guard'), 'Direct M3 re-execution did not fail through the duplicate guard')

  psql(connection, ['--command', 'DROP TRIGGER update_companies_updated_at ON public.companies;'])
  const prerequisiteAttempt = psql(connection, ['--file', m3MigrationPath], { expectFailure: true, failureLabel: 'M3 execution without M2 prerequisite' })
  assert(prerequisiteAttempt.stderr.includes('M3 prerequisite failed'), 'Missing M2 prerequisite did not fail through the prerequisite guard')
  psql(connection, ['--command', 'CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();'])

  const ownerAttempt = psql(connection, ['--command', 'SET ROLE authenticated;', '--file', m3MigrationPath], { expectFailure: true, failureLabel: 'M3 execution by the wrong owner' })
  assert(ownerAttempt.stderr.includes('M3 ownership guard'), 'Wrong migration owner did not fail through the ownership guard')

  psql(connection, ['--command', 'ALTER ROLE authenticated BYPASSRLS;'])
  const roleAttempt = psql(connection, ['--file', m3MigrationPath], { expectFailure: true, failureLabel: 'M3 execution with unsafe role privileges' })
  assert(roleAttempt.stderr.includes('M3 privilege guard'), 'Unsafe API role attributes did not fail through the privilege guard')
  psql(connection, ['--command', 'ALTER ROLE authenticated NOBYPASSRLS;'])

  psql(connection, ['--command', 'ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;'])
  expectAssertionFailure('M3 RLS guard', () => assertM3Catalog(connection))
  psql(connection, ['--command', 'ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;'])

  psql(connection, ['--command', 'GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;'])
  expectAssertionFailure('M3 function privilege guard', () => assertM3Catalog(connection))
  psql(connection, ['--command', 'REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;'])

  psql(connection, ['--command', 'ALTER FUNCTION public.is_admin() RESET search_path;'])
  expectAssertionFailure('M3 fixed search_path guard', () => assertM3Catalog(connection))
  psql(connection, ['--command', "ALTER FUNCTION public.is_admin() SET search_path TO '';"])

  psql(connection, ['--command', 'ALTER FUNCTION public.is_admin() SECURITY INVOKER;'])
  expectAssertionFailure('M3 SECURITY DEFINER guard', () => assertM3Catalog(connection))
  psql(connection, ['--command', 'ALTER FUNCTION public.is_admin() SECURITY DEFINER;'])

  psql(connection, ['--command', 'ALTER FUNCTION public.is_admin() OWNER TO authenticated;'])
  expectAssertionFailure('M3 function ownership guard', () => assertM3Catalog(connection))
  psql(connection, ['--command', 'ALTER FUNCTION public.is_admin() OWNER TO postgres; GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;'])
  assertM3Catalog(connection)
}

function assertM4Catalog(connection) {
  const state = JSON.parse(scalar(connection, `
    SELECT json_build_object(
      'owner', pg_catalog.pg_get_userbyid(table_class.relowner),
      'rls_enabled', table_class.relrowsecurity,
      'rls_forced', table_class.relforcerowsecurity,
      'policy_count', (SELECT count(*) FROM pg_catalog.pg_policy WHERE polrelid = table_class.oid),
      'admin_policy_count', (
        SELECT count(*) FROM pg_catalog.pg_policy
         WHERE polrelid = table_class.oid
           AND (pg_catalog.pg_get_expr(polqual, polrelid) ILIKE '%is_admin%'
             OR pg_catalog.pg_get_expr(polwithcheck, polrelid) ILIKE '%is_admin%')
      ),
      'anon_table_select', pg_catalog.has_table_privilege('anon', table_class.oid, 'SELECT'),
      'anon_public_columns', pg_catalog.has_column_privilege('anon', table_class.oid, 'id', 'SELECT')
        AND pg_catalog.has_column_privilege('anon', table_class.oid, 'review_text', 'SELECT'),
      'anon_reviewer_identity', pg_catalog.has_column_privilege('anon', table_class.oid, 'reviewer_user_id', 'SELECT'),
      'authenticated_reviewer_identity', pg_catalog.has_column_privilege('authenticated', table_class.oid, 'reviewer_user_id', 'SELECT'),
      'authenticated_insert_identity', pg_catalog.has_column_privilege('authenticated', table_class.oid, 'reviewer_user_id', 'INSERT'),
      'authenticated_status_update', pg_catalog.has_column_privilege('authenticated', table_class.oid, 'moderation_status', 'UPDATE'),
      'service_table_all', pg_catalog.has_table_privilege('service_role', table_class.oid, 'SELECT,INSERT,UPDATE,DELETE'),
      'rows', (SELECT count(*) FROM public.reviews)
    )::text
      FROM pg_catalog.pg_class AS table_class
      JOIN pg_catalog.pg_namespace AS table_namespace ON table_namespace.oid = table_class.relnamespace
     WHERE table_namespace.nspname = 'public' AND table_class.relname = 'reviews';
  `))
  assert(state.owner === 'postgres' && state.rls_enabled && !state.rls_forced, 'M4 table ownership/RLS guard failed')
  assert(state.policy_count === 4 && state.admin_policy_count === 0, 'M4 policy register enabled unexpected administrator access')
  assert(!state.anon_table_select && state.anon_public_columns, 'M4 anonymous column projection differs')
  assert(!state.anon_reviewer_identity && !state.authenticated_reviewer_identity, 'M4 reviewer identity is exposed')
  assert(state.authenticated_insert_identity && !state.authenticated_status_update, 'M4 authenticated column privileges differ')
  assert(state.service_table_all, 'M4 service maintenance privilege differs')
  return state
}

function validateM4RoleMatrix(connection) {
  const company = '20000000-0000-0000-0000-000000000001'
  const reviewer = '20000000-0000-0000-0000-000000000002'
  const otherReviewer = '20000000-0000-0000-0000-000000000003'
  const reviewText = 'This is a detailed first-hand review that exceeds the required minimum length.'

  psql(connection, ['--command', `
    INSERT INTO auth.users(id) VALUES ('${reviewer}'), ('${otherReviewer}');
    INSERT INTO public.companies(id, name, slug) VALUES ('${company}', 'M4 role matrix company', 'm4-role-matrix-company');
  `])
  assert(assertM4Catalog(connection).rows === 0, 'M4 retained unexpected review fixtures')

  const anonymousInsert = psql(connection, ['--command', `SET ROLE anon; INSERT INTO public.reviews(company_id, reviewer_user_id, rating, review_text, experience_confirmed_at) VALUES ('${company}', '${reviewer}', 5, '${reviewText}', now());`], { expectFailure: true, failureLabel: 'anonymous review insert' })
  assert(anonymousInsert.stderr.includes('permission denied'), 'Anonymous review insert did not fail through privileges')

  psql(connection, ['--command', `SET request.jwt.claim.sub = '${reviewer}'; SET ROLE authenticated; INSERT INTO public.reviews(company_id, reviewer_user_id, rating, title, review_text, experience_confirmed_at) VALUES ('${company}', '${reviewer}', 5, 'Strong experience', '${reviewText}', now());`])
  assert(scalar(connection, `SET ROLE anon; SELECT count(*) FROM public.reviews WHERE company_id = '${company}';`) === '1', 'Anonymous published-review read failed')

  const impersonation = psql(connection, ['--command', `SET request.jwt.claim.sub = '${otherReviewer}'; SET ROLE authenticated; INSERT INTO public.reviews(company_id, reviewer_user_id, rating, review_text, experience_confirmed_at) VALUES ('${company}', '${reviewer}', 4, '${reviewText}', now());`], { expectFailure: true, failureLabel: 'reviewer impersonation' })
  assert(impersonation.stderr.includes('row-level security policy'), 'Reviewer impersonation did not fail through RLS')

  const duplicate = psql(connection, ['--command', `SET request.jwt.claim.sub = '${reviewer}'; SET ROLE authenticated; INSERT INTO public.reviews(company_id, reviewer_user_id, rating, review_text, experience_confirmed_at) VALUES ('${company}', '${reviewer}', 4, '${reviewText}', now());`], { expectFailure: true, failureLabel: 'duplicate company review' })
  assert(duplicate.stderr.includes('reviews_company_reviewer_key'), 'Duplicate review did not fail through the unique constraint')

  const identityRead = psql(connection, ['--command', 'SET ROLE authenticated; SELECT reviewer_user_id FROM public.reviews;'], { expectFailure: true, failureLabel: 'reviewer identity read' })
  assert(identityRead.stderr.includes('permission denied'), 'Reviewer identity column was readable')

  const statusUpdate = psql(connection, ['--command', `SET request.jwt.claim.sub = '${reviewer}'; SET ROLE authenticated; UPDATE public.reviews SET moderation_status = 'rejected' WHERE company_id = '${company}';`], { expectFailure: true, failureLabel: 'reviewer moderation update' })
  assert(statusUpdate.stderr.includes('permission denied'), 'Reviewer could mutate moderation state')

  psql(connection, ['--command', `SET request.jwt.claim.sub = '${reviewer}'; SET ROLE authenticated; UPDATE public.reviews SET rating = 4 WHERE company_id = '${company}';`])
  assert(scalar(connection, `SET ROLE anon; SELECT rating FROM public.reviews WHERE company_id = '${company}';`) === '4', 'Reviewer self-update did not persist through RLS')
  assert(scalar(connection, `SET request.jwt.claim.sub = '${otherReviewer}'; SET ROLE authenticated; DELETE FROM public.reviews WHERE company_id = '${company}'; SELECT count(*) FROM public.reviews WHERE company_id = '${company}';`) === '1', 'Non-owner review delete was not denied')
  psql(connection, ['--command', `SET request.jwt.claim.sub = '${reviewer}'; SET ROLE authenticated; DELETE FROM public.reviews WHERE company_id = '${company}';`])

  psql(connection, ['--command', `DELETE FROM public.companies WHERE id = '${company}'; DELETE FROM auth.users WHERE id IN ('${reviewer}', '${otherReviewer}');`])
  assert(assertM4Catalog(connection).rows === 0, 'M4 role matrix retained review fixtures')
}

function validateFailClosedM4Guards(connection) {
  const duplicateAttempt = psql(connection, ['--file', m4MigrationPath], { expectFailure: true, failureLabel: 'direct M4 re-execution' })
  assert(duplicateAttempt.stderr.includes('M4 duplicate guard'), 'Direct M4 re-execution did not fail through the duplicate guard')

  const ownerAttempt = psql(connection, ['--command', 'SET ROLE authenticated;', '--file', m4MigrationPath], { expectFailure: true, failureLabel: 'M4 execution by the wrong owner' })
  assert(ownerAttempt.stderr.includes('M4 ownership guard'), 'Wrong M4 migration owner did not fail through the ownership guard')
}

function validateFailClosedM5M6M7Guards(connection) {
  const m5Duplicate = psql(connection, ['--file', m5MigrationPath], { expectFailure: true, failureLabel: 'direct M5 re-execution' })
  assert(m5Duplicate.stderr.includes('M5 duplicate guard'), 'Direct M5 re-execution did not fail through the duplicate guard')
  const m6Duplicate = psql(connection, ['--file', m6MigrationPath], { expectFailure: true, failureLabel: 'direct M6 re-execution' })
  assert(m6Duplicate.stderr.includes('M6 duplicate guard'), 'Direct M6 re-execution did not fail through the duplicate guard')
  const m5Owner = psql(connection, ['--command', 'SET ROLE authenticated;', '--file', m5MigrationPath], { expectFailure: true, failureLabel: 'M5 execution by the wrong owner' })
  assert(m5Owner.stderr.includes('M5 ownership guard'), 'Wrong M5 migration owner did not fail through the ownership guard')
  const m6Owner = psql(connection, ['--command', 'SET ROLE authenticated;', '--file', m6MigrationPath], { expectFailure: true, failureLabel: 'M6 execution by the wrong owner' })
  assert(m6Owner.stderr.includes('M6 ownership guard'), 'Wrong M6 migration owner did not fail through the ownership guard')
  const m7Duplicate = psql(connection, ['--file', m7MigrationPath], { expectFailure: true, failureLabel: 'direct M7 re-execution' })
  assert(m7Duplicate.stderr.includes('M7 duplicate guard'), 'Direct M7 re-execution did not fail through the duplicate guard')
  const m7Owner = psql(connection, ['--command', 'SET ROLE authenticated;', '--file', m7MigrationPath], { expectFailure: true, failureLabel: 'M7 execution by the wrong owner' })
  assert(m7Owner.stderr.includes('M7 ownership guard'), 'Wrong M7 migration owner did not fail through the ownership guard')
}

async function main() {
  const connection = connectionArguments()
  const identity = verifyIdentity(connection)
  verifyBlankAndCapable(connection)
  installValidationSupport(connection)

  const firstRun = await applyPending(connection)
  assert(firstRun === (await migrationFiles()).length, 'First migration run did not apply the complete active chain')
  const secondRun = await applyPending(connection)
  assert(secondRun === 0, 'Second migration run was not a no-op')
  validateCompaniesTimestampBehavior(connection)
  validateFailClosedTriggerGuards(connection)
  validateM3RoleMatrix(connection)
  validateFailClosedM3Guards(connection)
  validateM4RoleMatrix(connection)
  validateFailClosedM4Guards(connection)
  validateFailClosedM5M6M7Guards(connection)
  await compareFingerprint(connection)
  validateCatalog(connection)

  const guardAttempt = psql(connection, ['--file', baselineMigrationPath], { expectFailure: true, failureLabel: 'baseline re-execution' })
  assert(guardAttempt.stderr.includes('Fresh-environment guard'), 'Baseline did not fail through its fresh-environment guard on an existing schema')

  process.stdout.write(`Fresh M1 through M7 bootstrap passed on proven local target ${identity.database} at ${identity.server_address}:${identity.server_port}; runner rerun was a no-op, migration/catalog/security guards failed closed, the admin and public-review role matrices passed with zero retained fixtures, the M1 guard held, and the current-target fingerprint/catalog matched.\n`)
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
})
