# Application Database Remediation

**Status:** Checklist for a later implementation step; runtime code was not changed
**Target contract:** `TARGET_DATA_MODEL.md`

## Mandatory boundary rule

All application names must match entity meaning. Company/listing identifiers are `companyId`/`company_id`; advisor identifiers refer only to people. A compatibility shim may not blindly rename a company ID to `advisor_id`.

Generated Supabase database types should replace untyped query results. Create separate domain/view models for `Company` and `AdvisorPerson`; do not regenerate the legacy monolithic `AdvisorProfile` shape.

## Public directory paths

| File | Current access | Status and later remediation |
|---|---|---|
| `app/api/advisors/route.ts` | Reads `companies`, maps results to advisor-named API fields | Database entity is correct. Rename API/resource concepts to companies/listings; preserve a versioned compatibility response only if clients require it. Ensure filters use actual company columns. |
| `app/(public)/listings/[slug]/page.tsx` | Reads `companies`, then active `advisors` by `company_id`; uses admin client for some reads | Entity mapping is correct. Use anon/auth client for public data so RLS is exercised; reserve admin client for a justified non-public operation. Keep advisors as people. |
| `app/(public)/listings/page.tsx` | Calls listing API rather than direct database | Update local variable/types from advisor to company; no direct schema change. |
| `components/listing/FeaturedListings.tsx` | Reads `companies` | Compatible. Use generated Company type and RLS client. |
| `app/sitemap.ts` | Reads company slugs/timestamps | Compatible; verify public policy and remove any service-role dependence. |
| `app/(public)/claim/[slug]/page.tsx` | Reads company and company-centric pending claim | This is the only claim path already aligned with production names. Require selected authentication flow and keep `company_id`/`claim_status`. |
| `app/(public)/listings/[slug]/contact/page.tsx` | Reads company but passes `company.id` to components as `advisorId` | Rename prop/payload to `companyId`; never send company ID under `advisor_id`. |
| `app/(public)/listings/[slug]/reviews/new/page.tsx` | Reads company; queries `reviews` using mixed reviewer semantics | Rename to company ID and wait for company-review schema. Use canonical reviewer column. |
| `app/api/advisors/[id]/track-click/route.ts` | Inserts `click_tracking.advisor_id` | Rename resource/parameter or validate company ID and insert `company_id`. Add consent/rate-limit handling. |
| `app/api/advisors/[id]/reviews/route.ts` | Reads reviews by `advisor_id`, joins `users_public` separately | Change to company route/`company_id`; use canonical `users`/safe profile projection and reviewer column. |

UI/data-shape files that must be renamed or remapped with the public cutover include `components/listing/AdvisorCard.tsx`, `components/search/SearchResults.tsx`, `components/search/AdvisorFilters.tsx`, `components/listing/ContactCard.tsx`, `components/listing/ContactModal.tsx`, `components/listing/ReviewsList.tsx`, `components/listing/TeamSection.tsx`, and `components/analytics/GoogleAnalytics.tsx`.

## Claims and ownership

| File | Current access | Required remediation |
|---|---|---|
| `components/forms/ClaimForm.tsx` | Sends `advisor_id` | Send `company_id`; align fields with production claim columns and chosen authenticated/pre-auth workflow. |
| `app/api/advisors/claim/route.ts` | Validates legacy `advisors` listing; inserts claims using `advisor_id`, `status`, and verification-token additions; uses service role | Replace with company claim endpoint. Validate `companies.id`, use `company_id`, `claim_status`, `claimant_user_id`, and normal authenticated RLS for user submission. Redesign verification flow rather than applying the legacy migration. |
| `app/api/advisors/verify-email/route.ts` | Reads/updates token fields absent from production | Feature-disable until claim-auth decision. If pre-auth remains, use a dedicated hashed, expiring challenge design; do not store plaintext reusable tokens. |
| `app/api/advisors/setup-password/route.ts` | Creates auth user, writes `users_public`, claim `auth_user_id`, and legacy advisor ownership | Replace with standard Auth onboarding where possible. Write canonical `users`; ownership approval sets `companies.verified_owner_id`, `verified`, and `verification_date` atomically. |
| `app/api/admin/claims/route.ts` | Selects `advisor_id`, `status`, and legacy advisor relationship | Select production `company_id`, `claim_status`, claimant/reviewer user relationships, and authorize via `isAdmin`. |
| `app/api/admin/claims/[id]/route.ts` | Approves/rejects legacy status and updates `advisors.is_claimed/claimed_by_user_id` | Atomically decide company claim and update company ownership/verification. Add ownership-conflict and one-active-claim checks. |
| `app/(admin)/admin/claims/page.tsx` | Consumes legacy claim/advisor response shape | Update to company and canonical status/user fields. |
| `components/admin/ClaimReview.tsx` | Legacy claim/advisor terminology | Update props/actions to company claim contract. |
| `app/(public)/verify-email/page.tsx`, `app/(public)/setup-password/page.tsx` | Drive custom claim credential flow | Retain only if approved security design requires it; otherwise replace with normal Auth flows. |

Ownership helpers in `lib/supabase/auth.ts` (`hasClaimedAdvisor`, `getClaimedAdvisor`) must become company ownership helpers using `companies.verified_owner_id = auth.uid()`. Do not infer ownership from person rows.

## Reviews

| File | Current access | Required remediation |
|---|---|---|
| `components/forms/ReviewForm.tsx` | Sends company ID as `advisor_id` and verification flag | Send `company_id`; use canonical review fields. Client confirmation is not equivalent to administrator verification. |
| `app/api/reviews/route.ts` | Validates ID against legacy advisors; mixes `reviewer_id` with script schema's `user_id`; inserts missing table | Validate company; use normal authenticated user and `reviewer_user_id`; rely on RLS; enforce duplicate rule. |
| `app/api/advisors/[id]/reviews/route.ts` | Reads by advisor and assumes `user_id -> users_public` | Read by company; use selected profile projection and reviewer column. |
| `app/api/admin/reviews/route.ts` | Lists absent reviews with advisor/user joins | Join company and canonical user profile; require explicit admin authorization. |
| `app/api/admin/reviews/[id]/route.ts` | Moderates/deletes absent reviews | Keep only after admin predicate and moderation fields are defined. Prefer state transitions/audit to destructive delete. |
| `app/api/advisor/reviews/[id]/reply/route.ts` | Finds listing owner through legacy advisor; writes owner reply | Resolve owned company, ensure review `company_id` matches, permit reply fields only. |
| `app/(admin)/admin/reviews/page.tsx` | Legacy response fields | Update company/reviewer naming and moderation contract. |
| `app/(advisor)/dashboard/reviews/page.tsx` | Consumes company-owner review API | Rename advisor dashboard concepts to company-owner and use company scope. |

Every analytics/dashboard query that joins reviews to `advisors(name)` must join `companies(name)`.

## Leads

| File | Current access | Required remediation |
|---|---|---|
| `components/forms/ContactForm.tsx`, `components/listing/ContactModal.tsx` | Send company ID as `advisor_id` | Rename payload to `company_id`; disclose retention/consent as approved. |
| `app/api/leads/route.ts` | Validates against legacy advisors and inserts `advisor_id` with admin client | Validate `companies`; insert `company_id`. Use a narrowly authorized public/auth path with abuse controls instead of broad service-role bypass. |
| `app/api/advisor/leads/route.ts` | Resolves owner through legacy advisor then filters leads by advisor ID | Resolve owned company and filter `leads.company_id`. |
| `app/api/advisor/leads/[id]/route.ts` | Same ownership model; updates lead | Scope both selection and update to owned `company_id`; allow only approved status/note fields. |
| `app/api/admin/leads/route.ts` | Lists missing leads | Join company, not advisor; require explicit admin. |
| `app/(admin)/admin/leads/page.tsx`, `app/(advisor)/dashboard/leads/page.tsx` | Consume legacy API models | Rename entity fields and update response types. |

## Listing views and click tracking

| File | Current access | Required remediation |
|---|---|---|
| `app/api/advisors/[id]/track-click/route.ts` | Inserts legacy click record | Use company ID and constrained click target. |
| `app/api/advisor/dashboard/route.ts` | Reads `listing_views` and `click_tracking` by legacy advisor ID | Resolve company ownership; filter by `company_id`; read review/lead aggregates for the same company. |
| `app/api/admin/analytics/route.ts` | Aggregates click/view/lead/review tables and legacy advisors | Convert every group/join to companies; require explicit admin. |
| `app/api/admin/analytics/export/route.ts` | Service-role export with `advisors(name)` joins | Join companies, enforce admin before service-role use, minimize exported PII, and audit export. |
| `app/api/admin/dashboard/route.ts` | Counts/joins all legacy objects; checks only authentication | Use company-centric objects and `isAdmin`; do not treat any authenticated user as admin. |
| `app/(admin)/admin/analytics/page.tsx`, `app/(admin)/admin/dashboard/page.tsx`, `app/(advisor)/dashboard/page.tsx` | Consume legacy aggregates | Rename response models and metrics to company scope. |

No runtime database insert to `listing_views` was found. Decide whether to add one with consent/rate limiting or remove view metrics. `components/analytics/GoogleAnalytics.tsx` emits analytics events but is not a substitute for the missing database writer.

## Company administration and owner dashboard

| File | Current access | Required remediation |
|---|---|---|
| `app/api/admin/listings/route.ts` | Lists/inserts legacy business rows in `advisors` | Move to `companies`; map only approved company fields. Person creation is separate. |
| `app/api/admin/listings/[id]/route.ts` | Reads/updates/deletes legacy advisor-listing, including pricing/subscription fields | Move to company. Protect admin-only fields; use guarded delete/archive semantics because company delete cascades people and other relationships. |
| `app/(admin)/admin/listings/page.tsx`, `app/(admin)/admin/listings/new/page.tsx`, `app/(admin)/admin/listings/[id]/edit/page.tsx` | Legacy AdvisorProfile forms | Replace with Company forms/types. Preserve the `page-old-backup.tsx` files as historical only; do not update them into active paths. |
| `components/admin/AdvisorForm.tsx` and `components/profile/*` | Business fields modeled as advisor fields | Rename/recompose as company profile sections. Keep actual person fields in a separate advisor-person form. |
| `app/api/advisor/profile/route.ts` | Finds legacy claimed advisor and reads/updates business fields | Resolve owned company via `verified_owner_id`; update approved company fields. |
| `app/api/advisor/logo/route.ts` | Updates legacy advisor `logo_url` | Update owned company `logo_url`; media moderation/metadata decision applies. |
| `app/api/advisor/dashboard/route.ts` | Uses legacy advisor as owned listing | Resolve company and use company-scoped aggregates. |
| `app/api/cron/expire-subscriptions/route.ts` | Reads/updates subscription fields on advisors | Move approved subscription state to companies; require authenticated cron secret and a reviewed forward migration. |
| `app/(advisor)/dashboard/edit/page.tsx`, `app/(advisor)/dashboard/page.tsx`, `app/(advisor)/layout.tsx` | Legacy owner terminology and API shapes | Treat role as company owner; update types and navigation naming where feasible. |

`types/advisor.ts` must be split. Its `AdvisorProfile` and `AdvisorFormData` are almost entirely company shapes; `TeamMember` approximates a person but does not match production columns exactly.

## People/team management

| File | Current access | Required remediation |
|---|---|---|
| `app/api/advisor/team/route.ts` | Finds owned legacy advisor; reads/inserts `advisor_team_members` | Resolve owned company; read/insert production `advisors` with `company_id`. |
| `app/api/advisor/team/[id]/route.ts` | Authorizes via legacy advisor ID then updates/deletes team table | Fetch advisor person and require its `company_id` to be owned; update/delete `advisors`. |
| `app/api/advisor/team/[id]/photo/route.ts` | Same pattern, updates `photo_url` | Use `advisors.profile_image_url`; company-owner authorization. |
| `app/(advisor)/dashboard/team/page.tsx`, `components/dashboard/TeamMemberDialog.tsx`, `components/profile/TeamMembersSection.tsx` | Consume legacy team-member shape | Map to production advisor-person fields (`active`, `profile_image_url`, etc.). |

Do not create `advisor_team_members` or run the legacy team-count trigger. If a cached team count is needed, it belongs on companies and must be derived/tested explicitly; a live count is preferable initially.

## Users and administrator access

| File | Current access | Required remediation |
|---|---|---|
| `lib/supabase/auth.ts` | Queries missing `admin_users`, legacy advisor ownership, and missing `users_public` | Use reviewed admin predicate; company ownership; canonical users/safe view. |
| `app/(auth)/callback/route.ts` | Upserts `users_public` | Upsert `public.users` through normal authenticated RLS with approved fields. |
| `app/(admin)/layout.tsx` | Uses `isAdmin()` | Keep central guard, but make it rely on non-recursive production admin authorization. |
| All `app/api/admin/**` routes | Mixed: some call `isAdmin`, others merely check authentication; several use service role | Standardize every route on `isAdmin()` before privileged client creation. Service role is an implementation detail after authorization, not the authorization decision. |

Admin routes already calling `isAdmin()` include blog CRUD and CSV import/validation; preserve the check while replacing missing schema. `app/api/admin/dashboard/route.ts`, analytics, claims, listings, reviews, and leads require an explicit audit because several currently check only for an authenticated user.

## Media

Production `media_content` is not queried by application code. Upload routes currently send bytes to Cloudinary and write logo/photo URLs directly:

- `app/api/upload/route.ts`
- `app/api/advisor/logo/route.ts`
- `app/api/advisor/team/[id]/photo/route.ts`
- `components/admin/ImageUpload.tsx`
- `components/dashboard/LogoUpload.tsx`

Decide whether `media_content` becomes the canonical metadata/moderation record. If yes, company and uploader FKs must be written transactionally with the external upload outcome, and orphan cleanup must be defined. If no, document why the production table is retained unused or schedule a later, data-safe retirement decision. It must not be silently repurposed for person photos without an explicit entity column.

## Missing blog/import objects

All direct blog database paths expect tables absent from production. Keep blog/admin routes feature-disabled until a separate company-centric blog migration is approved:

- Pages: `app/(public)/blog/[slug]/page.tsx`, `app/(admin)/admin/blog/page.tsx`, and `app/(admin)/admin/blog/[id]/edit/page.tsx`.
- Public APIs: `app/api/blog/posts/route.ts`, `app/api/blog/categories/route.ts`, `app/api/blog/tags/route.ts`, and `app/api/blog/rss/route.ts`.
- Admin post APIs: `app/api/admin/blog/posts/route.ts` and `app/api/admin/blog/posts/[id]/route.ts`.
- Admin category APIs: `app/api/admin/blog/categories/route.ts` and `app/api/admin/blog/categories/[id]/route.ts`.
- Admin tag APIs: `app/api/admin/blog/tags/route.ts` and `app/api/admin/blog/tags/[id]/route.ts`.
- Admin analytics: `app/api/admin/blog/analytics/route.ts`, which expects `blog_posts`, `blog_post_views`, `blog_categories`, and `blog_tags`.

If blog relationships are created, use `related_company_id`; author profiles use canonical users/safe projection. `blog_comments` currently has no active database query and should not be created by default.

CSV paths `app/api/admin/csv/import/route.ts`, `app/api/admin/csv/validate/route.ts`, and `lib/utils/csv-import.ts` currently write legacy advisors and `csv_import_logs`. Rework imports to create/update companies with explicit duplicate rules, dry-run output, transaction boundaries, and an administrator-only audit log. Never run current import code against the production person table.

## Query object coverage appendix

This appendix assigns every directly queried application object found under `app`, `components`, and `lib`:

| Object | Direct query files | Target assignment |
|---|---|---|
| `companies` | `app/api/advisors/route.ts`; public listing/claim/contact/review pages; `app/sitemap.ts`; `components/listing/FeaturedListings.tsx` | Retain; rename application concepts to company/listing. |
| `advisors` | Public listing detail plus admin listing, owner profile/dashboard/logo/team/lead/review routes, claim/setup APIs, cron, auth helpers, CSV import | Keep only public/team person usage. Every business/owner use moves to companies. |
| `listing_claims` | Public claim page; claim/verify/setup APIs; admin claim/dashboard APIs | Retain production object and canonical company/status/user columns. |
| `reviews` | Public/new review, review APIs, admin review/analytics/dashboard, owner dashboard/reply | Create company-targeted object before enabling. |
| `leads` | Lead API; admin/owner lead, analytics, dashboard, export | Create company-targeted object before enabling. |
| `listing_views` | Admin/owner analytics/dashboard/export | Create company-targeted object; add or reject writer. |
| `click_tracking` | Click insert; admin/owner analytics/dashboard/export | Create company-targeted object. |
| `advisor_team_members` | Four owner team endpoints | Do not create; use production advisors (people). |
| `admin_users` | `lib/supabase/auth.ts` | Redesign/create non-recursive authorization foundation. |
| `users_public` | Auth callback/helper, setup-password, review author, blog author | Consolidate into `users` or safe view. |
| `csv_import_logs` | `lib/utils/csv-import.ts` | Optional administrator audit object. |
| blog tables | Public/admin blog pages and APIs listed above | Separate optional migration; company relation explicit. |
| `media_content` | No direct query | Product decision; production object retained meanwhile. |
| `users` | No direct query | Make canonical application profile target. |

## Operational scripts that must not touch production before remediation

All current data-maintenance/import scripts treating `advisors` as listings must be rewritten or retired, including `scripts/import-advisors.ts`, `scripts/add-missing-agencies.ts`, `scripts/geocode-advisors.ts`, `scripts/import-business-hours.ts`, `scripts/generate-descriptions.ts`, `scripts/remove-name-from-descriptions.ts`, `scripts/scrape-client-counts.ts`, `scripts/scrape-logos.ts`, logo upload/replace scripts, address/published/verification checks, and `lib/utils/csv-import.ts`. Their target is `companies`, subject to dry-run, explicit environment identity, and row-diff review.

RPC callers `scripts/test-location-search.ts`, `scripts/geocode-advisors.ts`, `scripts/import-advisors.ts`, and `lib/utils/csv-import.ts` must not call the legacy advisor PostGIS functions. Replace with a company location/search contract after migration.

## Implementation completion checks

- No runtime query sends a company ID as `advisor_id`.
- Direct query inventory contains no unexplained `users_public` or `advisor_team_members` use.
- Public/owner workflows pass RLS tests without service role.
- Every admin route performs explicit admin authorization before privileged access.
- Generated types compile and distinguish companies from advisor people.
- Missing feature routes remain disabled until their migrations exist and pass fresh bootstrap.
