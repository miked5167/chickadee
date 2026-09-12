// Mutating test fixtures: permitted ONLY on a proven loopback disposable database.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { repositoryRoot } from '../generate-schema-fingerprint.mjs'
import { connection, migrations, readState, reviewedSql, snapshot, validateDryRun } from '../m5-m7-release.mjs'

const [database, port, bin, root] = process.argv.slice(2)
assert(/^hockey_advisor_migration_validation_[a-z0-9_]+$/.test(database), 'Not a disposable database')
assert(Number(port) >= 1024 && Number(port) <= 65535, 'Invalid port')
const env = { ...process.env, PGSSLMODE: 'disable', PGCONNECT_TIMEOUT: '5', PGPASSWORD: '' }
const db = connection({ host: '127.0.0.1', port, user: 'postgres', database, bin, env })
const identity = JSON.parse(db.query("SELECT json_build_object('database',current_database(),'host',inet_server_addr()::text,'port',inet_server_port(),'user',current_user)::text"))
assert(identity.host.split('/')[0] === '127.0.0.1' && identity.database === database && identity.port === Number(port) && identity.user === 'postgres', 'Disposable identity mismatch')
assert.equal(db.query("SELECT to_regclass('public.companies') IS NULL"), 't', 'Rehearsal database must be blank')
const sql = await reviewedSql()
db.run('psql', ['-X', ...db.args, '--set', 'ON_ERROR_STOP=1', '-f', path.join(repositoryRoot, 'supabase/validation/local-platform-prerequisites.sql')])
db.run('psql', ['-X', ...db.args, '--set', 'ON_ERROR_STOP=1', '-c', 'CREATE SCHEMA supabase_migrations; CREATE TABLE supabase_migrations.schema_migrations(version text PRIMARY KEY, statements text[], name text);'])
for (const [name] of migrations.slice(0, 4)) db.run('psql', ['-X', ...db.args, '--set', 'ON_ERROR_STOP=1', '-c', 'BEGIN;',
  '-f', path.join(repositoryRoot, 'supabase/migrations', name), '-c', `INSERT INTO supabase_migrations.schema_migrations(version,name) VALUES ('${name.slice(0, 14)}','${name.slice(15, -4)}'); COMMIT;`])
db.run('psql', ['-X', ...db.args, '--set', 'ON_ERROR_STOP=1', '-c', "INSERT INTO public.companies(name,slug) SELECT 'Fixture Company '||n,'fixture-company-'||n FROM generate_series(1,202) n; INSERT INTO public.advisors(company_id,name) SELECT id,'Fixture Advisor' FROM public.companies ORDER BY slug LIMIT 177;"])
console.log('Rehearsal: M4 fixture initialized with 202 companies and 177 advisors.')
const before = await snapshot(db, path.join(root, 'before-release'), sql)
assert.equal(before.stage, 4)
const cliRoot = path.join(root, 'release-cli')
await mkdir(cliRoot)
const npx = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npx-cli.js')
const cli = (args) => {
  const result = spawnSync(process.execPath, [npx, '--yes', 'supabase@2.109.1', '--workdir', cliRoot, ...args], { env, encoding: 'utf8', windowsHide: true, timeout: 240000, maxBuffer: 8 * 1024 * 1024 })
  assert.equal(result.status, 0, `Rehearsal CLI failed: ${result.stderr}`)
  return `${result.stdout}\n${result.stderr}`
}
cli(['init'])
await mkdir(path.join(cliRoot, 'supabase/migrations'), { recursive: true })
for (const [name] of migrations) await copyFile(path.join(repositoryRoot, 'supabase/migrations', name), path.join(cliRoot, 'supabase/migrations', name))
const url = `postgresql://postgres@127.0.0.1:${port}/${database}?sslmode=disable`
validateDryRun(cli(['db', 'push', '--dry-run', '--db-url', url]), 4)
assert.deepEqual(readState(db), before, 'Dry run changed the database')
cli(['db', 'push', '--yes', '--db-url', url])
const after = await snapshot(db, path.join(root, 'after-release'), sql)
assert.equal(after.stage, 7)
for (const row of before.counts) assert.deepEqual(after.counts.find((item) => item.name === row.name), row, 'Existing fixture changed')
validateDryRun(cli(['db', 'push', '--dry-run', '--db-url', url]), 7)
assert.deepEqual(readState(db), after, 'Completed-release dry run changed data')
// Verify a permission regression is caught by the same snapshot validator.
db.run('psql', ['-X', ...db.args, '--set', 'ON_ERROR_STOP=1', '-c', 'GRANT SELECT ON public.advisor_interest_submissions TO anon;'])
await assert.rejects(snapshot(db, path.join(root, 'denied-drift'), sql), /schema\/permissions differ/)
console.log('RELEASE REHEARSAL PASSED: M4 backup, exact M5-M7 CLI dry run/apply, M7 backup, full schema and read-permission checks, unchanged row digests, no pending rerun, and deliberate permission drift rejected.')
