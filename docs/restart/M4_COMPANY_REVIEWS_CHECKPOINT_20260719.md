# M4 Company Reviews Restart Checkpoint — 2026-07-19

## Outcome

M4 is implemented and validated locally as the next unfinished restart phase after M3. The phase delivers the highest-value review capability that does not require an administrator: signed-in users can submit one company-targeted review, published reviews are visible on the company listing, and reviewer account identifiers are not publicly readable.

Nothing was staged, committed, pushed, deployed, linked to production, or changed in any hosted database. Production remains at exact M1+M2+M3 with no administrator rows and no enabled administrator mutation workflow.

## Exact phase goal and product decisions

The M4 release boundary is the public company-review workflow:

- canonical identifiers are `company_id` and `reviewer_user_id`;
- only authenticated users may write, and RLS binds the reviewer to `auth.uid()`;
- one review is allowed per reviewer/company pair;
- ratings are integers from 1 through 5;
- trimmed review content is 50–1,000 characters and optional titles are 1–100 characters;
- the user must explicitly confirm first-hand experience;
- reviews publish immediately, so the feature has no administrator dependency;
- public/authenticated reads expose only non-identifying review columns;
- account identity is presented as `Directory member`, not as verified or administrator-vetted;
- authenticated authors may update review content or delete their own review through the database contract, but cannot change identity, company, or moderation state;
- owner replies and administrator moderation remain disabled and are not part of this release.

Immediate publication is an explicit M4 product decision. It avoids a hidden dependency on the postponed administrator bootstrap, but it creates the abuse risk recorded below.

## Dependencies and deployment ordering

M4 depends on the exact production M1+M2+M3 state: `companies`, Auth UUID identities and `auth.uid()`, the shared timestamp function, the M2 company trigger, the M3 authorization foundation, and the existing ordered `moderation_status` enum. The guarded migration fails if these prerequisites or API-role attributes differ.

The database migration must be approved and applied before the application release. The application release must not be deployed against M3-only production because the listing review client expects `public.reviews` and the canonical company-review API.

No administrator identity, administrator policy, `is_admin()` mutation path, email fallback, service-role review API, seed row, legacy review import, or production data transformation is included.

## Measurable acceptance criteria

- The active migration chain is exact ordered M1→M4, while M1, M2, and M3 hashes remain unchanged.
- M4 creates exactly one table, two explicit indexes, four public/self-service policies, and one shared timestamp trigger; it creates no function and performs no row-bearing DML.
- Anonymous users can read only published non-identifying review columns and cannot insert.
- Authenticated users cannot impersonate a reviewer, submit a second review for the same company, read `reviewer_user_id`, or mutate `moderation_status`.
- Valid authenticated review insert, self-update, and self-delete behavior passes on disposable PostgreSQL with no retained fixtures.
- Public listing UI reads `/api/companies/[id]/reviews`, submits `company_id`, and never claims a review is verified.
- The ambiguous `/api/advisors/[id]/reviews` endpoint returns 410 with the canonical replacement.
- Owner reply mutations return 503 and administrator review routes retain the M3 fail-closed behavior.
- Focused lint has zero errors, TypeScript passes, all unit tests pass, the production build succeeds, and database/static validators pass.

All criteria passed locally.

## Files changed for M4

Application and tests:

- `app/(public)/listings/[slug]/page.tsx`
- `app/(public)/listings/[slug]/reviews/new/page.tsx`
- `app/api/companies/[id]/reviews/route.ts`
- `app/api/reviews/route.ts`
- `app/api/advisors/[id]/reviews/route.ts`
- `app/api/advisor/reviews/[id]/reply/route.ts`
- `components/forms/ReviewForm.tsx`
- `components/listing/ReviewsList.tsx`
- `lib/reviews/validation.ts`
- `tests/unit/company-reviews.test.ts`
- `vitest.config.ts`

Database and deterministic validation:

- `supabase/migrations/20260719000003_company_reviews.sql`
- `supabase/schema-fingerprint/current-target.json`
- `supabase/types/database.generated.ts`
- `scripts/database/generate-schema-fingerprint.mjs`
- `scripts/database/generate-database-types.mjs`
- `scripts/database/validate-migrations.mjs`
- `scripts/database/test-validation-rules.mjs`
- `scripts/database/validate-fresh-bootstrap.mjs`
- `scripts/database/run-local-bootstrap.ps1`

Documentation:

- `docs/restart/M4_COMPANY_REVIEWS_CHECKPOINT_20260719.md`

The pre-existing `package.json` change, migration quarantine, M1–M3 documentation, baseline/fingerprint artifacts, and other dirty-worktree changes were preserved. M1–M3 SQL was not edited.

## Validation evidence

- M1 SHA-256: `4b65fa234b56534985f249cc8061efd98b05ba927c5de130839b8fd35c1d1db8`
- M2 SHA-256: `95fb374bb07c5a4941b3dd78e6a6db9bf5b4b456c15670fb3ac9805e3a81b547`
- M3 SHA-256: `a968f41fb10e6ecbe1ff8363abe0322031defd6aa361ce3c98498603ade55f6d`
- Reviewed local M4 SHA-256: `7e05bd5ceaa429ebdd61d3236ed2806384bc30778f2325c76d046e84da50dd50`
- Focused M4 unit tests: 7/7 passed.
- Full unit suite: 117/117 passed across 6 files.
- TypeScript: `npm exec tsc -- --noEmit` passed.
- Focused ESLint: zero errors; five existing warnings in the previously deployed listing page.
- Repository ESLint baseline: 207 errors and 150 warnings across 130 files. None of the errors is in an M4 release file; the five focused warnings are pre-existing issues in the deployed listing page.
- Static database validator: passed M1/M2/M3 immutability, exact M4 scope/guards, layered fingerprint, quarantine, sensitive-content, and derived-type checks.
- Negative database rules: passed deliberate M4 seed, legacy identifier, reviewer impersonation, administrator-policy, identity-exposure, and cascade-delete rejection fixtures.
- Disposable PostgreSQL 18.4/PostGIS 3.6.2 bootstrap on `127.0.0.1:55434`: passed fresh M1→M4 application, migration-runner no-op rerun, catalog/fingerprint equality, fail-closed guards, admin matrix, M4 public/authenticated role matrix, and zero retained fixtures. The server was stopped after validation.
- Production-mode Next.js 16.1.6 build: passed with placeholder Supabase variables pointing only to unused `127.0.0.1:54321`; all 65 static pages generated and no hosted environment was contacted.
- Git staging: zero staged files.

The initial broad `npm test -- --run` exposed a pre-existing Vitest discovery defect: it attempted to load the seven Playwright suites as Vitest files. `vitest.config.ts` now scopes Vitest to `tests/unit/**/*.test.ts`; the separate Playwright command remains unchanged.

## Remaining risks and deliberate deferrals

- Immediate publication has no moderation queue, abuse report, or rate limiter. Authentication plus the database uniqueness rule limits an account to one review per company, but does not prevent coordinated or low-quality reviews.
- No production-like browser E2E was run because a safe local Supabase Auth/PostgREST stack with review schema and disposable identities is not configured. The request/UI contract is covered by unit/source tests and the database behavior by the real PostgreSQL role matrix.
- Review author edit/delete has a database authorization contract but no M4 account UI. This is not required for initial submission/read capability.
- Company-owner review listing/reply UI remains unavailable. The reply API is explicitly 503 until company-owner routing and reply-field/audit decisions are reviewed.
- Administrator review moderation remains unavailable. Admin APIs still fail closed as 401/403/503 through the M3 cutover and no M4 administrator mutation policy exists.
- The old advisor-dashboard aggregate route still belongs to later company-owner/dashboard remediation and must not be treated as an M4 review API.
- Repository-wide lint debt remains pre-existing and outside M4.
- M4 has not been tested against, applied to, or dry-run against production. No backup or production evidence package for M4 has been created.

## Deferred administrator bootstrap

The two-person first-administrator bootstrap remains postponed exactly as before. M4 does not query Auth email or metadata, select a candidate, insert an `admin_users` row, grant administrator access, add an email fallback, or make administrator mutations available. A future bootstrap still requires two distinct people, UUID-only identity verification, exact production evidence, and separate explicit approval.

## Exact recommended next step

Review this local M4 diff and the immediate-publication decision. If approved, the next action should be a separate **read-only M4 production preflight** that proves exact project identity, exact ordered M1+M2+M3 history, unchanged application counts, zero existing `reviews` object collision, exact M1–M4 hashes, current public smokes, a protected schema/data backup, and a pinned Supabase CLI dry run listing only `20260719000003_company_reviews.sql`.

Do not apply M4, deploy the application, bootstrap an administrator, commit, push, or change production under that review alone. Each consequential action requires its own exact proposal and explicit approval.
