-- Add privacy-conscious company inquiries and directory conversion events.
-- This migration contains no data and does not enable administrator mutations.

SET lock_timeout = '5s';
SET statement_timeout = '30s';

DO $guard$
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'M6 ownership guard: migration must run as postgres';
  END IF;

  IF to_regclass('public.companies') IS NULL
     OR to_regclass('public.company_profiles') IS NULL
     OR to_regprocedure('public.update_updated_at_column()') IS NULL
     OR to_regprocedure('auth.uid()') IS NULL THEN
    RAISE EXCEPTION 'M6 prerequisite failed: exact M1 through M5 foundation is absent';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated')
     OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'service_role')
     OR EXISTS (
       SELECT 1 FROM pg_catalog.pg_roles
        WHERE (rolname = 'authenticated' AND (rolsuper OR rolbypassrls))
           OR (rolname = 'service_role' AND (rolsuper OR NOT rolbypassrls))
     )
     OR pg_catalog.has_schema_privilege('authenticated', 'public', 'CREATE') THEN
    RAISE EXCEPTION 'M6 privilege guard: API role attributes differ from the least-privilege model';
  END IF;

  IF to_regclass('public.company_leads') IS NOT NULL
     OR to_regclass('public.directory_events') IS NOT NULL
     OR EXISTS (
       SELECT 1 FROM pg_catalog.pg_policy
        WHERE polname IN (
          'Company owners can read own leads',
          'Company owners can update own lead status',
          'Company owners can read own directory events'
        )
     )
     OR EXISTS (
       SELECT 1 FROM pg_catalog.pg_trigger
        WHERE tgname = 'update_company_leads_updated_at' AND NOT tgisinternal
     ) THEN
    RAISE EXCEPTION 'M6 duplicate guard: a lead or event object already exists';
  END IF;
END
$guard$;

CREATE TABLE public.company_leads (
  id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  company_id uuid NOT NULL,
  contact_name character varying(100) NOT NULL,
  contact_email character varying(320) NOT NULL,
  contact_phone character varying(50),
  player_age smallint,
  player_level character varying(100),
  goals text[] DEFAULT '{}'::text[] NOT NULL,
  message text NOT NULL,
  consent_confirmed boolean NOT NULL,
  status character varying(20) DEFAULT 'new'::character varying NOT NULL,
  owner_notes text,
  referral_url character varying(2048),
  ip_hash character(64) NOT NULL,
  user_agent character varying(500),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT company_leads_pkey PRIMARY KEY (id),
  CONSTRAINT company_leads_company_id_fkey FOREIGN KEY (company_id)
    REFERENCES public.companies(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT company_leads_email_check CHECK (((contact_email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)),
  CONSTRAINT company_leads_age_check CHECK (((player_age IS NULL) OR ((player_age >= 5) AND (player_age <= 30)))),
  CONSTRAINT company_leads_message_check CHECK (((char_length(btrim(message)) >= 50) AND (char_length(btrim(message)) <= 2000))),
  CONSTRAINT company_leads_consent_check CHECK (consent_confirmed),
  CONSTRAINT company_leads_status_check CHECK (((status)::text = ANY (ARRAY['new'::text, 'contacted'::text, 'qualified'::text, 'closed'::text, 'spam'::text]))),
  CONSTRAINT company_leads_notes_check CHECK (((owner_notes IS NULL) OR (char_length(owner_notes) <= 2000))),
  CONSTRAINT company_leads_ip_hash_check CHECK (((ip_hash)::text ~ '^[a-f0-9]{64}$'::text))
);

CREATE INDEX company_leads_company_created_idx ON public.company_leads USING btree (company_id, created_at DESC);
CREATE INDEX company_leads_company_status_idx ON public.company_leads USING btree (company_id, status);
CREATE INDEX company_leads_rate_limit_idx ON public.company_leads USING btree (ip_hash, created_at DESC);

ALTER TABLE public.company_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company owners can read own leads"
  ON public.company_leads
  FOR SELECT
  TO authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.companies
     WHERE ((companies.id = company_leads.company_id)
       AND (companies.verified_owner_id = auth.uid()))
  )));

CREATE POLICY "Company owners can update own lead status"
  ON public.company_leads
  FOR UPDATE
  TO authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.companies
     WHERE ((companies.id = company_leads.company_id)
       AND (companies.verified_owner_id = auth.uid()))
  )))
  WITH CHECK ((EXISTS (
    SELECT 1 FROM public.companies
     WHERE ((companies.id = company_leads.company_id)
       AND (companies.verified_owner_id = auth.uid()))
  )));

CREATE TRIGGER update_company_leads_updated_at
  BEFORE UPDATE ON public.company_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.directory_events (
  id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  company_id uuid NOT NULL,
  event_type character varying(30) NOT NULL,
  session_id uuid NOT NULL,
  ip_hash character(64) NOT NULL,
  user_agent character varying(500),
  referrer character varying(2048),
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT directory_events_pkey PRIMARY KEY (id),
  CONSTRAINT directory_events_company_id_fkey FOREIGN KEY (company_id)
    REFERENCES public.companies(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT directory_events_type_check CHECK (((event_type)::text = ANY (ARRAY['profile_view'::text, 'website_click'::text, 'email_click'::text, 'phone_click'::text, 'lead_submit'::text]))),
  CONSTRAINT directory_events_ip_hash_check CHECK (((ip_hash)::text ~ '^[a-f0-9]{64}$'::text)),
  CONSTRAINT directory_events_metadata_check CHECK ((jsonb_typeof(metadata) = 'object'::text))
);

CREATE INDEX directory_events_company_created_idx ON public.directory_events USING btree (company_id, created_at DESC);
CREATE INDEX directory_events_company_type_idx ON public.directory_events USING btree (company_id, event_type, created_at DESC);
CREATE INDEX directory_events_rate_limit_idx ON public.directory_events USING btree (ip_hash, created_at DESC);

ALTER TABLE public.directory_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company owners can read own directory events"
  ON public.directory_events
  FOR SELECT
  TO authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.companies
     WHERE ((companies.id = directory_events.company_id)
       AND (companies.verified_owner_id = auth.uid()))
  )));

ALTER TABLE public.company_leads OWNER TO postgres;
ALTER TABLE public.directory_events OWNER TO postgres;

REVOKE ALL ON TABLE public.company_leads FROM PUBLIC;
REVOKE ALL ON TABLE public.company_leads FROM anon;
REVOKE ALL ON TABLE public.company_leads FROM authenticated;
GRANT SELECT ON TABLE public.company_leads TO authenticated;
GRANT UPDATE (status, owner_notes) ON TABLE public.company_leads TO authenticated;
GRANT ALL ON TABLE public.company_leads TO service_role;

REVOKE ALL ON TABLE public.directory_events FROM PUBLIC;
REVOKE ALL ON TABLE public.directory_events FROM anon;
REVOKE ALL ON TABLE public.directory_events FROM authenticated;
GRANT SELECT ON TABLE public.directory_events TO authenticated;
GRANT ALL ON TABLE public.directory_events TO service_role;

RESET statement_timeout;
RESET lock_timeout;
