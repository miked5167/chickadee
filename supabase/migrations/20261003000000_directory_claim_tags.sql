-- Save the pending claim and its private tag selection in one transaction.
-- Existing ownership review and authentication mechanisms are unchanged.
SET lock_timeout = '5s';
SET statement_timeout = '30s';
DO $guard$
BEGIN
  IF current_user <> 'postgres' OR to_regprocedure('public.validate_directory_tag_selection(text[])') IS NULL
     OR to_regclass('public.claim_tags') IS NULL THEN
    RAISE EXCEPTION 'Claim tag transaction requires the postgres owner and directory tag foundation';
  END IF;
  IF to_regprocedure('public.submit_directory_claim(uuid,text,text,jsonb,text[])') IS NOT NULL THEN
    RAISE EXCEPTION 'Claim tag transaction already exists';
  END IF;
END
$guard$;

CREATE FUNCTION public.submit_directory_claim(p_company_id uuid, p_business_email text, p_business_phone text, p_verification_data jsonb, p_tag_ids text[]) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  selected_ids text[];
  new_claim public.listing_claims%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in required.' USING ERRCODE = '42501';
  END IF;
  IF p_business_email IS NULL OR length(btrim(p_business_email)) NOT BETWEEN 3 AND 255
     OR length(COALESCE(p_business_phone, '')) > 30
     OR jsonb_typeof(p_verification_data) IS DISTINCT FROM 'object'
     OR length(COALESCE(p_verification_data->>'relationship', '')) NOT BETWEEN 20 AND 500
     OR length(COALESCE(p_verification_data->>'verification_details', '')) NOT BETWEEN 50 AND 1500 THEN
    RAISE EXCEPTION 'Invalid claim information.' USING ERRCODE = '22023';
  END IF;
  PERFORM 1 FROM public.companies WHERE id = p_company_id AND verified_owner_id IS NULL FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing unavailable for claiming.' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM public.listing_claims WHERE company_id = p_company_id AND claimant_user_id = auth.uid() AND claim_status IN ('pending', 'under_review')) THEN
    RAISE EXCEPTION 'An active claim already exists.' USING ERRCODE = '23505';
  END IF;
  selected_ids := public.validate_directory_tag_selection(p_tag_ids);
  INSERT INTO public.listing_claims(company_id, claimant_user_id, claim_status, verification_method, verification_data, business_email, business_phone)
    VALUES (p_company_id, auth.uid(), 'pending', 'manual', p_verification_data, btrim(p_business_email), NULLIF(btrim(p_business_phone), '')) RETURNING * INTO new_claim;
  INSERT INTO public.claim_tags(claim_id, tag_id) SELECT new_claim.id, unnest(selected_ids);
  RETURN jsonb_build_object('id', new_claim.id, 'claim_status', new_claim.claim_status, 'submitted_at', new_claim.submitted_at);
END;
$$;
ALTER FUNCTION public.submit_directory_claim OWNER TO postgres;
REVOKE ALL ON FUNCTION public.submit_directory_claim FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_directory_claim TO authenticated;
RESET statement_timeout;
RESET lock_timeout;
