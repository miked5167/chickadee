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
- Reviewed local M4 SHA-256: `05bbef023d1b74e5707d801554e2839248d9a976f71fea41155167b69f8f69f7`
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

## Read-only production preflight follow-up (2026-07-19)

The approved M4 production preflight stopped before backup creation or CLI dry-run because the live `public.is_admin()` catalog attributes did not satisfy the exact M4 prerequisite check (`m3_function_exact`). The exact ordered M1+M2+M3 history, M3 administrator table, own-status policy, timestamp trigger, and absence of M4 review objects passed the preceding read-only checks. No production mutation occurred and M4 was not applied.

The protected post-M3 evidence package `advisor-directory-production-post-m3-20260719T184639Z` was revalidated independently: 28 checksums, 1,337 archive entries, exact M1+M2+M3 migration history, exact application counts, and complete M3 catalog/schema agreement passed. This narrows the open question to a live catalog-attribute comparison for `public.is_admin()`; it does not justify weakening or bypassing the M4 guard.

The exact next step is one targeted read-only catalog query that records the non-secret `pg_proc` attributes for `public.is_admin()` and compares them with the protected post-M3 definition. Do not deploy or apply M4 until that difference is understood and the unchanged M4 migration is revalidated against production.

## Production preflight resolution (2026-07-20)

The targeted read-only diagnostic completed against PostgreSQL 17.6 and proved that `public.is_admin()` retains the exact required security meaning: owner `postgres`, SQL/stable/parallel-safe/security-definer attributes, Boolean scalar result, no arguments, fixed empty `search_path`, authenticated and service-role execution only, and no anonymous or PUBLIC execution. Evidence was written outside the repository to `m4-is-admin-diagnostic-20260720T094348Z.json` under the protected production evidence root.

The false rejection came from comparing PostgreSQL's internal `proconfig` array representation rather than its security meaning. M4 now requires exactly one function setting named `search_path` and verifies through `pg_get_functiondef` that its value is the empty path. The guard remains fail-closed and the negative validator rejects removal of this requirement. The revised M4 SHA-256 is `05bbef023d1b74e5707d801554e2839248d9a976f71fea41155167b69f8f69f7`.

The revised migration passed a fresh disposable PostgreSQL 18.4 M1-to-M4 bootstrap, repeat-run no-op check, catalog fingerprint, fail-closed guards, administrator role matrix, public/authenticated review role matrix, and zero-fixture check. The disposable server was stopped and its port released.

The full read-only production preflight then passed. Protected evidence package: `advisor-directory-production-pre-m4-20260720T095530Z`.

- Exact routed project/database identity matched.
- Exact ordered M1+M2+M3 history matched.
- M3 authorization objects matched and `admin_users` remained empty.
- M4 review objects were absent.
- Counts remained companies 202, advisors 177, listing claims 0, media content 0, users 0, administrators 0.
- The protected archive contained 1,337 entries and passed list, schema-stream, data-stream, checksum, catalog, and canonical M3 evidence validation.
- Production site returned 200 and the public API returned the expected total of 202.
- Supabase CLI 2.109.1 dry-run listed only `20260719000003_company_reviews.sql`.
- `production_changes_made` and `baseline_ddl_executed` remained false.

Operational follow-up files added or changed after the combined M1-M4 restart commit:

- `scripts/database/run-m3-production-preflight.ps1`
- `scripts/database/run-m4-production-function-diagnostic.ps1`
- `scripts/database/validate-production-evidence.mjs`
- `scripts/database/validate-migrations.mjs`
- `scripts/database/test-validation-rules.mjs`
- `supabase/migrations/20260719000003_company_reviews.sql`
- `docs/restart/M4_COMPANY_REVIEWS_CHECKPOINT_20260719.md`

The exact recommended next step is an approval decision for a new local corrective commit containing the PostgreSQL 17-compatible M4 guard and production-preflight tooling. Do not push, deploy the application, or apply M4 under that commit approval. Applying M4 remains a separate consequential action requiring an exact proposal and explicit approval. The two-person administrator bootstrap remains postponed and no administrator access or mutation workflow was enabled.

Final post-resolution validation:

- Focused M4 tests: 7/7 passed.
- Full unit suite: 117/117 passed.
- TypeScript: passed.
- Focused M4/restart lint: zero errors; the listing page retains the same five pre-existing warnings.
- Changed JavaScript database validators: zero lint errors and zero warnings.
- Repository-wide lint: 204 errors and 150 warnings across 129 files, all existing repository debt and none introduced in the changed JavaScript validators.
- Production build: passed; all 65 static pages generated with loopback-only placeholder Supabase variables.
- Migration/static and negative-rule validators: passed with the revised M4 hash and PostgreSQL 17-compatible fixed-search-path guard.
