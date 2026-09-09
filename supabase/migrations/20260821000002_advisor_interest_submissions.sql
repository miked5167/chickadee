-- Add a private demand-validation inbox for prospective advisor products.
-- This migration contains no data, billing workflow, access grant, or administrator mutation.

SET lock_timeout = '5s';
SET statement_timeout = '30s';

DO $guard$
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'M7 ownership guard: migration must run as postgres';
  END IF;

  IF to_regclass('public.companies') IS NULL
     OR to_regclass('public.company_leads') IS NULL
     OR to_regclass('public.directory_events') IS NULL THEN
    RAISE EXCEPTION 'M7 prerequisite failed: exact M1 through M6 foundation is absent';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated')
     OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'service_role')
     OR EXISTS (
       SELECT 1 FROM pg_catalog.pg_roles
        WHERE (rolname = 'authenticated' AND (rolsuper OR rolbypassrls))
           OR (rolname = 'service_role' AND (rolsuper OR NOT rolbypassrls))
     )
     OR pg_catalog.has_schema_privilege('authenticated', 'public', 'CREATE') THEN
    RAISE EXCEPTION 'M7 privilege guard: API role attributes differ from the least-privilege model';
  END IF;

  IF to_regclass('public.advisor_interest_submissions') IS NOT NULL THEN
    RAISE EXCEPTION 'M7 duplicate guard: advisor interest table already exists';
  END IF;
END
$guard$;

CREATE TABLE public.advisor_interest_submissions (
  id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  contact_name character varying(100) NOT NULL,
  business_name character varying(150) NOT NULL,
  email character varying(320) NOT NULL,
  website_url character varying(2048),
  interests text[] NOT NULL,
  message text,
  consent_confirmed boolean NOT NULL,
  ip_hash character(64) NOT NULL,
  user_agent character varying(500),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT advisor_interest_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT advisor_interest_submissions_contact_name_check CHECK (((char_length(btrim((contact_name)::text)) >= 2) AND (char_length(btrim((contact_name)::text)) <= 100))),
  CONSTRAINT advisor_interest_submissions_business_name_check CHECK (((char_length(btrim((business_name)::text)) >= 2) AND (char_length(btrim((business_name)::text)) <= 150))),
  CONSTRAINT advisor_interest_submissions_email_check CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)),
  CONSTRAINT advisor_interest_submissions_interests_check CHECK (((cardinality(interests) >= 1) AND (cardinality(interests) <= 3) AND (interests <@ ARRAY['profile_plus'::text, 'sponsored_placement'::text, 'enhanced_analytics'::text]))),
  CONSTRAINT advisor_interest_submissions_message_check CHECK (((message IS NULL) OR (char_length(message) <= 2000))),
  CONSTRAINT advisor_interest_submissions_consent_check CHECK (consent_confirmed),
  CONSTRAINT advisor_interest_submissions_ip_hash_check CHECK (((ip_hash)::text ~ '^[a-f0-9]{64}$'::text))
);

CREATE INDEX advisor_interest_submissions_created_idx ON public.advisor_interest_submissions USING btree (created_at DESC);
CREATE INDEX advisor_interest_submissions_rate_limit_idx ON public.advisor_interest_submissions USING btree (ip_hash, created_at DESC);

ALTER TABLE public.advisor_interest_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_interest_submissions OWNER TO postgres;

REVOKE ALL ON TABLE public.advisor_interest_submissions FROM PUBLIC;
REVOKE ALL ON TABLE public.advisor_interest_submissions FROM anon;
REVOKE ALL ON TABLE public.advisor_interest_submissions FROM authenticated;
GRANT ALL ON TABLE public.advisor_interest_submissions TO service_role;

RESET statement_timeout;
RESET lock_timeout;
