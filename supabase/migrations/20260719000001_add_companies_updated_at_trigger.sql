-- Add the one missing timestamp-maintenance trigger to public.companies.
-- This forward migration is intentionally fail-closed and definitions-only.

SET lock_timeout = '5s';
SET statement_timeout = '30s';

DO $guard$
DECLARE
  companies_oid oid := to_regclass('public.companies');
  timestamp_function_oid oid := to_regprocedure('public.update_updated_at_column()');
BEGIN
  IF companies_oid IS NULL OR NOT EXISTS (
    SELECT 1
      FROM pg_catalog.pg_class AS table_class
     WHERE table_class.oid = companies_oid
       AND table_class.relkind IN ('r', 'p')
  ) THEN
    RAISE EXCEPTION 'M2 prerequisite failed: public.companies does not exist as a table';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_catalog.pg_attribute AS column_attribute
     WHERE column_attribute.attrelid = companies_oid
       AND column_attribute.attname = 'updated_at'
       AND column_attribute.attnum > 0
       AND NOT column_attribute.attisdropped
       AND column_attribute.atttypid = 'pg_catalog.timestamptz'::pg_catalog.regtype
       AND column_attribute.atttypmod = -1
  ) THEN
    RAISE EXCEPTION 'M2 prerequisite failed: public.companies.updated_at is missing or is not timestamp with time zone';
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
    RAISE EXCEPTION 'M2 prerequisite failed: public.update_updated_at_column() differs from the adopted definition or attributes';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM pg_catalog.pg_trigger AS intended_trigger
     WHERE intended_trigger.tgrelid = companies_oid
       AND intended_trigger.tgname = 'update_companies_updated_at'
       AND NOT intended_trigger.tgisinternal
  ) THEN
    RAISE EXCEPTION 'M2 duplicate guard: public.companies trigger update_companies_updated_at already exists';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM pg_catalog.pg_trigger AS equivalent_trigger
     WHERE equivalent_trigger.tgrelid = companies_oid
       AND equivalent_trigger.tgfoid = timestamp_function_oid
       AND equivalent_trigger.tgname <> 'update_companies_updated_at'
       AND (equivalent_trigger.tgtype & 16) = 16
       AND NOT equivalent_trigger.tgisinternal
  ) THEN
    RAISE EXCEPTION 'M2 equivalent-trigger guard: a differently named companies UPDATE trigger already calls public.update_updated_at_column()';
  END IF;
END
$guard$;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

RESET statement_timeout;
RESET lock_timeout;
