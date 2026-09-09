import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { repositoryRoot, targetFingerprintPath } from './generate-schema-fingerprint.mjs'

const outputPath = path.join(repositoryRoot, 'supabase', 'types', 'database.generated.ts')

function typeScriptType(sqlType) {
  if (sqlType === 'uuid' || sqlType === 'text' || sqlType.startsWith('character varying') || sqlType.startsWith('character(') || sqlType === 'timestamp with time zone') return 'string'
  if (sqlType === 'text[]') return 'string[]'
  if (sqlType === 'smallint' || sqlType === 'integer' || sqlType === 'bigint' || sqlType === 'numeric') return 'number'
  if (sqlType === 'boolean') return 'boolean'
  if (sqlType === 'jsonb') return 'Json'
  if (sqlType.startsWith('public.')) {
    const enumName = sqlType.slice('public.'.length)
    if (!enumName.startsWith('geography')) return `Database['public']['Enums']['${enumName}']`
  }
  return 'unknown'
}

function property(column, shape) {
  const baseType = typeScriptType(column.type)
  const valueType = column.nullable ? `${baseType} | null` : baseType
  const optional = shape === 'Update' || (shape === 'Insert' && (column.nullable || column.default !== null))
  return `          ${column.name}${optional ? '?' : ''}: ${valueType}`
}

function relationships(table, constraints) {
  return constraints
    .filter((constraint) => constraint.table === table && constraint.type === 'foreign_key')
    .map((constraint) => {
      const match = constraint.definition.match(/FOREIGN KEY \(([^)]+)\) REFERENCES (?:public\.)?([a-z_][a-z0-9_]*)\(([^)]+)\)/i)
      if (!match || /REFERENCES auth\./i.test(constraint.definition)) return null
      return {
        foreignKeyName: constraint.name,
        columns: match[1].split(',').map((item) => item.trim()),
        referencedRelation: match[2],
        referencedColumns: match[3].split(',').map((item) => item.trim()),
      }
    })
    .filter(Boolean)
}

function quotedArray(values) {
  return `[${values.map((value) => `'${value}'`).join(', ')}]`
}

export function generateTypes(fingerprint) {
  const lines = [
    '/**',
    ' * Derived from the deterministic current-target fingerprint.',
    ' * This file was not generated from a live database and is intentionally not',
    ' * wired into application runtime code during the guarded-foundation phase.',
    ' * Regenerate with: npm run db:types:generate',
    ' */',
    '',
    'export type Json =',
    '  | string',
    '  | number',
    '  | boolean',
    '  | null',
    '  | { [key: string]: Json | undefined }',
    '  | Json[]',
    '',
    'export type Database = {',
    '  public: {',
    '    Tables: {',
  ]

  for (const table of fingerprint.tables) {
    lines.push(`      ${table.name}: {`)
    for (const shape of ['Row', 'Insert', 'Update']) {
      lines.push(`        ${shape}: {`)
      for (const column of table.columns) lines.push(property(column, shape))
      lines.push('        }')
    }
    const tableRelationships = relationships(table.name, fingerprint.constraints)
    if (tableRelationships.length === 0) lines.push('        Relationships: []')
    else {
      lines.push('        Relationships: [')
      for (const relationship of tableRelationships) {
        lines.push('          {')
        lines.push(`            foreignKeyName: '${relationship.foreignKeyName}'`)
        lines.push(`            columns: ${quotedArray(relationship.columns)}`)
        lines.push('            isOneToOne: false')
        lines.push(`            referencedRelation: '${relationship.referencedRelation}'`)
        lines.push(`            referencedColumns: ${quotedArray(relationship.referencedColumns)}`)
        lines.push('          },')
      }
      lines.push('        ]')
    }
    lines.push('      }')
  }

  lines.push('    }')
  lines.push('    Views: { [_ in never]: never }')
  const callableFunctions = fingerprint.functions.filter((item) => item.resultType !== 'trigger')
  if (callableFunctions.length === 0) lines.push('    Functions: { [_ in never]: never }')
  else {
    lines.push('    Functions: {')
    for (const item of callableFunctions) {
      lines.push(`      ${item.name}: {`)
      lines.push('        Args: Record<PropertyKey, never>')
      lines.push(`        Returns: ${typeScriptType(item.resultType)}`)
      lines.push('      }')
    }
    lines.push('    }')
  }
  lines.push('    Enums: {')
  for (const item of fingerprint.enums) lines.push(`      ${item.name}: ${item.labels.map((label) => `'${label}'`).join(' | ')}`)
  lines.push('    }')
  lines.push('    CompositeTypes: { [_ in never]: never }')
  lines.push('  }')
  lines.push('}')
  lines.push('')
  lines.push("export type CompanyRow = Database['public']['Tables']['companies']['Row']")
  lines.push("export type AdvisorPersonRow = Database['public']['Tables']['advisors']['Row']")
  if (fingerprint.tables.some((table) => table.name === 'admin_users')) {
    lines.push("export type AdminUserRow = Database['public']['Tables']['admin_users']['Row']")
  }
  if (fingerprint.tables.some((table) => table.name === 'reviews')) {
    lines.push("export type ReviewRow = Database['public']['Tables']['reviews']['Row']")
  }
  if (fingerprint.tables.some((table) => table.name === 'company_profiles')) {
    lines.push("export type CompanyProfileRow = Database['public']['Tables']['company_profiles']['Row']")
  }
  if (fingerprint.tables.some((table) => table.name === 'company_leads')) {
    lines.push("export type CompanyLeadRow = Database['public']['Tables']['company_leads']['Row']")
  }
  if (fingerprint.tables.some((table) => table.name === 'directory_events')) {
    lines.push("export type DirectoryEventRow = Database['public']['Tables']['directory_events']['Row']")
  }
  if (fingerprint.tables.some((table) => table.name === 'advisor_interest_submissions')) {
    lines.push("export type AdvisorInterestSubmissionRow = Database['public']['Tables']['advisor_interest_submissions']['Row']")
  }
  lines.push('')
  return `${lines.join('\n')}\n`
}

async function main() {
  const fingerprint = JSON.parse(await readFile(targetFingerprintPath, 'utf8'))
  const generated = generateTypes(fingerprint)
  if (process.argv.includes('--stdout')) {
    process.stdout.write(generated)
    return
  }
  if (process.argv.includes('--check')) {
    const existing = await readFile(outputPath, 'utf8')
    if (existing !== generated) throw new Error('Derived database types are out of date')
    process.stdout.write('Derived database types are deterministic and current.\n')
    return
  }
  await writeFile(outputPath, generated, 'utf8')
  process.stdout.write('Generated canonical derived database types.\n')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })
}
