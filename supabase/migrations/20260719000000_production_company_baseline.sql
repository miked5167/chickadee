-- Canonical production-derived application baseline captured on 2026-07-19.
-- Definitions only. This migration must execute only on a fresh environment.
-- Existing production adopts this version later through a separately reviewed
-- fingerprint-and-history procedure without executing this file.

DO $guard$
DECLARE
  guarded_name text;
BEGIN
  SELECT candidate
    INTO guarded_name
    FROM unnest(ARRAY[
      'public.users',
      'public.companies',
      'public.advisors',
      'public.listing_claims',
      'public.media_content'
    ]) AS candidate
   WHERE to_regclass(candidate) IS NOT NULL
   LIMIT 1;

  IF guarded_name IS NOT NULL THEN
    RAISE EXCEPTION 'Fresh-environment guard: application relation % already exists', guarded_name;
  END IF;

  SELECT candidate
    INTO guarded_name
    FROM unnest(ARRAY[
      'public.claim_status',
      'public.media_type',
      'public.moderation_status',
      'public.user_type',
      'public.verification_method'
    ]) AS candidate
   WHERE to_regtype(candidate) IS NOT NULL
   LIMIT 1;

  IF guarded_name IS NOT NULL THEN
    RAISE EXCEPTION 'Fresh-environment guard: application type % already exists', guarded_name;
  END IF;

  IF to_regprocedure('public.update_updated_at_column()') IS NOT NULL THEN
    RAISE EXCEPTION 'Fresh-environment guard: application function public.update_updated_at_column() already exists';
  END IF;

  SELECT c.relname
    INTO guarded_name
    FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relname = ANY (ARRAY[
       'advisors_active_idx',
       'advisors_company_idx',
       'companies_location_idx',
       'companies_search_vector_idx',
       'companies_slug_idx',
       'companies_verified_idx',
       'companies_verified_owner_idx',
       'listing_claims_claimant_idx',
       'listing_claims_company_idx',
       'listing_claims_status_idx',
       'media_content_company_idx',
       'media_content_featured_idx',
       'media_content_intro_video_idx'
     ])
   LIMIT 1;

  IF guarded_name IS NOT NULL THEN
    RAISE EXCEPTION 'Fresh-environment guard: application index % already exists', guarded_name;
  END IF;

  SELECT con.conname
    INTO guarded_name
    FROM pg_catalog.pg_constraint AS con
    JOIN pg_catalog.pg_namespace AS n ON n.oid = con.connamespace
   WHERE n.nspname = 'public'
     AND con.conname = ANY (ARRAY[
       'advisors_pkey',
       'advisors_company_id_fkey',
       'advisors_display_order_check',
       'advisors_years_experience_check',
       'valid_advisor_email',
       'valid_advisor_name_length',
       'companies_pkey',
       'companies_slug_key',
       'companies_verified_owner_id_fkey',
       'valid_email',
       'valid_name_length',
       'valid_slug_format',
       'listing_claims_pkey',
       'listing_claims_company_id_fkey',
       'listing_claims_claimant_user_id_fkey',
       'listing_claims_reviewed_by_fkey',
       'one_active_claim_per_company',
       'valid_business_email',
       'media_content_pkey',
       'media_content_company_id_fkey',
       'media_content_uploaded_by_fkey',
       'media_content_display_order_check',
       'media_content_file_size_check',
       'users_pkey',
       'users_id_fkey'
     ])
   LIMIT 1;

  IF guarded_name IS NOT NULL THEN
    RAISE EXCEPTION 'Fresh-environment guard: application constraint % already exists', guarded_name;
  END IF;

  SELECT pol.polname
    INTO guarded_name
    FROM pg_catalog.pg_policy AS pol
   WHERE pol.polname = ANY (ARRAY[
     'Company owners can manage advisors',
     'Company owners can manage media',
     'Company owners can update their listings',
     'Public read access for advisors',
     'Public read access for approved media',
     'Public read access for companies',
     'Users can create claims',
     'Users can update their pending claims',
     'Users can view and update their own profile',
     'Users can view their own claims'
   ])
   LIMIT 1;

  IF guarded_name IS NOT NULL THEN
    RAISE EXCEPTION 'Fresh-environment guard: application policy % already exists', guarded_name;
  END IF;

  SELECT trg.tgname
    INTO guarded_name
    FROM pg_catalog.pg_trigger AS trg
   WHERE NOT trg.tgisinternal
     AND trg.tgname = ANY (ARRAY[
       'update_advisors_updated_at',
       'update_listing_claims_updated_at',
       'update_media_content_updated_at',
       'update_users_updated_at'
     ])
   LIMIT 1;

  IF guarded_name IS NOT NULL THEN
    RAISE EXCEPTION 'Fresh-environment guard: application trigger % already exists', guarded_name;
  END IF;
END
$guard$;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;

CREATE TYPE public.claim_status AS ENUM (
  'pending',
  'under_review',
  'approved',
  'rejected'
);

CREATE TYPE public.media_type AS ENUM (
  'photo',
  'video'
);

CREATE TYPE public.moderation_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

CREATE TYPE public.user_type AS ENUM (
  'searcher',
  'advisor'
);

CREATE TYPE public.verification_method AS ENUM (
  'email',
  'phone',
  'document',
  'manual'
);

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE public.users (
  id uuid NOT NULL,
  user_type public.user_type DEFAULT 'searcher'::public.user_type,
  first_name character varying(30),
  last_name character varying(30),
  search_preferences jsonb DEFAULT '{}'::jsonb,
  contact_history jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.companies (
  id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  name character varying(100) NOT NULL,
  slug character varying(100) NOT NULL,
  description text,
  website_url character varying(255),
  phone character varying(20),
  email character varying(255),
  address text,
  city character varying(50),
  state_province character varying(50),
  country character varying(50) DEFAULT 'Canada'::character varying,
  location public.geography(Point,4326),
  facebook_url character varying(255),
  instagram_url character varying(255),
  twitter_url character varying(255),
  logo_url character varying(255),
  verified boolean DEFAULT false,
  verified_owner_id uuid,
  verification_date timestamp with time zone,
  search_vector tsvector,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT valid_email CHECK ((((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text) OR (email IS NULL))),
  CONSTRAINT valid_name_length CHECK ((char_length((name)::text) >= 3)),
  CONSTRAINT valid_slug_format CHECK (((slug)::text ~* '^[a-z0-9-]+$'::text))
);

CREATE TABLE public.advisors (
  id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  company_id uuid NOT NULL,
  name character varying(50) NOT NULL,
  title character varying(100),
  bio text,
  specialties text[],
  years_experience integer,
  playing_background text,
  certifications text[],
  contact_email character varying(255),
  contact_phone character varying(20),
  profile_image_url character varying(255),
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT advisors_display_order_check CHECK ((display_order >= 0)),
  CONSTRAINT advisors_years_experience_check CHECK (((years_experience >= 0) AND (years_experience <= 50))),
  CONSTRAINT valid_advisor_email CHECK ((((contact_email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text) OR (contact_email IS NULL))),
  CONSTRAINT valid_advisor_name_length CHECK ((char_length((name)::text) >= 2))
);

CREATE TABLE public.listing_claims (
  id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  company_id uuid NOT NULL,
  claimant_user_id uuid NOT NULL,
  claim_status public.claim_status DEFAULT 'pending'::public.claim_status,
  verification_method public.verification_method,
  verification_data jsonb DEFAULT '{}'::jsonb,
  business_email character varying(255),
  business_phone character varying(20),
  supporting_documents text[],
  admin_notes text,
  submitted_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT valid_business_email CHECK ((((business_email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text) OR (business_email IS NULL)))
);

CREATE TABLE public.media_content (
  id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  company_id uuid NOT NULL,
  file_name character varying(255) NOT NULL,
  file_path character varying(500) NOT NULL,
  file_type public.media_type NOT NULL,
  file_size integer NOT NULL,
  mime_type character varying(50) NOT NULL,
  caption text,
  display_order integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_introduction_video boolean DEFAULT false,
  moderation_status public.moderation_status DEFAULT 'pending'::public.moderation_status,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT media_content_display_order_check CHECK ((display_order >= 0)),
  CONSTRAINT media_content_file_size_check CHECK ((file_size <= 10485760))
);

ALTER TABLE ONLY public.users
  ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.companies
  ADD CONSTRAINT companies_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.companies
  ADD CONSTRAINT companies_slug_key UNIQUE (slug);

ALTER TABLE ONLY public.advisors
  ADD CONSTRAINT advisors_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.listing_claims
  ADD CONSTRAINT listing_claims_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.listing_claims
  ADD CONSTRAINT one_active_claim_per_company EXCLUDE USING btree (
    company_id WITH =
  ) WHERE ((claim_status = ANY (ARRAY[
    'pending'::public.claim_status,
    'under_review'::public.claim_status
  ])));

ALTER TABLE ONLY public.media_content
  ADD CONSTRAINT media_content_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
  ADD CONSTRAINT users_id_fkey FOREIGN KEY (id)
  REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.companies
  ADD CONSTRAINT companies_verified_owner_id_fkey FOREIGN KEY (verified_owner_id)
  REFERENCES public.users(id);

ALTER TABLE ONLY public.advisors
  ADD CONSTRAINT advisors_company_id_fkey FOREIGN KEY (company_id)
  REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.listing_claims
  ADD CONSTRAINT listing_claims_claimant_user_id_fkey FOREIGN KEY (claimant_user_id)
  REFERENCES public.users(id);

ALTER TABLE ONLY public.listing_claims
  ADD CONSTRAINT listing_claims_company_id_fkey FOREIGN KEY (company_id)
  REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.listing_claims
  ADD CONSTRAINT listing_claims_reviewed_by_fkey FOREIGN KEY (reviewed_by)
  REFERENCES public.users(id);

ALTER TABLE ONLY public.media_content
  ADD CONSTRAINT media_content_company_id_fkey FOREIGN KEY (company_id)
  REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.media_content
  ADD CONSTRAINT media_content_uploaded_by_fkey FOREIGN KEY (uploaded_by)
  REFERENCES public.users(id);

CREATE INDEX advisors_active_idx ON public.advisors USING btree (active)
  WHERE (active = true);
CREATE INDEX advisors_company_idx ON public.advisors USING btree (company_id);
CREATE INDEX companies_location_idx ON public.companies USING gist (location);
CREATE INDEX companies_search_vector_idx ON public.companies USING gin (search_vector);
CREATE INDEX companies_slug_idx ON public.companies USING btree (slug);
CREATE INDEX companies_verified_idx ON public.companies USING btree (verified)
  WHERE (verified = true);
CREATE INDEX companies_verified_owner_idx ON public.companies USING btree (verified_owner_id);
CREATE INDEX listing_claims_claimant_idx ON public.listing_claims USING btree (claimant_user_id);
CREATE INDEX listing_claims_company_idx ON public.listing_claims USING btree (company_id);
CREATE INDEX listing_claims_status_idx ON public.listing_claims USING btree (claim_status);
CREATE INDEX media_content_company_idx ON public.media_content USING btree (company_id);
CREATE INDEX media_content_featured_idx ON public.media_content USING btree (is_featured)
  WHERE (is_featured = true);
CREATE INDEX media_content_intro_video_idx ON public.media_content USING btree (is_introduction_video)
  WHERE (is_introduction_video = true);

CREATE TRIGGER update_advisors_updated_at
  BEFORE UPDATE ON public.advisors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_listing_claims_updated_at
  BEFORE UPDATE ON public.listing_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_media_content_updated_at
  BEFORE UPDATE ON public.media_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company owners can manage advisors"
  ON public.advisors
  TO authenticated
  USING ((company_id IN (
    SELECT companies.id
    FROM public.companies
    WHERE (companies.verified_owner_id = auth.uid())
  )));

CREATE POLICY "Company owners can manage media"
  ON public.media_content
  TO authenticated
  USING ((company_id IN (
    SELECT companies.id
    FROM public.companies
    WHERE (companies.verified_owner_id = auth.uid())
  )));

CREATE POLICY "Company owners can update their listings"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING ((verified_owner_id = auth.uid()));

CREATE POLICY "Public read access for advisors"
  ON public.advisors
  FOR SELECT
  TO authenticated, anon
  USING ((active = true));

CREATE POLICY "Public read access for approved media"
  ON public.media_content
  FOR SELECT
  TO authenticated, anon
  USING ((moderation_status = 'approved'::public.moderation_status));

CREATE POLICY "Public read access for companies"
  ON public.companies
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create claims"
  ON public.listing_claims
  FOR INSERT
  TO authenticated
  WITH CHECK ((claimant_user_id = auth.uid()));

CREATE POLICY "Users can update their pending claims"
  ON public.listing_claims
  FOR UPDATE
  TO authenticated
  USING (((claimant_user_id = auth.uid()) AND (claim_status = 'pending'::public.claim_status)));

CREATE POLICY "Users can view and update their own profile"
  ON public.users
  TO authenticated
  USING ((id = auth.uid()));

CREATE POLICY "Users can view their own claims"
  ON public.listing_claims
  FOR SELECT
  TO authenticated
  USING ((claimant_user_id = auth.uid()));

ALTER TYPE public.claim_status OWNER TO postgres;
ALTER TYPE public.media_type OWNER TO postgres;
ALTER TYPE public.moderation_status OWNER TO postgres;
ALTER TYPE public.user_type OWNER TO postgres;
ALTER TYPE public.verification_method OWNER TO postgres;
ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;
ALTER TABLE public.users OWNER TO postgres;
ALTER TABLE public.companies OWNER TO postgres;
ALTER TABLE public.advisors OWNER TO postgres;
ALTER TABLE public.listing_claims OWNER TO postgres;
ALTER TABLE public.media_content OWNER TO postgres;

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;
GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON TABLE public.companies TO anon;
GRANT ALL ON TABLE public.companies TO authenticated;
GRANT ALL ON TABLE public.companies TO service_role;
GRANT ALL ON TABLE public.advisors TO anon;
GRANT ALL ON TABLE public.advisors TO authenticated;
GRANT ALL ON TABLE public.advisors TO service_role;
GRANT ALL ON TABLE public.listing_claims TO anon;
GRANT ALL ON TABLE public.listing_claims TO authenticated;
GRANT ALL ON TABLE public.listing_claims TO service_role;
GRANT ALL ON TABLE public.media_content TO anon;
GRANT ALL ON TABLE public.media_content TO authenticated;
GRANT ALL ON TABLE public.media_content TO service_role;
