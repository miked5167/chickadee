import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { isM4ArchiveCountFailure, m4ArchiveEntryCount, validateM4ArchiveEntries } from './m4-archive-contract.mjs'
import {
  baselinePath,
  buildFingerprint,
  baselineFingerprintPath,
  normalizeSql,
  projectFingerprint,
} from './generate-schema-fingerprint.mjs'

const baseApplicationTables = ['companies', 'advisors', 'listing_claims', 'media_content', 'users']
const adoptedBaselineVersion = '20260719000000'
const adoptedBaselineName = 'production_company_baseline'
const m2Version = '20260719000001'
const m2Name = 'add_companies_updated_at_trigger'
const m3Version = '20260719000002'
const m3Name = 'administrator_authorization_foundation'
const m4Version = '20260719000003'
const m4Name = 'company_reviews'
const exactApplicationCounts = new Map([
  ['companies', 202],
  ['advisors', 177],
  ['listing_claims', 0],
  ['media_content', 0],
  ['users', 0],
])

function option(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') quoted = false
      else field += character
    } else if (character === '"') quoted = true
    else if (character === ',') {
      row.push(field)
      field = ''
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''))
      if (row.some((value) => value !== '')) rows.push(row)
      row = []
      field = ''
    } else field += character
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ''))
    rows.push(row)
  }

  const [headers, ...values] = rows
  return values.map((items) => Object.fromEntries(headers.map((header, index) => [header, items[index] ?? ''])))
}

async function csv(directory, name) {
  return parseCsv((await readFile(path.join(directory, name), 'utf8')).replace(/^\uFEFF/, ''))
}

async function hashFile(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    createReadStream(file).on('data', (chunk) => hash.update(chunk)).on('error', reject).on('end', () => resolve(hash.digest('hex')))
  })
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function comparable(value) {
  return normalizeSql(value)
    .replaceAll('extensions.uuid_generate_v4()', 'uuid_generate_v4()')
    .replaceAll('public.', '')
}

function expectedUdt(type) {
  if (type.startsWith('character varying')) return ['pg_catalog', 'varchar']
  if (type === 'timestamp with time zone') return ['pg_catalog', 'timestamptz']
  if (type === 'text[]') return ['pg_catalog', '_text']
  if (type.startsWith('public.geography')) return ['public', 'geography']
  if (type.startsWith('public.')) return ['public', type.slice('public.'.length)]
  return {
    uuid: ['pg_catalog', 'uuid'],
    text: ['pg_catalog', 'text'],
    integer: ['pg_catalog', 'int4'],
    boolean: ['pg_catalog', 'bool'],
    jsonb: ['pg_catalog', 'jsonb'],
    tsvector: ['pg_catalog', 'tsvector'],
  }[type]
}

function setOwnersFromArchive(projected, archiveLines) {
  const ownerByObject = new Map()
  for (const line of archiveLines) {
    const match = line.match(/\b(TYPE|TABLE|FUNCTION) public ([a-z_][a-z0-9_]*)(?:\(\))? ([a-z_][a-z0-9_]*)$/i)
    if (match) ownerByObject.set(`${match[1].toLowerCase()}:${match[2]}`, match[3])
  }
  for (const item of projected.tables) item.owner = ownerByObject.get(`table:${item.name}`) ?? item.owner
  for (const item of projected.enums) item.owner = ownerByObject.get(`type:${item.name}`) ?? item.owner
  for (const item of projected.functions) item.owner = ownerByObject.get(`function:${item.name}`) ?? item.owner
}

async function validateIntegrity(directory, target, recoverM4ArchiveCount = false) {
  const status = JSON.parse((await readFile(path.join(directory, 'status.json'), 'utf8')).replace(/^\uFEFF/, ''))
  const statusSucceeded = status.success === true || ['success', 'succeeded', 'ok', 'complete', 'completed'].includes(String(status.status ?? status.result ?? '').toLowerCase())
  if (recoverM4ArchiveCount) {
    assert(target === 'm4' && isM4ArchiveCountFailure(status), 'Not the specific recoverable M4 archive-count failure')
  } else {
    assert(statusSucceeded, 'Protected evidence status does not report success')
  }

  const checksumLines = (await readFile(path.join(directory, 'SHA256SUMS.txt'), 'utf8')).replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
  assert(checksumLines.length > 0, 'Checksum manifest is empty')
  const checksummedNames = new Set()
  for (const line of checksumLines) {
    const match = line.match(/^([0-9a-f]{64})\s+\*?(.+)$/i)
    assert(match, 'Checksum manifest contains an unparseable entry')
    checksummedNames.add(match[2].trim().replaceAll('\\', '/'))
    const actual = await hashFile(path.join(directory, match[2].trim()))
    assert(actual === match[1].toLowerCase(), `Checksum mismatch for ${path.basename(match[2].trim())}`)
  }

  if (recoverM4ArchiveCount) {
    const required = ['status.json', 'archive-contents.txt', 'role-matrix-verification.json', 'supabase-apply.txt',
      'supabase-dry-run.txt', 'tables.csv', 'columns.csv', 'relationships-and-constraints.csv', 'rls-policies.csv',
      'functions.csv', 'function-privileges.csv', 'triggers.csv', 'table-privileges.csv', 'column-privileges.csv',
      'exact-row-counts.csv', 'migration-history-status.csv', 'migration-history-versions.csv']
    for (const name of required) assert(checksummedNames.has(name), `Recovery evidence lacks checksummed ${name}`)
    const names = await readdir(directory)
    for (const pattern of [/^production-\d{8}T\d{6}Z\.dump$/, /^production-schema-\d{8}T\d{6}Z\.sql$/]) {
      const files = names.filter((name) => pattern.test(name))
      assert(files.length === 1 && checksummedNames.has(files[0]), 'Recovery backup/schema is missing or not checksummed')
    }
    const roles = JSON.parse((await readFile(path.join(directory, 'role-matrix-verification.json'), 'utf8')).replace(/^\uFEFF/, ''))
    assert(roles.anonymous_public_read === '0' && roles.authenticated_public_read === '0' && roles.service_role_read === '0' &&
      roles.anonymous_reviewer_identity_read === false && roles.authenticated_moderation_state_read === false &&
      roles.production_review_rows === 0 && roles.production_admin_rows === 0, 'Recovery role checks differ')
  }

  const archiveLines = (await readFile(path.join(directory, 'archive-contents.txt'), 'utf8')).split(/\r?\n/)
  const archiveEntries = archiveLines.filter((line) => line.trim() && !line.startsWith(';'))
  const migrationStatus = await csv(directory, 'migration-history-status.csv')
  assert(migrationStatus.length === 1, 'Expected exactly one migration-history status row')
  const historyStatusValue = String(migrationStatus[0].standard_migration_table_present ?? '').trim().toLowerCase()
  assert(['true', 't', 'false', 'f'].includes(historyStatusValue), 'Migration-history status is not a recognized boolean')
  const historyPresent = historyStatusValue === 'true' || historyStatusValue === 't'
  assert(target === 'baseline' || historyPresent, 'Forward-target evidence requires standard migration history')
  const expectedArchiveEntries = target === 'm4' ? m4ArchiveEntryCount : (target === 'current' || target === 'm3' ? 1337 : (target === 'm2' ? 1322 : (historyPresent ? 1321 : 1317)))
  assert(archiveEntries.length === expectedArchiveEntries, `Expected ${expectedArchiveEntries.toLocaleString('en-US')} archive entries; found ${archiveEntries.length}`)
  if (target === 'm4') validateM4ArchiveEntries(archiveLines)

  if (historyPresent) {
    const migrationVersions = await csv(directory, 'migration-history-versions.csv')
    const expectedHistory = target === 'm4'
      ? [[adoptedBaselineVersion, adoptedBaselineName], [m2Version, m2Name], [m3Version, m3Name], [m4Version, m4Name]]
      : (target === 'current' || target === 'm3'
        ? [[adoptedBaselineVersion, adoptedBaselineName], [m2Version, m2Name], [m3Version, m3Name]]
      : (target === 'm2'
          ? [[adoptedBaselineVersion, adoptedBaselineName], [m2Version, m2Name]]
          : [[adoptedBaselineVersion, adoptedBaselineName]]))
    assert(migrationVersions.length === expectedHistory.length, `Expected exactly ${expectedHistory.length} migration-history row(s)`)
    for (let index = 0; index < expectedHistory.length; index += 1) {
      assert(
        migrationVersions[index].version === expectedHistory[index][0] && migrationVersions[index].name === expectedHistory[index][1],
        'Migration history does not contain the exact ordered target chain',
      )
    }
  }

  return { archiveLines, checksumCount: checksumLines.length, archiveEntryCount: archiveEntries.length, historyPresent }
}

async function validateCatalogs(directory, expected, target) {
  const applicationTables = new Set(
    target === 'm4'
      ? [...baseApplicationTables, 'admin_users', 'reviews']
      : target === 'current' || target === 'm3'
        ? [...baseApplicationTables, 'admin_users']
        : baseApplicationTables,
  )
  const tables = (await csv(directory, 'tables.csv')).filter((row) => row.schema_name === 'public' && applicationTables.has(row.table_name))
  assert(tables.length === expected.tables.length, 'Application table count differs from canonical fingerprint')
  for (const table of expected.tables) {
    const actual = tables.find((row) => row.table_name === table.name)
    assert(actual, `Catalog is missing table ${table.name}`)
    assert(actual.owner === table.owner, `Owner mismatch for table ${table.name}`)
    assert(actual.rls_enabled === 't' && actual.rls_forced === 'f', `RLS state mismatch for table ${table.name}`)
  }

  const columns = (await csv(directory, 'columns.csv')).filter((row) => row.schema_name === 'public' && applicationTables.has(row.table_name))
  assert(columns.length === expected.tables.reduce((count, table) => count + table.columns.length, 0), 'Application column count differs from canonical fingerprint')
  for (const table of expected.tables) {
    const actualColumns = columns.filter((row) => row.table_name === table.name).sort((left, right) => Number(left.ordinal_position) - Number(right.ordinal_position))
    for (const column of table.columns) {
      const actual = actualColumns[column.ordinal - 1]
      assert(actual?.column_name === column.name, `Column order/name mismatch at ${table.name}.${column.ordinal}`)
      assert((actual.is_nullable === 'YES') === column.nullable, `Nullability mismatch for ${table.name}.${column.name}`)
      assert(comparable(actual.column_default || '') === comparable(column.default || ''), `Default mismatch for ${table.name}.${column.name}`)
      const udt = expectedUdt(column.type)
      assert(udt && actual.udt_schema === udt[0] && actual.udt_name === udt[1], `Type mismatch for ${table.name}.${column.name}`)
    }
  }

  const constraints = (await csv(directory, 'relationships-and-constraints.csv')).filter((row) => row.schema_name === 'public' && applicationTables.has(row.table_name))
  assert(constraints.length === expected.constraints.length, 'Application constraint count differs from canonical fingerprint')
  for (const constraint of expected.constraints) {
    const actual = constraints.find((row) => row.table_name === constraint.table && row.constraint_name === constraint.name)
    assert(actual, `Catalog is missing constraint ${constraint.table}.${constraint.name}`)
    const expectedType = {
      check: 'check',
      primary_key: 'primary key',
      unique: 'unique',
      foreign_key: 'foreign key',
      exclude: 'exclusion',
    }[constraint.type]
    assert(actual.constraint_type === expectedType && actual.definition.trim(), `Constraint catalog attributes differ for ${constraint.table}.${constraint.name}`)
  }

  const policies = (await csv(directory, 'rls-policies.csv')).filter((row) => row.schema_name === 'public' && applicationTables.has(row.table_name))
  assert(policies.length === expected.policies.length, 'Application policy count differs from canonical fingerprint')
  for (const policy of expected.policies) {
    assert(policies.some((row) => row.table_name === policy.table && row.policy_name === policy.name), `Catalog is missing policy ${policy.table}.${policy.name}`)
  }

  const includesM3 = target === 'm3' || target === 'm4' || target === 'current'
  const includesM4 = target === 'm4'
  const expectedFunctionNames = new Set(includesM3 ? ['update_updated_at_column', 'is_admin'] : ['update_updated_at_column'])
  const functions = (await csv(directory, 'functions.csv')).filter((row) => row.schema_name === 'public' && expectedFunctionNames.has(row.function_name))
  assert(functions.length === expectedFunctionNames.size, 'Application function register is missing or duplicated')
  const timestampFunction = functions.find((row) => row.function_name === 'update_updated_at_column')
  assert(timestampFunction?.owner === 'postgres' && timestampFunction.security_definer === 'f' && timestampFunction.volatility === 'v', 'Timestamp function attributes differ')
  if (includesM3) {
    const adminFunction = functions.find((row) => row.function_name === 'is_admin')
    assert(
      adminFunction?.owner === 'postgres'
      && adminFunction.security_definer === 't'
      && adminFunction.volatility === 's'
      && adminFunction.definition.includes("SET search_path TO ''"),
      'M3 is_admin() ownership, security, volatility, or fixed search_path differs',
    )
    const functionPrivileges = (await csv(directory, 'function-privileges.csv')).filter((row) => row.function_schema === 'public' && row.function_name === 'is_admin')
    const actualFunctionPrivileges = functionPrivileges.map((row) => `${row.grantee}.${row.privilege_type}`).sort()
    assert(
      JSON.stringify(actualFunctionPrivileges) === JSON.stringify(['authenticated.EXECUTE', 'postgres.EXECUTE', 'service_role.EXECUTE']),
      'M3 is_admin() execution privilege register differs',
    )
  }

  const triggers = (await csv(directory, 'triggers.csv')).filter((row) => row.schema_name === 'public' && applicationTables.has(row.table_name))
  assert(triggers.length === expected.triggers.length, 'Application trigger count differs from canonical fingerprint')
  for (const trigger of expected.triggers) {
    assert(triggers.some((row) => row.table_name === trigger.table && row.trigger_name === trigger.name && row.enabled_state === 'O'), `Trigger mismatch for ${trigger.table}.${trigger.name}`)
  }

  const privileges = (await csv(directory, 'table-privileges.csv')).filter((row) => row.table_schema === 'public' && applicationTables.has(row.table_name))
  const expectedPrivileges = ['DELETE', 'INSERT', 'REFERENCES', 'SELECT', 'TRIGGER', 'TRUNCATE', 'UPDATE']
  for (const table of applicationTables) {
    if (table === 'admin_users' || table === 'reviews') continue
    for (const grantee of ['anon', 'authenticated', 'service_role']) {
      const actual = privileges.filter((row) => row.table_name === table && row.grantee === grantee).map((row) => row.privilege_type).sort()
      assert(JSON.stringify(actual) === JSON.stringify(expectedPrivileges), `Grant mismatch for ${table}.${grantee}`)
    }
  }
  if (includesM3) {
    const apiGrantees = new Set(['PUBLIC', 'anon', 'authenticated', 'service_role'])
    const adminPrivileges = privileges.filter((row) => row.table_name === 'admin_users' && apiGrantees.has(row.grantee)).map((row) => `${row.grantee}.${row.privilege_type}`).sort()
    const servicePrivileges = ['DELETE', 'INSERT', 'REFERENCES', 'SELECT', 'TRIGGER', 'TRUNCATE', 'UPDATE'].map((privilege) => `service_role.${privilege}`)
    assert(
      JSON.stringify(adminPrivileges) === JSON.stringify(['authenticated.SELECT', ...servicePrivileges].sort()),
      'M3 admin_users table privilege register differs',
    )
  }

  if (includesM4) {
    const apiGrantees = new Set(['PUBLIC', 'anon', 'authenticated', 'service_role'])
    const reviewPrivileges = privileges
      .filter((row) => row.table_name === 'reviews' && apiGrantees.has(row.grantee))
      .map((row) => `${row.grantee}.${row.privilege_type}`)
      .sort()
    const servicePrivileges = ['DELETE', 'INSERT', 'REFERENCES', 'SELECT', 'TRIGGER', 'TRUNCATE', 'UPDATE']
      .map((privilege) => `service_role.${privilege}`)
    assert(
      JSON.stringify(reviewPrivileges) === JSON.stringify(['authenticated.DELETE', ...servicePrivileges].sort()),
      'M4 reviews table privilege register differs',
    )

    const columnPrivileges = (await csv(directory, 'column-privileges.csv'))
      .filter((row) => row.table_schema === 'public' && row.table_name === 'reviews' && ['anon', 'authenticated'].includes(row.grantee))
      .map((row) => `${row.grantee}.${row.privilege_type}.${row.column_name}`)
      .sort()
    const publicColumns = ['id', 'company_id', 'rating', 'title', 'review_text', 'experience_confirmed_at', 'created_at', 'updated_at']
    const insertColumns = ['company_id', 'reviewer_user_id', 'rating', 'title', 'review_text', 'experience_confirmed_at']
    const updateColumns = ['rating', 'title', 'review_text', 'experience_confirmed_at']
    const expectedColumnPrivileges = [
      ...publicColumns.map((column) => `anon.SELECT.${column}`),
      ...publicColumns.map((column) => `authenticated.SELECT.${column}`),
      ...insertColumns.map((column) => `authenticated.INSERT.${column}`),
      ...updateColumns.map((column) => `authenticated.UPDATE.${column}`),
    ].sort()
    assert(JSON.stringify(columnPrivileges) === JSON.stringify(expectedColumnPrivileges), 'M4 reviews column privilege register differs')
  }

  const rowCounts = (await csv(directory, 'exact-row-counts.csv')).filter((row) => row.schema_name === 'public' && applicationTables.has(row.table_name))
  const expectedCounts = new Map(exactApplicationCounts)
  if (includesM3) expectedCounts.set('admin_users', 0)
  if (includesM4) expectedCounts.set('reviews', 0)
  assert(rowCounts.length === expectedCounts.size, 'Application exact-count register is incomplete')
  for (const [table, expectedCount] of expectedCounts) {
    const actual = rowCounts.find((row) => row.table_name === table)
    assert(actual && Number(actual.exact_row_count) === expectedCount, `Exact production row count differs for public.${table}`)
  }
}

async function main() {
  const target = option('--target') || 'baseline'
  assert(['baseline', 'm2', 'm3', 'm4', 'current'].includes(target), '--target must be baseline, m2, m3, m4, or current')
  const recoverM4ArchiveCount = process.argv.includes('--recover-m4-archive-count')
  const positional = process.argv.slice(2).find((argument, index, arguments_) => !argument.startsWith('--') && arguments_[index - 1] !== '--target')
  const supplied = positional || process.env.SCHEMA_EVIDENCE_DIR
  assert(supplied, 'Provide the protected evidence directory as the first argument or SCHEMA_EVIDENCE_DIR')
  const directory = path.resolve(supplied)
  const integrity = await validateIntegrity(directory, target, recoverM4ArchiveCount)
  let expected
  if (target === 'm4') {
    const migrationDirectory = path.dirname(baselinePath)
    const m2Path = path.join(migrationDirectory, `${m2Version}_${m2Name}.sql`)
    const m3Path = path.join(migrationDirectory, `${m3Version}_${m3Name}.sql`)
    const m4Path = path.join(migrationDirectory, `${m4Version}_${m4Name}.sql`)
    expected = buildFingerprint(
      `${await readFile(baselinePath, 'utf8')}\n${await readFile(m2Path, 'utf8')}\n${await readFile(m3Path, 'utf8')}\n${await readFile(m4Path, 'utf8')}`,
      {
        kind: 'deterministic-m4-target',
        baseMigration: 'supabase/migrations/20260719000000_production_company_baseline.sql',
        forwardMigrations: [
          'supabase/migrations/20260719000001_add_companies_updated_at_trigger.sql',
          'supabase/migrations/20260719000002_administrator_authorization_foundation.sql',
          'supabase/migrations/20260719000003_company_reviews.sql',
        ],
        containsData: false,
      },
    )
  }
  else if (target === 'current' || target === 'm3') {
    const migrationDirectory = path.dirname(baselinePath)
    const m2Path = path.join(migrationDirectory, `${m2Version}_${m2Name}.sql`)
    const m3Path = path.join(migrationDirectory, `${m3Version}_${m3Name}.sql`)
    expected = buildFingerprint(
      `${await readFile(baselinePath, 'utf8')}\n${await readFile(m2Path, 'utf8')}\n${await readFile(m3Path, 'utf8')}`,
      {
        kind: 'deterministic-m3-target',
        baseMigration: 'supabase/migrations/20260719000000_production_company_baseline.sql',
        forwardMigrations: [
          'supabase/migrations/20260719000001_add_companies_updated_at_trigger.sql',
          'supabase/migrations/20260719000002_administrator_authorization_foundation.sql',
        ],
        containsData: false,
      },
    )
  }
  else if (target === 'baseline') expected = JSON.parse(await readFile(baselineFingerprintPath, 'utf8'))
  else {
    const m2Path = path.join(path.dirname(baselinePath), `${m2Version}_${m2Name}.sql`)
    expected = buildFingerprint(`${await readFile(baselinePath, 'utf8')}\n${await readFile(m2Path, 'utf8')}`, {
      kind: 'deterministic-m2-target',
      baseMigration: 'supabase/migrations/20260719000000_production_company_baseline.sql',
      forwardMigrations: ['supabase/migrations/20260719000001_add_companies_updated_at_trigger.sql'],
      containsData: false,
    })
  }

  const schemaFiles = (await readdir(directory)).filter((name) => /^production-schema-\d{8}T\d{6}Z\.sql$/.test(name))
  assert(schemaFiles.length === 1, 'Expected exactly one schema-only production SQL file')
  const evidenceFingerprint = projectFingerprint(buildFingerprint(await readFile(path.join(directory, schemaFiles[0]), 'utf8')), expected)
  setOwnersFromArchive(evidenceFingerprint, integrity.archiveLines)
  assert(JSON.stringify(evidenceFingerprint) === JSON.stringify(expected), 'Canonical baseline fingerprint differs from protected schema-only evidence')
  await validateCatalogs(directory, expected, target)

  if (recoverM4ArchiveCount) process.stdout.write('Offline recovery validated the captured backup; original failed status/evidence left unchanged. No production changes or migration reapplication.\n')

  const historyState = integrity.historyPresent ? `exact ${target} migration history` : 'pre-adoption history absence'
  process.stdout.write(`Protected ${target} evidence validated: ${integrity.checksumCount} checksums, ${integrity.archiveEntryCount} archive entries, ${historyState}, exact application counts, and complete application catalog/schema agreement.\n`)
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
})
