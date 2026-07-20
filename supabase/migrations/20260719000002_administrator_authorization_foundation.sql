-- Establish the empty, least-privilege administrator authorization foundation.
-- This migration creates no administrator identities and contains no row data.

SET lock_timeout = '5s';
SET statement_timeout = '30s';

DO $guard$
DECLARE
  auth_users_oid oid := to_regclass('auth.users');
  auth_uid_oid oid := to_regprocedure('auth.uid()');
  timestamp_function_oid oid := to_regprocedure('public.update_updated_at_column()');
  companies_oid oid := to_regclass('public.companies');
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'M3 ownership guard: migration must run as postgres';
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
    RAISE EXCEPTION 'M3 privilege guard: anon, authenticated, or service_role attributes differ from the required least-privilege model';
  END IF;

  IF pg_catalog.has_schema_privilege('anon', 'public', 'CREATE')
     OR pg_catalog.has_schema_privilege('authenticated', 'public', 'CREATE') THEN
    RAISE EXCEPTION 'M3 privilege guard: untrusted API roles can create objects in public';
  END IF;

  IF auth_users_oid IS NULL OR NOT EXISTS (
    SELECT 1
      FROM pg_catalog.pg_class AS table_class
     WHERE table_class.oid = auth_users_oid
       AND table_class.relkind IN ('r', 'p')
  ) THEN
    RAISE EXCEPTION 'M3 prerequisite failed: auth.users does not exist as a table';
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
  ) OR NOT EXISTS (
    SELECT 1
      FROM pg_catalog.pg_index AS identity_index
     WHERE identity_index.indrelid = auth_users_oid
       AND identity_index.indisunique
       AND identity_index.indisvalid
       AND identity_index.indisready
       AND identity_index.indnkeyatts = 1
       AND identity_index.indkey[0] = (
         SELECT column_attribute.attnum
           FROM pg_catalog.pg_attribute AS column_attribute
          WHERE column_attribute.attrelid = auth_users_oid
            AND column_attribute.attname = 'id'
            AND column_attribute.attnum > 0
            AND NOT column_attribute.attisdropped
       )
  ) THEN
    RAISE EXCEPTION 'M3 prerequisite failed: auth.users.id is not a non-null uniquely indexed uuid';
  END IF;

  IF auth_uid_oid IS NULL OR NOT EXISTS (
    SELECT 1
      FROM pg_catalog.pg_proc AS function_proc
      JOIN pg_catalog.pg_language AS function_language
        ON function_language.oid = function_proc.prolang
     WHERE function_proc.oid = auth_uid_oid
       AND function_proc.prokind = 'f'
       AND function_proc.pronargs = 0
       AND function_proc.pronargdefaults = 0
       AND NOT function_proc.proretset
       AND function_proc.prorettype = 'pg_catalog.uuid'::pg_catalog.regtype
       AND function_language.lanname = 'sql'
       AND function_proc.provolatile = 's'
       AND NOT function_proc.prosecdef
  ) OR NOT pg_catalog.has_function_privilege('authenticated', auth_uid_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'M3 prerequisite failed: auth.uid() signature, attributes, or authenticated execution privilege differs';
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
    RAISE EXCEPTION 'M3 prerequisite failed: exact enabled M2 companies timestamp trigger is absent';
  END IF;

  IF timestamp_function_oid IS NULL OR NOT EXISTS (
    SELECT 1
      FROM pg_catalog.pg_proc AS function_proc
      JOIN pg_catalog.pg_language AS function_language
        ON function_language.oid = function_proc.prolang
     WHERE function_proc.oid = timestamp_function_oid
       AND function_proc.prokind = 'f'
       AND function_proc.pronargs = 0
       AND function_proc.pronargdefaults = 0
       AND NOT function_proc.proretset
       AND function_proc.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype
       AND function_language.lanname = 'plpgsql'
       AND function_proc.provolatile = 'v'
       AND function_proc.proparallel = 'u'
       AND NOT function_proc.proisstrict
       AND NOT function_proc.prosecdef
       AND NOT function_proc.proleakproof
       AND function_proc.proconfig IS NULL
       AND pg_catalog.pg_get_userbyid(function_proc.proowner) = 'postgres'
       AND pg_catalog.replace(
             pg_catalog.btrim(function_proc.prosrc, E' \t\r\n'),
             E'\r\n',
             E'\n'
           ) = E'BEGIN\n  NEW.updated_at := NOW();\n  RETURN NEW;\nEND;'
  ) THEN
    RAISE EXCEPTION 'M3 prerequisite failed: public.update_updated_at_column() differs from the adopted definition or attributes';
  END IF;

  IF to_regclass('public.admin_users') IS NOT NULL
     OR to_regprocedure('public.is_admin()') IS NOT NULL
     OR EXISTS (
       SELECT 1
         FROM pg_catalog.pg_class AS schema_object
         JOIN pg_catalog.pg_namespace AS object_namespace
           ON object_namespace.oid = schema_object.relnamespace
        WHERE object_namespace.nspname = 'public'
          AND schema_object.relname IN (
            'admin_users_pkey',
            'admin_users_user_id_key',
            'admin_users_granted_by_idx',
            'admin_users_revoked_by_idx'
          )
     ) OR EXISTS (
       SELECT 1
         FROM pg_catalog.pg_constraint AS table_constraint
         JOIN pg_catalog.pg_namespace AS constraint_namespace
           ON constraint_namespace.oid = table_constraint.connamespace
        WHERE constraint_namespace.nspname = 'public'
          AND table_constraint.conname IN (
            'admin_users_pkey',
            'admin_users_user_id_key',
            'admin_users_user_id_fkey',
            'admin_users_granted_by_fkey',
            'admin_users_revoked_by_fkey',
            'admin_users_lifecycle_check',
            'admin_users_no_self_grant_check',
            'admin_users_no_self_revoke_check'
          )
     ) OR EXISTS (
       SELECT 1
         FROM pg_catalog.pg_policy AS row_policy
        WHERE row_policy.polname = 'Users can inspect own administrator status'
     ) OR EXISTS (
       SELECT 1
         FROM pg_catalog.pg_trigger AS table_trigger
        WHERE table_trigger.tgname = 'update_admin_users_updated_at'
          AND NOT table_trigger.tgisinternal
     ) THEN
    RAISE EXCEPTION 'M3 duplicate guard: an administrator authorization object already exists';
  END IF;
END
$guard$;

CREATE TABLE public.admin_users (
  id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  user_id uuid NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  granted_by uuid,
  granted_at timestamp with time zone DEFAULT now() NOT NULL,
  revoked_by uuid,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT admin_users_pkey PRIMARY KEY (id),
  CONSTRAINT admin_users_user_id_key UNIQUE (user_id),
  CONSTRAINT admin_users_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT admin_users_granted_by_fkey FOREIGN KEY (granted_by)
    REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT admin_users_revoked_by_fkey FOREIGN KEY (revoked_by)
    REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT admin_users_lifecycle_check CHECK (
    ((is_active AND (revoked_by IS NULL) AND (revoked_at IS NULL))
    OR ((NOT is_active) AND (revoked_by IS NOT NULL) AND (revoked_at IS NOT NULL)))
  ),
  CONSTRAINT admin_users_no_self_grant_check CHECK (((granted_by IS NULL) OR (granted_by <> user_id))),
  CONSTRAINT admin_users_no_self_revoke_check CHECK (((revoked_by IS NULL) OR (revoked_by <> user_id)))
);

CREATE INDEX admin_users_granted_by_idx
  ON public.admin_users USING btree (granted_by)
  WHERE (granted_by IS NOT NULL);

CREATE INDEX admin_users_revoked_by_idx
  ON public.admin_users USING btree (revoked_by)
  WHERE (revoked_by IS NOT NULL);

CREATE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
PARALLEL SAFE
SET search_path TO ''
AS $$
  SELECT COALESCE(
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
        FROM public.admin_users AS administrator
       WHERE administrator.user_id = auth.uid()
         AND administrator.is_active
    ),
    false
  );
$$;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can inspect own administrator status"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING ((user_id = auth.uid()));

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.admin_users OWNER TO postgres;
ALTER FUNCTION public.is_admin() OWNER TO postgres;

REVOKE ALL ON TABLE public.admin_users FROM PUBLIC;
REVOKE ALL ON TABLE public.admin_users FROM anon;
REVOKE ALL ON TABLE public.admin_users FROM authenticated;
GRANT SELECT ON TABLE public.admin_users TO authenticated;
GRANT ALL ON TABLE public.admin_users TO service_role;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM authenticated;
REVOKE ALL ON FUNCTION public.is_admin() FROM service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

RESET statement_timeout;
RESET lock_timeout;
