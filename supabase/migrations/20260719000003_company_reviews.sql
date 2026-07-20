-- Add canonical, company-targeted public reviews without enabling administrator mutations.
-- Reviews are published immediately by product decision and contain no imported or seed data.

SET lock_timeout = '5s';
SET statement_timeout = '30s';

DO $guard$
DECLARE
  auth_users_oid oid := to_regclass('auth.users');
  auth_uid_oid oid := to_regprocedure('auth.uid()');
  companies_oid oid := to_regclass('public.companies');
  timestamp_function_oid oid := to_regprocedure('public.update_updated_at_column()');
  admin_table_oid oid := to_regclass('public.admin_users');
  admin_function_oid oid := to_regprocedure('public.is_admin()');
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'M4 ownership guard: migration must run as postgres';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM pg_catalog.pg_roles AS role
     WHERE (role.rolname IN ('anon', 'authenticated') AND (role.rolsuper OR role.rolbypassrls))
        OR (role.rolname = 'service_role' AND (role.rolsuper OR NOT role.rolbypassrls))
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'anon'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'authenticated'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'service_role'
  ) THEN
    RAISE EXCEPTION 'M4 privilege guard: API role attributes differ from the required least-privilege model';
  END IF;

  IF pg_catalog.has_schema_privilege('anon', 'public', 'CREATE')
     OR pg_catalog.has_schema_privilege('authenticated', 'public', 'CREATE') THEN
    RAISE EXCEPTION 'M4 privilege guard: untrusted API roles can create objects in public';
  END IF;

  IF auth_users_oid IS NULL OR auth_uid_oid IS NULL THEN
    RAISE EXCEPTION 'M4 prerequisite failed: required Auth objects are absent';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_catalog.pg_attribute AS column_attribute
     WHERE column_attribute.attrelid = auth_users_oid
       AND column_attribute.attname = 'id'
       AND column_attribute.attnum > 0
       AND NOT column_attribute.attisdropped
       AND column_attribute.atttypid = 'pg_catalog.uuid'::pg_catalog.regtype
       AND column_attribute.attnotnull
  ) OR NOT pg_catalog.has_function_privilege('authenticated', auth_uid_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'M4 prerequisite failed: Auth identity contract differs';
  END IF;

  IF companies_oid IS NULL OR NOT EXISTS (
    SELECT 1
      FROM pg_catalog.pg_trigger AS companies_trigger
     WHERE companies_trigger.tgrelid = companies_oid
       AND companies_trigger.tgname = 'update_companies_updated_at'
       AND companies_trigger.tgfoid = timestamp_function_oid
       AND companies_trigger.tgtype = 19
       AND companies_trigger.tgenabled = 'O'
       AND NOT companies_trigger.tgisinternal
  ) THEN
    RAISE EXCEPTION 'M4 prerequisite failed: exact M2 companies state is absent';
  END IF;

  IF admin_table_oid IS NULL OR admin_function_oid IS NULL OR NOT EXISTS (
    SELECT 1
      FROM pg_catalog.pg_class AS admin_table
     WHERE admin_table.oid = admin_table_oid
       AND admin_table.relrowsecurity
       AND NOT admin_table.relforcerowsecurity
       AND pg_catalog.pg_get_userbyid(admin_table.relowner) = 'postgres'
  ) OR NOT EXISTS (
    SELECT 1
      FROM pg_catalog.pg_proc AS admin_function
     WHERE admin_function.oid = admin_function_oid
       AND admin_function.prosecdef
       AND admin_function.provolatile = 's'
       AND admin_function.prorettype = 'pg_catalog.bool'::pg_catalog.regtype
       AND cardinality(admin_function.proconfig) = 1
       AND split_part(
             admin_function.proconfig[array_lower(admin_function.proconfig, 1)],
             '=',
             1
           ) = 'search_path'
       AND pg_catalog.pg_get_functiondef(admin_function.oid) LIKE '%SET search_path TO ''''%'
       AND pg_catalog.pg_get_userbyid(admin_function.proowner) = 'postgres'
  ) THEN
    RAISE EXCEPTION 'M4 prerequisite failed: exact M3 authorization foundation is absent';
  END IF;

  IF timestamp_function_oid IS NULL OR NOT EXISTS (
    SELECT 1
      FROM pg_catalog.pg_proc AS function_proc
      JOIN pg_catalog.pg_language AS function_language
        ON function_language.oid = function_proc.prolang
     WHERE function_proc.oid = timestamp_function_oid
       AND function_proc.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype
       AND function_language.lanname = 'plpgsql'
       AND function_proc.provolatile = 'v'
       AND NOT function_proc.prosecdef
       AND pg_catalog.pg_get_userbyid(function_proc.proowner) = 'postgres'
  ) THEN
    RAISE EXCEPTION 'M4 prerequisite failed: shared timestamp function differs';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_catalog.pg_type AS enum_type
      JOIN pg_catalog.pg_namespace AS enum_namespace
        ON enum_namespace.oid = enum_type.typnamespace
     WHERE enum_namespace.nspname = 'public'
       AND enum_type.typname = 'moderation_status'
       AND (
         SELECT array_agg((enum_value.enumlabel)::text ORDER BY enum_value.enumsortorder)
           FROM pg_catalog.pg_enum AS enum_value
          WHERE enum_value.enumtypid = enum_type.oid
       ) = ARRAY['pending', 'approved', 'rejected']
  ) THEN
    RAISE EXCEPTION 'M4 prerequisite failed: moderation_status enum differs';
  END IF;

  IF to_regclass('public.reviews') IS NOT NULL
     OR EXISTS (
       SELECT 1
         FROM pg_catalog.pg_class AS schema_object
         JOIN pg_catalog.pg_namespace AS object_namespace
           ON object_namespace.oid = schema_object.relnamespace
        WHERE object_namespace.nspname = 'public'
          AND schema_object.relname IN (
            'reviews_pkey',
            'reviews_company_reviewer_key',
            'reviews_company_published_idx',
            'reviews_reviewer_idx'
          )
     ) OR EXISTS (
       SELECT 1
         FROM pg_catalog.pg_policy AS row_policy
        WHERE row_policy.polname IN (
          'Published company reviews are public',
          'Users can create own company reviews',
          'Users can update own company reviews',
          'Users can delete own company reviews'
        )
     ) OR EXISTS (
       SELECT 1
         FROM pg_catalog.pg_trigger AS table_trigger
        WHERE table_trigger.tgname = 'update_reviews_updated_at'
          AND NOT table_trigger.tgisinternal
     ) THEN
    RAISE EXCEPTION 'M4 duplicate guard: a company-review object already exists';
  END IF;
END
$guard$;

CREATE TABLE public.reviews (
  id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  company_id uuid NOT NULL,
  reviewer_user_id uuid NOT NULL,
  rating integer NOT NULL,
  title character varying(100),
  review_text text NOT NULL,
  experience_confirmed_at timestamp with time zone NOT NULL,
  moderation_status public.moderation_status DEFAULT 'approved'::public.moderation_status NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_company_id_fkey FOREIGN KEY (company_id)
    REFERENCES public.companies(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT reviews_reviewer_user_id_fkey FOREIGN KEY (reviewer_user_id)
    REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT reviews_company_reviewer_key UNIQUE (company_id, reviewer_user_id),
  CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
  CONSTRAINT reviews_title_length_check CHECK (((title IS NULL) OR ((char_length(btrim((title)::text)) >= 1) AND (char_length(btrim((title)::text)) <= 100)))),
  CONSTRAINT reviews_text_length_check CHECK (((char_length(btrim(review_text)) >= 50) AND (char_length(btrim(review_text)) <= 1000))),
  CONSTRAINT reviews_confirmation_check CHECK ((experience_confirmed_at <= (created_at + '00:05:00'::interval)))
);

CREATE INDEX reviews_company_published_idx
  ON public.reviews USING btree (company_id, created_at DESC)
  WHERE (moderation_status = 'approved'::public.moderation_status);

CREATE INDEX reviews_reviewer_idx
  ON public.reviews USING btree (reviewer_user_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published company reviews are public"
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING ((moderation_status = 'approved'::public.moderation_status));

CREATE POLICY "Users can create own company reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK ((
    (reviewer_user_id = auth.uid())
    AND (moderation_status = 'approved'::public.moderation_status)
  ));

CREATE POLICY "Users can update own company reviews"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING ((reviewer_user_id = auth.uid()))
  WITH CHECK ((
    (reviewer_user_id = auth.uid())
    AND (moderation_status = 'approved'::public.moderation_status)
  ));

CREATE POLICY "Users can delete own company reviews"
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING ((reviewer_user_id = auth.uid()));

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.reviews OWNER TO postgres;

REVOKE ALL ON TABLE public.reviews FROM PUBLIC;
REVOKE ALL ON TABLE public.reviews FROM anon;
REVOKE ALL ON TABLE public.reviews FROM authenticated;
GRANT SELECT (id, company_id, rating, title, review_text, experience_confirmed_at, created_at, updated_at)
  ON TABLE public.reviews TO anon;
GRANT SELECT (id, company_id, rating, title, review_text, experience_confirmed_at, created_at, updated_at)
  ON TABLE public.reviews TO authenticated;
GRANT INSERT (company_id, reviewer_user_id, rating, title, review_text, experience_confirmed_at)
  ON TABLE public.reviews TO authenticated;
GRANT UPDATE (rating, title, review_text, experience_confirmed_at)
  ON TABLE public.reviews TO authenticated;
GRANT DELETE ON TABLE public.reviews TO authenticated;
GRANT ALL ON TABLE public.reviews TO service_role;

RESET statement_timeout;
RESET lock_timeout;
