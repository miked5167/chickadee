import { buildFingerprint, normalizeSql, splitStatements } from './generate-schema-fingerprint.mjs'

// Explicit register for the additive tag foundation; older migration registers
// remain unchanged. Update deliberately when changing this migration.
export const directoryTagRegister = {
  "tables": {
    "claim_tags": [
      "claim_id",
      "tag_id",
      "created_at"
    ],
    "company_tags": [
      "company_id",
      "tag_id",
      "created_at"
    ],
    "directory_tag_groups": [
      "key",
      "label",
      "display_order",
      "is_core",
      "filter_enabled"
    ],
    "directory_tag_suggestions": [
      "id",
      "requester_user_id",
      "company_id",
      "claim_id",
      "group_key",
      "label",
      "reason",
      "status",
      "approved_tag_id",
      "reviewed_by",
      "reviewed_at",
      "review_note",
      "created_at"
    ],
    "directory_tags": [
      "id",
      "group_key",
      "slug",
      "label",
      "parent_id",
      "display_order",
      "is_active",
      "created_at"
    ]
  },
  "constraints": [
    "claim_tags.claim_tags_claim_id_fkey",
    "claim_tags.claim_tags_pkey",
    "claim_tags.claim_tags_tag_id_fkey",
    "company_tags.company_tags_company_id_fkey",
    "company_tags.company_tags_pkey",
    "company_tags.company_tags_tag_id_fkey",
    "directory_tag_groups.directory_tag_groups_core_check",
    "directory_tag_groups.directory_tag_groups_key_check",
    "directory_tag_groups.directory_tag_groups_label_check",
    "directory_tag_groups.directory_tag_groups_order_check",
    "directory_tag_groups.directory_tag_groups_pkey",
    "directory_tag_suggestions.directory_tag_suggestions_approved_tag_fkey",
    "directory_tag_suggestions.directory_tag_suggestions_claim_id_fkey",
    "directory_tag_suggestions.directory_tag_suggestions_company_id_fkey",
    "directory_tag_suggestions.directory_tag_suggestions_context_check",
    "directory_tag_suggestions.directory_tag_suggestions_group_key_fkey",
    "directory_tag_suggestions.directory_tag_suggestions_label_check",
    "directory_tag_suggestions.directory_tag_suggestions_note_check",
    "directory_tag_suggestions.directory_tag_suggestions_pkey",
    "directory_tag_suggestions.directory_tag_suggestions_reason_check",
    "directory_tag_suggestions.directory_tag_suggestions_requester_fkey",
    "directory_tag_suggestions.directory_tag_suggestions_review_check",
    "directory_tag_suggestions.directory_tag_suggestions_reviewer_fkey",
    "directory_tag_suggestions.directory_tag_suggestions_status_check",
    "directory_tags.directory_tags_group_id_key",
    "directory_tags.directory_tags_group_key_fkey",
    "directory_tags.directory_tags_group_slug_key",
    "directory_tags.directory_tags_identity_check",
    "directory_tags.directory_tags_label_check",
    "directory_tags.directory_tags_order_check",
    "directory_tags.directory_tags_parent_check",
    "directory_tags.directory_tags_parent_id_fkey",
    "directory_tags.directory_tags_pkey",
    "directory_tags.directory_tags_slug_check"
  ],
  "indexes": [
    "claim_tags.claim_tags_pkey",
    "claim_tags.claim_tags_tag_id_idx",
    "company_tags.company_tags_pkey",
    "company_tags.company_tags_tag_id_idx",
    "directory_tag_groups.directory_tag_groups_pkey",
    "directory_tag_suggestions.directory_tag_suggestions_pending_idx",
    "directory_tag_suggestions.directory_tag_suggestions_pkey",
    "directory_tag_suggestions.directory_tag_suggestions_queue_idx",
    "directory_tag_suggestions.directory_tag_suggestions_requester_idx",
    "directory_tags.directory_tags_group_id_key",
    "directory_tags.directory_tags_group_slug_key",
    "directory_tags.directory_tags_parent_idx",
    "directory_tags.directory_tags_pkey"
  ],
  "policies": [
    "claim_tags.Claim tags are private",
    "company_tags.Company tags are public",
    "directory_tag_groups.Directory tag groups are public",
    "directory_tag_suggestions.Advisors can suggest tags",
    "directory_tag_suggestions.Tag suggestions are private",
    "directory_tags.Active directory tags are public"
  ],
  "grants": [
    "function.replace_claim_tags.authenticated.ALL",
    "function.replace_company_tags.authenticated.ALL",
    "function.review_directory_tag_suggestion.authenticated.ALL",
    "function.validate_directory_tag_selection.authenticated.ALL",
    "table.claim_tags.authenticated.SELECT",
    "table.claim_tags.service_role.ALL",
    "table.company_tags.anon.SELECT",
    "table.company_tags.authenticated.SELECT",
    "table.company_tags.service_role.ALL",
    "table.directory_tag_groups.anon.SELECT",
    "table.directory_tag_groups.authenticated.SELECT",
    "table.directory_tag_groups.service_role.ALL",
    "table.directory_tag_suggestions.authenticated.INSERT(claim_id), INSERT(company_id), INSERT(group_key), INSERT(label), INSERT(reason), INSERT(requester_user_id), SELECT",
    "table.directory_tag_suggestions.service_role.ALL",
    "table.directory_tags.anon.SELECT",
    "table.directory_tags.authenticated.SELECT",
    "table.directory_tags.service_role.ALL"
  ],
  "functions": [
    {
      "name": "replace_claim_tags",
      "args": "p_claim_id uuid, p_tag_ids text[]",
      "result": "text[]",
      "definer": true
    },
    {
      "name": "replace_company_tags",
      "args": "p_company_id uuid, p_tag_ids text[]",
      "result": "text[]",
      "definer": true
    },
    {
      "name": "review_directory_tag_suggestion",
      "args": "p_suggestion_id uuid, p_action text, p_slug text, p_label text, p_note text",
      "result": "text",
      "definer": true
    },
    {
      "name": "validate_directory_tag_selection",
      "args": "p_tag_ids text[]",
      "result": "text[]",
      "definer": false
    }
  ]
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

export function validateDirectoryTagMigration(sql) {
  const fingerprint = buildFingerprint(sql)
  const statements = splitStatements(sql)
  assert(statements[2]?.startsWith('DO $guard$'), 'Directory tags prerequisite guard must precede DDL')
  for (const statement of statements) {
    assert(!/^(?:INSERT|UPDATE|DELETE|COPY|DROP|TRUNCATE)\b/i.test(normalizeSql(statement)), 'Tag migration must not contain top-level row changes or destructive statements')
    const altered = normalizeSql(statement).match(/^ALTER TABLE public\.([a-z_]+)/i)?.[1]
    assert(!altered || Object.hasOwn(directoryTagRegister.tables, altered), 'Tag migration must not alter existing tables')
  }
  assert(!/\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|FUNCTION|SCHEMA)\s+auth\./i.test(sql), 'Tag migration must not change authentication')
  for (const required of ['current_user <> \'postgres\'', 'Directory tags duplicate guard', "to_regprocedure('public.is_admin()')", 'core_count NOT BETWEEN 3 AND 5 OR service_count < 1', 'price_count > 1', 'company_owner IS DISTINCT FROM auth.uid() AND NOT public.is_admin()', "claim_status IN ('pending', 'under_review')", 'auth.uid() IS NULL OR NOT public.is_admin()', 'requester_user_id = auth.uid()', "status = 'pending'::text"]) {
    assert(sql.includes(required), 'Directory tag authorization/validation guard is missing: ' + required)
  }
  assert(JSON.stringify(Object.fromEntries(fingerprint.tables.map(table => [table.name, table.columns.map(column => column.name)]))) === JSON.stringify(directoryTagRegister.tables), 'Directory tag table/column register differs')
  for (const property of ['constraints', 'indexes', 'policies']) {
    assert(JSON.stringify(fingerprint[property].map(item => item.table + '.' + item.name)) === JSON.stringify(directoryTagRegister[property]), 'Directory tag ' + property + ' register differs')
  }
  assert(JSON.stringify(fingerprint.grants.map(item => item.kind + '.' + item.name + '.' + item.grantee + '.' + item.privileges)) === JSON.stringify(directoryTagRegister.grants), 'Directory tag grants differ')
  assert(fingerprint.rowLevelSecurity.length === 5 && fingerprint.rowLevelSecurity.every(item => item.enabled && !item.forced), 'Directory tag RLS differs')
  for (const table of Object.keys(directoryTagRegister.tables)) {
    assert(sql.includes('REVOKE ALL ON TABLE public.' + table + ' FROM PUBLIC, anon, authenticated;'), 'Directory tag table public privileges were not revoked: ' + table)
  }
  assert(fingerprint.functions.length === directoryTagRegister.functions.length, 'Directory tag function register differs')
  for (const expected of directoryTagRegister.functions) {
    const actual = fingerprint.functions.find(item => item.name === expected.name)
    assert(actual?.owner === 'postgres' && actual.searchPath === '' && actual.language === 'plpgsql' && actual.securityDefiner === expected.definer && actual.identityArguments === expected.args && actual.resultType === expected.result, 'Directory tag function attributes differ: ' + expected.name)
    assert(sql.includes('REVOKE ALL ON FUNCTION public.' + expected.name + ' FROM PUBLIC, anon, authenticated;'), 'Directory tag function public execution was not revoked')
  }
}
