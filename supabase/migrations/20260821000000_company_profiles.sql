-- Add a canonical one-to-one rich profile for each company.
-- This migration contains no data and does not enable administrator mutations.

SET lock_timeout = '5s';
SET statement_timeout = '30s';

DO $guard$
DECLARE
  companies_oid oid := to_regclass('public.companies');
  reviews_oid oid := to_regclass('public.reviews');
  timestamp_function_oid oid := to_regprocedure('public.update_updated_at_column()');
  auth_uid_oid oid := to_regprocedure('auth.uid()');
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'M5 ownership guard: migration must run as postgres';
  END IF;

  IF companies_oid IS NULL OR reviews_oid IS NULL OR timestamp_function_oid IS NULL OR auth_uid_oid IS NULL THEN
    RAISE EXCEPTION 'M5 prerequisite failed: exact M1 through M4 foundation is absent';
  END IF;

  IF NOT EXISTS (
       SELECT 1
         FROM pg_catalog.pg_attribute AS column_attribute
        WHERE column_attribute.attrelid = companies_oid
          AND column_attribute.attname = 'verified_owner_id'
          AND column_attribute.atttypid = 'pg_catalog.uuid'::pg_catalog.regtype
          AND NOT column_attribute.attisdropped
     )
     OR NOT EXISTS (
       SELECT 1
         FROM pg_catalog.pg_proc AS function_proc
         JOIN pg_catalog.pg_language AS function_language
           ON function_language.oid = function_proc.prolang
        WHERE function_proc.oid = timestamp_function_oid
          AND function_language.lanname = 'plpgsql'
          AND function_proc.provolatile = 'v'
          AND NOT function_proc.prosecdef
          AND pg_catalog.pg_get_userbyid(function_proc.proowner) = 'postgres'
     ) THEN
    RAISE EXCEPTION 'M5 prerequisite failed: owner identity or timestamp contract differs from M1 through M4';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon')
     OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated')
     OR NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'service_role')
     OR EXISTS (
       SELECT 1
         FROM pg_catalog.pg_roles
        WHERE (rolname IN ('anon', 'authenticated') AND (rolsuper OR rolbypassrls))
           OR (rolname = 'service_role' AND (rolsuper OR NOT rolbypassrls))
     ) THEN
    RAISE EXCEPTION 'M5 privilege guard: API role attributes differ from the least-privilege model';
  END IF;

  IF pg_catalog.has_schema_privilege('anon', 'public', 'CREATE')
     OR pg_catalog.has_schema_privilege('authenticated', 'public', 'CREATE') THEN
    RAISE EXCEPTION 'M5 privilege guard: untrusted API roles can create objects in public';
  END IF;

  IF to_regclass('public.company_profiles') IS NOT NULL
     OR EXISTS (
       SELECT 1
         FROM pg_catalog.pg_policy
        WHERE polname IN (
          'Company profiles are public',
          'Company owners can create profiles',
          'Company owners can update profiles',
          'Company owners can delete profiles'
        )
     )
     OR EXISTS (
       SELECT 1
         FROM pg_catalog.pg_trigger
        WHERE tgname = 'update_company_profiles_updated_at'
          AND NOT tgisinternal
     ) THEN
    RAISE EXCEPTION 'M5 duplicate guard: a company-profile object already exists';
  END IF;
END
$guard$;

CREATE TABLE public.company_profiles (
  company_id uuid NOT NULL,
  tagline character varying(160),
  services text[] DEFAULT '{}'::text[] NOT NULL,
  specialties text[] DEFAULT '{}'::text[] NOT NULL,
  pathways text[] DEFAULT '{}'::text[] NOT NULL,
  player_levels text[] DEFAULT '{}'::text[] NOT NULL,
  age_groups text[] DEFAULT '{}'::text[] NOT NULL,
  service_areas text[] DEFAULT '{}'::text[] NOT NULL,
  languages text[] DEFAULT '{}'::text[] NOT NULL,
  offers_remote boolean DEFAULT false NOT NULL,
  accepting_clients boolean,
  pricing_models text[] DEFAULT '{}'::text[] NOT NULL,
  price_min integer,
  price_max integer,
  price_currency character(3),
  response_time character varying(50),
  founded_year integer,
  business_hours jsonb DEFAULT '{}'::jsonb NOT NULL,
  faq jsonb DEFAULT '[]'::jsonb NOT NULL,
  last_reviewed_at timestamp with time zone,
  source_label character varying(100),
  source_url character varying(2048),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT company_profiles_pkey PRIMARY KEY (company_id),
  CONSTRAINT company_profiles_company_id_fkey FOREIGN KEY (company_id)
    REFERENCES public.companies(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT company_profiles_tagline_check CHECK (((tagline IS NULL) OR ((char_length(btrim((tagline)::text)) >= 10) AND (char_length(btrim((tagline)::text)) <= 160)))),
  CONSTRAINT company_profiles_price_min_check CHECK (((price_min IS NULL) OR (price_min >= 0))),
  CONSTRAINT company_profiles_price_max_check CHECK (((price_max IS NULL) OR (price_max >= 0))),
  CONSTRAINT company_profiles_price_order_check CHECK (((price_min IS NULL) OR (price_max IS NULL) OR (price_max >= price_min))),
  CONSTRAINT company_profiles_currency_check CHECK (((price_currency IS NULL) OR ((price_currency)::text ~ '^[A-Z]{3}$'::text))),
  CONSTRAINT company_profiles_founded_year_check CHECK (((founded_year IS NULL) OR ((founded_year >= 1900) AND (founded_year <= 2100)))),
  CONSTRAINT company_profiles_business_hours_check CHECK ((jsonb_typeof(business_hours) = 'object'::text)),
  CONSTRAINT company_profiles_faq_check CHECK ((jsonb_typeof(faq) = 'array'::text))
);

CREATE INDEX company_profiles_services_idx ON public.company_profiles USING gin (services);
CREATE INDEX company_profiles_specialties_idx ON public.company_profiles USING gin (specialties);
CREATE INDEX company_profiles_pathways_idx ON public.company_profiles USING gin (pathways);
CREATE INDEX company_profiles_accepting_idx ON public.company_profiles USING btree (accepting_clients) WHERE (accepting_clients = true);

ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company profiles are public"
  ON public.company_profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Company owners can create profiles"
  ON public.company_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((EXISTS (
    SELECT 1
      FROM public.companies
     WHERE ((companies.id = company_profiles.company_id)
       AND (companies.verified_owner_id = auth.uid()))
  )));

CREATE POLICY "Company owners can update profiles"
  ON public.company_profiles
  FOR UPDATE
  TO authenticated
  USING ((EXISTS (
    SELECT 1
      FROM public.companies
     WHERE ((companies.id = company_profiles.company_id)
       AND (companies.verified_owner_id = auth.uid()))
  )))
  WITH CHECK ((EXISTS (
    SELECT 1
      FROM public.companies
     WHERE ((companies.id = company_profiles.company_id)
       AND (companies.verified_owner_id = auth.uid()))
  )));

CREATE POLICY "Company owners can delete profiles"
  ON public.company_profiles
  FOR DELETE
  TO authenticated
  USING ((EXISTS (
    SELECT 1
      FROM public.companies
     WHERE ((companies.id = company_profiles.company_id)
       AND (companies.verified_owner_id = auth.uid()))
  )));

CREATE TRIGGER update_company_profiles_updated_at
  BEFORE UPDATE ON public.company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.company_profiles OWNER TO postgres;

REVOKE ALL ON TABLE public.company_profiles FROM PUBLIC;
REVOKE ALL ON TABLE public.company_profiles FROM anon;
REVOKE ALL ON TABLE public.company_profiles FROM authenticated;
GRANT SELECT ON TABLE public.company_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.company_profiles TO authenticated;
GRANT ALL ON TABLE public.company_profiles TO service_role;

RESET statement_timeout;
RESET lock_timeout;
