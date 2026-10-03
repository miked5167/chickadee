-- Read-only release observations. Requires the existing directory tag foundation.
-- Safe against production: no fixtures, tag assignments, or migration changes.
BEGIN READ ONLY;
SELECT jsonb_build_object(
  'observed_at', current_timestamp,
  'companies', (SELECT count(*) FROM public.companies),
  'groups', (SELECT count(*) FROM public.directory_tag_groups),
  'active_tags', (SELECT count(*) FROM public.directory_tags WHERE is_active),
  'company_tag_assignments', (SELECT count(*) FROM public.company_tags),
  'private_claim_tag_assignments', (SELECT count(*) FROM public.claim_tags),
  'price_filter_enabled', (SELECT filter_enabled FROM public.directory_tag_groups WHERE key = 'price_range'),
  'claim_phone_max_length', (SELECT character_maximum_length FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listing_claims' AND column_name = 'business_phone'),
  'migration_history', (SELECT jsonb_agg(jsonb_build_object('version', version, 'name', name) ORDER BY version)
    FROM supabase_migrations.schema_migrations),
  'claim_submit_present', to_regprocedure('public.submit_directory_claim(uuid,text,text,jsonb,text[])') IS NOT NULL,
  'claim_submit_anon_execute', has_function_privilege('anon',
    to_regprocedure('public.submit_directory_claim(uuid,text,text,jsonb,text[])'), 'EXECUTE'),
  'claim_submit_authenticated_execute', has_function_privilege('authenticated',
    to_regprocedure('public.submit_directory_claim(uuid,text,text,jsonb,text[])'), 'EXECUTE'),
  'tag_tables', (SELECT jsonb_agg(jsonb_build_object('table', c.relname, 'rls', c.relrowsecurity) ORDER BY c.relname)
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname IN
      ('directory_tag_groups', 'directory_tags', 'company_tags', 'claim_tags', 'directory_tag_suggestions')),
  'tag_functions', (SELECT jsonb_agg(jsonb_build_object(
    'signature', p.oid::regprocedure::text, 'owner', pg_get_userbyid(p.proowner),
    'security_definer', p.prosecdef, 'configuration', p.proconfig) ORDER BY p.proname)
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname IN
      ('validate_directory_tag_selection', 'replace_company_tags', 'replace_claim_tags',
       'review_directory_tag_suggestion', 'submit_directory_claim'))
) AS release_preflight;
COMMIT;
