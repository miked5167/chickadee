-- Executed only by the loopback-only fresh-bootstrap harness, inside a transaction.
INSERT INTO auth.users(id) VALUES ('41000000-0000-4000-8000-000000000001'), ('41000000-0000-4000-8000-000000000002');
INSERT INTO public.users(id) VALUES ('41000000-0000-4000-8000-000000000001'), ('41000000-0000-4000-8000-000000000002');
INSERT INTO public.companies(id,name,slug,description,country)
  VALUES ('42000000-0000-4000-8000-000000000001','Release fixture advisor','release-fixture-advisor','Preserved original description','CA');
SET LOCAL request.jwt.claim.sub = '41000000-0000-4000-8000-000000000001';
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  details jsonb := jsonb_build_object('relationship',repeat('a',30),'verification_details',repeat('b',60));
  selection text[] := ARRAY['services:advisor','pathways:junior','pathways:ncaa','player_level:aaa'];
BEGIN
  BEGIN
    PERFORM public.submit_directory_claim('42000000-0000-4000-8000-000000000001','owner@example.test',NULL,details,ARRAY['services:advisor','pathways:ncaa']);
    RAISE EXCEPTION 'Incomplete claim tags were accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  BEGIN
    PERFORM public.submit_directory_claim('42000000-0000-4000-8000-000000000001','owner@example.test',repeat('1',21),details,selection);
    RAISE EXCEPTION 'Oversize claim phone was accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  IF EXISTS(SELECT 1 FROM public.listing_claims WHERE company_id='42000000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'Invalid claim left a stored claim';
  END IF;
  PERFORM public.submit_directory_claim('42000000-0000-4000-8000-000000000001','owner@example.test','+1 555 010 0123',details,selection);
  IF (SELECT count(*) FROM public.claim_tags WHERE claim_id IN (SELECT id FROM public.listing_claims WHERE company_id='42000000-0000-4000-8000-000000000001')) <> 4 THEN
    RAISE EXCEPTION 'Private claim tags were not persisted';
  END IF;
  IF EXISTS(SELECT 1 FROM public.company_tags WHERE company_id='42000000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'Pending claim tags became public';
  END IF;
END $$;
SET LOCAL request.jwt.claim.sub = '41000000-0000-4000-8000-000000000002';
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM public.claim_tags WHERE claim_id IN (SELECT id FROM public.listing_claims WHERE company_id='42000000-0000-4000-8000-000000000001')) THEN
    RAISE EXCEPTION 'Another user could read the private claim tags';
  END IF;
  BEGIN
    PERFORM public.replace_company_tags('42000000-0000-4000-8000-000000000001',ARRAY['services:advisor','pathways:junior','pathways:ncaa']);
    RAISE EXCEPTION 'Another user could publish tags';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
-- Simulate the result of existing ownership review, without changing its workflow.
UPDATE public.listing_claims SET claim_status='approved' WHERE company_id='42000000-0000-4000-8000-000000000001';
UPDATE public.companies SET verified_owner_id='41000000-0000-4000-8000-000000000001',verified=true WHERE id='42000000-0000-4000-8000-000000000001';
SET LOCAL request.jwt.claim.sub = '41000000-0000-4000-8000-000000000001';
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  PERFORM public.replace_company_tags('42000000-0000-4000-8000-000000000001',ARRAY['services:advisor','pathways:junior','pathways:ncaa','player_level:aaa']);
  BEGIN
    PERFORM public.replace_company_tags('42000000-0000-4000-8000-000000000001',ARRAY['services:invented','pathways:junior','pathways:ncaa']);
    RAISE EXCEPTION 'Unknown tag was accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  IF (SELECT count(*) FROM public.company_tags WHERE company_id='42000000-0000-4000-8000-000000000001') <> 4 THEN
    RAISE EXCEPTION 'Failed save destroyed the previous selection';
  END IF;
  PERFORM public.replace_company_tags('42000000-0000-4000-8000-000000000001',ARRAY['services:agent','pathways:junior','pathways:professional','player_level:aaa']);
  IF (SELECT description FROM public.companies WHERE id='42000000-0000-4000-8000-000000000001') <> 'Preserved original description' THEN
    RAISE EXCEPTION 'Tag save changed profile text';
  END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
SELECT json_build_object(
  'catalog',json_build_object('groups',(SELECT json_agg(g) FROM public.directory_tag_groups g),'tags',(SELECT json_agg(t) FROM public.directory_tags t WHERE is_active)),
  'listings',(SELECT json_agg(json_build_object('id',c.id,'slug',c.slug,'name',c.name,'country',c.country,'state',c.state_province,'city',c.city,'description',c.description,'verified',c.verified,'logo_url',c.logo_url,'card_tags',(SELECT json_agg(t) FROM public.company_tags ct JOIN public.directory_tags t ON t.id=ct.tag_id WHERE ct.company_id=c.id))) FROM public.companies c WHERE c.id='42000000-0000-4000-8000-000000000001')
)::text;
RESET ROLE;
ROLLBACK;
