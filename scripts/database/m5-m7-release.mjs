import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { copyFile, mkdir, readFile, readdir, realpath, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildFingerprint, projectFingerprint, repositoryRoot } from './generate-schema-fingerprint.mjs'

export const projectRef = 'dqskdrqubqnhdssxpryx'
export const approvalPhrase = 'APPROVE M5 M6 M7 PRODUCTION MIGRATIONS'
export const migrations = [
  ['20260719000000_production_company_baseline.sql', '4b65fa234b56534985f249cc8061efd98b05ba927c5de130839b8fd35c1d1db8'],
  ['20260719000001_add_companies_updated_at_trigger.sql', '95fb374bb07c5a4941b3dd78e6a6db9bf5b4b456c15670fb3ac9805e3a81b547'],
  ['20260719000002_administrator_authorization_foundation.sql', 'a968f41fb10e6ecbe1ff8363abe0322031defd6aa361ce3c98498603ade55f6d'],
  ['20260719000003_company_reviews.sql', '05bbef023d1b74e5707d801554e2839248d9a976f71fea41155167b69f8f69f7'],
  ['20260821000000_company_profiles.sql', '854df7aab36a71b229b92525194972144fa118e4dd537d7cb81ed26eb8de49cc'],
  ['20260821000001_company_leads_and_events.sql', '6eb36ca91d99dba5ee605a101cc48329c1d586ff0b2e0f14f864971e289673e9'],
  ['20260821000002_advisor_interest_submissions.sql', 'dd3633aa14ba58d2340c5e1512cf20353006ac1b98e3d4f75431d4322409234e'],
]
export const baseTables = ['companies', 'advisors', 'listing_claims', 'media_content', 'users', 'admin_users', 'reviews']
export const newTables = ['company_profiles', 'company_leads', 'directory_events', 'advisor_interest_submissions']
const sha = (value) => createHash('sha256').update(value).digest('hex')
const historyEntry = ([filename]) => ({ version: filename.slice(0, 14), name: filename.slice(15, -4) })
export function validateHistory(history) {
  assert(Array.isArray(history) && history.length >= 4 && history.length <= 7, 'Expected an exact M4 through M7 migration history')
  assert.deepEqual(history, migrations.slice(0, history.length).map(historyEntry), 'Migration history has drifted; no automatic repair permitted')
  return history.length
}
export function validateDryRun(text, stage) {
  assert(Number.isInteger(stage) && stage >= 4 && stage <= 7, 'Invalid release stage')
  const listed = [...new Set(text.match(/\b\d{14}_[a-z0-9_]+\.sql\b/g) ?? [])].sort()
  assert.deepEqual(listed, migrations.slice(stage).map(([name]) => name), 'Dry run differs from exactly the remaining M5-M7 migrations')
}
export async function reviewedSql() {
  const files = await readdir(path.join(repositoryRoot, 'supabase/migrations'))
  assert.deepEqual(files.filter((name) => name.endsWith('.sql')).sort(), migrations.map(([name]) => name), 'Active migration set differs')
  return Promise.all(migrations.map(async ([name, expected]) => {
    const data = await readFile(path.join(repositoryRoot, 'supabase/migrations', name))
    assert.equal(sha(data), expected, `Reviewed migration changed: ${name}`)
    return data.toString('utf8')
  }))
}
export function validateSchema(schema, archiveList, sql, stage) {
  archiveList = archiveList.replaceAll('\r', '')
  const expected = buildFingerprint(sql.slice(0, stage).join('\n'), { kind: `release-stage-${stage}` })
  const actual = projectFingerprint(buildFingerprint(schema), expected)
  // pg_dump may express a table owner with ONLY, which the parser does not consume.
  for (const [kind, items] of [['TABLE', actual.tables], ['TYPE', actual.enums], ['FUNCTION', actual.functions]]) {
    for (const item of items) {
      const match = archiveList.match(new RegExp(`\\b${kind} public ${item.name}(?:\\(\\))? ([a-z_][a-z0-9_]*)$`, 'm'))
      if (match) item.owner = match[1]
    }
  }
  assert.deepEqual(actual, expected, `Stage M${stage} schema/permissions differ from the reviewed migrations`)
  const names = new Set(buildFingerprint(schema).tables.map((table) => table.name))
  const expectedNames = new Set(expected.tables.map((table) => table.name))
  for (const name of newTables) assert.equal(names.has(name), expectedNames.has(name), `Unexpected stage for ${name}`)
}
export function connection({ host, port, user, database, bin, env = process.env }) {
  const args = ['-w', '-h', host, '-p', String(port), '-U', user, '-d', database]
  const clean = (value) => {
    let text = String(value ?? '')
    if (env.PGPASSWORD) for (const secret of [env.PGPASSWORD, encodeURIComponent(env.PGPASSWORD)]) text = text.split(secret).join('[redacted]')
    return text
  }
  function run(tool, more, { allowFailure = false } = {}) {
    const result = spawnSync(path.join(bin, `${tool}.exe`), more, { encoding: 'utf8', env,
      windowsHide: true, timeout: 180000, maxBuffer: 16 * 1024 * 1024 })
    if (!allowFailure && result.status !== 0) throw new Error(`${tool} failed: ${clean(result.stderr || result.error?.message)}`)
    return result
  }
  function query(sql, { role, denied = false } = {}) {
    assert(!role || ['anon', 'authenticated', 'service_role'].includes(role), 'Invalid test role')
    const command = `BEGIN READ ONLY; SET LOCAL statement_timeout='60s'; ${role ? `SET LOCAL ROLE ${role};` : ''} ${sql}; ROLLBACK;`
    const result = run('psql', ['-X', ...args, '--set', 'ON_ERROR_STOP=1', '--set', 'VERBOSITY=sqlstate', '-Atq', '-c', command], { allowFailure: denied })
    if (denied) { assert(result.status !== 0 && /42501/.test(result.stderr), 'Expected insufficient-privilege denial, not a query/connection error'); return 'denied' }
    return result.stdout.trim()
  }
  return { args, run, query, database, host, port }
}
export function readState(db) {
  const identity = JSON.parse(db.query("SELECT json_build_object('database',current_database(),'user',current_user,'address',inet_server_addr()::text,'port',inet_server_port())::text"))
  assert(identity.database === db.database && identity.user === 'postgres', 'Database identity mismatch')
  const history = JSON.parse(db.query("SELECT coalesce(json_agg(x ORDER BY version),'[]'::json)::text FROM (SELECT version,name FROM supabase_migrations.schema_migrations) x"))
  const stage = validateHistory(history)
  const tables = [...baseTables, ...(stage >= 5 ? ['company_profiles'] : []), ...(stage >= 6 ? ['company_leads', 'directory_events'] : []), ...(stage >= 7 ? ['advisor_interest_submissions'] : [])]
  const rows = tables.map((name) => `SELECT '${name}' AS name, count(*)::int AS count, md5(coalesce(string_agg(to_jsonb(t)::text,E'\\n' ORDER BY to_jsonb(t)::text),'')) AS digest FROM public.${name} t`)
  const counts = JSON.parse(db.query(`SELECT json_agg(x ORDER BY name)::text FROM (${rows.join(' UNION ALL ')}) x`))
  for (const item of counts) assert.equal(item.count, item.name === 'companies' ? 202 : item.name === 'advisors' ? 177 : 0, `Unexpected row count for ${item.name}`)
  const security = db.query("SELECT (NOT has_schema_privilege('anon','public','CREATE') AND NOT has_schema_privilege('authenticated','public','CREATE') AND (SELECT count(*)=3 AND bool_and(NOT rolsuper AND rolbypassrls=(rolname='service_role')) FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role')))::text")
  assert.equal(security, 'true', 'API role attributes or public schema privileges differ')
  return { stage, identity, history, counts }
}
export function checkRoleReads(db, stage) {
  const result = {}
  for (const role of ['anon', 'authenticated', 'service_role']) {
    assert.equal(db.query('SELECT count(*) FROM public.reviews', { role }), '0')
    if (stage >= 5) assert.equal(db.query('SELECT count(*) FROM public.company_profiles', { role }), '0')
    if (stage >= 6) for (const table of ['company_leads', 'directory_events']) {
      if (role === 'anon') db.query(`SELECT * FROM public.${table} LIMIT 0`, { role, denied: true })
      else assert.equal(db.query(`SELECT count(*) FROM public.${table}`, { role }), '0')
    }
    if (stage >= 7) {
      if (role !== 'service_role') db.query('SELECT * FROM public.advisor_interest_submissions LIMIT 0', { role, denied: true })
      else assert.equal(db.query('SELECT count(*) FROM public.advisor_interest_submissions', { role }), '0')
    }
    result[role] = 'passed'
  }
  db.query('SELECT reviewer_user_id FROM public.reviews LIMIT 0', { role: 'anon', denied: true })
  db.query('SELECT moderation_status FROM public.reviews LIMIT 0', { role: 'authenticated', denied: true })
  return result
}
async function manifest(directory) {
  const names = await readdir(directory, { recursive: true })
  const entries = []
  for (const name of names.sort()) {
    if (name === 'SHA256SUMS.txt') continue
    const file = path.join(directory, name)
    if ((await stat(file)).isFile()) entries.push(`${sha(await readFile(file))} *${name}`)
  }
  await writeFile(path.join(directory, 'SHA256SUMS.txt'), entries.join('\n') + '\n')
  for (const entry of entries) {
    const [expected, name] = entry.split(' *')
    assert.equal(sha(await readFile(path.join(directory, name))), expected, 'Backup checksum verification failed')
  }
}
export async function snapshot(db, directory, sql) {
  await mkdir(directory)
  const before = readState(db)
  const dump = path.join(directory, 'production.dump')
  db.run('pg_dump', [...db.args, '--format=custom', '--compress=9', '--file', dump])
  db.run('pg_dumpall', ['-w', '-h', db.host, '-p', String(db.port), '-U', db.args[db.args.indexOf('-U') + 1], '-l', db.database, '--roles-only', '--no-role-passwords', '--file', path.join(directory, 'roles.sql')])
  const list = db.run('pg_restore', ['--list', dump]).stdout
  await writeFile(path.join(directory, 'archive-contents.txt'), list)
  const schemaFile = path.join(directory, 'schema.sql')
  db.run('pg_restore', ['--schema-only', '--file', schemaFile, dump])
  // Read the entire data stream without retaining a second plaintext data copy.
  db.run('pg_restore', ['--data-only', '--file', 'NUL', dump])
  validateSchema(await readFile(schemaFile, 'utf8'), list, sql, before.stage)
  for (const table of before.counts) assert(list.includes(`TABLE DATA public ${table.name} `), `Backup lacks ${table.name} data`)
  const roleReads = checkRoleReads(db, before.stage)
  const after = readState(db)
  assert.deepEqual(after, before, 'Database changed during backup; stop and take a new snapshot')
  const report = { capturedAt: new Date().toISOString(), stage: before.stage, history: before.history, counts: before.counts,
    roleReads, schema: 'verified', archiveBytes: (await stat(dump)).size, dataStream: 'verified', productionMutation: false }
  await writeFile(path.join(directory, 'snapshot.json'), JSON.stringify(report, null, 2))
  await manifest(directory)
  return before
}

async function publicSmoke() {
  const site = await fetch('https://www.thehockeydirectory.com/', { signal: AbortSignal.timeout(30000) })
  assert.equal(site.status, 200, 'Existing public website smoke check failed')
  await site.arrayBuffer()
  const api = await fetch('https://www.thehockeydirectory.com/api/advisors?limit=1', { signal: AbortSignal.timeout(30000) })
  assert.equal(api.status, 200, 'Existing directory API smoke check failed')
  const body = await api.json()
  assert(body.pagination?.total === 202 && body.advisors?.length === 1, 'Existing directory API count differs')
}

async function productionMain() {
  const [mode = 'preflight', phrase = ''] = process.argv.slice(2)
  assert(['preflight', 'apply', 'verify'].includes(mode), 'Invalid release mode')
  if (mode === 'apply') assert.equal(phrase, approvalPhrase, 'Exact release approval required')
  assert(process.env.PGPASSWORD, 'Use the PowerShell wrapper to enter the database password securely')
  const sql = await reviewedSql()
  for (const script of ['validate-migrations.mjs', 'test-validation-rules.mjs']) {
    const result = spawnSync(process.execPath, [path.join(repositoryRoot, 'scripts/database', script)], { encoding: 'utf8', windowsHide: true })
    assert.equal(result.status, 0, 'Repository migration safeguards failed')
  }
  const git = (...args) => spawnSync('git', args, { cwd: repositoryRoot, encoding: 'utf8', windowsHide: true })
  assert.equal(git('branch', '--show-current').stdout.trim(), 'codex/restart-foundation', 'Wrong release branch')
  assert.equal(git('diff', '--cached', '--name-only').stdout.trim(), '', 'Staged files must be reviewed before release')
  const beforeGit = git('status', '--porcelain=v1').stdout
  const root = await realpath(path.join(process.env.USERPROFILE, 'HockeyAdvisorDirectory-Backups/production'))
  assert(!root.toLowerCase().includes('onedrive') && !root.toLowerCase().startsWith(repositoryRoot.toLowerCase()), 'Backup root must be outside repository and OneDrive')
  const directory = path.join(root, `advisor-directory-m5-m7-${new Date().toISOString().replaceAll(/[-:.]/g, '')}-${randomUUID().slice(0, 8)}`)
  await mkdir(directory)
  const env = { ...process.env, PGSSLMODE: 'require', PGCONNECT_TIMEOUT: '15', PGOPTIONS: '-c statement_timeout=120000' }
  const host = 'aws-1-ca-central-1.pooler.supabase.com'
  const user = `postgres.${projectRef}`
  const db = connection({ host, port: 5432, user, database: 'postgres', bin: 'C:/Program Files/PostgreSQL/18/bin', env })
  let applyAttempted = false
  let verified = false
  try {
    await publicSmoke()
    console.log('Creating and validating a fresh protected backup...')
    const before = await snapshot(db, path.join(directory, 'before'), sql)
    if (mode === 'verify') assert.equal(before.stage, 7, 'Verification requires M7; remaining migrations were not applied')
    if (before.stage < 7) {
      const cliRoot = path.join(directory, 'cli')
      const npx = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npx-cli.js')
      const cli = (args) => {
        const result = spawnSync(process.execPath, [npx, '--yes', 'supabase@2.109.1', '--workdir', cliRoot, ...args],
          { env, encoding: 'utf8', timeout: 240000, maxBuffer: 8 * 1024 * 1024, windowsHide: true })
        let output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
        for (const secret of [env.PGPASSWORD, encodeURIComponent(env.PGPASSWORD)]) output = output.split(secret).join('[redacted]')
        return { ...result, output }
      }
      await mkdir(cliRoot)
      assert.equal(cli(['init']).status, 0, 'Could not initialize isolated migration CLI')
      await mkdir(path.join(cliRoot, 'supabase/migrations'), { recursive: true })
      for (const [name] of migrations) await copyFile(path.join(repositoryRoot, 'supabase/migrations', name), path.join(cliRoot, 'supabase/migrations', name))
      const url = `postgresql://${user}@${host}:5432/postgres?sslmode=require`
      const dryRun = cli(['db', 'push', '--dry-run', '--db-url', url])
      await writeFile(path.join(directory, 'dry-run.txt'), dryRun.output)
      assert.equal(dryRun.status, 0, 'Dry run failed; see protected evidence')
      validateDryRun(dryRun.output, before.stage)
      console.log(`Exact pending upgrades verified: ${migrations.slice(before.stage).map(([name]) => name).join(', ')}`)
      if (mode === 'apply') {
        await reviewedSql()
        for (const [name, expected] of migrations) assert.equal(sha(await readFile(path.join(cliRoot, 'supabase/migrations', name))), expected)
        assert.deepEqual(readState(db), before, 'Database changed after backup; application cancelled')
        assert.equal(git('status', '--porcelain=v1').stdout, beforeGit, 'Working tree changed during preflight')
        applyAttempted = true
        await writeFile(path.join(directory, 'status.json'), JSON.stringify({ status: 'applying', productionChanges: 'unknown', beforeStage: before.stage }))
        const apply = cli(['db', 'push', '--yes', '--db-url', url])
        await writeFile(path.join(directory, 'apply.txt'), apply.output)
        assert.equal(apply.status, 0, 'Migration command did not finish cleanly. Do not manually reapply; inspect live history first')
        const after = await snapshot(db, path.join(directory, 'after'), sql)
        assert.equal(after.stage, 7, 'Final migration history is not M7')
        for (const prior of before.counts) assert.deepEqual(after.counts.find((item) => item.name === prior.name), prior, `Existing data changed in ${prior.name}`)
        verified = true
      }
    } else { verified = true; console.log('M7 is already present; verified without reapplying anything.') }
    await publicSmoke()
    assert.equal(git('status', '--porcelain=v1').stdout, beforeGit, 'Working tree changed during release')
    await writeFile(path.join(directory, 'status.json'), JSON.stringify({ status: 'success', mode, applyAttempted, m7Verified: verified,
      productionChanges: applyAttempted, projectRef, existingRecordsPreserved: true, adminCreated: false }, null, 2))
    await manifest(directory)
    console.log(`${verified ? 'M5-M7 verified. All existing records preserved.' : 'Preflight passed; no migrations applied.'}\nEvidence: ${directory}`)
  } catch (error) {
    // Never report an interrupted network/application attempt as no mutation.
    await writeFile(path.join(directory, 'status.json'), JSON.stringify({ status: 'failed', applyAttempted,
      productionChanges: applyAttempted ? 'unknown-check-live-history' : false, m7Verified: verified, error: error.message }, null, 2))
    await manifest(directory)
    throw new Error(`${error.message}\nEvidence: ${directory}`)
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  productionMain().catch((error) => { console.error(error.message); process.exitCode = 1 })
}
