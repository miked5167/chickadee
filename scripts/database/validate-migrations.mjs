import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildFingerprint,
  baselinePath,
  baselineFingerprintPath,
  generatedBaselineFingerprintText,
  generatedTargetFingerprintText,
  normalizeSql,
  repositoryRoot,
  splitStatements,
  targetFingerprintPath,
} from './generate-schema-fingerprint.mjs'
import { generateTypes } from './generate-database-types.mjs'

const activeDirectory = path.join(repositoryRoot, 'supabase', 'migrations')
const legacyDirectory = path.join(repositoryRoot, 'supabase', 'legacy-migrations')
const typesPath = path.join(repositoryRoot, 'supabase', 'types', 'database.generated.ts')
const baselineFilename = '20260719000000_production_company_baseline.sql'
const m2Filename = '20260719000001_add_companies_updated_at_trigger.sql'
const m2Path = path.join(activeDirectory, m2Filename)
const m3Filename = '20260719000002_administrator_authorization_foundation.sql'
const m3Path = path.join(activeDirectory, m3Filename)
const m4Filename = '20260719000003_company_reviews.sql'
const m4Path = path.join(activeDirectory, m4Filename)
const m5Filename = '20260821000000_company_profiles.sql'
const m5Path = path.join(activeDirectory, m5Filename)
const m6Filename = '20260821000001_company_leads_and_events.sql'
const m6Path = path.join(activeDirectory, m6Filename)
const m7Filename = '20260821000002_advisor_interest_submissions.sql'
const m7Path = path.join(activeDirectory, m7Filename)
const adoptedBaselineSha256 = '4b65fa234b56534985f249cc8061efd98b05ba927c5de130839b8fd35c1d1db8'
const reviewedM2Sha256 = '95fb374bb07c5a4941b3dd78e6a6db9bf5b4b456c15670fb3ac9805e3a81b547'
const reviewedM3Sha256 = 'a968f41fb10e6ecbe1ff8363abe0322031defd6aa361ce3c98498603ade55f6d'
const reviewedM4Sha256 = '05bbef023d1b74e5707d801554e2839248d9a976f71fea41155167b69f8f69f7'
const reviewedM5Sha256 = '854df7aab36a71b229b92525194972144fa118e4dd537d7cb81ed26eb8de49cc'
const reviewedM6Sha256 = '6eb36ca91d99dba5ee605a101cc48329c1d586ff0b2e0f14f864971e289673e9'
const reviewedM7Sha256 = 'dd3633aa14ba58d2340c5e1512cf20353006ac1b98e3d4f75431d4322409234e'

const legacyHashes = new Map([
  ['20250104000000_claim_improvements.sql', 'd75ccbad41a3dd118fdcd796a9ee73820b8a4a5d63471e1acaf763c5f5be601d'],
  ['20251109000000_add_advisor_profile_fields.sql', '683e5d708c096eade3ada2590de64a2b7a2d1876677f39ad39815dc2cc0fafdb'],
  ['20251110000000_add_pricing_fields.sql', '5b1d9c0269b7c7198aec3ee376ba713b1080c167c255f130034a66d9e51b630d'],
  ['20251110120000_consolidate_pricing_engagement.sql', 'bb08050b57ce97f07c89800c2a0c867a583dc886636f7369a0dd6a3a0372c4a1'],
  ['20251115_create_admin_users.sql', '11c5bb4e7898900b1755a663b88096cc262d5cfe57c1e188308e547c2c2725d6'],
])

const expected = {
  extensions: ['extensions.uuid-ossp', 'public.postgis'],
  enums: ['claim_status', 'media_type', 'moderation_status', 'user_type', 'verification_method'],
  tables: {
    advisors: ['id', 'company_id', 'name', 'title', 'bio', 'specialties', 'years_experience', 'playing_background', 'certifications', 'contact_email', 'contact_phone', 'profile_image_url', 'display_order', 'active', 'created_at', 'updated_at'],
    companies: ['id', 'name', 'slug', 'description', 'website_url', 'phone', 'email', 'address', 'city', 'state_province', 'country', 'location', 'facebook_url', 'instagram_url', 'twitter_url', 'logo_url', 'verified', 'verified_owner_id', 'verification_date', 'search_vector', 'created_at', 'updated_at'],
    listing_claims: ['id', 'company_id', 'claimant_user_id', 'claim_status', 'verification_method', 'verification_data', 'business_email', 'business_phone', 'supporting_documents', 'admin_notes', 'submitted_at', 'reviewed_at', 'reviewed_by', 'created_at', 'updated_at'],
    media_content: ['id', 'company_id', 'file_name', 'file_path', 'file_type', 'file_size', 'mime_type', 'caption', 'display_order', 'is_featured', 'is_introduction_video', 'moderation_status', 'uploaded_by', 'created_at', 'updated_at'],
    users: ['id', 'user_type', 'first_name', 'last_name', 'search_preferences', 'contact_history', 'created_at', 'updated_at'],
  },
  constraints: [
    'advisors.advisors_company_id_fkey', 'advisors.advisors_display_order_check', 'advisors.advisors_pkey', 'advisors.advisors_years_experience_check', 'advisors.valid_advisor_email', 'advisors.valid_advisor_name_length',
    'companies.companies_pkey', 'companies.companies_slug_key', 'companies.companies_verified_owner_id_fkey', 'companies.valid_email', 'companies.valid_name_length', 'companies.valid_slug_format',
    'listing_claims.listing_claims_claimant_user_id_fkey', 'listing_claims.listing_claims_company_id_fkey', 'listing_claims.listing_claims_pkey', 'listing_claims.listing_claims_reviewed_by_fkey', 'listing_claims.one_active_claim_per_company', 'listing_claims.valid_business_email',
    'media_content.media_content_company_id_fkey', 'media_content.media_content_display_order_check', 'media_content.media_content_file_size_check', 'media_content.media_content_pkey', 'media_content.media_content_uploaded_by_fkey',
    'users.users_id_fkey', 'users.users_pkey',
  ],
  indexes: [
    'advisors.advisors_active_idx', 'advisors.advisors_company_idx', 'advisors.advisors_pkey',
    'companies.companies_location_idx', 'companies.companies_pkey', 'companies.companies_search_vector_idx', 'companies.companies_slug_idx', 'companies.companies_slug_key', 'companies.companies_verified_idx', 'companies.companies_verified_owner_idx',
    'listing_claims.listing_claims_claimant_idx', 'listing_claims.listing_claims_company_idx', 'listing_claims.listing_claims_pkey', 'listing_claims.listing_claims_status_idx', 'listing_claims.one_active_claim_per_company',
    'media_content.media_content_company_idx', 'media_content.media_content_featured_idx', 'media_content.media_content_intro_video_idx', 'media_content.media_content_pkey',
    'users.users_pkey',
  ],
  policies: [
    'advisors.Company owners can manage advisors', 'advisors.Public read access for advisors',
    'companies.Company owners can update their listings', 'companies.Public read access for companies',
    'listing_claims.Users can create claims', 'listing_claims.Users can update their pending claims', 'listing_claims.Users can view their own claims',
    'media_content.Company owners can manage media', 'media_content.Public read access for approved media',
    'users.Users can view and update their own profile',
  ],
  triggers: [
    'advisors.update_advisors_updated_at',
    'listing_claims.update_listing_claims_updated_at',
    'media_content.update_media_content_updated_at',
    'users.update_users_updated_at',
  ],
}

const expectedM3 = {
  table: ['id', 'user_id', 'is_active', 'granted_by', 'granted_at', 'revoked_by', 'revoked_at', 'created_at', 'updated_at'],
  constraints: [
    'admin_users.admin_users_granted_by_fkey',
    'admin_users.admin_users_lifecycle_check',
    'admin_users.admin_users_no_self_grant_check',
    'admin_users.admin_users_no_self_revoke_check',
    'admin_users.admin_users_pkey',
    'admin_users.admin_users_revoked_by_fkey',
    'admin_users.admin_users_user_id_fkey',
    'admin_users.admin_users_user_id_key',
  ],
  indexes: [
    'admin_users.admin_users_granted_by_idx',
    'admin_users.admin_users_pkey',
    'admin_users.admin_users_revoked_by_idx',
    'admin_users.admin_users_user_id_key',
  ],
  policies: ['admin_users.Users can inspect own administrator status'],
  trigger: 'admin_users.update_admin_users_updated_at',
}

const expectedM4 = {
  table: ['id', 'company_id', 'reviewer_user_id', 'rating', 'title', 'review_text', 'experience_confirmed_at', 'moderation_status', 'created_at', 'updated_at'],
  constraints: [
    'reviews.reviews_company_id_fkey',
    'reviews.reviews_company_reviewer_key',
    'reviews.reviews_confirmation_check',
    'reviews.reviews_pkey',
    'reviews.reviews_rating_check',
    'reviews.reviews_reviewer_user_id_fkey',
    'reviews.reviews_text_length_check',
    'reviews.reviews_title_length_check',
  ],
  indexes: [
    'reviews.reviews_company_published_idx',
    'reviews.reviews_company_reviewer_key',
    'reviews.reviews_pkey',
    'reviews.reviews_reviewer_idx',
  ],
  policies: [
    'reviews.Published company reviews are public',
    'reviews.Users can create own company reviews',
    'reviews.Users can delete own company reviews',
    'reviews.Users can update own company reviews',
  ],
  trigger: 'reviews.update_reviews_updated_at',
}

const expectedM5 = {
  table: ['company_id', 'tagline', 'services', 'specialties', 'pathways', 'player_levels', 'age_groups', 'service_areas', 'languages', 'offers_remote', 'accepting_clients', 'pricing_models', 'price_min', 'price_max', 'price_currency', 'response_time', 'founded_year', 'business_hours', 'faq', 'last_reviewed_at', 'source_label', 'source_url', 'created_at', 'updated_at'],
  constraints: [
    'company_profiles.company_profiles_business_hours_check',
    'company_profiles.company_profiles_company_id_fkey',
    'company_profiles.company_profiles_currency_check',
    'company_profiles.company_profiles_faq_check',
    'company_profiles.company_profiles_founded_year_check',
    'company_profiles.company_profiles_pkey',
    'company_profiles.company_profiles_price_max_check',
    'company_profiles.company_profiles_price_min_check',
    'company_profiles.company_profiles_price_order_check',
    'company_profiles.company_profiles_tagline_check',
  ],
  indexes: [
    'company_profiles.company_profiles_accepting_idx',
    'company_profiles.company_profiles_pathways_idx',
    'company_profiles.company_profiles_pkey',
    'company_profiles.company_profiles_services_idx',
    'company_profiles.company_profiles_specialties_idx',
  ],
  policies: [
    'company_profiles.Company owners can create profiles',
    'company_profiles.Company owners can delete profiles',
    'company_profiles.Company owners can update profiles',
    'company_profiles.Company profiles are public',
  ],
  trigger: 'company_profiles.update_company_profiles_updated_at',
}

const expectedM6 = {
  tables: {
    company_leads: ['id', 'company_id', 'contact_name', 'contact_email', 'contact_phone', 'player_age', 'player_level', 'goals', 'message', 'consent_confirmed', 'status', 'owner_notes', 'referral_url', 'ip_hash', 'user_agent', 'created_at', 'updated_at'],
    directory_events: ['id', 'company_id', 'event_type', 'session_id', 'ip_hash', 'user_agent', 'referrer', 'metadata', 'created_at'],
  },
  constraints: [
    'company_leads.company_leads_age_check', 'company_leads.company_leads_company_id_fkey', 'company_leads.company_leads_consent_check', 'company_leads.company_leads_email_check', 'company_leads.company_leads_ip_hash_check', 'company_leads.company_leads_message_check', 'company_leads.company_leads_notes_check', 'company_leads.company_leads_pkey', 'company_leads.company_leads_status_check',
    'directory_events.directory_events_company_id_fkey', 'directory_events.directory_events_ip_hash_check', 'directory_events.directory_events_metadata_check', 'directory_events.directory_events_pkey', 'directory_events.directory_events_type_check',
  ],
  indexes: [
    'company_leads.company_leads_company_created_idx', 'company_leads.company_leads_company_status_idx', 'company_leads.company_leads_pkey', 'company_leads.company_leads_rate_limit_idx',
    'directory_events.directory_events_company_created_idx', 'directory_events.directory_events_company_type_idx', 'directory_events.directory_events_pkey', 'directory_events.directory_events_rate_limit_idx',
  ],
  policies: [
    'company_leads.Company owners can read own leads',
    'company_leads.Company owners can update own lead status',
    'directory_events.Company owners can read own directory events',
  ],
  trigger: 'company_leads.update_company_leads_updated_at',
}

const expectedM7 = {
  table: ['id', 'contact_name', 'business_name', 'email', 'website_url', 'interests', 'message', 'consent_confirmed', 'ip_hash', 'user_agent', 'created_at'],
  constraints: [
    'advisor_interest_submissions.advisor_interest_submissions_business_name_check',
    'advisor_interest_submissions.advisor_interest_submissions_consent_check',
    'advisor_interest_submissions.advisor_interest_submissions_contact_name_check',
    'advisor_interest_submissions.advisor_interest_submissions_email_check',
    'advisor_interest_submissions.advisor_interest_submissions_interests_check',
    'advisor_interest_submissions.advisor_interest_submissions_ip_hash_check',
    'advisor_interest_submissions.advisor_interest_submissions_message_check',
    'advisor_interest_submissions.advisor_interest_submissions_pkey',
  ],
  indexes: [
    'advisor_interest_submissions.advisor_interest_submissions_created_idx',
    'advisor_interest_submissions.advisor_interest_submissions_pkey',
    'advisor_interest_submissions.advisor_interest_submissions_rate_limit_idx',
  ],
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

export function equalList(actual, wanted, label) {
  assert(JSON.stringify([...actual].sort()) === JSON.stringify([...wanted].sort()), `${label} register differs from the validated production register`)
}

async function validateLegacy(activeFiles) {
  const legacyFiles = (await readdir(legacyDirectory)).filter((name) => name.endsWith('.sql')).sort()
  equalList(legacyFiles, [...legacyHashes.keys()], 'Legacy migration file')
  for (const [name, expectedHash] of legacyHashes) {
    const contents = await readFile(path.join(legacyDirectory, name))
    const actualHash = createHash('sha256').update(contents).digest('hex')
    assert(actualHash === expectedHash, `Legacy migration bytes changed: ${name}`)
    assert(!activeFiles.includes(name), `Legacy migration returned to active chain: ${name}`)
  }
}

export function validateActiveFileNames(activeFiles) {
  assert(activeFiles.length > 0, 'Active migration chain is empty')
  for (const name of activeFiles) assert(/^\d{14}_[a-z0-9_]+\.sql$/.test(name), `Invalid active migration filename: ${name}`)
  const versions = activeFiles.map((name) => name.slice(0, 14))
  assert(new Set(versions).size === versions.length, 'Active migration versions are not unique')
  const legacyVersions = new Set([...legacyHashes.keys()].map((name) => name.split('_')[0]))
  for (const version of versions) assert(!legacyVersions.has(version), `Legacy migration version returned to active chain: ${version}`)
  const ordered = [...versions].sort()
  assert(JSON.stringify(versions) === JSON.stringify(ordered), 'Active migration files are not ordered by version')
  for (let index = 1; index < ordered.length; index += 1) assert(ordered[index] > ordered[index - 1], 'Active migration versions are not strictly ordered')
}

export function validateRegister(fingerprint, { currentTarget = false, includesM3 = false, includesM4 = false, includesM5 = false, includesM6 = false, includesM7 = false } = {}) {
  equalList(fingerprint.extensions.map((item) => `${item.schema}.${item.name}`), expected.extensions, 'Extension')
  equalList(fingerprint.enums.map((item) => item.name), expected.enums, 'Enum')
  const expectedTables = {
    ...(includesM3 ? { admin_users: expectedM3.table } : {}),
    ...expected.tables,
    ...(includesM4 ? { reviews: expectedM4.table } : {}),
    ...(includesM5 ? { company_profiles: expectedM5.table } : {}),
    ...(includesM6 ? expectedM6.tables : {}),
    ...(includesM7 ? { advisor_interest_submissions: expectedM7.table } : {}),
  }
  equalList(fingerprint.tables.map((item) => item.name), Object.keys(expectedTables), 'Table')
  for (const table of fingerprint.tables) {
    assert(JSON.stringify(table.columns.map((column) => column.name)) === JSON.stringify(expectedTables[table.name]), `Column register differs for ${table.name}`)
    assert(table.owner === 'postgres', `Table owner differs for ${table.name}`)
  }
  assert(fingerprint.enums.every((item) => item.owner === 'postgres'), 'Enum ownership differs from production')
  const expectedConstraints = [...expected.constraints, ...(includesM3 ? expectedM3.constraints : []), ...(includesM4 ? expectedM4.constraints : []), ...(includesM5 ? expectedM5.constraints : []), ...(includesM6 ? expectedM6.constraints : []), ...(includesM7 ? expectedM7.constraints : [])]
  const expectedIndexes = [...expected.indexes, ...(includesM3 ? expectedM3.indexes : []), ...(includesM4 ? expectedM4.indexes : []), ...(includesM5 ? expectedM5.indexes : []), ...(includesM6 ? expectedM6.indexes : []), ...(includesM7 ? expectedM7.indexes : [])]
  const expectedPolicies = [...expected.policies, ...(includesM3 ? expectedM3.policies : []), ...(includesM4 ? expectedM4.policies : []), ...(includesM5 ? expectedM5.policies : []), ...(includesM6 ? expectedM6.policies : [])]
  equalList(fingerprint.constraints.map((item) => `${item.table}.${item.name}`), expectedConstraints, 'Constraint')
  equalList(fingerprint.indexes.map((item) => `${item.table}.${item.name}`), expectedIndexes, 'Index')
  equalList(fingerprint.policies.map((item) => `${item.table}.${item.name}`), expectedPolicies, 'Policy')
  const expectedTriggers = currentTarget
    ? [...expected.triggers, 'companies.update_companies_updated_at']
    : expected.triggers
  if (includesM3) expectedTriggers.push(expectedM3.trigger)
  if (includesM4) expectedTriggers.push(expectedM4.trigger)
  if (includesM5) expectedTriggers.push(expectedM5.trigger)
  if (includesM6) expectedTriggers.push(expectedM6.trigger)
  equalList(fingerprint.triggers.map((item) => `${item.table}.${item.name}`), expectedTriggers, 'Trigger')
  assert(fingerprint.rowLevelSecurity.length === 5 + (includesM3 ? 1 : 0) + (includesM4 ? 1 : 0) + (includesM5 ? 1 : 0) + (includesM6 ? 2 : 0) + (includesM7 ? 1 : 0) && fingerprint.rowLevelSecurity.every((item) => item.enabled && !item.forced), 'RLS enabled/forced state differs from production')
  const timestampFunction = fingerprint.functions.find((item) => item.name === 'update_updated_at_column')
  assert(timestampFunction?.owner === 'postgres' && !timestampFunction.securityDefiner && timestampFunction.volatility === 'volatile', 'Timestamp function register differs from production')
  if (includesM3) {
    const adminFunction = fingerprint.functions.find((item) => item.name === 'is_admin')
    assert(fingerprint.functions.length === 2, 'M3 function register differs from the reviewed target')
    assert(
      adminFunction?.owner === 'postgres'
      && adminFunction.identityArguments === ''
      && adminFunction.resultType === 'boolean'
      && adminFunction.language === 'sql'
      && adminFunction.securityDefiner
      && adminFunction.volatility === 'stable'
      && adminFunction.parallel === 'safe'
      && adminFunction.searchPath === '',
      'M3 is_admin() attributes differ from the reviewed target',
    )
  } else assert(fingerprint.functions.length === 1, 'Function register differs from production')
  const expectedGrants = [
    'function.update_updated_at_column.anon.ALL',
    'function.update_updated_at_column.authenticated.ALL',
    'function.update_updated_at_column.service_role.ALL',
    ...Object.keys(expected.tables).flatMap((table) => ['anon', 'authenticated', 'service_role'].map((grantee) => `table.${table}.${grantee}.ALL`)),
  ]
  if (includesM3) expectedGrants.push(
    'function.is_admin.authenticated.ALL',
    'function.is_admin.service_role.ALL',
    'table.admin_users.authenticated.SELECT',
    'table.admin_users.service_role.ALL',
  )
  if (includesM4) expectedGrants.push(
    'table.reviews.anon.SELECT(company_id), SELECT(created_at), SELECT(experience_confirmed_at), SELECT(id), SELECT(rating), SELECT(review_text), SELECT(title), SELECT(updated_at)',
    'table.reviews.authenticated.DELETE, INSERT(company_id), INSERT(experience_confirmed_at), INSERT(rating), INSERT(review_text), INSERT(reviewer_user_id), INSERT(title), SELECT(company_id), SELECT(created_at), SELECT(experience_confirmed_at), SELECT(id), SELECT(rating), SELECT(review_text), SELECT(title), SELECT(updated_at), UPDATE(experience_confirmed_at), UPDATE(rating), UPDATE(review_text), UPDATE(title)',
    'table.reviews.service_role.ALL',
  )
  if (includesM5) expectedGrants.push(
    'table.company_profiles.anon.SELECT',
    'table.company_profiles.authenticated.DELETE, INSERT, SELECT, UPDATE',
    'table.company_profiles.service_role.ALL',
  )
  if (includesM6) expectedGrants.push(
    'table.company_leads.authenticated.SELECT, UPDATE(owner_notes), UPDATE(status)',
    'table.company_leads.service_role.ALL',
    'table.directory_events.authenticated.SELECT',
    'table.directory_events.service_role.ALL',
  )
  if (includesM7) expectedGrants.push('table.advisor_interest_submissions.service_role.ALL')
  equalList(fingerprint.grants.map((item) => `${item.kind}.${item.name}.${item.grantee}.${item.privileges}`), expectedGrants, 'Grant')
  assert(fingerprint.source.containsData === false, 'Fingerprint must be definitions-only')
}

export function validateM2SqlSafety(sql) {
  const statements = splitStatements(sql)
  assert(statements.length === 6, 'M2 must contain exactly two timeout settings, one guard, one trigger creation, and two timeout resets')
  assert(normalizeSql(statements[0]) === "SET lock_timeout = '5s'", 'M2 lock timeout differs from the reviewed value')
  assert(normalizeSql(statements[1]) === "SET statement_timeout = '30s'", 'M2 statement timeout differs from the reviewed value')
  assert(/^DO \$guard\$/i.test(normalizeSql(statements[2])), 'M2 prerequisite guard is missing or misplaced')
  assert(
    normalizeSql(statements[3]) === 'CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
    'M2 trigger definition differs from the sole intended schema change',
  )
  assert(normalizeSql(statements[4]) === 'RESET statement_timeout', 'M2 must reset statement_timeout')
  assert(normalizeSql(statements[5]) === 'RESET lock_timeout', 'M2 must reset lock_timeout')

  const guard = statements[2]
  const requiredGuardEvidence = [
    "to_regclass('public.companies')",
    "to_regprocedure('public.update_updated_at_column()')",
    "column_attribute.attname = 'updated_at'",
    "'pg_catalog.timestamptz'::pg_catalog.regtype",
    "function_language.lanname = 'plpgsql'",
    "function_proc.provolatile = 'v'",
    "function_proc.proparallel = 'u'",
    'NOT function_proc.prosecdef',
    "pg_catalog.pg_get_userbyid(function_proc.proowner) = 'postgres'",
    "pg_catalog.replace(\n             pg_catalog.btrim(function_proc.prosrc, E' \\t\\r\\n'),\n             E'\\r\\n',\n             E'\\n'\n           )",
    "intended_trigger.tgname = 'update_companies_updated_at'",
    'equivalent_trigger.tgfoid = timestamp_function_oid',
    "equivalent_trigger.tgname <> 'update_companies_updated_at'",
    '(equivalent_trigger.tgtype & 16) = 16',
  ]
  for (const evidence of requiredGuardEvidence) assert(guard.includes(evidence), `M2 guard omits required check: ${evidence}`)

  const prohibited = [
    /^\s*(?:INSERT\s+INTO|UPDATE\s+[a-z".]|DELETE\s+FROM|COPY\s+)/im,
    /\b(?:DROP|ALTER|TRUNCATE|GRANT|REVOKE)\b/i,
    /\bCREATE\s+(?:SCHEMA|EXTENSION|TYPE|TABLE|FUNCTION|INDEX|POLICY|VIEW|MATERIALIZED)\b/i,
    /\b(?:ENABLE|DISABLE|FORCE)\s+ROW\s+LEVEL\s+SECURITY\b/i,
    /\bsupabase_migrations\b/i,
  ]
  for (const pattern of prohibited) assert(!pattern.test(sql), `M2 contains prohibited scope: ${pattern}`)
  assert((sql.match(/\bCREATE\s+TRIGGER\b/gi) ?? []).length === 1, 'M2 must create exactly one trigger')
}

export function validateM3SqlSafety(sql) {
  const statements = splitStatements(sql)
  assert(statements.length === 25, 'M3 statement register differs from the reviewed authorization-only scope')
  assert(normalizeSql(statements[0]) === "SET lock_timeout = '5s'", 'M3 lock timeout differs from the reviewed value')
  assert(normalizeSql(statements[1]) === "SET statement_timeout = '30s'", 'M3 statement timeout differs from the reviewed value')
  assert(/^DO \$guard\$/i.test(normalizeSql(statements[2])), 'M3 prerequisite guard is missing or misplaced')
  assert(/^CREATE TABLE public\.admin_users\b/i.test(normalizeSql(statements[3])), 'M3 must create only public.admin_users as its table')
  assert(/^CREATE FUNCTION public\.is_admin\(\) RETURNS boolean\b/i.test(normalizeSql(statements[6])), 'M3 must create the zero-argument boolean is_admin() predicate')
  assert(normalizeSql(statements[7]) === 'ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY', 'M3 must enable RLS immediately on admin_users')
  assert(
    normalizeSql(statements[8]) === 'CREATE POLICY "Users can inspect own administrator status" ON public.admin_users FOR SELECT TO authenticated USING ((user_id = auth.uid()))',
    'M3 RLS policy differs from the reviewed own-row read-only contract',
  )
  assert(
    normalizeSql(statements[9]) === 'CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
    'M3 timestamp trigger differs from the reviewed shared-trigger contract',
  )
  assert(normalizeSql(statements[23]) === 'RESET statement_timeout', 'M3 must reset statement_timeout')
  assert(normalizeSql(statements[24]) === 'RESET lock_timeout', 'M3 must reset lock_timeout')

  const guard = statements[2]
  const requiredGuardEvidence = [
    "current_user <> 'postgres'",
    "role.rolname IN ('anon', 'authenticated')",
    "role.rolname = 'service_role'",
    "has_schema_privilege('authenticated', 'public', 'CREATE')",
    "to_regclass('auth.users')",
    "column_attribute.atttypid = 'pg_catalog.uuid'::pg_catalog.regtype",
    'identity_index.indisunique',
    "to_regprocedure('auth.uid()')",
    "function_proc.provolatile = 's'",
    "has_function_privilege('authenticated', auth_uid_oid, 'EXECUTE')",
    "to_regclass('public.companies')",
    "companies_trigger.tgname = 'update_companies_updated_at'",
    'companies_trigger.tgtype = 19',
    "companies_trigger.tgenabled = 'O'",
    "to_regprocedure('public.update_updated_at_column()')",
    "pg_catalog.pg_get_userbyid(function_proc.proowner) = 'postgres'",
    "to_regclass('public.admin_users')",
    "to_regprocedure('public.is_admin()')",
    "row_policy.polname = 'Users can inspect own administrator status'",
    "table_trigger.tgname = 'update_admin_users_updated_at'",
  ]
  for (const evidence of requiredGuardEvidence) assert(guard.includes(evidence), `M3 guard omits required check: ${evidence}`)

  const table = statements[3]
  for (const evidence of [
    'REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT',
    'CONSTRAINT admin_users_lifecycle_check CHECK',
    'CONSTRAINT admin_users_no_self_grant_check CHECK',
    'CONSTRAINT admin_users_no_self_revoke_check CHECK',
  ]) assert(normalizeSql(table).includes(normalizeSql(evidence)), `M3 admin_users definition omits ${evidence}`)

  const adminFunction = normalizeSql(statements[6])
  for (const evidence of [
    'LANGUAGE sql',
    'STABLE',
    'PARALLEL SAFE',
    'SECURITY DEFINER',
    "SET search_path TO ''",
    'FROM public.admin_users AS administrator',
    'administrator.user_id = auth.uid()',
    'administrator.is_active',
  ]) assert(adminFunction.includes(evidence), `M3 is_admin() omits required security property: ${evidence}`)

  const normalizedStatements = statements.map(normalizeSql)
  const requiredPrivileges = [
    'REVOKE ALL ON TABLE public.admin_users FROM PUBLIC',
    'REVOKE ALL ON TABLE public.admin_users FROM anon',
    'REVOKE ALL ON TABLE public.admin_users FROM authenticated',
    'GRANT SELECT ON TABLE public.admin_users TO authenticated',
    'GRANT ALL ON TABLE public.admin_users TO service_role',
    'REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC',
    'REVOKE ALL ON FUNCTION public.is_admin() FROM anon',
    'REVOKE ALL ON FUNCTION public.is_admin() FROM authenticated',
    'REVOKE ALL ON FUNCTION public.is_admin() FROM service_role',
    'GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated',
    'GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role',
  ]
  for (const privilege of requiredPrivileges) assert(normalizedStatements.includes(privilege), `M3 privilege register omits: ${privilege}`)

  const prohibited = [
    /^\s*(?:INSERT\s+INTO|UPDATE\s+[a-z".]|DELETE\s+FROM|COPY\s+)/im,
    /\b(?:DROP|TRUNCATE)\b/i,
    /\bCREATE\s+(?:SCHEMA|EXTENSION|TYPE|VIEW|MATERIALIZED)\b/i,
    /\bCREATE\s+TABLE\s+(?!public\.admin_users\b)/i,
    /\bCREATE\s+FUNCTION\s+(?!public\.is_admin\(\))/i,
    /\b(?:email|password|token|secret)\b/i,
    /\bsupabase_migrations\b/i,
  ]
  for (const pattern of prohibited) assert(!pattern.test(sql), `M3 contains prohibited scope: ${pattern}`)
  assert((sql.match(/\bCREATE\s+TABLE\b/gi) ?? []).length === 1, 'M3 must create exactly one table')
  assert((sql.match(/\bCREATE\s+FUNCTION\b/gi) ?? []).length === 1, 'M3 must create exactly one function')
  assert((sql.match(/\bCREATE\s+POLICY\b/gi) ?? []).length === 1, 'M3 must create exactly one read-only policy')
  assert(!/\bFOR\s+(?:INSERT|UPDATE|DELETE|ALL)\b/i.test(statements[8]), 'M3 may not expose authenticated grant mutation through RLS')
}

export function validateM4SqlSafety(sql) {
  const statements = splitStatements(sql)
  assert(statements.length === 24, 'M4 statement register differs from the reviewed company-review scope')
  assert(normalizeSql(statements[0]) === "SET lock_timeout = '5s'", 'M4 lock timeout differs from the reviewed value')
  assert(normalizeSql(statements[1]) === "SET statement_timeout = '30s'", 'M4 statement timeout differs from the reviewed value')
  assert(/^DO \$guard\$/i.test(normalizeSql(statements[2])), 'M4 prerequisite guard is missing or misplaced')
  assert(/^CREATE TABLE public\.reviews\b/i.test(normalizeSql(statements[3])), 'M4 must create only public.reviews')
  assert(normalizeSql(statements[6]) === 'ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY', 'M4 must enable RLS immediately on reviews')
  assert(normalizeSql(statements[11]) === 'CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', 'M4 timestamp trigger differs from the reviewed contract')
  assert(normalizeSql(statements[22]) === 'RESET statement_timeout', 'M4 must reset statement_timeout')
  assert(normalizeSql(statements[23]) === 'RESET lock_timeout', 'M4 must reset lock_timeout')

  const guard = statements[2]
  for (const evidence of [
    "current_user <> 'postgres'",
    "role.rolname IN ('anon', 'authenticated')",
    "role.rolname = 'service_role'",
    "has_schema_privilege('authenticated', 'public', 'CREATE')",
    "to_regclass('auth.users')",
    "to_regprocedure('auth.uid()')",
    "to_regclass('public.companies')",
    "companies_trigger.tgname = 'update_companies_updated_at'",
      "to_regclass('public.admin_users')",
      "to_regprocedure('public.is_admin()')",
      'cardinality(admin_function.proconfig) = 1',
      'admin_function.proconfig[array_lower(admin_function.proconfig, 1)]',
      ") = 'search_path'",
      "pg_catalog.pg_get_functiondef(admin_function.oid) LIKE '%SET search_path TO ''''%'",
      "enum_type.typname = 'moderation_status'",
    "to_regclass('public.reviews')",
    "table_trigger.tgname = 'update_reviews_updated_at'",
  ]) assert(guard.includes(evidence), `M4 guard omits required check: ${evidence}`)

  const table = normalizeSql(statements[3])
  for (const evidence of [
    'company_id uuid NOT NULL',
    'reviewer_user_id uuid NOT NULL',
    'REFERENCES public.companies(id) ON UPDATE RESTRICT ON DELETE RESTRICT',
    'REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT',
    'CONSTRAINT reviews_company_reviewer_key UNIQUE (company_id, reviewer_user_id)',
    'CONSTRAINT reviews_rating_check CHECK',
    'CONSTRAINT reviews_text_length_check CHECK',
    "moderation_status public.moderation_status DEFAULT 'approved'::public.moderation_status NOT NULL",
  ]) assert(table.includes(normalizeSql(evidence)), `M4 reviews definition omits ${evidence}`)

  const policies = statements.slice(7, 11).map(normalizeSql)
  assert(policies[0] === 'CREATE POLICY "Published company reviews are public" ON public.reviews FOR SELECT TO anon, authenticated USING ((moderation_status = \'approved\'::public.moderation_status))', 'M4 public read policy differs')
  assert(policies[1].includes('FOR INSERT TO authenticated') && policies[1].includes('reviewer_user_id = auth.uid()'), 'M4 insert policy must bind reviewer identity')
  assert(policies[2].includes('FOR UPDATE TO authenticated') && policies[2].includes('reviewer_user_id = auth.uid()'), 'M4 update policy must remain self-scoped')
  assert(policies[3].includes('FOR DELETE TO authenticated') && policies[3].includes('reviewer_user_id = auth.uid()'), 'M4 delete policy must remain self-scoped')
  assert(policies.every((policy) => !/is_admin|service_role/i.test(policy)), 'M4 must not enable an administrator mutation policy')

  const normalizedStatements = statements.map(normalizeSql)
  for (const privilege of [
    'REVOKE ALL ON TABLE public.reviews FROM PUBLIC',
    'REVOKE ALL ON TABLE public.reviews FROM anon',
    'REVOKE ALL ON TABLE public.reviews FROM authenticated',
    'GRANT SELECT (id, company_id, rating, title, review_text, experience_confirmed_at, created_at, updated_at) ON TABLE public.reviews TO anon',
    'GRANT SELECT (id, company_id, rating, title, review_text, experience_confirmed_at, created_at, updated_at) ON TABLE public.reviews TO authenticated',
    'GRANT INSERT (company_id, reviewer_user_id, rating, title, review_text, experience_confirmed_at) ON TABLE public.reviews TO authenticated',
    'GRANT UPDATE (rating, title, review_text, experience_confirmed_at) ON TABLE public.reviews TO authenticated',
    'GRANT DELETE ON TABLE public.reviews TO authenticated',
    'GRANT ALL ON TABLE public.reviews TO service_role',
  ]) assert(normalizedStatements.includes(privilege), `M4 privilege register omits: ${privilege}`)

  const prohibited = [
    /^\s*(?:INSERT\s+INTO|UPDATE\s+[a-z".]|DELETE\s+FROM|COPY\s+)/im,
    /\b(?:DROP|TRUNCATE)\b/i,
    /\bCREATE\s+(?:SCHEMA|EXTENSION|TYPE|FUNCTION|VIEW|MATERIALIZED)\b/i,
    /\bCREATE\s+TABLE\s+(?!public\.reviews\b)/i,
    /\b(?:advisor_id|reviewer_id|users_public)\b/i,
    /\bsupabase_migrations\b/i,
  ]
  for (const pattern of prohibited) assert(!pattern.test(sql), `M4 contains prohibited scope: ${pattern}`)
  assert((sql.match(/\bCREATE\s+TABLE\b/gi) ?? []).length === 1, 'M4 must create exactly one table')
  assert((sql.match(/\bCREATE\s+POLICY\b/gi) ?? []).length === 4, 'M4 must create exactly four public/self-service policies')
  assert((sql.match(/\bCREATE\s+FUNCTION\b/gi) ?? []).length === 0, 'M4 must not add a privileged function')
}

export function validateM5SqlSafety(sql) {
  const statements = splitStatements(sql)
  assert(statements.length === 23, 'M5 statement register differs from the reviewed company-profile scope')
  assert(normalizeSql(statements[0]) === "SET lock_timeout = '5s'", 'M5 lock timeout differs from the reviewed value')
  assert(normalizeSql(statements[1]) === "SET statement_timeout = '30s'", 'M5 statement timeout differs from the reviewed value')
  assert(/^DO \$guard\$/i.test(normalizeSql(statements[2])), 'M5 prerequisite guard is missing or misplaced')
  assert(/^CREATE TABLE public\.company_profiles\b/i.test(normalizeSql(statements[3])), 'M5 must create only public.company_profiles')
  assert(normalizeSql(statements[8]) === 'ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY', 'M5 must enable RLS immediately on company_profiles')
  assert(normalizeSql(statements[13]) === 'CREATE TRIGGER update_company_profiles_updated_at BEFORE UPDATE ON public.company_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', 'M5 timestamp trigger differs from the reviewed contract')
  assert(normalizeSql(statements[21]) === 'RESET statement_timeout', 'M5 must reset statement_timeout')
  assert(normalizeSql(statements[22]) === 'RESET lock_timeout', 'M5 must reset lock_timeout')

  const guard = statements[2]
  for (const evidence of [
    "current_user <> 'postgres'",
    "to_regclass('public.companies')",
    "to_regclass('public.reviews')",
    "to_regprocedure('public.update_updated_at_column()')",
    "to_regprocedure('auth.uid()')",
    "column_attribute.attname = 'verified_owner_id'",
    "column_attribute.atttypid = 'pg_catalog.uuid'::pg_catalog.regtype",
    "function_language.lanname = 'plpgsql'",
    "function_proc.provolatile = 'v'",
    'NOT function_proc.prosecdef',
    "pg_catalog.pg_get_userbyid(function_proc.proowner) = 'postgres'",
    "rolname IN ('anon', 'authenticated')",
    "rolname = 'service_role'",
    "has_schema_privilege('authenticated', 'public', 'CREATE')",
    "to_regclass('public.company_profiles')",
    "'Company owners can update profiles'",
    "tgname = 'update_company_profiles_updated_at'",
  ]) assert(guard.includes(evidence), `M5 guard omits required check: ${evidence}`)

  const table = normalizeSql(statements[3])
  for (const evidence of [
    'company_id uuid NOT NULL',
    'REFERENCES public.companies(id) ON UPDATE RESTRICT ON DELETE CASCADE',
    'CONSTRAINT company_profiles_pkey PRIMARY KEY (company_id)',
    'CONSTRAINT company_profiles_tagline_check CHECK',
    'CONSTRAINT company_profiles_price_order_check CHECK',
    "CONSTRAINT company_profiles_business_hours_check CHECK ((jsonb_typeof(business_hours) = 'object'::text))",
    "CONSTRAINT company_profiles_faq_check CHECK ((jsonb_typeof(faq) = 'array'::text))",
  ]) assert(table.includes(normalizeSql(evidence)), `M5 company_profiles definition omits ${evidence}`)

  const policies = statements.slice(9, 13).map(normalizeSql)
  assert(policies[0] === 'CREATE POLICY "Company profiles are public" ON public.company_profiles FOR SELECT TO anon, authenticated USING (true)', 'M5 public read policy differs')
  assert(policies[1].includes('FOR INSERT TO authenticated') && policies[1].includes('companies.verified_owner_id = auth.uid()'), 'M5 insert policy must be verified-owner scoped')
  assert(policies[2].includes('FOR UPDATE TO authenticated') && policies[2].includes('companies.verified_owner_id = auth.uid()'), 'M5 update policy must be verified-owner scoped')
  assert(policies[3].includes('FOR DELETE TO authenticated') && policies[3].includes('companies.verified_owner_id = auth.uid()'), 'M5 delete policy must be verified-owner scoped')
  assert(policies.every((policy) => !/is_admin|service_role|email/i.test(policy)), 'M5 must not add an administrator or email-based mutation path')

  const normalizedStatements = statements.map(normalizeSql)
  for (const privilege of [
    'REVOKE ALL ON TABLE public.company_profiles FROM PUBLIC',
    'REVOKE ALL ON TABLE public.company_profiles FROM anon',
    'REVOKE ALL ON TABLE public.company_profiles FROM authenticated',
    'GRANT SELECT ON TABLE public.company_profiles TO anon',
    'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.company_profiles TO authenticated',
    'GRANT ALL ON TABLE public.company_profiles TO service_role',
  ]) assert(normalizedStatements.includes(privilege), `M5 privilege register omits: ${privilege}`)

  const prohibited = [
    /^\s*(?:INSERT\s+INTO|UPDATE\s+[a-z".]|DELETE\s+FROM|COPY\s+)/im,
    /\b(?:DROP|TRUNCATE)\b/i,
    /\bCREATE\s+(?:SCHEMA|EXTENSION|TYPE|FUNCTION|VIEW|MATERIALIZED)\b/i,
    /\bCREATE\s+TABLE\s+(?!public\.company_profiles\b)/i,
    /\b(?:advisor_id|is_admin|admin_users)\b/i,
    /\bsupabase_migrations\b/i,
  ]
  for (const pattern of prohibited) assert(!pattern.test(sql), `M5 contains prohibited scope: ${pattern}`)
  assert((sql.match(/\bCREATE\s+TABLE\b/gi) ?? []).length === 1, 'M5 must create exactly one table')
  assert((sql.match(/\bCREATE\s+POLICY\b/gi) ?? []).length === 4, 'M5 must create exactly four public/owner policies')
  assert((sql.match(/\bCREATE\s+FUNCTION\b/gi) ?? []).length === 0, 'M5 must not add a privileged function')
}

export function validateM6SqlSafety(sql) {
  const statements = splitStatements(sql)
  assert(statements.length === 32, 'M6 statement register differs from the reviewed lead/event scope')
  assert(normalizeSql(statements[0]) === "SET lock_timeout = '5s'", 'M6 lock timeout differs from the reviewed value')
  assert(normalizeSql(statements[1]) === "SET statement_timeout = '30s'", 'M6 statement timeout differs from the reviewed value')
  assert(/^DO \$guard\$/i.test(normalizeSql(statements[2])), 'M6 prerequisite guard is missing or misplaced')
  assert(/^CREATE TABLE public\.company_leads\b/i.test(normalizeSql(statements[3])), 'M6 must create public.company_leads first')
  assert(normalizeSql(statements[7]) === 'ALTER TABLE public.company_leads ENABLE ROW LEVEL SECURITY', 'M6 must enable RLS immediately on company_leads')
  assert(normalizeSql(statements[10]) === 'CREATE TRIGGER update_company_leads_updated_at BEFORE UPDATE ON public.company_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', 'M6 lead timestamp trigger differs')
  assert(/^CREATE TABLE public\.directory_events\b/i.test(normalizeSql(statements[11])), 'M6 must create public.directory_events second')
  assert(normalizeSql(statements[15]) === 'ALTER TABLE public.directory_events ENABLE ROW LEVEL SECURITY', 'M6 must enable RLS immediately on directory_events')
  assert(normalizeSql(statements[30]) === 'RESET statement_timeout' && normalizeSql(statements[31]) === 'RESET lock_timeout', 'M6 must reset both timeouts')

  const guard = statements[2]
  for (const evidence of [
    "current_user <> 'postgres'",
    "to_regclass('public.companies')",
    "to_regclass('public.company_profiles')",
    "to_regprocedure('public.update_updated_at_column()')",
    "to_regprocedure('auth.uid()')",
    "rolname = 'authenticated'",
    "rolname = 'service_role'",
    "has_schema_privilege('authenticated', 'public', 'CREATE')",
    "to_regclass('public.company_leads')",
    "to_regclass('public.directory_events')",
    "tgname = 'update_company_leads_updated_at'",
  ]) assert(guard.includes(evidence), `M6 guard omits required check: ${evidence}`)

  const leadsTable = normalizeSql(statements[3])
  for (const evidence of [
    'company_id uuid NOT NULL',
    'REFERENCES public.companies(id) ON UPDATE RESTRICT ON DELETE RESTRICT',
    'CONSTRAINT company_leads_consent_check CHECK (consent_confirmed)',
    'CONSTRAINT company_leads_message_check CHECK',
    'CONSTRAINT company_leads_ip_hash_check CHECK',
  ]) assert(leadsTable.includes(normalizeSql(evidence)), `M6 company_leads definition omits ${evidence}`)

  const eventsTable = normalizeSql(statements[11])
  for (const evidence of [
    'company_id uuid NOT NULL',
    'session_id uuid NOT NULL',
    'REFERENCES public.companies(id) ON UPDATE RESTRICT ON DELETE RESTRICT',
    'CONSTRAINT directory_events_type_check CHECK',
    "CONSTRAINT directory_events_metadata_check CHECK ((jsonb_typeof(metadata) = 'object'::text))",
  ]) assert(eventsTable.includes(normalizeSql(evidence)), `M6 directory_events definition omits ${evidence}`)

  const policies = [statements[8], statements[9], statements[16]].map(normalizeSql)
  assert(policies[0].includes('FOR SELECT TO authenticated') && policies[0].includes('companies.verified_owner_id = auth.uid()'), 'M6 lead read policy must be owner scoped')
  assert(policies[1].includes('FOR UPDATE TO authenticated') && policies[1].includes('companies.verified_owner_id = auth.uid()'), 'M6 lead update policy must be owner scoped')
  assert(policies[2].includes('FOR SELECT TO authenticated') && policies[2].includes('companies.verified_owner_id = auth.uid()'), 'M6 event read policy must be owner scoped')
  assert(policies.every((policy) => !/is_admin|email|service_role/i.test(policy)), 'M6 must not add an administrator, email, or service-role policy path')

  const normalizedStatements = statements.map(normalizeSql)
  for (const privilege of [
    'REVOKE ALL ON TABLE public.company_leads FROM PUBLIC',
    'REVOKE ALL ON TABLE public.company_leads FROM anon',
    'REVOKE ALL ON TABLE public.company_leads FROM authenticated',
    'GRANT SELECT ON TABLE public.company_leads TO authenticated',
    'GRANT UPDATE (status, owner_notes) ON TABLE public.company_leads TO authenticated',
    'GRANT ALL ON TABLE public.company_leads TO service_role',
    'REVOKE ALL ON TABLE public.directory_events FROM PUBLIC',
    'REVOKE ALL ON TABLE public.directory_events FROM anon',
    'REVOKE ALL ON TABLE public.directory_events FROM authenticated',
    'GRANT SELECT ON TABLE public.directory_events TO authenticated',
    'GRANT ALL ON TABLE public.directory_events TO service_role',
  ]) assert(normalizedStatements.includes(privilege), `M6 privilege register omits: ${privilege}`)

  const prohibited = [
    /^\s*(?:INSERT\s+INTO|UPDATE\s+[a-z".]|DELETE\s+FROM|COPY\s+)/im,
    /\b(?:DROP|TRUNCATE)\b/i,
    /\bCREATE\s+(?:SCHEMA|EXTENSION|TYPE|FUNCTION|VIEW|MATERIALIZED)\b/i,
    /\bCREATE\s+TABLE\s+(?!public\.(?:company_leads|directory_events)\b)/i,
    /\b(?:advisor_id|is_admin|admin_users)\b/i,
    /\bsupabase_migrations\b/i,
  ]
  for (const pattern of prohibited) assert(!pattern.test(sql), `M6 contains prohibited scope: ${pattern}`)
  assert((sql.match(/\bCREATE\s+TABLE\b/gi) ?? []).length === 2, 'M6 must create exactly two tables')
  assert((sql.match(/\bCREATE\s+POLICY\b/gi) ?? []).length === 3, 'M6 must create exactly three owner read/update policies')
  assert((sql.match(/\bCREATE\s+FUNCTION\b/gi) ?? []).length === 0, 'M6 must not add a privileged function')
}

export function validateM7SqlSafety(sql) {
  const statements = splitStatements(sql)
  assert(statements.length === 14, 'M7 statement register differs from the reviewed advisor-interest scope')
  assert(normalizeSql(statements[0]) === "SET lock_timeout = '5s'", 'M7 lock timeout differs from the reviewed value')
  assert(normalizeSql(statements[1]) === "SET statement_timeout = '30s'", 'M7 statement timeout differs from the reviewed value')
  assert(/^DO \$guard\$/i.test(normalizeSql(statements[2])), 'M7 prerequisite guard is missing or misplaced')
  assert(/^CREATE TABLE public\.advisor_interest_submissions\b/i.test(normalizeSql(statements[3])), 'M7 must create only the private advisor-interest table')
  assert(normalizeSql(statements[6]) === 'ALTER TABLE public.advisor_interest_submissions ENABLE ROW LEVEL SECURITY', 'M7 must enable RLS before privileges are assigned')
  assert(normalizeSql(statements[12]) === 'RESET statement_timeout' && normalizeSql(statements[13]) === 'RESET lock_timeout', 'M7 must reset both timeouts')

  const guard = statements[2]
  for (const evidence of [
    "current_user <> 'postgres'",
    "to_regclass('public.companies')",
    "to_regclass('public.company_leads')",
    "to_regclass('public.directory_events')",
    "rolname = 'authenticated'",
    "rolname = 'service_role'",
    "has_schema_privilege('authenticated', 'public', 'CREATE')",
    "to_regclass('public.advisor_interest_submissions')",
  ]) assert(guard.includes(evidence), `M7 guard omits required check: ${evidence}`)

  const table = normalizeSql(statements[3])
  for (const evidence of [
    'contact_name character varying(100) NOT NULL',
    'business_name character varying(150) NOT NULL',
    'interests text[] NOT NULL',
    'CONSTRAINT advisor_interest_submissions_interests_check CHECK',
    'CONSTRAINT advisor_interest_submissions_consent_check CHECK (consent_confirmed)',
    'CONSTRAINT advisor_interest_submissions_ip_hash_check CHECK',
  ]) assert(table.includes(normalizeSql(evidence)), `M7 advisor-interest definition omits ${evidence}`)

  const normalizedStatements = statements.map(normalizeSql)
  for (const privilege of [
    'REVOKE ALL ON TABLE public.advisor_interest_submissions FROM PUBLIC',
    'REVOKE ALL ON TABLE public.advisor_interest_submissions FROM anon',
    'REVOKE ALL ON TABLE public.advisor_interest_submissions FROM authenticated',
    'GRANT ALL ON TABLE public.advisor_interest_submissions TO service_role',
  ]) assert(normalizedStatements.includes(privilege), `M7 privilege register omits: ${privilege}`)

  const prohibited = [
    /^\s*(?:INSERT\s+INTO|UPDATE\s+[a-z".]|DELETE\s+FROM|COPY\s+)/im,
    /\b(?:DROP|TRUNCATE)\b/i,
    /\bCREATE\s+(?:SCHEMA|EXTENSION|TYPE|FUNCTION|VIEW|MATERIALIZED|POLICY)\b/i,
    /\bCREATE\s+TABLE\s+(?!public\.advisor_interest_submissions\b)/i,
    /\b(?:is_admin|admin_users|payment|subscription|entitlement)\b/i,
    /\bsupabase_migrations\b/i,
  ]
  for (const pattern of prohibited) assert(!pattern.test(sql), `M7 contains prohibited scope: ${pattern}`)
  assert((sql.match(/\bCREATE\s+TABLE\b/gi) ?? []).length === 1, 'M7 must create exactly one table')
  assert((sql.match(/\bCREATE\s+POLICY\b/gi) ?? []).length === 0, 'M7 must not expose advisor-interest rows through an RLS policy')
}

export function validateProductionApplyScript(script) {
  const required = [
    "[ValidateSet('APPROVE M2 PRODUCTION MIGRATION')]",
    '[switch]$ResumePostVerification',
    "Read-Host 'Enter the PRODUCTION Supabase database password for the APPROVED M2 migration' -AsSecureString",
    "'95fb374bb07c5a4941b3dd78e6a6db9bf5b4b456c15670fb3ac9805e3a81b547'",
    "Get-ChildItem -LiteralPath $BackupRoot -Directory | Sort-Object CreationTime -Descending",
    "$CandidateSummary.production_changes_made -eq $false",
    "$CandidateSummary.dry_run_migrations[0] -eq $M2Filename",
    "if (-not $HistoryIsM1M2) { throw 'Verification-resume mode requires exact already-applied M1+M2 history.' }",
    'apply_reinvoked = $false',
    'validate-production-evidence.mjs $ApprovedPreflightDirectory --target baseline',
    "'db', 'push', '--dry-run', '--db-url', $PasswordlessDbUrl",
    "'db', 'push', '--db-url', $PasswordlessDbUrl",
    '$ApplySucceeded = $true',
    '$ArchiveEntries -ne 1322',
    'validate-production-evidence.mjs $PostDirectory --target current',
    'Remove-Item Env:PGPASSWORD',
    'ZeroFreeBSTR',
  ]
  for (const evidence of required) assert(script.includes(evidence), `M2 production apply wrapper omits required safeguard: ${evidence}`)
  const prohibited = ['--include-all', '--include-seed', '--include-roles', 'migration repair', 'DROP TRIGGER', 'DROP TABLE', 'TRUNCATE TABLE']
  for (const token of prohibited) assert(!script.includes(token), `M2 production apply wrapper contains prohibited scope: ${token}`)
  assert((script.match(/'db', 'push',/g) ?? []).length === 2, 'M2 production apply wrapper must contain exactly one dry-run and one apply invocation')
}

export function validateM3PreflightScript(script) {
  const required = [
    "Read-Host 'Enter the PRODUCTION Supabase database password for the READ-ONLY M3 preflight' -AsSecureString",
    "'4b65fa234b56534985f249cc8061efd98b05ba927c5de130839b8fd35c1d1db8'",
    "'95fb374bb07c5a4941b3dd78e6a6db9bf5b4b456c15670fb3ac9805e3a81b547'",
    "'a968f41fb10e6ecbe1ff8363abe0322031defd6aa361ce3c98498603ade55f6d'",
    "throw 'Production migration history differs from exact M1+M2 state.'",
    "'m3_objects_absent'",
    "$ArchiveEntries -ne 1322",
    "'db', 'push', '--dry-run', '--db-url', $PasswordlessDbUrl",
    '$DryRunMigrations[0] -ne $M3Filename',
    'validate-production-evidence.mjs $BackupDirectory --target m2',
    'production_changes_made=$false',
    'Remove-Item Env:PGPASSWORD',
    'ZeroFreeBSTR',
  ]
  for (const evidence of required) assert(script.includes(evidence), `M3 production preflight omits required safeguard: ${evidence}`)
  const prohibited = [
    "'db', 'push', '--db-url'",
    '--include-all', '--include-seed', '--include-roles',
    'migration repair', 'DROP TABLE', 'DROP FUNCTION', 'TRUNCATE TABLE',
  ]
  for (const token of prohibited) assert(!script.includes(token), `M3 production preflight contains prohibited scope: ${token}`)
  assert((script.match(/'db', 'push',/g) ?? []).length === 1, 'M3 production preflight must invoke only one dry-run push')
}

export function validateM4PreflightScript(script) {
  const required = [
    "[ValidateSet('M3', 'M4')]",
    "Read-Host 'Enter the PRODUCTION Supabase database password for the READ-ONLY M4 preflight' -AsSecureString",
    "'05bbef023d1b74e5707d801554e2839248d9a976f71fea41155167b69f8f69f7'",
    "throw 'Production migration history differs from exact M1+M2+M3 state.'",
    "@('m3_table_exact','m3_function_exact','m3_policy_exact','m3_trigger_exact','m4_objects_absent')",
    'cardinality(p.proconfig) = 1',
    "split_part(p.proconfig[array_lower(p.proconfig, 1)], '=', 1) = 'search_path'",
    "pg_catalog.pg_get_functiondef(p.oid) LIKE '%SET search_path TO ''''%'",
    '$ArchiveEntries -ne 1337',
    '$DryRunMigrations[0] -ne $M4Filename',
    'validate-production-evidence.mjs $BackupDirectory --target m3',
    'production_changes_made=$false',
    'Remove-Item Env:PGPASSWORD',
    'ZeroFreeBSTR',
  ]
  for (const evidence of required) assert(script.includes(evidence), `M4 production preflight omits required safeguard: ${evidence}`)
  const prohibited = [
    "'db', 'push', '--db-url'",
    '--include-all', '--include-seed', '--include-roles',
    'migration repair', 'DROP TABLE', 'DROP FUNCTION', 'TRUNCATE TABLE',
  ]
  for (const token of prohibited) assert(!script.includes(token), `M4 production preflight contains prohibited scope: ${token}`)
  assert((script.match(/'db', 'push',/g) ?? []).length === 1, 'M4 production preflight must invoke only one dry-run push')
}

export function validateM3ApplyScript(script) {
  const required = [
    "[ValidateSet('APPROVE M3 PRODUCTION MIGRATION')]",
    "run-m3-production-preflight.ps1",
    'validate-production-evidence.mjs $ApprovedPreflightDirectory.FullName --target m2',
    "Read-Host 'Enter the PRODUCTION Supabase database password for the APPROVED M3 migration' -AsSecureString",
    "'a968f41fb10e6ecbe1ff8363abe0322031defd6aa361ce3c98498603ade55f6d'",
    "$DryRunMigrations[0] -ne $M3Filename",
    "'db','push','--dry-run','--db-url',$PasswordlessDbUrl",
    "'db','push','--yes','--db-url',$PasswordlessDbUrl",
    '$ApplySucceeded = $true',
    '$ArchiveEntries -ne 1337',
    'validate-production-evidence.mjs $PostDirectory --target current',
    'first_admin_created=$false',
    'Remove-Item Env:PGPASSWORD',
    'ZeroFreeBSTR',
  ]
  for (const evidence of required) assert(script.includes(evidence), `M3 production apply wrapper omits required safeguard: ${evidence}`)
  const prohibited = [
    '--include-all', '--include-seed', '--include-roles', 'migration repair',
    'DROP TABLE', 'DROP FUNCTION', 'TRUNCATE TABLE',
    'INSERT INTO public.admin_users', 'UPDATE public.admin_users', 'DELETE FROM public.admin_users',
  ]
  for (const token of prohibited) assert(!script.includes(token), `M3 production apply wrapper contains prohibited scope: ${token}`)
  assert((script.match(/'db','push',/g) ?? []).length === 2, 'M3 production apply wrapper must contain exactly one dry-run and one apply invocation')
}

export function validateM3PostVerificationScript(script) {
  const required = [
    '[string]$ApplyEvidenceDirectory',
    "Read-Host 'Enter the PRODUCTION Supabase database password for READ-ONLY M3 post-verification' -AsSecureString",
    "'a968f41fb10e6ecbe1ff8363abe0322031defd6aa361ce3c98498603ade55f6d'",
    '$PostState.history_signature -ne $ExpectedHistorySignature',
    "$AuthenticatedBehavior -ne 'false|0'",
    "$ServiceBehavior -ne 'false|0'",
    '$ArchiveEntries -ne 1337',
    'validate-production-evidence.mjs $PostDirectory --target current',
    'apply_reinvoked=$false',
    'first_admin_created=$false',
    'Remove-Item Env:PGPASSWORD',
    'ZeroFreeBSTR',
  ]
  for (const evidence of required) assert(script.includes(evidence), `M3 post-verification wrapper omits required safeguard: ${evidence}`)
  const prohibited = [
    'Invoke-SupabaseCli', "'db','push'", "'db', 'push'", 'migration repair',
    'DROP TABLE', 'DROP FUNCTION', 'TRUNCATE TABLE',
    'INSERT INTO public.admin_users', 'UPDATE public.admin_users', 'DELETE FROM public.admin_users',
  ]
  for (const token of prohibited) assert(!script.includes(token), `M3 post-verification wrapper contains prohibited scope: ${token}`)
}

export function validateM4ApplyScript(script) {
  const required = [
    "[ValidateSet('APPROVE M4 PRODUCTION MIGRATION')]",
    "run-m3-production-preflight.ps1') -Target M4",
    'Where-Object { $_.CreationTimeUtc -ge $PreflightStartedAtUtc }',
    'validate-production-evidence.mjs $ApprovedPreflightDirectory.FullName --target m3',
    "Read-Host 'Enter the PRODUCTION Supabase database password for the APPROVED M4 migration' -AsSecureString",
    "'05bbef023d1b74e5707d801554e2839248d9a976f71fea41155167b69f8f69f7'",
    '$DryRunMigrations[0] -ne $M4Filename',
    "'db','push','--dry-run','--db-url',$PasswordlessDbUrl",
    "'db','push','--yes','--db-url',$PasswordlessDbUrl",
    '$ApplySucceeded = $true',
    "$PostState.counts_signature -ne '202,177,0,0,0,0,0'",
    "Export-ReadOnlyCsv 'column-privileges.csv'",
    '$ArchiveEntries -ne 1361',
    'validate-production-evidence.mjs $PostDirectory --target m4',
    'first_admin_created=$false;review_rows_created=0',
    'Remove-Item Env:PGPASSWORD',
    'ZeroFreeBSTR',
  ]
  for (const evidence of required) assert(script.includes(evidence), `M4 production apply wrapper omits required safeguard: ${evidence}`)
  const prohibited = [
    '--include-all', '--include-seed', '--include-roles', 'migration repair',
    'DROP TABLE', 'DROP FUNCTION', 'TRUNCATE TABLE',
    'INSERT INTO public.admin_users', 'UPDATE public.admin_users', 'DELETE FROM public.admin_users',
    'INSERT INTO public.reviews', 'UPDATE public.reviews', 'DELETE FROM public.reviews',
  ]
  for (const token of prohibited) assert(!script.includes(token), `M4 production apply wrapper contains prohibited scope: ${token}`)
  assert((script.match(/'db','push',/g) ?? []).length === 2, 'M4 production apply wrapper must contain exactly one dry-run and one apply invocation')
}

export function validateM4PostVerificationScript(script) {
  const required = [
    '[string]$ApplyEvidenceDirectory',
    'validate-production-evidence.mjs\') $ApplyEvidenceDirectory --target m4',
    "Read-Host 'Enter the PRODUCTION Supabase database password for READ-ONLY M4 post-verification' -AsSecureString",
    "'05bbef023d1b74e5707d801554e2839248d9a976f71fea41155167b69f8f69f7'",
    '$PostState.history_signature -ne $ExpectedHistorySignature',
    "$PostState.counts_signature -ne '202,177,0,0,0,0,0'",
    'Assert-ReadOnlyQueryFails "SET LOCAL ROLE anon; SELECT reviewer_user_id',
    'Assert-ReadOnlyQueryFails "SET LOCAL ROLE authenticated; SELECT moderation_status',
    "Export-ReadOnlyCsv 'column-privileges.csv'",
    '$ArchiveEntries -ne 1361',
    'validate-production-evidence.mjs $PostDirectory --target m4',
    'apply_reinvoked=$false',
    'first_admin_created=$false;review_rows_created=0',
    'Remove-Item Env:PGPASSWORD',
    'ZeroFreeBSTR',
  ]
  for (const evidence of required) assert(script.includes(evidence), `M4 post-verification wrapper omits required safeguard: ${evidence}`)
  const prohibited = [
    'Invoke-SupabaseCli', "'db','push'", "'db', 'push'", 'migration repair',
    'DROP TABLE', 'DROP FUNCTION', 'TRUNCATE TABLE',
    'INSERT INTO public.admin_users', 'UPDATE public.admin_users', 'DELETE FROM public.admin_users',
    'INSERT INTO public.reviews', 'UPDATE public.reviews', 'DELETE FROM public.reviews',
  ]
  for (const token of prohibited) assert(!script.includes(token), `M4 post-verification wrapper contains prohibited scope: ${token}`)
}

export function validateSqlSafety(sql, fingerprint) {
  const guardStart = sql.indexOf('DO $guard$')
  const firstChange = Math.min(...['CREATE SCHEMA', 'CREATE EXTENSION', 'CREATE TYPE', 'CREATE TABLE', 'CREATE FUNCTION'].map((token) => sql.indexOf(token)).filter((index) => index >= 0))
  const guardEnd = sql.indexOf('$guard$;', guardStart + 1)
  assert(guardStart >= 0 && guardEnd > guardStart && guardEnd < firstChange, 'Baseline fresh-environment guard must precede every schema change')
  const guard = sql.slice(guardStart, guardEnd)
  const guardedObjects = [
    ...fingerprint.tables.map((item) => item.name),
    ...fingerprint.enums.map((item) => item.name),
    ...fingerprint.constraints.map((item) => item.name),
    ...fingerprint.indexes.filter((item) => !item.constraintBacked).map((item) => item.name),
    ...fingerprint.policies.map((item) => item.name),
    ...fingerprint.triggers.map((item) => item.name),
    ...fingerprint.functions.map((item) => item.name),
  ]
  for (const objectName of guardedObjects) assert(guard.includes(objectName), `Fresh-environment guard omits ${objectName}`)

  const prohibited = [
    /\bDROP\s+SCHEMA\b/i,
    /\bDROP\s+TABLE\b/i,
    /\bTRUNCATE\s+(?:TABLE\s+)?public\./i,
    /\bALTER\s+TABLE\b[\s\S]*?\bDROP\s+(?:COLUMN|CONSTRAINT)\b/i,
    /\bsupabase\s+db\s+(?:push|reset)\b/i,
    /\bpg_restore\b/i,
    /\bsupabase\s+migration\s+repair\b/i,
    /\b(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+supabase_migrations\b/i,
  ]
  for (const pattern of prohibited) assert(!pattern.test(sql), `Baseline contains prohibited command pattern: ${pattern}`)
  assert(!/^\s*(?:INSERT\s+INTO|UPDATE\s+[a-z".]|DELETE\s+FROM|COPY\s+)/im.test(sql), 'Baseline contains a row-bearing DML statement')
  assert(!/\badvisor_id\b/i.test(sql), 'Active baseline contains ambiguous advisor_id')
}

export function validateSensitiveText(contents, label) {
  const patterns = [
    /postgres(?:ql)?:\/\//i,
    /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
    /[A-Za-z]:\\Users\\/i,
    /HockeyAdvisorDirectory-Backups/i,
    /advisor-directory-production-\d{8}T\d{6}Z/i,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  ]
  for (const pattern of patterns) assert(!pattern.test(contents), `Sensitive or protected value pattern found in ${label}`)
}

async function validateSensitiveContent(files) {
  for (const file of files) validateSensitiveText(await readFile(file, 'utf8'), path.relative(repositoryRoot, file))
}

async function main() {
  const activeFiles = (await readdir(activeDirectory)).filter((name) => name.endsWith('.sql')).sort()
  validateActiveFileNames(activeFiles)
  equalList(activeFiles, [baselineFilename, m2Filename, m3Filename, m4Filename, m5Filename, m6Filename, m7Filename], 'Active migration file')
  await validateLegacy(activeFiles)

  const baselineBytes = await readFile(baselinePath)
  assert(createHash('sha256').update(baselineBytes).digest('hex') === adoptedBaselineSha256, 'Adopted M1 baseline bytes changed')
  const baselineSql = baselineBytes.toString('utf8')
  const m2Bytes = await readFile(m2Path)
  assert(createHash('sha256').update(m2Bytes).digest('hex') === reviewedM2Sha256, 'Reviewed M2 migration bytes changed')
  const m2Sql = m2Bytes.toString('utf8')
  const m3Bytes = await readFile(m3Path)
  assert(createHash('sha256').update(m3Bytes).digest('hex') === reviewedM3Sha256, 'Reviewed M3 migration bytes changed')
  const m3Sql = m3Bytes.toString('utf8')
  const m4Bytes = await readFile(m4Path)
  assert(createHash('sha256').update(m4Bytes).digest('hex') === reviewedM4Sha256, 'Reviewed M4 migration bytes changed')
  const m4Sql = m4Bytes.toString('utf8')
  const m5Bytes = await readFile(m5Path)
  assert(createHash('sha256').update(m5Bytes).digest('hex') === reviewedM5Sha256, 'Reviewed M5 migration bytes changed')
  const m5Sql = m5Bytes.toString('utf8')
  const m6Bytes = await readFile(m6Path)
  assert(createHash('sha256').update(m6Bytes).digest('hex') === reviewedM6Sha256, 'Reviewed M6 migration bytes changed')
  const m6Sql = m6Bytes.toString('utf8')
  const m7Bytes = await readFile(m7Path)
  assert(createHash('sha256').update(m7Bytes).digest('hex') === reviewedM7Sha256, 'Reviewed M7 migration bytes changed')
  const m7Sql = m7Bytes.toString('utf8')
  const productionApplyScriptPath = path.join(repositoryRoot, 'scripts', 'database', 'run-m2-production-apply.ps1')
  const productionApplyScript = await readFile(productionApplyScriptPath, 'utf8')
  const m3PreflightScriptPath = path.join(repositoryRoot, 'scripts', 'database', 'run-m3-production-preflight.ps1')
  const m3PreflightScript = await readFile(m3PreflightScriptPath, 'utf8')
  const m3ApplyScriptPath = path.join(repositoryRoot, 'scripts', 'database', 'run-m3-production-apply.ps1')
  const m3ApplyScript = await readFile(m3ApplyScriptPath, 'utf8')
  const m3PostVerificationScriptPath = path.join(repositoryRoot, 'scripts', 'database', 'run-m3-production-post-verification.ps1')
  const m3PostVerificationScript = await readFile(m3PostVerificationScriptPath, 'utf8')
  const m4ApplyScriptPath = path.join(repositoryRoot, 'scripts', 'database', 'run-m4-production-apply.ps1')
  const m4ApplyScript = await readFile(m4ApplyScriptPath, 'utf8')
  const m4PostVerificationScriptPath = path.join(repositoryRoot, 'scripts', 'database', 'run-m4-production-post-verification.ps1')
  const m4PostVerificationScript = await readFile(m4PostVerificationScriptPath, 'utf8')
  const baselineFingerprint = buildFingerprint(baselineSql)
  const m2Fingerprint = buildFingerprint(`${baselineSql}\n${m2Sql}`, {
    kind: 'deterministic-m2-target',
    baseMigration: `supabase/migrations/${baselineFilename}`,
    forwardMigrations: [`supabase/migrations/${m2Filename}`],
    containsData: false,
  })
  const m3Fingerprint = buildFingerprint(`${baselineSql}\n${m2Sql}\n${m3Sql}`, {
    kind: 'deterministic-m3-target',
    baseMigration: `supabase/migrations/${baselineFilename}`,
    forwardMigrations: [`supabase/migrations/${m2Filename}`, `supabase/migrations/${m3Filename}`],
    containsData: false,
  })
  const m4Fingerprint = buildFingerprint(`${baselineSql}\n${m2Sql}\n${m3Sql}\n${m4Sql}`, {
    kind: 'deterministic-m4-target',
    baseMigration: `supabase/migrations/${baselineFilename}`,
    forwardMigrations: [`supabase/migrations/${m2Filename}`, `supabase/migrations/${m3Filename}`, `supabase/migrations/${m4Filename}`],
    containsData: false,
  })
  const m5Fingerprint = buildFingerprint(`${baselineSql}\n${m2Sql}\n${m3Sql}\n${m4Sql}\n${m5Sql}`, {
    kind: 'deterministic-m5-target',
    baseMigration: `supabase/migrations/${baselineFilename}`,
    forwardMigrations: [`supabase/migrations/${m2Filename}`, `supabase/migrations/${m3Filename}`, `supabase/migrations/${m4Filename}`, `supabase/migrations/${m5Filename}`],
    containsData: false,
  })
  const targetFingerprint = buildFingerprint(`${baselineSql}\n${m2Sql}\n${m3Sql}\n${m4Sql}\n${m5Sql}\n${m6Sql}\n${m7Sql}`, {
    kind: 'deterministic-current-target',
    baseMigration: `supabase/migrations/${baselineFilename}`,
    forwardMigrations: [`supabase/migrations/${m2Filename}`, `supabase/migrations/${m3Filename}`, `supabase/migrations/${m4Filename}`, `supabase/migrations/${m5Filename}`, `supabase/migrations/${m6Filename}`, `supabase/migrations/${m7Filename}`],
    containsData: false,
  })
  validateRegister(baselineFingerprint)
  validateRegister(m2Fingerprint, { currentTarget: true })
  validateRegister(m3Fingerprint, { currentTarget: true, includesM3: true })
  validateRegister(m4Fingerprint, { currentTarget: true, includesM3: true, includesM4: true })
  validateRegister(m5Fingerprint, { currentTarget: true, includesM3: true, includesM4: true, includesM5: true })
  validateRegister(targetFingerprint, { currentTarget: true, includesM3: true, includesM4: true, includesM5: true, includesM6: true, includesM7: true })
  validateSqlSafety(baselineSql, baselineFingerprint)
  validateM2SqlSafety(m2Sql)
  validateM3SqlSafety(m3Sql)
  validateM4SqlSafety(m4Sql)
  validateM5SqlSafety(m5Sql)
  validateM6SqlSafety(m6Sql)
  validateM7SqlSafety(m7Sql)
  validateProductionApplyScript(productionApplyScript)
  validateM3PreflightScript(m3PreflightScript)
  validateM4PreflightScript(m3PreflightScript)
  validateM3ApplyScript(m3ApplyScript)
  validateM3PostVerificationScript(m3PostVerificationScript)
  validateM4ApplyScript(m4ApplyScript)
  validateM4PostVerificationScript(m4PostVerificationScript)

  const generatedBaseline = await generatedBaselineFingerprintText()
  const checkedInBaseline = await readFile(baselineFingerprintPath, 'utf8')
  assert(generatedBaseline === checkedInBaseline, 'Immutable M1 fingerprint changed or is stale')
  const generatedOnce = await generatedTargetFingerprintText()
  const generatedTwice = await generatedTargetFingerprintText()
  const checkedInTarget = await readFile(targetFingerprintPath, 'utf8')
  assert(generatedOnce === generatedTwice && generatedOnce === checkedInTarget, 'Current-target fingerprint generation is nondeterministic or stale')
  const checkedInTypes = await readFile(typesPath, 'utf8')
  assert(generateTypes(baselineFingerprint) === generateTypes(m2Fingerprint), 'Trigger-only M2 unexpectedly changes derived row types')
  assert(checkedInTypes === generateTypes(targetFingerprint), 'Derived database types are stale')
  assert(
    checkedInTypes.includes('export type CompanyRow')
    && checkedInTypes.includes('export type AdvisorPersonRow')
    && checkedInTypes.includes('export type AdminUserRow')
    && checkedInTypes.includes('export type ReviewRow')
    && checkedInTypes.includes('export type CompanyProfileRow')
    && checkedInTypes.includes('export type CompanyLeadRow')
    && checkedInTypes.includes('export type DirectoryEventRow')
    && checkedInTypes.includes('export type AdvisorInterestSubmissionRow')
    && checkedInTypes.includes('is_admin:'),
    'Database types do not include the distinct company, advisor-person, authorization, review, profile, lead, event, and advisor-interest contracts',
  )

  const databaseFiles = [
    ...activeFiles.map((name) => path.join(activeDirectory, name)),
    baselineFingerprintPath,
    targetFingerprintPath,
    typesPath,
    path.join(legacyDirectory, 'README.md'),
    path.join(repositoryRoot, 'scripts', 'database', 'generate-schema-fingerprint.mjs'),
    path.join(repositoryRoot, 'scripts', 'database', 'generate-database-types.mjs'),
    path.join(repositoryRoot, 'scripts', 'database', 'run-local-bootstrap.ps1'),
    path.join(repositoryRoot, 'scripts', 'database', 'run-m2-production-preflight.ps1'),
    m3PreflightScriptPath,
    m3ApplyScriptPath,
    m3PostVerificationScriptPath,
    m4ApplyScriptPath,
    m4PostVerificationScriptPath,
    productionApplyScriptPath,
    path.join(repositoryRoot, 'scripts', 'database', 'validate-production-evidence.mjs'),
    path.join(repositoryRoot, 'scripts', 'database', 'validate-fresh-bootstrap.mjs'),
    path.join(repositoryRoot, 'scripts', 'database', 'test-validation-rules.mjs'),
    path.join(repositoryRoot, 'supabase', 'validation', 'local-platform-prerequisites.sql'),
    path.join(repositoryRoot, 'supabase', 'schema-fingerprint', 'README.md'),
    path.join(repositoryRoot, 'package.json'),
  ]
  await validateSensitiveContent(databaseFiles)
  process.stdout.write('M1 through M5 immutability, exact M6 lead/event and M7 advisor-interest scope/guards, layered fingerprints, legacy quarantine, and derived types passed.\n')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })
}
