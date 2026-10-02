-- Controlled company tags. This migration assigns no tags to existing listings.
-- Taxonomy data is intentionally separate in supabase/seeds/directory-tags.sql.
SET lock_timeout = '5s';
SET statement_timeout = '30s';

DO $guard$
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'Directory tags ownership guard: migration must run as postgres';
  END IF;
  IF to_regclass('public.companies') IS NULL
     OR to_regclass('public.listing_claims') IS NULL
     OR to_regprocedure('public.is_admin()') IS NULL
     OR to_regprocedure('auth.uid()') IS NULL THEN
    RAISE EXCEPTION 'Directory tags prerequisite guard: company, claim and administrator foundation required';
  END IF;
  IF to_regclass('public.directory_tag_groups') IS NOT NULL
     OR to_regclass('public.directory_tags') IS NOT NULL
     OR to_regclass('public.company_tags') IS NOT NULL
     OR to_regclass('public.claim_tags') IS NOT NULL
     OR to_regclass('public.directory_tag_suggestions') IS NOT NULL THEN
    RAISE EXCEPTION 'Directory tags duplicate guard: tag tables already exist';
  END IF;
END
$guard$;

CREATE TABLE public.directory_tag_groups (
  key text NOT NULL,
  label text NOT NULL,
  display_order integer DEFAULT 0 NOT NULL,
  is_core boolean DEFAULT false NOT NULL,
  filter_enabled boolean DEFAULT true NOT NULL,
  CONSTRAINT directory_tag_groups_core_check CHECK ((is_core = (key = ANY (ARRAY['services'::text, 'pathways'::text])))),
  CONSTRAINT directory_tag_groups_key_check CHECK ((key = ANY (ARRAY['services'::text, 'pathways'::text, 'player_level'::text, 'age_group'::text, 'regions'::text, 'languages'::text, 'price_range'::text]))),
  CONSTRAINT directory_tag_groups_label_check CHECK (((length(btrim(label)) >= 2) AND (length(btrim(label)) <= 100))),
  CONSTRAINT directory_tag_groups_order_check CHECK ((display_order >= 0)),
  CONSTRAINT directory_tag_groups_pkey PRIMARY KEY (key)
);
CREATE TABLE public.directory_tags (
  id text NOT NULL,
  group_key text NOT NULL,
  slug text NOT NULL,
  label text NOT NULL,
  parent_id text,
  display_order integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT directory_tags_group_id_key UNIQUE (id, group_key),
  CONSTRAINT directory_tags_group_key_fkey FOREIGN KEY (group_key) REFERENCES public.directory_tag_groups(key) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT directory_tags_group_slug_key UNIQUE (group_key, slug),
  CONSTRAINT directory_tags_identity_check CHECK ((id = ((group_key || ':'::text) || slug))),
  CONSTRAINT directory_tags_label_check CHECK (((length(btrim(label)) >= 2) AND (length(btrim(label)) <= 100))),
  CONSTRAINT directory_tags_order_check CHECK ((display_order >= 0)),
  CONSTRAINT directory_tags_parent_check CHECK (((parent_id IS NULL) OR (parent_id <> id))),
  CONSTRAINT directory_tags_parent_id_fkey FOREIGN KEY (parent_id, group_key) REFERENCES public.directory_tags(id, group_key) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT directory_tags_pkey PRIMARY KEY (id),
  CONSTRAINT directory_tags_slug_check CHECK (((slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text) AND (length(slug) <= 80)))
);
CREATE TABLE public.company_tags (
  company_id uuid NOT NULL,
  tag_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT company_tags_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT company_tags_pkey PRIMARY KEY (company_id, tag_id),
  CONSTRAINT company_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.directory_tags(id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE TABLE public.claim_tags (
  claim_id uuid NOT NULL,
  tag_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT claim_tags_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES public.listing_claims(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT claim_tags_pkey PRIMARY KEY (claim_id, tag_id),
  CONSTRAINT claim_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.directory_tags(id) ON UPDATE RESTRICT ON DELETE RESTRICT
);
CREATE TABLE public.directory_tag_suggestions (
  id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  requester_user_id uuid NOT NULL,
  company_id uuid,
  claim_id uuid,
  group_key text NOT NULL,
  label text NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  approved_tag_id text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  review_note text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT directory_tag_suggestions_approved_tag_fkey FOREIGN KEY (approved_tag_id, group_key) REFERENCES public.directory_tags(id, group_key) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT directory_tag_suggestions_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES public.listing_claims(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT directory_tag_suggestions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  CONSTRAINT directory_tag_suggestions_context_check CHECK ((num_nonnulls(company_id, claim_id) = 1)),
  CONSTRAINT directory_tag_suggestions_group_key_fkey FOREIGN KEY (group_key) REFERENCES public.directory_tag_groups(key) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT directory_tag_suggestions_label_check CHECK (((length(btrim(label)) >= 2) AND (length(btrim(label)) <= 100))),
  CONSTRAINT directory_tag_suggestions_note_check CHECK (((review_note IS NULL) OR (length(review_note) <= 1000))),
  CONSTRAINT directory_tag_suggestions_pkey PRIMARY KEY (id),
  CONSTRAINT directory_tag_suggestions_reason_check CHECK (((length(btrim(reason)) >= 10) AND (length(btrim(reason)) <= 1000))),
  CONSTRAINT directory_tag_suggestions_requester_fkey FOREIGN KEY (requester_user_id) REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT directory_tag_suggestions_review_check CHECK ((((status = 'pending'::text) AND (approved_tag_id IS NULL) AND (reviewed_by IS NULL) AND (reviewed_at IS NULL) AND (review_note IS NULL)) OR ((status = 'approved'::text) AND (approved_tag_id IS NOT NULL) AND (reviewed_by IS NOT NULL) AND (reviewed_at IS NOT NULL)) OR ((status = 'rejected'::text) AND (approved_tag_id IS NULL) AND (reviewed_by IS NOT NULL) AND (reviewed_at IS NOT NULL)))),
  CONSTRAINT directory_tag_suggestions_reviewer_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT directory_tag_suggestions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);
CREATE INDEX company_tags_tag_id_idx ON public.company_tags USING btree (tag_id, company_id);
CREATE INDEX claim_tags_tag_id_idx ON public.claim_tags USING btree (tag_id);
CREATE INDEX directory_tags_parent_idx ON public.directory_tags USING btree (parent_id) WHERE (parent_id IS NOT NULL);
CREATE INDEX directory_tag_suggestions_queue_idx ON public.directory_tag_suggestions USING btree (status, created_at);
CREATE INDEX directory_tag_suggestions_requester_idx ON public.directory_tag_suggestions USING btree (requester_user_id);
CREATE UNIQUE INDEX directory_tag_suggestions_pending_idx ON public.directory_tag_suggestions USING btree (requester_user_id, group_key, lower(btrim(label))) WHERE (status = 'pending'::text);

-- Validation is shared by company and claim writes. Other groups do not consume
-- the 3-5 core slots; a price range is optional and single-select.
CREATE FUNCTION public.validate_directory_tag_selection(p_tag_ids text[]) RETURNS text[]
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $$
DECLARE
  selected_ids text[];
  core_count integer;
  service_count integer;
  price_count integer;
BEGIN
  IF p_tag_ids IS NULL OR cardinality(p_tag_ids) NOT BETWEEN 3 AND 100
     OR array_ndims(p_tag_ids) <> 1 OR array_position(p_tag_ids, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'Choose valid tag IDs.' USING ERRCODE = '22023';
  END IF;
  SELECT array_agg(id ORDER BY id) INTO selected_ids FROM (SELECT DISTINCT unnest(p_tag_ids) AS id) AS selected;
  IF cardinality(selected_ids) <> cardinality(p_tag_ids) THEN
    RAISE EXCEPTION 'Duplicate tags are not allowed.' USING ERRCODE = '22023';
  END IF;
  IF (SELECT count(*) FROM public.directory_tags WHERE id = ANY(selected_ids) AND is_active) <> cardinality(selected_ids) THEN
    RAISE EXCEPTION 'Choose only active, approved tags.' USING ERRCODE = '22023';
  END IF;
  SELECT count(*) FILTER (WHERE group_key IN ('services', 'pathways')),
         count(*) FILTER (WHERE group_key = 'services'),
         count(*) FILTER (WHERE group_key = 'price_range')
    INTO core_count, service_count, price_count
    FROM public.directory_tags WHERE id = ANY(selected_ids);
  IF core_count NOT BETWEEN 3 AND 5 OR service_count < 1 THEN
    RAISE EXCEPTION 'Choose 3 to 5 Services and Pathways tags, including at least one Service.' USING ERRCODE = '22023';
  END IF;
  IF price_count > 1 THEN
    RAISE EXCEPTION 'Choose at most one price range.' USING ERRCODE = '22023';
  END IF;
  RETURN selected_ids;
END;
$$;

-- Clients cannot directly mutate assignment tables. These narrowly scoped
-- functions authorize the actor, lock the parent and replace the set atomically.
CREATE FUNCTION public.replace_company_tags(p_company_id uuid, p_tag_ids text[]) RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  company_owner uuid;
  selected_ids text[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in required.' USING ERRCODE = '42501';
  END IF;
  SELECT verified_owner_id INTO company_owner FROM public.companies WHERE id = p_company_id FOR UPDATE;
  IF NOT FOUND OR (company_owner IS DISTINCT FROM auth.uid() AND NOT public.is_admin()) THEN
    RAISE EXCEPTION 'Listing access denied.' USING ERRCODE = '42501';
  END IF;
  selected_ids := public.validate_directory_tag_selection(p_tag_ids);
  DELETE FROM public.company_tags WHERE company_id = p_company_id;
  INSERT INTO public.company_tags(company_id, tag_id) SELECT p_company_id, unnest(selected_ids);
  RETURN selected_ids;
END;
$$;

CREATE FUNCTION public.replace_claim_tags(p_claim_id uuid, p_tag_ids text[]) RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  selected_ids text[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in required.' USING ERRCODE = '42501';
  END IF;
  PERFORM 1 FROM public.listing_claims
    WHERE id = p_claim_id AND claimant_user_id = auth.uid() AND claim_status IN ('pending', 'under_review') FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending claim access denied.' USING ERRCODE = '42501';
  END IF;
  selected_ids := public.validate_directory_tag_selection(p_tag_ids);
  DELETE FROM public.claim_tags WHERE claim_id = p_claim_id;
  INSERT INTO public.claim_tags(claim_id, tag_id) SELECT p_claim_id, unnest(selected_ids);
  RETURN selected_ids;
END;
$$;

-- Reviewing a suggestion creates/reuses a controlled tag. It never assigns
-- that tag to a company or grants ownership of a listing.
CREATE FUNCTION public.review_directory_tag_suggestion(p_suggestion_id uuid, p_action text, p_slug text, p_label text, p_note text) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $_$
DECLARE
  suggestion public.directory_tag_suggestions%ROWTYPE;
  approved_id text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required.' USING ERRCODE = '42501';
  END IF;
  IF p_action IS NULL OR p_action NOT IN ('approve', 'reject') OR length(COALESCE(p_note, '')) > 1000 THEN
    RAISE EXCEPTION 'Invalid review action or note.' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO suggestion FROM public.directory_tag_suggestions WHERE id = p_suggestion_id FOR UPDATE;
  IF NOT FOUND OR suggestion.status <> 'pending' THEN
    RAISE EXCEPTION 'Suggestion is unavailable or already reviewed.' USING ERRCODE = '22023';
  END IF;
  IF p_action = 'approve' THEN
    IF p_slug IS NULL OR p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR length(p_slug) > 80
       OR p_label IS NULL OR length(btrim(p_label)) NOT BETWEEN 2 AND 100 THEN
      RAISE EXCEPTION 'A valid controlled slug and label are required.' USING ERRCODE = '22023';
    END IF;
    approved_id := suggestion.group_key || ':' || p_slug;
    INSERT INTO public.directory_tags(id, group_key, slug, label)
      VALUES (approved_id, suggestion.group_key, p_slug, btrim(p_label)) ON CONFLICT (id) DO NOTHING;
    PERFORM 1 FROM public.directory_tags WHERE id = approved_id AND is_active AND label = btrim(p_label);
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Existing tag is inactive or has a different label.' USING ERRCODE = '22023';
    END IF;
  END IF;
  UPDATE public.directory_tag_suggestions
    SET status = CASE WHEN p_action = 'approve' THEN 'approved' ELSE 'rejected' END,
        approved_tag_id = approved_id, reviewed_by = auth.uid(), reviewed_at = now(), review_note = NULLIF(btrim(p_note), '')
    WHERE id = p_suggestion_id;
  RETURN approved_id;
END;
$_$;

ALTER TABLE public.directory_tag_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_tag_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directory tag groups are public" ON public.directory_tag_groups FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Active directory tags are public" ON public.directory_tags FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "Company tags are public" ON public.company_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Claim tags are private" ON public.claim_tags FOR SELECT TO authenticated USING ((public.is_admin() OR (EXISTS (SELECT 1 FROM public.listing_claims WHERE ((listing_claims.id = claim_tags.claim_id) AND (listing_claims.claimant_user_id = auth.uid()))))));
CREATE POLICY "Tag suggestions are private" ON public.directory_tag_suggestions FOR SELECT TO authenticated USING (((requester_user_id = auth.uid()) OR public.is_admin()));
CREATE POLICY "Advisors can suggest tags" ON public.directory_tag_suggestions FOR INSERT TO authenticated WITH CHECK (((requester_user_id = auth.uid()) AND (status = 'pending'::text) AND ((EXISTS (SELECT 1 FROM public.companies WHERE ((companies.id = directory_tag_suggestions.company_id) AND (companies.verified_owner_id = auth.uid())))) OR (EXISTS (SELECT 1 FROM public.listing_claims WHERE ((listing_claims.id = directory_tag_suggestions.claim_id) AND (listing_claims.claimant_user_id = auth.uid()) AND (listing_claims.claim_status = ANY (ARRAY['pending'::public.claim_status, 'under_review'::public.claim_status]))))))));

ALTER TABLE public.directory_tag_groups OWNER TO postgres;
ALTER TABLE public.directory_tags OWNER TO postgres;
ALTER TABLE public.company_tags OWNER TO postgres;
ALTER TABLE public.claim_tags OWNER TO postgres;
ALTER TABLE public.directory_tag_suggestions OWNER TO postgres;
ALTER FUNCTION public.validate_directory_tag_selection OWNER TO postgres;
ALTER FUNCTION public.replace_company_tags OWNER TO postgres;
ALTER FUNCTION public.replace_claim_tags OWNER TO postgres;
ALTER FUNCTION public.review_directory_tag_suggestion OWNER TO postgres;

REVOKE ALL ON TABLE public.directory_tag_groups FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.directory_tags FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.company_tags FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.claim_tags FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.directory_tag_suggestions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.directory_tag_groups TO anon;
GRANT SELECT ON TABLE public.directory_tag_groups TO authenticated;
GRANT SELECT ON TABLE public.directory_tags TO anon;
GRANT SELECT ON TABLE public.directory_tags TO authenticated;
GRANT SELECT ON TABLE public.company_tags TO anon;
GRANT SELECT ON TABLE public.company_tags TO authenticated;
GRANT SELECT ON TABLE public.claim_tags TO authenticated;
GRANT SELECT, INSERT(requester_user_id, company_id, claim_id, group_key, label, reason) ON TABLE public.directory_tag_suggestions TO authenticated;
GRANT ALL ON TABLE public.directory_tag_groups TO service_role;
GRANT ALL ON TABLE public.directory_tags TO service_role;
GRANT ALL ON TABLE public.company_tags TO service_role;
GRANT ALL ON TABLE public.claim_tags TO service_role;
GRANT ALL ON TABLE public.directory_tag_suggestions TO service_role;

REVOKE ALL ON FUNCTION public.validate_directory_tag_selection FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.replace_company_tags FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.replace_claim_tags FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.review_directory_tag_suggestion FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_directory_tag_selection TO authenticated;
GRANT EXECUTE ON FUNCTION public.replace_company_tags TO authenticated;
GRANT EXECUTE ON FUNCTION public.replace_claim_tags TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_directory_tag_suggestion TO authenticated;

RESET statement_timeout;
RESET lock_timeout;
