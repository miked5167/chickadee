-- External source measurements are separate from owner-editable company profiles.
-- Counts refer to clients listed by Elite Prospects, not lifetime clients served.
SET lock_timeout = '5s';
SET statement_timeout = '30s';

CREATE TABLE public.company_elite_prospects (
  company_id uuid NOT NULL,
  match_status text NOT NULL,
  agency_name text,
  source_url text,
  client_count integer,
  match_notes text NOT NULL,
  source_file text NOT NULL,
  source_sha256 text NOT NULL,
  source_observed_at timestamp with time zone,
  imported_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT company_elite_prospects_pkey PRIMARY KEY (company_id),
  CONSTRAINT company_elite_prospects_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT company_elite_prospects_status_check CHECK (match_status IN ('exact', 'likely', 'none', 'ambiguous')),
  CONSTRAINT company_elite_prospects_count_check CHECK (client_count IS NULL OR client_count >= 0),
  CONSTRAINT company_elite_prospects_source_check CHECK (source_url IS NULL OR source_url ~ '^https://www[.]eliteprospects[.]com/agent-portal/[0-9]+/[^[:space:]]+$'),
  CONSTRAINT company_elite_prospects_match_check CHECK (
    (match_status IN ('exact', 'likely') AND client_count IS NOT NULL AND source_url IS NOT NULL AND agency_name IS NOT NULL AND length(trim(agency_name)) > 0)
    OR (match_status IN ('none', 'ambiguous') AND client_count IS NULL AND source_url IS NULL AND agency_name IS NULL)
  ),
  CONSTRAINT company_elite_prospects_hash_check CHECK (source_sha256 ~ '^[a-f0-9]{64}$')
);

ALTER TABLE public.company_elite_prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Elite Prospects measurements are public"
  ON public.company_elite_prospects FOR SELECT TO anon, authenticated USING (true);
ALTER TABLE public.company_elite_prospects OWNER TO postgres;
REVOKE ALL ON TABLE public.company_elite_prospects FROM PUBLIC;
REVOKE ALL ON TABLE public.company_elite_prospects FROM anon;
REVOKE ALL ON TABLE public.company_elite_prospects FROM authenticated;
GRANT SELECT ON TABLE public.company_elite_prospects TO anon;
GRANT SELECT ON TABLE public.company_elite_prospects TO authenticated;
GRANT ALL ON TABLE public.company_elite_prospects TO service_role;

RESET statement_timeout;
RESET lock_timeout;
