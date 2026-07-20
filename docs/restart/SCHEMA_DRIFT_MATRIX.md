# Production Schema Drift Matrix

**Evidence date:** 2026-07-19
**Scope:** Production application schema, repository SQL, generated/manual database types, application queries, and database/deployment documentation
**Production changes made:** None

## Evidence and classification

This matrix was derived from the validated protected backup at the path recorded in `PRODUCTION_BASELINE.md`. Before use, `status.json` was confirmed as `success`, all 21 entries in `SHA256SUMS.txt` were independently hashed and matched, and the 1,317-entry archive inventory was used without reading table rows. The catalog CSVs are authoritative for catalog state and exact counts. Schema-only SQL was extracted inside the protected backup directory solely to inventory enum values and index definitions; it remains outside Git.

Classification terms:

- **Production**: present in the validated production catalog.
- **Migration**: represented in `supabase/migrations`.
- **Script**: represented only by SQL under `scripts/`.
- **Code**: queried or structurally expected by application/runtime code.
- **Compatible**: the repository meaning and production definition agree closely enough to use the same object without entity ambiguity.
- **Incompatible**: the name exists in both places but its entity meaning, columns, relationships, or security contract conflicts.
- **Obsolete**: a repository concept superseded by the company-centric model.
- **Decision**: a product/schema decision is required before implementation.

## Production application schema

All five application tables are owned by `postgres`, have RLS enabled but not forced, and have the standard Supabase table grants (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, and `TRIGGER`) to `anon`, `authenticated`, `service_role`, and `postgres`. Effective client access is therefore determined by RLS. Grant breadth should be reviewed in a later forward migration, but it is reproducible catalog state rather than proof of authorization by itself.

### `public.companies` — 202 rows

Business and directory-listing entity.

| # | Column | Type | Null | Default |
|---:|---|---|---|---|
| 1 | `id` | `uuid` | no | `uuid_generate_v4()` |
| 2 | `name` | `varchar` | no | — |
| 3 | `slug` | `varchar` | no | — |
| 4 | `description` | `text` | yes | — |
| 5 | `website_url` | `varchar` | yes | — |
| 6 | `phone` | `varchar` | yes | — |
| 7 | `email` | `varchar` | yes | — |
| 8 | `address` | `text` | yes | — |
| 9 | `city` | `varchar` | yes | — |
| 10 | `state_province` | `varchar` | yes | — |
| 11 | `country` | `varchar` | yes | `'Canada'` |
| 12 | `location` | `public.geography` | yes | — |
| 13 | `facebook_url` | `varchar` | yes | — |
| 14 | `instagram_url` | `varchar` | yes | — |
| 15 | `twitter_url` | `varchar` | yes | — |
| 16 | `logo_url` | `varchar` | yes | — |
| 17 | `verified` | `boolean` | yes | `false` |
| 18 | `verified_owner_id` | `uuid` | yes | — |
| 19 | `verification_date` | `timestamptz` | yes | — |
| 20 | `search_vector` | `tsvector` | yes | — |
| 21 | `created_at` | `timestamptz` | yes | `now()` |
| 22 | `updated_at` | `timestamptz` | yes | `now()` |

Constraints: `companies_pkey` primary key on `id`; `companies_slug_key` unique on `slug`; `companies_verified_owner_id_fkey` from `verified_owner_id` to `public.users(id)`; checks `valid_email`, `valid_name_length` (at least 3 characters), and `valid_slug_format`.

Indexes beyond constraint-backed indexes: `companies_location_idx` (GiST `location`), `companies_search_vector_idx` (GIN `search_vector`), `companies_slug_idx` (btree `slug`, redundant with the unique constraint), `companies_verified_idx` (partial btree where `verified = true`), and `companies_verified_owner_idx` (btree `verified_owner_id`).

Policies: public `SELECT` to `anon, authenticated` with `true`; owner `UPDATE` to `authenticated` where `verified_owner_id = auth.uid()`. There is no owner insert/delete policy and no `updated_at` trigger on this table.

### `public.advisors` — 177 rows

Individual people associated with a company.

| # | Column | Type | Null | Default |
|---:|---|---|---|---|
| 1 | `id` | `uuid` | no | `uuid_generate_v4()` |
| 2 | `company_id` | `uuid` | no | — |
| 3 | `name` | `varchar` | no | — |
| 4 | `title` | `varchar` | yes | — |
| 5 | `bio` | `text` | yes | — |
| 6 | `specialties` | `text[]` | yes | — |
| 7 | `years_experience` | `integer` | yes | — |
| 8 | `playing_background` | `text` | yes | — |
| 9 | `certifications` | `text[]` | yes | — |
| 10 | `contact_email` | `varchar` | yes | — |
| 11 | `contact_phone` | `varchar` | yes | — |
| 12 | `profile_image_url` | `varchar` | yes | — |
| 13 | `display_order` | `integer` | yes | `0` |
| 14 | `active` | `boolean` | yes | `true` |
| 15 | `created_at` | `timestamptz` | yes | `now()` |
| 16 | `updated_at` | `timestamptz` | yes | `now()` |

Constraints: primary key; `company_id -> companies(id) ON DELETE CASCADE`; checks for non-negative display order, experience from 0 through 50, valid optional email, and name length of at least 2.

Indexes: `advisors_active_idx` (partial btree where active), `advisors_company_idx` (btree `company_id`), plus the primary-key index.

Policies: public `SELECT` of active people; company-owner `ALL` where the related company has `verified_owner_id = auth.uid()`. Trigger `update_advisors_updated_at` calls `update_updated_at_column()` before update.

### `public.listing_claims` — 0 rows

Claims target companies and authenticated application users.

| # | Column | Type | Null | Default |
|---:|---|---|---|---|
| 1 | `id` | `uuid` | no | `uuid_generate_v4()` |
| 2 | `company_id` | `uuid` | no | — |
| 3 | `claimant_user_id` | `uuid` | no | — |
| 4 | `claim_status` | `public.claim_status` | yes | `pending` |
| 5 | `verification_method` | `public.verification_method` | yes | — |
| 6 | `verification_data` | `jsonb` | yes | `{}` |
| 7 | `business_email` | `varchar` | yes | — |
| 8 | `business_phone` | `varchar` | yes | — |
| 9 | `supporting_documents` | `text[]` | yes | — |
| 10 | `admin_notes` | `text` | yes | — |
| 11 | `submitted_at` | `timestamptz` | yes | `now()` |
| 12 | `reviewed_at` | `timestamptz` | yes | — |
| 13 | `reviewed_by` | `uuid` | yes | — |
| 14 | `created_at` | `timestamptz` | yes | `now()` |
| 15 | `updated_at` | `timestamptz` | yes | `now()` |

Constraints: primary key; `company_id -> companies(id) ON DELETE CASCADE`; claimant and reviewer FKs to `public.users(id)`; `valid_business_email`; exclusion constraint `one_active_claim_per_company` preventing more than one `pending` or `under_review` claim for a company.

Indexes: `listing_claims_claimant_idx`, `listing_claims_company_idx`, `listing_claims_status_idx`, plus indexes backing the primary and exclusion constraints.

Policies: authenticated users may insert only with their own `claimant_user_id`, view their own claims, and update their own pending claims. Trigger `update_listing_claims_updated_at` maintains `updated_at`. There is no deployed administrator policy; service-role clients currently bypass RLS for administration.

### `public.media_content` — 0 rows

Company media metadata.

| # | Column | Type | Null | Default |
|---:|---|---|---|---|
| 1 | `id` | `uuid` | no | `uuid_generate_v4()` |
| 2 | `company_id` | `uuid` | no | — |
| 3 | `file_name` | `varchar` | no | — |
| 4 | `file_path` | `varchar` | no | — |
| 5 | `file_type` | `public.media_type` | no | — |
| 6 | `file_size` | `integer` | no | — |
| 7 | `mime_type` | `varchar` | no | — |
| 8 | `caption` | `text` | yes | — |
| 9 | `display_order` | `integer` | yes | `0` |
| 10 | `is_featured` | `boolean` | yes | `false` |
| 11 | `is_introduction_video` | `boolean` | yes | `false` |
| 12 | `moderation_status` | `public.moderation_status` | yes | `pending` |
| 13 | `uploaded_by` | `uuid` | no | — |
| 14 | `created_at` | `timestamptz` | yes | `now()` |
| 15 | `updated_at` | `timestamptz` | yes | `now()` |

Constraints: primary key; company FK with cascade; uploader FK to `public.users`; checks for non-negative display order and file size no greater than 10 MiB.

Indexes: company btree; partial featured and introduction-video indexes; primary key. Policies allow public reads only for approved media and company-owner `ALL`. Trigger maintains `updated_at`.

### `public.users` — 0 rows

Application profile keyed one-to-one to Supabase Auth.

| # | Column | Type | Null | Default |
|---:|---|---|---|---|
| 1 | `id` | `uuid` | no | — |
| 2 | `user_type` | `public.user_type` | yes | `searcher` |
| 3 | `first_name` | `varchar` | yes | — |
| 4 | `last_name` | `varchar` | yes | — |
| 5 | `search_preferences` | `jsonb` | yes | `{}` |
| 6 | `contact_history` | `jsonb` | yes | `[]` |
| 7 | `created_at` | `timestamptz` | yes | `now()` |
| 8 | `updated_at` | `timestamptz` | yes | `now()` |

Constraints: primary key and `id -> auth.users(id) ON DELETE CASCADE`. The sole policy grants authenticated `ALL` only when `id = auth.uid()`. Trigger maintains `updated_at`.

### Production enums, function, and triggers

| Enum | Values |
|---|---|
| `claim_status` | `pending`, `under_review`, `approved`, `rejected` |
| `verification_method` | `email`, `phone`, `document`, `manual` |
| `media_type` | `photo`, `video` |
| `moderation_status` | `pending`, `approved`, `rejected` |
| `user_type` | `searcher`, `advisor` |

The only custom application function is `public.update_updated_at_column() RETURNS trigger`, owned by `postgres`, PL/pgSQL, volatile, `SECURITY INVOKER`. It assigns `NEW.updated_at = now()` and returns `NEW`. Four enabled application triggers call it on `advisors`, `listing_claims`, `media_content`, and `users`. `companies` has no corresponding trigger despite having `updated_at`.

Production has no `supabase_migrations.schema_migrations` relation. There is therefore no standard Supabase migration history to match to repository versions.

### Exact production object-name register

This register makes every catalog object independently traceable to the protected CSVs.

| Kind | Table | Exact names |
|---|---|---|
| Constraints | `companies` | `companies_pkey`, `companies_slug_key`, `companies_verified_owner_id_fkey`, `valid_email`, `valid_name_length`, `valid_slug_format` |
| Constraints | `advisors` | `advisors_pkey`, `advisors_company_id_fkey`, `advisors_display_order_check`, `advisors_years_experience_check`, `valid_advisor_email`, `valid_advisor_name_length` |
| Constraints | `listing_claims` | `listing_claims_pkey`, `listing_claims_company_id_fkey`, `listing_claims_claimant_user_id_fkey`, `listing_claims_reviewed_by_fkey`, `one_active_claim_per_company`, `valid_business_email` |
| Constraints | `media_content` | `media_content_pkey`, `media_content_company_id_fkey`, `media_content_uploaded_by_fkey`, `media_content_display_order_check`, `media_content_file_size_check` |
| Constraints | `users` | `users_pkey`, `users_id_fkey` |
| Indexes | `companies` | `companies_location_idx`, `companies_search_vector_idx`, `companies_slug_idx`, `companies_verified_idx`, `companies_verified_owner_idx` plus constraint-backed indexes |
| Indexes | `advisors` | `advisors_active_idx`, `advisors_company_idx` plus primary-key index |
| Indexes | `listing_claims` | `listing_claims_claimant_idx`, `listing_claims_company_idx`, `listing_claims_status_idx` plus primary/exclusion indexes |
| Indexes | `media_content` | `media_content_company_idx`, `media_content_featured_idx`, `media_content_intro_video_idx` plus primary-key index |
| Indexes | `users` | primary-key index only |
| Policies | `companies` | `Public read access for companies`; `Company owners can update their listings` |
| Policies | `advisors` | `Public read access for advisors`; `Company owners can manage advisors` |
| Policies | `listing_claims` | `Users can create claims`; `Users can view their own claims`; `Users can update their pending claims` |
| Policies | `media_content` | `Public read access for approved media`; `Company owners can manage media` |
| Policies | `users` | `Users can view and update their own profile` |
| Triggers | application | `update_advisors_updated_at`, `update_listing_claims_updated_at`, `update_media_content_updated_at`, `update_users_updated_at` |

## Object-by-object drift

| Object | Production | Migration | Script | Code | Classification and required action |
|---|:---:|:---:|:---:|:---:|---|
| `companies` | yes | no | no | yes | Production-compatible in public reads; **missing but required** from reproducible migrations. Retain as business/listing entity. |
| `advisors` (people) | yes | no | no | public page only | Production-compatible only where queried by `company_id`; **definition-incompatible** with every migration and legacy script using the same name for businesses. |
| `listing_claims` (company claim) | yes | alters incompatible object | creates incompatible object | yes | **Definition-incompatible**: production uses `company_id`, `claim_status`, and `claimant_user_id`; legacy code/SQL uses `advisor_id`, `status`, claimant email, and later verification-token fields. |
| `media_content` | yes | no | no | no direct DB access | **Missing from migrations** and currently unused by application code; retain production name and decide whether Cloudinary metadata should converge here. |
| `users` | yes | no | no | no | **Missing from migrations**; target application profile. Code instead expects `users_public`. |
| `reviews` | no | alters assumed table | legacy create | yes | **Missing but required**. Create company-targeted table; do not recreate `advisor_id`. Reconcile `reviewer_id` versus `user_id`. |
| `leads` | no | alters assumed table | legacy create | yes | **Missing but required**. Create with `company_id`; current `advisor_id` meaning is obsolete. |
| `click_tracking` | no | no | legacy create | yes | **Missing but required** for current analytics; create with `company_id` or replace with a named event model. |
| `listing_views` | no | no | legacy create | yes | **Missing but required** for dashboards; create with `company_id`. No current public insert path was found. |
| `admin_users` | no | creates | no | yes | **Missing but required** for production admin auth. Migration policies are probably recursive and require replacement, not direct application. |
| `advisor_team_members` | no | creates | no | yes | **Probably obsolete** because production `advisors` already represents people. Route data to `advisors`; do not create a second people table. |
| `notifications` | no | creates | no | no DB query found | **Future product decision**. If retained, target `user_id` and optionally explicit `company_id`; legacy `advisor_id` is ambiguous. |
| `users_public` | no | no | creates | yes | **Probably obsolete**. Consolidate needed author/display fields into `public.users` or introduce a deliberate profile view; do not keep two unexplained profile tables. |
| `csv_import_logs` | no | no | creates | yes | **Future operational decision**. If kept, define RLS/audit retention and make imports company-centric. |
| `blog_categories` | no | no | creates | yes | **Future product/migration decision**; application expects it but production does not contain it. |
| `blog_tags` | no | no | creates | yes | Same as above. |
| `blog_posts` | no | no | creates | yes | Same as above; `related_advisor_id` must become explicit `related_company_id` if it links listings. |
| `blog_post_tags` | no | no | creates | yes | Same as above. |
| `blog_comments` | no | no | creates | no active query found | Probably deferred/obsolete until comments are a confirmed product requirement. |
| `blog_post_views` | no | no | creates | yes | Future decision; separate from company listing analytics. |
| `update_updated_at_column()` | yes | no | no | implicit | **Missing but required** from migrations; retain and apply consistently, including `companies`. |
| legacy rating/data-quality/blog functions (7) | no | no | yes | implicit expectations | **Not deployed**. Rating aggregation must be redesigned for company reviews; blog functions depend on the blog decision. |
| `update_advisor_team_count()` | no | yes | no | implicit | **Obsolete/incompatible** because production `advisors` is the team itself. |
| `update_admin_users_updated_at()` | no | yes | no | implicit | Missing with `admin_users`; use the shared timestamp function instead. |
| `search_advisors_by_distance()` | no | no | yes | RPC in script/test | **Definition-incompatible**; redesign as company search or query `companies.location`. |
| `update_postgis_locations()` / `auto_update_location()` | no | no | yes | RPC/scripts | **Definition-incompatible**; legacy latitude/longitude columns do not exist in production. |
| legacy 31 RLS policies | no | no | yes | assumed | **Definition-incompatible** and outside migration history. Do not apply. |
| production 10 RLS policies | yes | no | no | relied upon | **Missing but required** from reproducible migrations; retain semantics initially and add explicit admin authorization. |

## Tracked migration classification

Every tracked migration assumes a legacy database state and none has a corresponding production migration-history row.

| File | Objects/actions | Classification |
|---|---|---|
| `supabase/migrations/20250104000000_claim_improvements.sql` | Alters legacy claims/reviews/advisors/leads; creates `advisor_team_members`, `notifications`, two functions/triggers/indexes | **Incompatible and unsafe to apply**. Assumes missing tables; treats advisor IDs as company IDs; duplicates production people model; contains unguarded DDL. Preserve as historical evidence only. |
| `20251109000000_add_advisor_profile_fields.sql` | Adds 13 business/profile fields and four indexes to `advisors`; copies specialties | **Incompatible** with person-table definition and contains a data update. Future equivalent fields belong primarily on `companies`. |
| `20251110000000_add_pricing_fields.sql` | Adds six pricing fields, four checks, four indexes, and transforms pricing data | **Incompatible**; business pricing belongs on `companies`. Constraints are not safely rerunnable. |
| `20251110120000_consolidate_pricing_engagement.sql` | Rewrites legacy `advisors.pricing_structure`; comments old column | **Incompatible data migration** with prerequisites absent in production. |
| `20251115_create_admin_users.sql` | Creates `admin_users`, indexes, four RLS policies, timestamp function/trigger | **Missing but requires redesign**. Short version naming is inconsistent; self-querying policies need recursion testing; bootstrap instructions encourage manual production SQL and temporary RLS disablement. |

## SQL-under-`scripts` classification

| File | Classification |
|---|---|
| `scripts/setup-schema.sql` | Legacy, non-migration base schema: 14 tables, 7 functions, 7 triggers, indexes, and seed data. **Incompatible** with production and not safe to run there. |
| `scripts/setup-rls-policies.sql` | Enables RLS on 14 legacy tables and creates 31 policies. **Incompatible**, incomplete for `csv_import_logs`, and not tracked as a migration. |
| `scripts/create-distance-function.sql` | Legacy listing search over `advisors`. **Replace** with company-centric search. |
| `scripts/update-postgis-function.sql` | Legacy advisor-listing geometry update and trigger. **Replace** or retire; production companies store geography directly. |
| `scripts/add-is-verified.sql` | Adds legacy listing verification to `advisors`. **Obsolete**; production uses `companies.verified`. |
| `scripts/make-state-nullable.sql` | Alters legacy `advisors.state`. **Obsolete**; production uses nullable `companies.state_province`. |
| `scripts/seed-blog-sample.sql` | Non-production sample data for absent blog tables. Keep out of production migrations; product/seed decision required. |
| `scripts/verify-columns.sql` | Read-only check for legacy advisor-listing columns. **Obsolete diagnostic** after company cutover. |

## Types, query objects, and documentation drift

No generated Supabase `Database` type exists. `types/advisor.ts` is a hand-written legacy business-listing shape containing location, ownership, subscription, pricing, rating, and search fields that do not exist on production `advisors`. It must be replaced later by generated database types plus separate `Company`, `AdvisorPerson`, and form/view models.

Application queries reference these database objects: `companies`, `advisors`, `listing_claims`, `media_content` (not queried), `users` (not queried), `reviews`, `leads`, `click_tracking`, `listing_views`, `admin_users`, `advisor_team_members`, `users_public`, `csv_import_logs`, `blog_categories`, `blog_tags`, `blog_posts`, `blog_post_tags`, and `blog_post_views`. Only the first three queried objects exist in production; `advisors` and `listing_claims` are compatible only in the public company-centric paths identified in `APPLICATION_DATABASE_REMEDIATION.md`.

Documentation that instructs operators to use the legacy model or makes unverified deployment claims must be treated as historical, not operational:

- `scripts/README.md` calls `setup-schema.sql` complete, suggests `supabase db push` even though that command will not run the script, and includes a destructive public-schema reset.
- `ADMIN_SETUP.md` and `TEST_ADMIN_AUTH.md` instruct manual application of the incompatible admin migration and include temporary RLS disablement guidance.
- `SESSION_SUMMARY_CLAIM_SYSTEM.md` says the claim migration was applied, but the validated production catalog and absent migration history contradict that claim.
- `docs/WEEK6_FINAL_STATUS.md`, `docs/WEEK7_KICKOFF.md`, and related summaries say migrations/RLS are complete; catalog evidence contradicts them.
- `docs/DEPLOYMENT.md` and `DEPLOYMENT_CHECKLIST.md` assume migrations are applied but define no schema drift or migration-history gate.
- `LOCATION_SEARCH_SETUP.md` instructs manual installation of the legacy advisor-distance function.
- `.github/workflows/deploy.yml` deploys application code without database migration or drift validation; `.github/workflows/ci.yml` builds/tests with Supabase keys but performs no fresh bootstrap or catalog comparison.

The operational sources of truth for restart work are this package, `PRODUCTION_BASELINE.md`, and `BACKUP_AND_RESTORE_RUNBOOK.md`.
