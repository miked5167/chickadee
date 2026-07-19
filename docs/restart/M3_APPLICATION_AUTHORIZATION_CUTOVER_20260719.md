# M3 Application Authorization Cutover — 2026-07-19

## Outcome

The administrator-authorization application cutover is implemented and validated locally on branch `codex/restart-foundation`. Nothing was staged, committed, pushed, deployed, linked, or mutated in production. No Auth email or other Auth PII was queried, no administrator was selected or inserted, M3 was not rerun, and M4 implementation did not begin.

Every one of the 19 `app/api/admin/**` modules now reaches the M3 `public.is_admin()` predicate through one request-scoped server helper. Missing/invalid sessions fail with a generic 401. Authenticated non-administrators, inactive administrators, and predicate failures receive the same generic 403. Only active administrators pass authorization.

All 19 modules remain intentionally disabled after authorization because their analytics, blog, claims, CSV, dashboard, leads, listings, or reviews contracts are missing, legacy-shaped, or unsafe. Active administrators receive a generic 503 before request parsing or application-database access. No administrator handler imports, creates, or uses a service-role client.

The parent server administrator layout remains centrally protected by `isAdmin()`. That helper now uses only `rpc('is_admin')`; the development email fallback and direct `admin_users` lookup were removed. API authorization does not rely on the layout.

## Exact changed files

Authorization helpers:

- `lib/supabase/auth.ts`
- `lib/supabase/admin-api.ts`

Administrator API modules:

- `app/api/admin/analytics/export/route.ts`
- `app/api/admin/analytics/route.ts`
- `app/api/admin/blog/analytics/route.ts`
- `app/api/admin/blog/categories/[id]/route.ts`
- `app/api/admin/blog/categories/route.ts`
- `app/api/admin/blog/posts/[id]/route.ts`
- `app/api/admin/blog/posts/route.ts`
- `app/api/admin/blog/tags/[id]/route.ts`
- `app/api/admin/blog/tags/route.ts`
- `app/api/admin/claims/[id]/route.ts`
- `app/api/admin/claims/route.ts`
- `app/api/admin/csv/import/route.ts`
- `app/api/admin/csv/validate/route.ts`
- `app/api/admin/dashboard/route.ts`
- `app/api/admin/leads/route.ts`
- `app/api/admin/listings/[id]/route.ts`
- `app/api/admin/listings/route.ts`
- `app/api/admin/reviews/[id]/route.ts`
- `app/api/admin/reviews/route.ts`

Tests and record:

- `tests/unit/admin-authorization.test.ts`
- `tests/unit/admin-routes.test.ts`
- `docs/restart/M3_APPLICATION_AUTHORIZATION_CUTOVER_20260719.md`

## Validation evidence

- Focused authorization tests: 16/16 passed.
- Full intended Vitest unit suite: 110/110 passed across five files.
- Route coverage: all 19 modules and all 30 exported handlers exercised as anonymous, invalid-session, authenticated non-admin, inactive admin, and active admin.
- Ordering/static assertions: authentication precedes `is_admin`; anonymous/invalid sessions never invoke the predicate; no handler has route-local database access or service-role construction.
- Relevant changed-file ESLint: zero errors and zero warnings.
- Repository ESLint baseline: 212 errors and 154 warnings in pre-existing files; no finding is in a changed cutover file. This is lower than the prior recorded 226/157 backlog because legacy administrator route implementations were removed.
- TypeScript: `npm exec tsc -- --noEmit --incremental false` passed.
- Production-mode Next build: passed with placeholder Supabase variables pointing only to unused loopback `127.0.0.1:54321`; all 65 static pages generated. No hosted environment was contacted.
- Database migration validator: passed M1/M2 immutability, exact M3 scope/guards, fingerprints, quarantine, and derived types.
- Database negative-rule suite: passed.
- Derived database type determinism: passed.
- `git diff --check`: passed for cutover files.
- Staged files: zero.

The unqualified `npm exec vitest -- run` command still discovers seven Playwright `tests/e2e/*.spec.ts` files as Vitest suites and reports runner-context errors before executing them. This is a pre-existing Vitest include/exclude configuration issue, not an application test failure: all 110 Vitest unit tests pass when the intended `tests/unit` scope is selected. Browser E2E was not run because no approved deployed or local Supabase-backed application target exists for the role fixtures.

## Immutable boundary verification

The active migrations remain byte-for-byte unchanged:

- M1: `4b65fa234b56534985f249cc8061efd98b05ba927c5de130839b8fd35c1d1db8`
- M2: `95fb374bb07c5a4941b3dd78e6a6db9bf5b4b456c15670fb3ac9805e3a81b547`
- M3: `a968f41fb10e6ecbe1ff8363abe0322031defd6aa361ce3c98498603ade55f6d`

No production count, history, or administrator-row query was run during this cutover. The authoritative post-M3 production evidence remains `advisor-directory-production-post-m3-20260719T184639Z` with archive SHA-256 `a33a1f42c415a3aacfd4b19aafe8ec10d12f0aa707014971b282b3c668f0530c`.

## Remaining risks and intentionally unavailable behavior

- Every administrator workflow remains unavailable. This is deliberate: none may be enabled until its company-centric database contract, least-privilege access, tests, and release approval exist.
- Administrator pages can render only after bootstrap, but their current data calls will receive 503. The UI does not yet provide a unified maintenance-state presentation.
- Browser E2E role testing still needs a proven non-production Supabase target with anonymous, non-admin, inactive-admin, and active-admin fixtures. Service-role success must never substitute for those roles.
- The repository-wide lint backlog and Vitest/Playwright discovery configuration remain outside this cutover.
- There is no in-application administrator grant/revoke workflow. Bootstrap and later governance remain protected operational procedures.

## First-administrator bootstrap proposal — separate approval required

Do not execute this proposal until a separate approval identifies the exact candidate UUID, exact approver/revoker UUID, operator, window, and retained evidence.

1. The candidate signs in normally and obtains their own Auth `sub` UUID without exposing an email, name, token, or other Auth data. The approver does the same for a distinct Auth UUID. Transfer only the two UUIDs through the approved protected channel.
2. Two people verify the target project reference is exactly `dqskdrqubqnhdssxpryx`, the candidate and approver UUIDs are different, production history is exact M1+M2+M3, application counts remain 202/177/0/0/0, and `public.admin_users` still has zero rows. Queries match UUIDs only and do not select Auth email/metadata.
3. After a dedicated bootstrap approval, use one explicit database transaction to verify both UUID FKs exist and insert exactly one active row with `user_id = <candidate UUID>` and `granted_by = <approver UUID>`. Return only row UUIDs, status, and audit timestamps; retain no Auth PII.
4. Verify the registry contains exactly one active row, an ordinary authenticated fixture remains forbidden, and the candidate's fresh authenticated session passes `public.is_admin()`. Verify all disabled administrator APIs still return 503.
5. Protect a checksum manifest containing the approved change record, redacted command transcript, exact project reference, migration hashes/history, before/after counts, inserted authorization-row UUID fields, and rollback owner. Do not record tokens, connection strings, emails, or Auth metadata.

The bootstrap transaction must be separately reviewed before use; this document intentionally does not provide an executable credentialed command.

## Coordinated application deployment plan — separate approval required

1. Review and commit only the listed cutover files; recheck M1/M2/M3 hashes, zero staging surprises, focused lint, TypeScript, unit tests, database validators, and the production-mode loopback build.
2. Reconfirm the deployment target and environment are production-shaped with `NODE_ENV=production`, exact M3 schema availability, and no legacy administrator email fallback. Do not link the local workspace to production.
3. Approve and deploy the application artifact only. Apply no migration and insert no administrator in this step.
4. With the registry still empty, run public read-only smokes plus anonymous and ordinary-user administrator API checks. Expected administrator results are 401 and 403; no service-role or application-table access occurs.
5. Only after the application deployment is healthy may the separately approved first-administrator bootstrap run. Validate that the active administrator receives 503 for every intentionally disabled workflow.
6. Enable no individual workflow until its own schema/application/RLS release gate is complete. Do not begin M4 under this approval.

## Recovery approach

- Application regression: roll back only the application artifact. M3 remains additive and unchanged; do not drop `admin_users` or `is_admin()`.
- Suspected authorization bypass: stop administrator enablement and revoke `is_admin()` execution from API roles through a separately reviewed forward incident action. Restore the grant only after root cause and role tests pass.
- Incorrect first grant: do not delete the audit row. In a separately approved transaction, set it inactive with `revoked_by` equal to the pre-approved distinct revoker Auth UUID and `revoked_at = now()`, then verify the former administrator is forbidden with a fresh session.
- Schema/data corruption: use the protected post-M3 archive as the recovery reference. Restore remains incident-level only and is never tested against production.

## Approval checkpoint

Stop here. Required next decisions are separate: (1) application deployment approval and (2) first-administrator identity/bootstrap approval. Neither is implied by completion of this local cutover.
