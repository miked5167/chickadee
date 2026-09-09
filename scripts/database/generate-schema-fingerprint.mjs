import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
export const repositoryRoot = path.resolve(scriptDirectory, '..', '..')
export const baselinePath = path.join(
  repositoryRoot,
  'supabase',
  'migrations',
  '20260719000000_production_company_baseline.sql',
)
export const baselineFingerprintPath = path.join(
  repositoryRoot,
  'supabase',
  'schema-fingerprint',
  'production-company-baseline.json',
)
export const targetFingerprintPath = path.join(
  repositoryRoot,
  'supabase',
  'schema-fingerprint',
  'current-target.json',
)
export const fingerprintPath = baselineFingerprintPath

export const baselineSource = {
  kind: 'canonical-production-derived-baseline',
  capturedDate: '2026-07-19',
  migration: 'supabase/migrations/20260719000000_production_company_baseline.sql',
  containsData: false,
}

export const targetSource = {
  kind: 'deterministic-current-target',
  baseMigration: 'supabase/migrations/20260719000000_production_company_baseline.sql',
  forwardMigrations: [
    'supabase/migrations/20260719000001_add_companies_updated_at_trigger.sql',
    'supabase/migrations/20260719000002_administrator_authorization_foundation.sql',
    'supabase/migrations/20260719000003_company_reviews.sql',
    'supabase/migrations/20260821000000_company_profiles.sql',
    'supabase/migrations/20260821000001_company_leads_and_events.sql',
    'supabase/migrations/20260821000002_advisor_interest_submissions.sql',
  ],
  containsData: false,
}

export function normalizeSql(value) {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/;$/, '')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\[\s+/g, '[')
    .replace(/\s+\]/g, ']')
    .replace(/\s*,\s*/g, ', ')
}

function stripLeadingComments(value) {
  return value.replace(/^(?:\s*--[^\n]*(?:\r?\n|$))+/, '').trim()
}

export function splitStatements(sql) {
  const input = sql
    .replace(/^\s*--[^\n]*(?:\r?\n|$)/gm, '')
    .replace(/^\s*\\[^\n]*(?:\r?\n|$)/gm, '')
  const statements = []
  let start = 0
  let singleQuoted = false
  let doubleQuoted = false
  let dollarTag = null

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]

    if (dollarTag) {
      if (input.startsWith(dollarTag, index)) {
        index += dollarTag.length - 1
        dollarTag = null
      }
      continue
    }

    if (singleQuoted) {
      if (character === "'" && input[index + 1] === "'") {
        index += 1
      } else if (character === "'") {
        singleQuoted = false
      }
      continue
    }

    if (doubleQuoted) {
      if (character === '"' && input[index + 1] === '"') {
        index += 1
      } else if (character === '"') {
        doubleQuoted = false
      }
      continue
    }

    if (character === "'") {
      singleQuoted = true
      continue
    }
    if (character === '"') {
      doubleQuoted = true
      continue
    }
    if (character === '$') {
      const tag = input.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/)?.[0]
      if (tag) {
        dollarTag = tag
        index += tag.length - 1
        continue
      }
    }
    if (character === ';') {
      const statement = stripLeadingComments(input.slice(start, index + 1))
      if (statement) statements.push(statement)
      start = index + 1
    }
  }

  const remainder = stripLeadingComments(input.slice(start))
  if (remainder) statements.push(remainder)
  return statements
}

function splitTopLevel(value) {
  const parts = []
  let start = 0
  let depth = 0
  let singleQuoted = false

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if (singleQuoted) {
      if (character === "'" && value[index + 1] === "'") index += 1
      else if (character === "'") singleQuoted = false
      continue
    }
    if (character === "'") {
      singleQuoted = true
      continue
    }
    if (character === '(' || character === '[') depth += 1
    else if (character === ')' || character === ']') depth -= 1
    else if (character === ',' && depth === 0) {
      parts.push(value.slice(start, index).trim())
      start = index + 1
    }
  }
  parts.push(value.slice(start).trim())
  return parts.filter(Boolean)
}

function tableBody(statement) {
  const open = statement.indexOf('(')
  let depth = 0
  let singleQuoted = false
  for (let index = open; index < statement.length; index += 1) {
    const character = statement[index]
    if (singleQuoted) {
      if (character === "'" && statement[index + 1] === "'") index += 1
      else if (character === "'") singleQuoted = false
      continue
    }
    if (character === "'") singleQuoted = true
    else if (character === '(') depth += 1
    else if (character === ')') {
      depth -= 1
      if (depth === 0) return statement.slice(open + 1, index)
    }
  }
  throw new Error('Unbalanced CREATE TABLE statement')
}

function parseColumn(item, ordinal) {
  const match = item.match(/^([a-z_][a-z0-9_]*)\s+([\s\S]+)$/i)
  if (!match) throw new Error(`Cannot parse column: ${item}`)
  const definition = normalizeSql(match[2])
  const boundary = definition.search(/\s+(?:DEFAULT|NOT NULL)(?:\s|$)/i)
  const type = (boundary === -1 ? definition : definition.slice(0, boundary)).trim()
  const defaultMatch = definition.match(/\bDEFAULT\s+([\s\S]+?)(?:\s+NOT NULL)?$/i)
  return {
    ordinal,
    name: match[1],
    type,
    nullable: !/\bNOT NULL\b/i.test(definition),
    default: defaultMatch ? defaultMatch[1].trim() : null,
    definition,
  }
}

function parseConstraint(table, name, definition) {
  const normalized = normalizeSql(definition)
  const type = normalized.match(/^(PRIMARY KEY|UNIQUE|FOREIGN KEY|CHECK|EXCLUDE)\b/i)?.[1]
  if (!type) throw new Error(`Cannot classify constraint ${name}`)
  return { table, name, type: type.toLowerCase().replace(' ', '_'), definition: normalized }
}

function sorted(items, key) {
  return [...items].sort((left, right) => key(left).localeCompare(key(right)))
}

function parenthesizedClause(value, keyword) {
  const keywordIndex = value.search(new RegExp(`\\b${keyword}\\b`, 'i'))
  if (keywordIndex < 0) return null
  const open = value.indexOf('(', keywordIndex)
  if (open < 0) return null
  let depth = 0
  let singleQuoted = false
  for (let index = open; index < value.length; index += 1) {
    const character = value[index]
    if (singleQuoted) {
      if (character === "'" && value[index + 1] === "'") index += 1
      else if (character === "'") singleQuoted = false
      continue
    }
    if (character === "'") singleQuoted = true
    else if (character === '(') depth += 1
    else if (character === ')') {
      depth -= 1
      if (depth === 0) return normalizeSql(value.slice(open + 1, index))
    }
  }
  return null
}

export function buildFingerprint(sql, source = baselineSource) {
  const statements = splitStatements(sql)
  const extensions = []
  const enums = []
  const tables = []
  const constraints = []
  const indexes = []
  const policies = []
  const functions = []
  const triggers = []
  const ownership = []
  const grants = []
  const rls = new Map()

  for (const rawStatement of statements) {
    const statement = normalizeSql(rawStatement)
    let match

    match = statement.match(/^CREATE EXTENSION IF NOT EXISTS\s+("[^"]+"|[a-z0-9_]+)\s+WITH SCHEMA\s+([a-z0-9_]+)/i)
    if (match) {
      extensions.push({ name: match[1].replaceAll('"', ''), schema: match[2] })
      continue
    }

    match = statement.match(/^CREATE TYPE public\.([a-z_][a-z0-9_]*) AS ENUM\s*\(([\s\S]+)\)$/i)
    if (match) {
      const labels = [...match[2].matchAll(/'((?:''|[^'])*)'/g)].map((item) => item[1].replaceAll("''", "'"))
      enums.push({ schema: 'public', name: match[1], labels })
      continue
    }

    match = statement.match(/^CREATE TABLE public\.([a-z_][a-z0-9_]*)\s*\(/i)
    if (match) {
      const table = match[1]
      const columns = []
      for (const item of splitTopLevel(tableBody(rawStatement))) {
        const constraintMatch = item.match(/^CONSTRAINT\s+([a-z_][a-z0-9_]*)\s+([\s\S]+)$/i)
        if (constraintMatch) constraints.push(parseConstraint(table, constraintMatch[1], constraintMatch[2]))
        else columns.push(parseColumn(item, columns.length + 1))
      }
      tables.push({ schema: 'public', name: table, columns })
      rls.set(table, { table, enabled: false, forced: false })
      continue
    }

    match = statement.match(/^ALTER TABLE ONLY public\.([a-z_][a-z0-9_]*) ADD CONSTRAINT\s+([a-z_][a-z0-9_]*)\s+([\s\S]+)$/i)
    if (match) {
      constraints.push(parseConstraint(match[1], match[2], match[3]))
      continue
    }

    match = statement.match(/^CREATE (UNIQUE )?INDEX\s+([a-z_][a-z0-9_]*)\s+ON public\.([a-z_][a-z0-9_]*)\s+([\s\S]+)$/i)
    if (match) {
      indexes.push({
        table: match[3],
        name: match[2],
        unique: Boolean(match[1]),
        method: match[4].match(/\bUSING\s+([a-z0-9_]+)/i)?.[1] ?? 'btree',
        predicate: match[4].match(/\bWHERE\s+([\s\S]+)$/i)?.[1] ?? null,
        constraintBacked: false,
        definition: statement,
      })
      continue
    }

    match = statement.match(/^ALTER TABLE public\.([a-z_][a-z0-9_]*) ENABLE ROW LEVEL SECURITY$/i)
    if (match) {
      rls.set(match[1], { table: match[1], enabled: true, forced: false })
      continue
    }

    match = statement.match(/^CREATE POLICY\s+"([^"]+)"\s+ON public\.([a-z_][a-z0-9_]*)\s+([\s\S]+)$/i)
    if (match) {
      const clauses = match[3]
      const roleClause = clauses.match(/\bTO\s+([\s\S]+?)(?=\s+USING\b|\s+WITH CHECK\b|$)/i)?.[1]
      const command = clauses.match(/\bFOR\s+(ALL|SELECT|INSERT|UPDATE|DELETE)\b/i)?.[1].toLowerCase() ?? 'all'
      const roles = (roleClause ? roleClause.split(',').map((role) => role.trim()) : ['public']).sort()
      const using = parenthesizedClause(clauses, 'USING')
      const withCheck = parenthesizedClause(clauses, 'WITH CHECK')
      const definitionParts = [
        `CREATE POLICY "${match[1]}" ON public.${match[2]} FOR ${command.toUpperCase()} TO ${roles.join(', ')}`,
      ]
      if (using !== null) definitionParts.push(`USING (${using})`)
      if (withCheck !== null) definitionParts.push(`WITH CHECK (${withCheck})`)
      policies.push({
        table: match[2],
        name: match[1],
        permissive: true,
        command,
        roles,
        using,
        withCheck,
        definition: definitionParts.join(' '),
      })
      continue
    }

    match = statement.match(/^CREATE FUNCTION public\.([a-z_][a-z0-9_]*)\(([^)]*)\) RETURNS\s+([^\s]+)\s+([\s\S]+)$/i)
    if (match) {
      const language = statement.match(/\bLANGUAGE\s+([a-z0-9_]+)/i)?.[1] ?? null
      const functionDefinition = {
        schema: 'public',
        name: match[1],
        identityArguments: normalizeSql(match[2]),
        resultType: match[3],
        language,
        securityDefiner: /\bSECURITY DEFINER\b/i.test(statement),
        volatility: /\bIMMUTABLE\b/i.test(statement) ? 'immutable' : (/\bSTABLE\b/i.test(statement) ? 'stable' : 'volatile'),
        definition: statement,
        definitionSha256: createHash('sha256').update(statement).digest('hex'),
      }
      const parallel = statement.match(/\bPARALLEL\s+(UNSAFE|RESTRICTED|SAFE)\b/i)?.[1]?.toLowerCase()
      if (parallel) functionDefinition.parallel = parallel
      const searchPath = statement.match(/\bSET\s+search_path\s+(?:TO|=)\s+('(?:''|[^'])*')/i)?.[1]
      if (searchPath) functionDefinition.searchPath = searchPath.slice(1, -1).replaceAll("''", "'")
      functions.push(functionDefinition)
      continue
    }

    match = statement.match(/^CREATE TRIGGER\s+([a-z_][a-z0-9_]*)\s+([\s\S]+?)\s+ON public\.([a-z_][a-z0-9_]*)\s+([\s\S]+)$/i)
    if (match) {
      const timingAndEvents = normalizeSql(match[2])
      triggers.push({
        table: match[3],
        name: match[1],
        timing: timingAndEvents.split(' ')[0].toLowerCase(),
        events: timingAndEvents.slice(timingAndEvents.indexOf(' ') + 1).split(/\s+OR\s+/i).map((event) => event.toLowerCase()),
        enabled: 'origin',
        definition: statement,
      })
      continue
    }

    match = statement.match(/^ALTER (TYPE|FUNCTION|TABLE)\s+public\.([a-z_][a-z0-9_]*)(\(\))?\s+OWNER TO\s+([a-z_][a-z0-9_]*)$/i)
    if (match) {
      ownership.push({ kind: match[1].toLowerCase(), name: match[2], owner: match[4] })
      continue
    }

    match = statement.match(/^GRANT\s+(.+?)\s+ON\s+(FUNCTION|TABLE)\s+public\.([a-z_][a-z0-9_]*)(\(\))?\s+TO\s+([a-z_][a-z0-9_]*)$/i)
    if (match) {
      const kind = match[2].toLowerCase()
      const parsedPrivileges = normalizeSql(match[1])
      grants.push({
        kind,
        name: match[3],
        grantee: match[5],
        privileges: kind === 'function' && parsedPrivileges === 'EXECUTE' ? 'ALL' : parsedPrivileges,
      })
    }
  }

  for (const constraint of constraints) {
    if (['primary_key', 'unique', 'exclude'].includes(constraint.type)) {
      indexes.push({
        table: constraint.table,
        name: constraint.name,
        unique: ['primary_key', 'unique'].includes(constraint.type),
        method: constraint.definition.match(/\bUSING\s+([a-z0-9_]+)/i)?.[1] ?? 'btree',
        predicate: constraint.definition.match(/\bWHERE\s+([\s\S]+)$/i)?.[1] ?? null,
        constraintBacked: true,
        definition: `backed by constraint ${constraint.name}`,
      })
    }
  }

  const groupedGrants = new Map()
  for (const grant of grants) {
    const key = `${grant.kind}:${grant.name}:${grant.grantee}`
    const entry = groupedGrants.get(key) ?? { ...grant, privileges: new Set() }
    for (const privilege of splitTopLevel(grant.privileges)) {
      const columnPrivilege = privilege.match(/^(SELECT|INSERT|UPDATE|REFERENCES)\s*\(([^)]+)\)$/i)
      if (columnPrivilege) {
        for (const column of columnPrivilege[2].split(',').map((item) => item.trim())) {
          entry.privileges.add(`${columnPrivilege[1].toUpperCase()}(${column})`)
        }
      } else entry.privileges.add(normalizeSql(privilege).toUpperCase())
    }
    groupedGrants.set(key, entry)
  }
  const canonicalGrants = [...groupedGrants.values()].map((grant) => ({
    kind: grant.kind,
    name: grant.name,
    grantee: grant.grantee,
    privileges: [...grant.privileges].sort().join(', '),
  }))

  const owners = new Map(ownership.map((item) => [`${item.kind}:${item.name}`, item.owner]))
  for (const table of tables) table.owner = owners.get(`table:${table.name}`) ?? null
  for (const item of enums) item.owner = owners.get(`type:${item.name}`) ?? null
  for (const item of functions) item.owner = owners.get(`function:${item.name}`) ?? null

  return {
    formatVersion: 1,
    source,
    extensions: sorted(extensions, (item) => `${item.schema}.${item.name}`),
    enums: sorted(enums, (item) => item.name),
    tables: sorted(tables, (item) => item.name),
    constraints: sorted(constraints, (item) => `${item.table}.${item.name}`),
    indexes: sorted(indexes, (item) => `${item.table}.${item.name}`),
    rowLevelSecurity: sorted([...rls.values()], (item) => item.table),
    policies: sorted(policies, (item) => `${item.table}.${item.name}`),
    functions: sorted(functions, (item) => item.name),
    triggers: sorted(triggers, (item) => `${item.table}.${item.name}`),
    grants: sorted(canonicalGrants, (item) => `${item.kind}.${item.name}.${item.grantee}`),
  }
}

export function projectFingerprint(fingerprint, expected) {
  const tableNames = new Set(expected.tables.map((item) => item.name))
  const enumNames = new Set(expected.enums.map((item) => item.name))
  const functionNames = new Set(expected.functions.map((item) => item.name))
  const extensionNames = new Set(expected.extensions.map((item) => item.name))
  return {
    ...fingerprint,
    source: expected.source,
    extensions: fingerprint.extensions.filter((item) => extensionNames.has(item.name)),
    enums: fingerprint.enums.filter((item) => enumNames.has(item.name)),
    tables: fingerprint.tables.filter((item) => tableNames.has(item.name)),
    constraints: fingerprint.constraints.filter((item) => tableNames.has(item.table)),
    indexes: fingerprint.indexes.filter((item) => tableNames.has(item.table)),
    rowLevelSecurity: fingerprint.rowLevelSecurity.filter((item) => tableNames.has(item.table)),
    policies: fingerprint.policies.filter((item) => tableNames.has(item.table)),
    functions: fingerprint.functions.filter((item) => functionNames.has(item.name)),
    triggers: fingerprint.triggers.filter((item) => tableNames.has(item.table)),
    grants: fingerprint.grants.filter(
      (item) => (item.kind === 'table' && tableNames.has(item.name)) || (item.kind === 'function' && functionNames.has(item.name)),
    ),
  }
}

export async function generatedBaselineFingerprintText() {
  const sql = await readFile(baselinePath, 'utf8')
  return `${JSON.stringify(buildFingerprint(sql, baselineSource), null, 2)}\n`
}

export async function generatedTargetFingerprintText() {
  const migrationPaths = [
    baselinePath,
    ...targetSource.forwardMigrations.map((migration) => path.join(repositoryRoot, migration)),
  ]
  const sql = (await Promise.all(migrationPaths.map((migration) => readFile(migration, 'utf8')))).join('\n')
  return `${JSON.stringify(buildFingerprint(sql, targetSource), null, 2)}\n`
}

export const generatedFingerprintText = generatedBaselineFingerprintText

async function checkBaselineEvidence() {
  const generated = await generatedBaselineFingerprintText()
  const existing = await readFile(baselineFingerprintPath, 'utf8')
  if (existing !== generated) throw new Error('Immutable M1 baseline fingerprint is stale or changed')
}

async function main() {
  await checkBaselineEvidence()
  const generated = await generatedTargetFingerprintText()
  if (process.argv.includes('--stdout')) {
    process.stdout.write(generated)
    return
  }
  if (process.argv.includes('--check')) {
    const existing = await readFile(targetFingerprintPath, 'utf8')
    if (existing !== generated) throw new Error('Current-target schema fingerprint is not deterministic or is out of date')
    process.stdout.write('Immutable M1 evidence and deterministic current-target fingerprint are current.\n')
    return
  }
  await writeFile(targetFingerprintPath, generated, 'utf8')
  process.stdout.write('Generated sanitized current-target schema fingerprint without rewriting M1 evidence.\n')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })
}
