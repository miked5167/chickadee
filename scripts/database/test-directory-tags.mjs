// Real PostgreSQL role/transaction tests on a new, isolated loopback cluster.
// Uses minimal dependency fixtures; does not claim to test the PostGIS baseline.
import { spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { buildFingerprint, projectFingerprint, repositoryRoot, splitStatements } from './generate-schema-fingerprint.mjs'

const option = process.argv.indexOf('--pg-bin')
const bin = option >= 0 ? process.argv[option + 1] : 'C:/Program Files/PostgreSQL/18/bin'
const executable = (name) => path.join(bin, process.platform === 'win32' ? `${name}.exe` : name)
if (!existsSync(executable('initdb'))) throw new Error('Supply an installed PostgreSQL binary directory with --pg-bin.')
const root = await mkdtemp(path.join(os.tmpdir(), 'hockey-directory-tags-validation-'))
const cluster = path.join(root, 'data')
const database = 'hockey_advisor_migration_validation_tags'
let started = false
let checks = 0

function run(name, args) {
  return spawnSync(executable(name), args, { encoding: 'utf8', windowsHide: true, timeout: 45000 })
}
function assert(condition, message) { if (!condition) throw new Error(message) }
function successful(name, args) {
  const result = run(name, args)
  assert(result.status === 0, result.stderr?.trim() || `${name} failed`)
  return result.stdout.trim()
}
const port = await new Promise((resolve, reject) => {
  const server = createServer()
  server.on('error', reject)
  server.listen(0, '127.0.0.1', () => { const address = server.address(); server.close(() => resolve(address.port)) })
})
const connection = ['-X', '-w', '-h', '127.0.0.1', '-p', String(port), '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1', '-A', '-t', '-q']
function sql(statement) { return successful('psql', [...connection, '-c', statement]) }
function fails(statement, pattern, label) {
  const result = run('psql', [...connection, '-c', statement])
  assert(result.status !== 0 && pattern.test(result.stderr || ''), `Expected rejection: ${label}; ${result.stderr || ''}`)
  checks++
}
function equal(statement, expected, label) {
  assert(sql(statement) === String(expected), label)
  checks++
}

const owner = '00000000-0000-0000-0000-000000000001'
const other = '00000000-0000-0000-0000-000000000002'
const admin = '00000000-0000-0000-0000-000000000003'
const company = '10000000-0000-0000-0000-000000000001'
const unclaimed = '10000000-0000-0000-0000-000000000002'
const claim = '20000000-0000-0000-0000-000000000001'
const suggestion = '30000000-0000-0000-0000-000000000001'
const rejected = '30000000-0000-0000-0000-000000000002'
const asUser = (id, statement) => `SET request.jwt.claim.sub = '${id}'; SET ROLE authenticated; ${statement}`
const core = "ARRAY['services:advisor','pathways:junior','pathways:ncaa']"

try {
  successful('initdb', ['-D', cluster, '-U', 'postgres', '--auth-local=trust', '--auth-host=trust', '--encoding=UTF8', '--locale=C'])
  successful('pg_ctl', ['-D', cluster, '-l', path.join(root, 'server.log'), '-o', `-h 127.0.0.1 -p ${port}`, '-w', '-t', '30', 'start'])
  started = true
  successful('createdb', ['-h', '127.0.0.1', '-p', String(port), '-U', 'postgres', database])
  const identity = JSON.parse(sql("SELECT json_build_object('database', current_database(), 'address', inet_server_addr()::text, 'port', inet_server_port(), 'data', current_setting('data_directory'))::text"))
  assert(identity.database === database, 'Disposable database name differs')
  assert(identity.address.split('/')[0] === '127.0.0.1' && identity.port === port, 'Disposable server is not the expected loopback endpoint')
  const canonicalPath = (value) => process.platform === 'win32' ? path.resolve(value).toLowerCase() : path.resolve(value)
  assert(canonicalPath(identity.data) === canonicalPath(cluster), 'Disposable data directory differs')

  successful('psql', [...connection, '-f', path.join(repositoryRoot, 'supabase/validation/local-platform-prerequisites.sql')])
  sql(`CREATE SCHEMA extensions; CREATE EXTENSION "uuid-ossp" WITH SCHEMA extensions;
    CREATE TABLE public.companies(id uuid PRIMARY KEY, verified_owner_id uuid REFERENCES auth.users(id), description text);
    CREATE TYPE public.claim_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');
    CREATE TABLE public.listing_claims(id uuid PRIMARY KEY, company_id uuid REFERENCES public.companies(id), claimant_user_id uuid REFERENCES auth.users(id), claim_status public.claim_status);
    CREATE TABLE public.admin_users(user_id uuid PRIMARY KEY REFERENCES auth.users(id), is_active boolean NOT NULL);
    ALTER TABLE public.listing_claims ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Fixture own claims" ON public.listing_claims FOR SELECT TO authenticated USING (claimant_user_id = auth.uid());
    GRANT SELECT ON public.companies TO anon, authenticated;
    GRANT SELECT ON public.listing_claims TO authenticated;`)
  const foundation = await readFile(path.join(repositoryRoot, 'supabase/migrations/20260719000002_administrator_authorization_foundation.sql'), 'utf8')
  sql(splitStatements(foundation).find((statement) => statement.startsWith('CREATE FUNCTION public.is_admin()')))
  sql('ALTER FUNCTION public.is_admin() OWNER TO postgres; REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;')
  const migration = path.join(repositoryRoot, 'supabase/migrations/20261002000000_directory_tags.sql')
  const seed = path.join(repositoryRoot, 'supabase/seeds/directory-tags.sql')
  successful('psql', [...connection, '--single-transaction', '-f', migration])
  const expectedFingerprint = buildFingerprint(await readFile(migration, 'utf8'))
  const dump = successful('pg_dump', connection.filter((arg) => !['-X', '-v', 'ON_ERROR_STOP=1', '-A', '-t', '-q'].includes(arg)).concat(['--schema-only', '--no-comments', '--schema=public']))
  const actualFingerprint = projectFingerprint(buildFingerprint(dump), expectedFingerprint)
  if (process.argv.includes('--inspect-fingerprint')) {
    for (const key of ['tables', 'constraints', 'indexes', 'policies', 'functions', 'grants']) {
      if (JSON.stringify(expectedFingerprint[key]) !== JSON.stringify(actualFingerprint[key])) process.stdout.write(JSON.stringify({ key, actual: actualFingerprint[key] }) + '\n')
    }
  }
  assert(JSON.stringify(expectedFingerprint) === JSON.stringify(actualFingerprint), 'Directory tag schema dump differs from the generated fingerprint')
  checks++
  successful('psql', [...connection, '-f', seed])
  successful('psql', [...connection, '-f', seed])
  equal('SELECT count(*) FROM public.directory_tags', 93, 'Seed rerun changed the tag count')
  equal('SELECT count(*) FROM public.directory_tag_groups', 7, 'Wrong starter group count')
  equal("SELECT filter_enabled FROM public.directory_tag_groups WHERE key = 'price_range'", 'f', 'Pricing filter must start disabled')
  equal('SELECT count(*) FROM public.company_tags', 0, 'Migration or seed assigned tags')

  sql(`INSERT INTO auth.users(id) VALUES ('${owner}'), ('${other}'), ('${admin}');
    INSERT INTO public.companies VALUES ('${company}', '${owner}', 'Preserved legacy description'), ('${unclaimed}', NULL, 'Unclaimed company');
    INSERT INTO public.listing_claims VALUES ('${claim}', '${unclaimed}', '${owner}', 'pending');
    INSERT INTO public.admin_users VALUES ('${admin}', true);`)
  sql(asUser(owner, `SELECT public.replace_company_tags('${company}', ${core} || ARRAY['player_level:aaa','age_group:15-17','regions:ca-on','languages:english','languages:french']);`))
  equal(`SET ROLE anon; SELECT count(*) FROM public.company_tags WHERE company_id = '${company}'`, 8, 'Supplemental tags consumed core slots or public read failed')

  for (const [ids, label] of [
    ["ARRAY[]::text[]", 'empty selection'],
    ["ARRAY['services:advisor','pathways:ncaa']", 'too few core tags'],
    ["ARRAY['services:advisor','services:agent','services:scouting','services:video','services:recruiting','pathways:ncaa']", 'too many core tags'],
    ["ARRAY['pathways:prep-school','pathways:junior','pathways:ncaa']", 'no service'],
    ["ARRAY['services:advisor','pathways:ncaa','pathways:ncaa']", 'duplicate'],
    ["ARRAY['services:advisor','pathways:ncaa','services:made-up']", 'unknown tag'],
    [core + " || ARRAY['price_range:under-1000','price_range:10000-plus']", 'multiple prices'],
  ]) fails(asUser(owner, `SELECT public.replace_company_tags('${company}', ${ids});`), /Choose|Duplicate/, label)
  equal(`SELECT count(*) FROM public.company_tags WHERE company_id = '${company}'`, 8, 'Rejected replacement destroyed saved tags')
  fails(asUser(other, `SELECT public.replace_company_tags('${company}', ${core});`), /access denied/, 'non-owner replacement')
  fails(`SET ROLE anon; SELECT public.replace_company_tags('${company}', ${core});`, /permission denied/, 'anonymous RPC')
  fails(asUser(owner, `DELETE FROM public.company_tags WHERE company_id = '${company}';`), /permission denied/, 'direct assignment deletion')
  fails(asUser(owner, "INSERT INTO public.directory_tags(id,group_key,slug,label) VALUES ('languages:invented','languages','invented','Invented');"), /permission denied/, 'advisor creates a controlled tag')
  sql("UPDATE public.directory_tags SET is_active = false WHERE id = 'services:video'")
  fails(asUser(owner, `SELECT public.replace_company_tags('${company}', ARRAY['services:video','pathways:junior','pathways:ncaa']);`), /active, approved/, 'retired tag')
  successful('psql', [...connection, '-f', seed])
  equal("SELECT is_active FROM public.directory_tags WHERE id = 'services:video'", 'f', 'Seed reactivated a retired tag')
  equal("SET ROLE anon; SELECT count(*) FROM public.directory_tags WHERE id = 'services:video'", 0, 'Retired tag leaked into public catalog')

  sql(asUser(owner, `SELECT public.replace_claim_tags('${claim}', ${core});`))
  equal(asUser(owner, `SELECT count(*) FROM public.claim_tags WHERE claim_id = '${claim}'`), 3, 'Claimant cannot read saved tags')
  equal(asUser(other, `SELECT count(*) FROM public.claim_tags WHERE claim_id = '${claim}'`), 0, 'Private claim tags exposed to another user')
  equal(asUser(admin, `SELECT count(*) FROM public.claim_tags WHERE claim_id = '${claim}'`), 3, 'Administrator cannot read claim tags')
  fails(`SET ROLE anon; SELECT * FROM public.claim_tags`, /permission denied/, 'public claim tags')
  fails(asUser(other, `SELECT public.replace_claim_tags('${claim}', ${core});`), /access denied/, 'another claimant replacement')
  equal(`SELECT count(*) FROM public.company_tags WHERE company_id = '${unclaimed}'`, 0, 'Claim selections published before ownership')

  // INSERT privileges deliberately exclude reviewer-controlled columns.
  fails(asUser(owner, `INSERT INTO public.directory_tag_suggestions(requester_user_id,company_id,group_key,label,reason,status) VALUES ('${owner}','${company}','languages','Spanish','Clients request this language','approved');`), /permission denied/, 'advisor self-approval')
  fails(asUser(other, `INSERT INTO public.directory_tag_suggestions(requester_user_id,company_id,group_key,label,reason) VALUES ('${other}','${company}','languages','Spanish','Clients request this language');`), /row-level security/, 'non-owner suggestion')
  fails(asUser(owner, `INSERT INTO public.directory_tag_suggestions(requester_user_id,company_id,group_key,label,reason) VALUES ('${other}','${company}','languages','Spanish','Clients request this language');`), /row-level security/, 'requester impersonation')
  sql(asUser(owner, `INSERT INTO public.directory_tag_suggestions(requester_user_id,company_id,group_key,label,reason) VALUES ('${owner}','${company}','languages','Spanish','Clients request this language');`))
  sql(`UPDATE public.directory_tag_suggestions SET id = '${suggestion}' WHERE label = 'Spanish'`)
  equal(asUser(other, 'SELECT count(*) FROM public.directory_tag_suggestions'), 0, 'Suggestion privacy failed')
  equal(asUser(admin, 'SELECT count(*) FROM public.directory_tag_suggestions'), 1, 'Administrator queue access failed')
  equal("SELECT count(*) FROM public.directory_tags WHERE id = 'languages:spanish'", 0, 'Pending suggestion entered the catalog')
  fails(asUser(owner, `INSERT INTO public.directory_tag_suggestions(requester_user_id,company_id,group_key,label,reason) VALUES ('${owner}','${company}','languages',' spanish ','Clients request this language');`), /duplicate key/, 'duplicate pending suggestion')
  fails(asUser(owner, `SELECT public.review_directory_tag_suggestion('${suggestion}','approve','spanish','Spanish',NULL);`), /Administrator access/, 'non-admin review')
  equal(asUser(admin, `SELECT public.review_directory_tag_suggestion('${suggestion}','approve','spanish','Spanish','Supported language');`), 'languages:spanish', 'Approval did not create controlled tag')
  equal(`SELECT status FROM public.directory_tag_suggestions WHERE id = '${suggestion}'`, 'approved', 'Approval audit status missing')
  equal(`SELECT reviewed_by FROM public.directory_tag_suggestions WHERE id = '${suggestion}'`, admin, 'Approval reviewer missing')
  equal(`SELECT count(*) FROM public.company_tags WHERE company_id = '${company}' AND tag_id = 'languages:spanish'`, 0, 'Approval auto-assigned a tag')
  fails(asUser(admin, `SELECT public.review_directory_tag_suggestion('${suggestion}','reject',NULL,NULL,NULL);`), /already reviewed/, 'repeat review')

  sql(asUser(owner, `INSERT INTO public.directory_tag_suggestions(requester_user_id,claim_id,group_key,label,reason) VALUES ('${owner}','${claim}','services','Guaranteed scholarship','A service name proposed for review');`))
  sql(`UPDATE public.directory_tag_suggestions SET id = '${rejected}' WHERE label = 'Guaranteed scholarship'`)
  sql(asUser(admin, `SELECT public.review_directory_tag_suggestion('${rejected}','reject',NULL,NULL,'Unsupported promise');`))
  equal(`SELECT status FROM public.directory_tag_suggestions WHERE id = '${rejected}'`, 'rejected', 'Rejection audit missing')
  equal("SELECT count(*) FROM public.directory_tags WHERE label = 'Guaranteed scholarship'", 0, 'Rejected suggestion entered catalog')
  sql(`UPDATE public.admin_users SET is_active = false WHERE user_id = '${admin}'`)
  fails(asUser(admin, `SELECT public.replace_company_tags('${company}', ${core});`), /access denied/, 'inactive administrator')
  sql(`UPDATE public.listing_claims SET claim_status = 'approved' WHERE id = '${claim}'`)
  fails(asUser(owner, `SELECT public.replace_claim_tags('${claim}', ${core});`), /access denied/, 'editing a reviewed claim')
  equal(`SELECT description FROM public.companies WHERE id = '${company}'`, 'Preserved legacy description', 'Legacy description changed')
  equal(`SELECT verified_owner_id FROM public.companies WHERE id = '${unclaimed}'`, '', 'Claim tags granted ownership')
  const duplicate = run('psql', [...connection, '--single-transaction', '-f', migration])
  assert(duplicate.status !== 0 && /duplicate guard/.test(duplicate.stderr), 'Migration duplicate guard failed')
  checks++
  process.stdout.write(`Directory tag PostgreSQL tests passed: ${checks} checks; isolated loopback cluster, real RLS/privileges, atomic replacements, private claims, moderation and repeatable seed.\n`)
} finally {
  if (started) successful('pg_ctl', ['-D', cluster, '-m', 'fast', '-w', '-t', '30', 'stop'])
  // Check the resolved cleanup target before any recursive removal on Windows.
  const resolved = path.resolve(root)
  const relative = path.relative(path.resolve(os.tmpdir()), resolved)
  assert(relative && !relative.startsWith('..') && !path.isAbsolute(relative) && path.basename(resolved).startsWith('hockey-directory-tags-validation-'), 'Unsafe temporary cleanup target')
  await rm(resolved, { recursive: true, force: true })
}
