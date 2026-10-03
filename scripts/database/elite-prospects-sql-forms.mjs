// Exact equivalents emitted by PostgreSQL for the reviewed M8 CHECK clauses.
// Unknown expressions are retained so schema changes still fail comparison.
const forms = new Map([
  ["CHECK (((client_count IS NULL) OR (client_count >= 0)))", "CHECK (client_count IS NULL OR client_count >= 0)"],
  ["CHECK ((source_sha256 ~ '^[a-f0-9]{64}$'::text))", "CHECK (source_sha256 ~ '^[a-f0-9]{64}$')"],
  ["CHECK ((((match_status = ANY (ARRAY['exact'::text, 'likely'::text])) AND (client_count IS NOT NULL) AND (source_url IS NOT NULL) AND (agency_name IS NOT NULL) AND (length(TRIM(BOTH FROM agency_name)) > 0)) OR ((match_status = ANY (ARRAY['none'::text, 'ambiguous'::text])) AND (client_count IS NULL) AND (source_url IS NULL) AND (agency_name IS NULL))))", "CHECK ((match_status IN ('exact', 'likely') AND client_count IS NOT NULL AND source_url IS NOT NULL AND agency_name IS NOT NULL AND length(trim(agency_name)) > 0) OR (match_status IN ('none', 'ambiguous') AND client_count IS NULL AND source_url IS NULL AND agency_name IS NULL))"],
  ["CHECK (((source_url IS NULL) OR (source_url ~ '^https://www[.]eliteprospects[.]com/agent-portal/[0-9]+/[^[:space:]]+$'::text)))", "CHECK (source_url IS NULL OR source_url ~ '^https://www[.]eliteprospects[.]com/agent-portal/[0-9]+/[^[:space:]]+$')"],
  ["CHECK ((match_status = ANY (ARRAY['exact'::text, 'likely'::text, 'none'::text, 'ambiguous'::text])))", "CHECK (match_status IN ('exact', 'likely', 'none', 'ambiguous'))"],
])

export function normalizeEliteProspectsCheck(table, definition) {
  return table === 'company_elite_prospects' ? forms.get(definition) || definition : definition
}
