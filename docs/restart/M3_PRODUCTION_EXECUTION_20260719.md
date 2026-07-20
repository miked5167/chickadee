# M3 Production Execution Record — 2026-07-19

## Outcome

After the user supplied the exact approval phrase `APPROVE M3 PRODUCTION MIGRATION`, pinned Supabase CLI `2.109.1` applied only `20260719000002_administrator_authorization_foundation.sql`. M1 and M2 were not replayed. No application code or environment linkage was deployed.

Reviewed M3 SHA-256: `a968f41fb10e6ecbe1ff8363abe0322031defd6aa361ce3c98498603ade55f6d`.

M3 created an empty `public.admin_users` authorization registry, `public.is_admin()`, one own-row SELECT policy, two partial FK indexes, and one shared timestamp trigger, with the reviewed ownership/grants/revokes. It created no first administrator row, queried no Auth identity/PII, and changed no application data.

## Approval and immediate safeguards

The approved wrapper repeated the complete credentialed no-mutation preflight in package `advisor-directory-production-pre-m3-20260719T182413Z`, then repeated immediate identity, exact M1+M2 version/name history, migration hashes, M2 trigger, M3 absence, counts, worktree, and M3-only dry-run checks.

The Supabase apply output records exactly M3 followed by `Finished supabase db push`. The apply was not invoked again during verification recovery.

The CLI emitted a non-fatal warning that it could not cache its local migration catalog because Docker Desktop was unavailable. This occurred after the remote migration application; exact production history/catalog verification and the independent protected schema evidence confirm the applied result.

## Post-application verification

Protected package: `advisor-directory-production-post-m3-20260719T184639Z`.

- Status: success; `apply_reinvoked=false`; `verification_only=true`.
- Manifest coverage: 28/28 files, independently rehashed.
- Archive size: 772,070 bytes.
- Archive entries: 1,337.
- Archive SHA-256: `a33a1f42c415a3aacfd4b19aafe8ec10d12f0aa707014971b282b3c668f0530c`.
- Schema-only and data-only streams: passed.
- Migration history: exact ordered M1+M2+M3 version/name pairs.
- `admin_users` rows: zero.
- Application counts: companies 202, advisors 177, listing claims 0, media content 0, users 0.
- Authorization catalog: exact table/columns/constraints/indexes, owner, RLS policy, trigger, table grants, and function grants.
- `is_admin()`: SQL, STABLE, PARALLEL SAFE, SECURITY DEFINER, `postgres` owner, fixed empty `search_path`, no PUBLIC/anonymous execute grant.
- Production empty-registry behavior: authenticated non-admin `false|0`; service role without JWT subject `false|0`; anonymous execution denied by grant.
- Full active/inactive administrator and service mutation matrix: passed on the disposable M1+M2+M3 target; production retained zero administrator fixtures.
- Current-target fingerprint/catalog: exact match.
- Public smokes: site HTTP 200; advisor API total 202 with one requested row.
- Repository: M1/M2/M3 hashes exact, expected dirty worktree preserved, and zero staged files.

## Verification recovery note

The first combined post-apply Boolean reported `function_exact=false` even though a read-only field-by-field catalog diagnostic proved every required function attribute and grant exact. Verification resumed through a dedicated read-only wrapper containing no Supabase migration invocation and explicitly recorded `apply_reinvoked=false`.

The first captured post package then exposed a local evidence-validator defect: its administrator-table privilege comparison included implicit PostgreSQL owner privileges while its expected register contained API roles only. Filtering that comparison to PUBLIC/anon/authenticated/service-role privileges made the already captured package pass all remaining checks. A final clean capture produced the successful package above without diagnostic bypass.

## Application and administrator governance

No coordinated application changes were deployed. Eleven of 19 administrator API modules remain authentication-only, including four that create service-role clients, so administrator application enablement remains blocked.

No first administrator was selected or inserted. Bootstrap identity, approver, transaction, evidence, and ongoing grant/revocation governance require a separate explicit decision and approval.
