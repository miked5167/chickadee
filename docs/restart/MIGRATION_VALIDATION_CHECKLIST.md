# Migration Validation Checklist

**Use:** Mandatory gates for the guarded foundation and later schema/application implementation
**Current goal:** M3 applied after explicit approval and fully verified; administrator bootstrap and coordinated application remediation remain separately gated

No checklist item authorizes a production change. Production execution requires a separately approved change window and exact target verification.

## 1. Repository and environment safety

- [x] Current branch and commit are recorded; unrelated working-tree changes are preserved.
- [x] No dump, roles export, catalog CSV, schema extraction, backup log, or protected-backup path is tracked or staged.
- [x] Active migrations contain no legacy business-as-`advisors` files.
- [x] Migration filenames are unique, fixed-width timestamps and strictly ordered.
- [x] The automated validator rejects duplicate/out-of-order versions and rejects legacy versions in the active path.
- [x] No migration includes production row contents, credentials, connection strings, tokens, password hashes, or PII.
- [x] No baseline/migration contains `DROP SCHEMA public`, unapproved `DROP TABLE`, `TRUNCATE`, restore commands, `db reset`, or environment-variable mutation.
- [x] Baseline has a fresh-environment guard covering canonical application objects and cannot execute when an application table already exists.
- [x] Production project reference is supplied as an expected non-secret identifier; target URL/reference was validated without printing the URL.
- [x] The production execution wrapper permits only the approved history repair command and contains no baseline execution, reset, restore, or destructive operation.

Recommended command-policy tests should reject at minimum:

```text
supabase db reset --linked
supabase db push   # unless exact reviewed target and change window gates passed
pg_restore <production-url>
psql <production-url> -f baseline.sql
DROP SCHEMA public CASCADE
```

## 2. Backup and evidence gate

- [x] The current change window completed the protected logical backup and evidence procedure without restoring into production.
- [x] `status.json` reports success.
- [x] Every manifest entry independently matches SHA-256.
- [x] Archive listing and schema/data stream validation pass; independent checks confirmed 1,317 pre-adoption entries and 1,321 post-adoption entries including the expected history objects.
- [x] Catalog evidence includes tables/columns, constraints, indexes, enums, RLS/policies, functions, triggers, ownership/grants, counts, and migration-history state.
- [ ] A disposable restore target is proven non-production before any restore command.
- [ ] Restore test succeeds or the approved change explicitly records why it is blocked; no restore test ever targets production.
- [x] Production exact application counts immediately before and after adoption are recorded and unchanged at 202/177/0/0/0.

Baseline counts from 2026-07-19 are reference values, not substitutes for a new preflight: companies 202; advisors 177; claims/media/users 0.

## 3. Fresh-database bootstrap

Run on a blank, disposable Supabase project whose identity is proven not to be production.

- [x] Apply the canonical baseline from zero using the repository validation migration runner.
- [x] Apply exact M1 then M2 in order exactly once.
- [x] Re-run the migration runner; it performs no DDL/DML and reports no pending migration.
- [ ] Generate types successfully from the bootstrapped schema with the intended Supabase type generator. The checked-in types are deliberately derived from the canonical fingerprint, not claimed as live-generated.
- [ ] Application type-check/build succeeds against generated types.
- [x] Required extensions are present in expected schemas/versions.
- [x] Exactly one canonical definition exists for each table, enum, constraint, index, function, trigger, and policy.
- [x] Seed/test data is separate from production migrations and can be omitted; the fresh target contained zero application rows.
- [x] Optional feature objects are absent when their feature migration is intentionally excluded.
- [x] Direct M2 re-execution fails through the duplicate guard.
- [x] A differently named companies UPDATE trigger calling the timestamp function is rejected.
- [x] A disposable rolled-back UPDATE proves `companies.updated_at` advances.
- [x] The trigger-only migration leaves generated row types byte-for-byte unchanged.
- [x] Exact M1 then M2 then M3 applies once and the runner rerun is a no-op.
- [x] M3 adds deterministic `admin_users` row types and the `is_admin()` RPC signature.
- [x] M3 role and tamper matrices cover anonymous, non-admin, active/inactive admin, service role, privileges, ownership, RLS, and security-function configuration with zero retained fixtures.

Fingerprint the blank target and compare its baseline portion to protected production evidence. Normalize only known nondeterministic fields such as object OIDs and sizes; do not normalize away names, expressions, defaults, enum order, policy predicates, function bodies/security, ownership, or grants.

## 4. Migration-history adoption and drift detection

- [x] Production fingerprint equaled the reviewed baseline before baseline history was adopted.
- [x] The baseline SQL itself was not executed on existing production.
- [x] Adoption procedure and exact version were reviewed, explicitly approved, and recorded.
- [x] Standard Supabase migration history exists after adoption and contains only `20260719000000_production_company_baseline`.
- [x] Before M2, production history contains exactly the adopted M1 row; the active local chain contains exact M1+M2 versions in order.
- [ ] CI compares canonical schema to a freshly migrated database.
- [ ] Pre-deployment drift job compares the intended target to a read-only catalog export and fails closed on unknown differences.
- [x] Adoption drift/evidence output contains definitions and counts only, not row data or secrets.
- [ ] Manual dashboard SQL is prohibited unless captured as an emergency change and immediately reconciled into migrations.

Drift detection must include:

- columns, order, type, nullability, defaults and generated expressions;
- enum labels and order;
- primary, unique, check, exclusion and foreign-key constraints including delete/update actions;
- indexes, methods, columns/expressions and predicates;
- RLS enabled/forced status, policy roles/commands/expressions;
- function identity arguments, body hash, volatility, security mode, owner and grants;
- trigger timing/events/enabled state/function;
- table owner and grants.

## 5. Company/advisor identity checks

Static checks:

- [x] SQL validation rejects a company-targeted table with `advisor_id`.
- [ ] Code lint/search flags `advisor_id` in claims, reviews, leads, listing views, click tracking, company ownership, company media, pricing/subscription, and listing APIs.
- [x] Derived canonical types distinguish `companies.Row` from `advisors.Row` and are not wired into runtime code yet.
- [ ] API schemas use `company_id`/`companyId` for listings.

Catalog checks (adapt to the disposable target):

```sql
-- Every person belongs to a company.
SELECT count(*) AS orphan_advisors
FROM public.advisors a
LEFT JOIN public.companies c ON c.id = a.company_id
WHERE c.id IS NULL;

-- Required company-targeted FKs must reference companies.
SELECT tc.table_name, kcu.column_name, ccu.table_name AS referenced_table
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_schema = tc.constraint_schema
 AND kcu.constraint_name = tc.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_schema = tc.constraint_schema
 AND ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('listing_claims','reviews','leads','listing_views','click_tracking','media_content')
ORDER BY 1, 2;

-- Ambiguous company-target columns are forbidden.
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('listing_claims','reviews','leads','listing_views','click_tracking','media_content')
  AND column_name = 'advisor_id';
```

Expected: zero orphan advisors; each relevant relationship uses `company_id -> companies`; final query returns zero rows.

## 6. RLS role matrix

Tests must use isolated fixtures on a disposable target: one anonymous client, two ordinary authenticated users, a company owner, a non-owner, an active admin, an inactive admin, and a service-role maintenance client. Never infer RLS correctness from service-role success.

| Scenario | anon | authenticated non-owner | owner | admin |
|---|---:|---:|---:|---:|
| Read public company | allow | allow | allow | allow |
| Update company | deny | deny | own only | explicit allow |
| Read active advisor person | allow | allow | allow | allow |
| Manage advisor person | deny | deny | owned company only | explicit allow |
| Insert own claim | deny unless deliberately supported | own identity only | own identity only | explicit workflow |
| View/update claim | deny | own only/pending only | own claim only | explicit allow |
| Read approved media | allow | allow | allow | allow |
| Manage media | deny | deny | owned company only | moderate |
| Read published review | allow | allow | allow | allow |
| Create/update review | deny | own only | own reviewer row only | moderate |
| Reply to review | deny | deny | owned company only | explicit allow |
| Submit lead/event | controlled allow | controlled allow | controlled allow | allow |
| Read lead/analytics | deny | deny | owned company only | explicit allow |
| Read/manage admin grants | deny | deny | deny | active admin only |

For every write policy:

- [ ] Test permitted row.
- [ ] Test same-role row for another user/company.
- [ ] Test changed FK/owner in `WITH CHECK`.
- [ ] Test null identity and forged payload user ID.
- [ ] Test inactive admin and revoked ownership.
- [ ] Confirm no recursive-policy error.
- [ ] Confirm security-definer functions use a fixed safe `search_path`, least privilege, and intended execute grants.

## 7. Workflow tests

### Claims

- [ ] Authenticated claimant can create a company claim only as self.
- [ ] Second active claim for the same company is rejected, including concurrent insert test.
- [ ] Claimant can see only own claims and update only permitted pending fields.
- [ ] Non-admin cannot approve/reject.
- [ ] Approval is atomic: claim approved and company owner/verified/date set together.
- [ ] Approval refuses a company owned by another user.
- [ ] Rejection leaves ownership unchanged.
- [ ] Expired/used verification challenge cannot be replayed if pre-auth workflow exists.

### Reviews

- [ ] Reviewer can create only for an existing company and only as self.
- [ ] Rating and uniqueness constraints work.
- [ ] Owner cannot edit reviewer content/rating and can reply only to reviews for owned company.
- [ ] Moderation visibility and rating aggregate are correct.
- [ ] Deletion/archive policy matches audit requirements.

### Leads

- [ ] Valid company lead accepted; missing/invalid company rejected.
- [ ] Rate-limit/abuse control tested.
- [ ] Owner sees/updates only owned-company leads.
- [ ] PII fields, retention, export, and deletion behavior match policy.

### Analytics

- [ ] Click/listing-view events use `company_id` and constrained event type.
- [ ] Public writer cannot read events.
- [ ] Owner dashboard sees only owned-company aggregates.
- [ ] Admin export is authorized, auditable, and minimizes PII.
- [ ] Listing-view writer either exists and is tested or the metric is removed.

### People and media

- [ ] Owner can CRUD advisor people only within owned company.
- [ ] Public sees active people only.
- [ ] Approved media is public; pending/rejected media is not.
- [ ] External upload failure does not leave a misleading metadata row; metadata failure has cleanup/retry behavior.

## 8. Counts, invariants, and orphan checks

Run before and after each migration in a read-only transaction where applicable. Expected deltas must be stated in the change record.

```sql
SELECT 'companies' AS object, count(*) FROM public.companies
UNION ALL SELECT 'advisors', count(*) FROM public.advisors
UNION ALL SELECT 'listing_claims', count(*) FROM public.listing_claims
UNION ALL SELECT 'media_content', count(*) FROM public.media_content
UNION ALL SELECT 'users', count(*) FROM public.users;

SELECT count(*) AS orphan_company_owners
FROM public.companies c
LEFT JOIN public.users u ON u.id = c.verified_owner_id
WHERE c.verified_owner_id IS NOT NULL AND u.id IS NULL;

SELECT count(*) AS orphan_claim_companies
FROM public.listing_claims lc
LEFT JOIN public.companies c ON c.id = lc.company_id
WHERE c.id IS NULL;

SELECT count(*) AS orphan_claimants
FROM public.listing_claims lc
LEFT JOIN public.users u ON u.id = lc.claimant_user_id
WHERE u.id IS NULL;

SELECT company_id, count(*)
FROM public.listing_claims
WHERE claim_status IN ('pending','under_review')
GROUP BY company_id
HAVING count(*) > 1;
```

After feature tables exist, add equivalent company/user orphan queries for reviews, leads, views, clicks, media, and admins. Expected result for every orphan/duplicate query is zero.

- [x] Exact unaffected-table counts did not change during baseline history adoption.
- [ ] Data transformation reports source count, transformed count, skipped count and exception count.
- [ ] No transformation infers company/advisor equivalence from coincident UUIDs.
- [ ] All backfills are rerun-safe or guarded by an explicit state predicate.
- [ ] Constraint validation completes before the application depends on it.

## 9. Migration failure and recovery

- [ ] Each migration is transactional where PostgreSQL/Supabase permits.
- [x] M2 uses reviewed 5-second lock and 30-second statement timeouts and resets both.
- [ ] Long constraint/index work uses the safe supported pattern and has a cancellation plan.
- [ ] Application remains compatible if schema is ahead by one release.
- [ ] Rollback does not require dropping columns/tables containing newly written data.
- [ ] Preferred recovery is a corrective forward migration.
- [ ] Restore is reserved for corruption/data loss, uses the validated backup/runbook, and never experiments on production.
- [ ] Stop conditions from `SCHEMA_RECONCILIATION_PLAN.md` are copied into the change record.

## 10. Final release gate

- [ ] Fresh bootstrap, rerun, generated types, type-check, tests and build pass.
- [x] Schema drift is zero except the reviewed Supabase migration-history objects.
- [ ] RLS matrix and workflow suites pass.
- [ ] Counts/orphans/invariants pass.
- [ ] Application direct-query inventory matches the target contract.
- [ ] No normal user flow depends on service role.
- [x] No secrets/PII/raw production rows appear in the guarded-foundation artifacts or validation output.
- [x] `git diff --check` passes for the repository implementation.
- [x] Git shows no staged/tracked backup artifacts at the repository implementation handoff.
- [ ] Reviewer signs baseline/adoption, migration, application, RLS, privacy, and recovery sections.
- [x] Production identity was revalidated immediately before the approved history-only command.
- [ ] Post-deploy verification and monitoring owner/window are assigned.

## 11. M2 production approval gate

- [x] Selected version/file is `20260719000001_add_companies_updated_at_trigger.sql` and no version collision exists.
- [x] M1 migration hash remains `4b65fa234b56534985f249cc8061efd98b05ba927c5de130839b8fd35c1d1db8`.
- [x] Reviewed M2 hash is `95fb374bb07c5a4941b3dd78e6a6db9bf5b4b456c15670fb3ac9805e3a81b547`.
- [x] Immutable M1 fingerprint remains unchanged; deterministic current-target fingerprint is generated from exact M1+M2.
- [x] Static scope validation proves M2 creates only the intended trigger and contains no row-bearing DML, destructive SQL, RLS/grant changes, function replacement, or metadata objects.
- [x] Disposable M1+M2 bootstrap, no-op rerun, direct/alternate-trigger guards, baseline guard, target fingerprint, catalog, type invariance, and future-update behavior pass.
- [x] Public site and advisor API smoke tests pass before credentialed preflight; rerun them during preflight.
- [x] Run `scripts/database/run-m2-production-preflight.ps1` from a local interactive terminal and supply the production database password only at its masked prompt.
- [x] Fresh protected archive, schema/data streams, 23/23 manifest checksums, 1,321-entry catalog evidence, exact M1 history, function/trigger checks, exact counts, M1 fingerprint, repository safeguards, and pinned Supabase CLI dry run all pass.
- [x] Present the exact reviewed production command and explain that it creates one BEFORE UPDATE row trigger and records only M2 history.
- [x] Receive the explicit phrase `APPROVE M2 PRODUCTION MIGRATION` before any production mutation.
- [x] Immediately before execution, repeat identity/history/function/trigger/hash/count checks and fail closed on change.
- [x] After approval/application, verify exact M1+M2 history, exact trigger metadata, no equivalent trigger, unchanged counts, fresh post-M2 protected evidence/current fingerprint, validators, smokes, documentation, and zero staged files.

## 12. M3 production approval gate

- [x] Selected version/file is `20260719000002_administrator_authorization_foundation.sql`; M1 and M2 remain byte-for-byte immutable.
- [x] Reviewed M3 SHA-256 is `a968f41fb10e6ecbe1ff8363abe0322031defd6aa361ce3c98498603ade55f6d`.
- [x] Static validation proves M3 is definitions-only, includes no identity/PII/row DML, and creates only reviewed authorization objects.
- [x] Full disposable M1+M2+M3 bootstrap, no-op rerun, role matrix, negative constraints, tamper guards, target fingerprint, and derived types pass.
- [x] Application audit covers all 19 administrator API modules; 11 authentication-only modules block coordinated application enablement.
- [x] Run `scripts/database/run-m3-production-preflight.ps1` interactively and enter the password only at its masked prompt.
- [x] Revalidate exact M1+M2 history/catalog/counts, hashes, absent M3 objects, Auth/role prerequisites, and public smokes.
- [x] Create a fresh protected archive outside the repository and validate exact 1,322-entry pre-M3 evidence/checksums/streams.
- [x] Pinned Supabase CLI `2.109.1` dry run lists only M3.
- [x] Present scope/evidence/risks/recovery/command and receive `APPROVE M3 PRODUCTION MIGRATION`.
- [x] After approval, repeat immediate gates, apply only M3, and verify exact M1+M2+M3 history, authorization catalog, zero admin rows, unchanged 202/177/0/0/0 counts, exact 1,337-entry post archive, fingerprint, smokes, docs, hashes, preserved worktree, and zero staging.
