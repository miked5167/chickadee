# Schema Reconciliation Plan

**Status:** M1, M2, and M3 applied and verified; first-admin bootstrap and coordinated administrator application remediation remain separately gated
**Production target:** Supabase project reference recorded in `PRODUCTION_BASELINE.md`
**Production changes made:** M1 history adoption, trigger-only M2, and authorization-foundation M3 are complete; M3 created no administrator row and changed no application data

The completed production change is recorded in `PRODUCTION_BASELINE_ADOPTION_RECORD.md`.

## Selected migration-history strategy

Select **preserve the existing files as historical evidence while introducing a guarded reconciliation layer**.

The five incompatible SQL files are now outside the active `supabase/migrations` execution path without deleting their history. A production-derived canonical baseline and deterministic fingerprint are implemented. The baseline is guarded so an existing application object causes it to abort before any schema change. A fresh environment applies the baseline normally. Production may adopt the baseline version in migration history only after a strict catalog fingerprint proves that every baseline object already matches. Forward migrations then add company-centric capabilities.

The repository implementation itself ran no production change. A later reviewed change window adopted `20260719000000` into production migration history with Supabase CLI `2.109.1`. The CLI created the previously absent standard history relation and recorded the version/name/parsed statements only; it did not execute the baseline SQL.

### Strategy comparison

| Strategy | Production safety | Fresh bootstrap | Existing data/recovery | App compatibility/reviewability | Accidental deployment risk | Decision |
|---|---|---|---|---|---|---|
| Production-derived baseline followed by forward migrations, directly added to active chain | Good definition fidelity, but a naïve baseline can collide with all existing objects | Strong | Preserves data if adopted rather than executed | Reviewable after normalization | High unless execution is strongly gated because production has no migration history | Use its baseline artifact, but only inside the guarded strategy. |
| Rebuild/squash the incomplete chain | Can be clean, but obscures how production diverged and encourages replacement assumptions | Strong | Higher risk of destructive convergence or ID remapping | Large review surface; rollback attribution is weak | Medium-high | Reject as the primary production strategy. |
| Preserve files and add guarded reconciliation/adoption layer | Highest: no legacy file is applied; baseline adoption requires exact fingerprint | Strong once legacy files are removed from active path and baseline is first | Existing IDs/data stay in place; backup remains recovery point | Historical and canonical definitions are clearly separated | Lowest when CI blocks unguarded execution | **Selected.** |

### Why this is safest

- Production has valid company-centric data and no standard Supabase migration history; destructive rebuilding has no benefit.
- None of the local migrations can safely initialize or update production.
- A canonical baseline is necessary for fresh-database reproducibility, but execution against an existing database must be impossible by default.
- A fingerprint-and-adopt step makes production history truthful without replaying `CREATE TABLE` statements.
- Small forward migrations are independently reviewable and recoverable.
- Existing legacy SQL remains available for archaeology but cannot be mistaken for an executable chain.

## Implemented repository layout

Implemented layout:

```text
supabase/
  migrations/
    20260719000000_production_company_baseline.sql
    20260719000001_add_companies_updated_at_trigger.sql
  legacy-migrations/
    README.md
    20250104000000_claim_improvements.sql
    ...four preserved historical files...
  schema-fingerprint/
    README.md
    production-company-baseline.json
    current-target.json
  types/
    database.generated.ts
  validation/
    local-platform-prerequisites.sql
scripts/database/
  generate-schema-fingerprint.mjs
  generate-database-types.mjs
  validate-migrations.mjs
  validate-production-evidence.mjs
  validate-fresh-bootstrap.mjs
  run-local-bootstrap.ps1
  run-m2-production-preflight.ps1
```

The baseline contains definitions, not production rows. It creates the required extensions/types/tables/constraints/indexes/function/triggers/RLS/policies/ownership/grants for a blank supported Supabase database. It begins with a fresh-environment guard that covers canonical tables, enums, the function, constraints, indexes, policies, and triggers. Production never executes it; the controlled adoption procedure records the version only after a read-only fingerprint comparison.

`npm run db:validate` validates exact M1/M2 ordering, adopted/reviewed hashes, legacy hashes/quarantine, baseline and forward guard coverage, destructive/DML/entity/sensitive-value rules, both object registers, deterministic layered fingerprints, and unchanged derived types. `npm run db:validate:evidence -- <protected-evidence-directory> --target baseline` rechecks exact M1-only protected evidence; `--target current` requires exact M1+M2 history and the current-target fingerprint. The loopback-only bootstrap harness applies the complete chain, proves a runner rerun is a no-op, tests direct M2 re-execution and an alternate-name equivalent trigger, performs a real future-update timestamp test, compares the target fingerprint, and rechecks the M1 guard.

## Finite ordered migration sequence

The sequence separates schema availability from application cutover. Every step is forward-only unless explicitly marked as repository-only.

### R0 — Quarantine incompatible history (repository-only)

- **Purpose:** Preserve but remove the five legacy migrations from automatic execution.
- **Prerequisites:** Clean review branch; inventory in `SCHEMA_DRIFT_MATRIX.md`; no migration process running.
- **Affected objects:** Repository paths only; no database objects.
- **Transformations:** Move files byte-for-byte to `supabase/legacy-migrations`; add a warning README and ordering test.
- **Preflight:** Hash the five source files; confirm Git status and branch.
- **Invariants:** File contents preserved; active migrations contain no legacy business-as-advisor DDL.
- **RLS/app dependencies:** None.
- **Recovery:** Revert the repository move before deployment; never compensate in the database.
- **Verification:** Implemented locally: before/after SHA-256 equality and an automated assertion that legacy versions are absent from the active chain.
- **Downtime:** None.
- **Stop if:** Any environment has already recorded one of these exact versions and its actual object effects are not understood.

### M1 — Canonical production baseline and guarded adoption

- **Purpose:** Make the current five-table production schema reproducible on a blank database and establish truthful history on production without replaying DDL.
- **Prerequisites:** Independently reviewed schema-only baseline; validated backup; disposable fresh target; exact catalog fingerprint covering columns/defaults/nullability, enums/order, constraints, indexes/predicates, RLS/policies, functions, triggers, owners, and grants.
- **Affected objects:** PostGIS/UUID prerequisites; five production enums; `companies`, `advisors`, `listing_claims`, `media_content`, `users`; shared timestamp function; 4 existing triggers; 10 policies; grants.
- **Transformations:** None. Baseline contains no row data.
- **Preflight:** Fresh target has no application objects. Production fingerprint equals the reviewed baseline and exact counts remain 202/177/0/0/0. Confirm the standard migration table is still absent or document any state change.
- **Invariants:** Existing production object OIDs/data/IDs are not touched; baseline SQL cannot run when any application table exists.
- **RLS:** Reproduce current semantics exactly before enhancements.
- **App dependencies:** Current public company reads must remain valid.
- **Recovery:** Fresh target can be discarded. If production adoption history is recorded incorrectly, stop all deployment work and correct history through the approved Supabase migration-repair procedure; do not drop/recreate schema.
- **Verification:** Completed. Repository object/fingerprint/evidence checks pass. Blank-target bootstrap, no-op rerun, post-bootstrap fingerprint equality, catalog/RLS checks, and guard rejection passed on a proven temporary loopback PostgreSQL 18.4/PostGIS 3.6.2 target. Production history now contains only the approved baseline version. Pre/post protected evidence confirms the canonical application fingerprint and exact counts remained unchanged.
- **Downtime:** None for adoption.
- **Stop if:** Any fingerprint mismatch, unexpected production rows, missing backup validation, project-reference ambiguity, baseline tries to execute on production, or the adoption tool would replay SQL.

### M2 — Reconciliation guardrails and timestamp consistency

- **Purpose:** Close the single timestamp-consistency gap through a small, fail-closed forward migration.
- **Prerequisites:** M1 history established and fingerprint clean.
- **Version/file:** `20260719000001_add_companies_updated_at_trigger.sql`; reviewed SHA-256 `95fb374bb07c5a4941b3dd78e6a6db9bf5b4b456c15670fb3ac9805e3a81b547`.
- **Affected objects:** Creates only `public.companies.update_companies_updated_at`. It calls the existing `public.update_updated_at_column()` without replacing or modifying it. No metadata object is included.
- **Transformations:** None.
- **Preflight:** Confirm exact M1-only history, expected project/route, exact function definition/owner/volatility/security/language/body, `companies.updated_at` type, absence of the intended or equivalent trigger, exact counts 202/177/0/0/0, fresh protected backup/checksums/streams, M1 fingerprint, public smoke tests, branch/worktree/staging safeguards, and a pinned CLI dry run containing only M2.
- **Invariants:** Company rows and IDs unchanged; trigger only changes `updated_at` on future updates.
- **RLS:** No access expansion.
- **App dependencies:** None.
- **Recovery:** Drop only the newly added trigger in a forward repair if it misbehaves; preserve function used by four other tables.
- **Verification:** Completed on 2026-07-19. Fresh M1+M2 bootstrap, migration-runner no-op rerun, direct M2 duplicate rejection, differently named equivalent-trigger rejection, M1 existing-schema guard, deterministic current-target fingerprint, unchanged derived types, exact five-trigger catalog, and a rolled-back behavioral update proving `companies.updated_at` advances all passed. Credentialed production preflight package `advisor-directory-production-20260719T165915Z` passed 23/23 checksums, exact M1-only history/counts/catalog, a 1,321-entry archive, streams/smokes, and a pinned CLI dry-run listing only M2. After explicit approval, pinned CLI `2.109.1` applied only M2. Post package `advisor-directory-production-post-m2-20260719T172018Z` passed 22/22 checksums, exact ordered M1+M2 history, exact enabled BEFORE UPDATE row trigger metadata, unchanged 202/177/0/0/0 counts, current-target fingerprint/catalog, public smokes, and a 764,399-byte/1,322-entry archive with SHA-256 `84be451f779257f302255443dd96f82de0f683cfb265d4f4c89ce00a0ce6e4a7`.
- **Downtime:** None.
- **Stop if:** A differently named company timestamp trigger already exists or writes other columns.

### M3 — Administrator authorization foundation

- **Purpose:** Provide explicit production admin authorization without depending on service-role use for every admin request.
- **Prerequisites:** Exact M1+M2 production state; first administrator identity remains a separately approved operation.
- **Version/file:** `20260719000002_administrator_authorization_foundation.sql`; reviewed SHA-256 `a968f41fb10e6ecbe1ff8363abe0322031defd6aa361ce3c98498603ade55f6d`.
- **Affected objects:** Empty `admin_users`, constraints/indexes, shared timestamp trigger, fixed-search-path `is_admin()` predicate, one own-row SELECT policy, ownership, revokes, and grants.
- **Transformations:** None from production; production has no admin rows.
- **Preflight:** Confirm object names absent; confirm no administrator currently relies on an undocumented table; verify owner role for any security-definer function and fixed `search_path`.
- **Invariants:** Non-admin users cannot enumerate or self-grant; only authorized admins can manage grants; audit timestamps cannot be caller-forged if protected.
- **RLS:** Own-row status inspection only; no authenticated mutation policy. Anonymous, authenticated non-admin, active admin, inactive admin, and service-role tests pass without recursion.
- **App dependencies:** `lib/supabase/auth.ts` and every admin route must switch to this explicit predicate/client model in the coordinated app release.
- **Recovery:** Deactivate bad grants and replace policies/function forward. Do not drop audit records during incident recovery.
- **Verification:** Repository rules and a full disposable M1+M2+M3 bootstrap pass, including no-op rerun, role matrix, constraint behavior, duplicate/prerequisite/privilege/ownership/RLS/security-function tamper tests, target fingerprint, and zero retained administrator rows. The no-mutation production preflight package `advisor-directory-production-pre-m3-20260719T181517Z` proves exact M1+M2 history, exact prerequisites/counts, absent M3 objects, 25 validated checksums, a 764,399-byte/1,322-entry archive (SHA-256 `f5afb063ececc52d3736b01a1a25fdb0be79c995fdeb73b46282d61b2cc9673f`), public smokes, and a pinned CLI dry run listing only M3. After explicit approval, pinned CLI `2.109.1` applied only M3. Post package `advisor-directory-production-post-m3-20260719T184639Z` proves exact M1+M2+M3 history, zero admin rows, unchanged 202/177/0/0/0 counts, exact authorization/current-target catalog, public smokes, 28 validated checksums, and a 772,070-byte/1,337-entry archive with SHA-256 `a33a1f42c415a3aacfd4b19aafe8ec10d12f0aa707014971b282b3c668f0530c`. See `M3_ADMIN_AUTHORIZATION_FOUNDATION.md`, `M3_PRODUCTION_PREFLIGHT_20260719.md`, and `M3_PRODUCTION_EXECUTION_20260719.md`.
- **Downtime:** None; admin UI remains blocked until app cutover/bootstrap.
- **Stop if:** First-admin identity is ambiguous, policy recursion occurs, function is executable by unintended roles, or admin APIs still trust authentication alone.

### M4 — Company reviews

- **Purpose:** Create the missing review feature with explicit company and reviewer targets.
- **Prerequisites:** Review field/moderation/retention decisions; M3 if admin moderation ships concurrently.
- **Affected objects:** `reviews`, constraints/indexes, RLS, optional company rating aggregation function/trigger.
- **Transformations:** None; production has no review table. Do not import legacy or test data without a separate reviewed mapping.
- **Preflight:** Object absent; every intended FK target exists; no code release is writing legacy `advisor_id`.
- **Invariants:** `company_id` always references companies; rating 1–5; reviewer uniqueness rule; owners cannot edit reviewer content; aggregates equal published reviews.
- **RLS:** Public published reads, own-review writes, owner reply only, explicit admin moderation.
- **App dependencies:** Review form/page and all review/admin/dashboard APIs listed in `APPLICATION_DATABASE_REMEDIATION.md` must deploy with `company_id` and the selected reviewer column.
- **Recovery:** Disable writes with policy replacement; repair forward. Table drop is allowed only before any real rows and with approval.
- **Verification:** CRUD tests for all roles, duplicate-review test, aggregate reconciliation and orphan queries.
- **Downtime:** None with schema-first then coordinated app deployment.
- **Stop if:** Any route still sends company IDs as `advisor_id`, reviewer column naming is unresolved, or RLS tests require service role for normal review actions.

### M5 — Company leads and directory analytics

- **Purpose:** Create missing company-targeted `leads`, `listing_views`, and `click_tracking`.
- **Prerequisites:** Privacy/retention, abuse-control, event taxonomy, and indexing decisions.
- **Affected objects:** Three tables, FKs/indexes/checks, RLS, retention job definition if approved.
- **Transformations:** None; objects do not exist in production.
- **Preflight:** Objects absent; analytics consent and IP handling reviewed; event writers identified.
- **Invariants:** All three use `company_id`; no raw production secret; lead status constrained; analytics inserts cannot update/delete arbitrary rows.
- **RLS:** Controlled public/auth insert; owner read for owned company; owner lead-status update; explicit admin access.
- **App dependencies:** Contact components/API, click route, missing listing-view writer, advisor dashboards, and admin analytics/export routes all cut over together.
- **Recovery:** Revoke insert policies to stop collection, then repair forward. Preserve already collected lead data under retention rules.
- **Verification:** Role matrix, company FK checks, rate-limit tests, count dashboards against known test events.
- **Downtime:** None.
- **Stop if:** Retention/legal basis is unresolved, app payload remains `advisor_id`, or anonymous policy permits reads.

### M6 — Claim workflow reconciliation

- **Purpose:** Align application behavior with existing company-centric claims and implement a secure decision workflow.
- **Prerequisites:** Auth-before-claim versus pre-auth decision; administrator foundation; all existing claim rows confirmed zero immediately before change or separately mapped.
- **Affected objects:** Existing `listing_claims` columns/checks/indexes/policies; optional challenge table if pre-auth is selected; atomic approval function if approved.
- **Transformations:** With current zero rows, only additive/constraint changes are expected. Never rename `company_id` to `advisor_id` or `claim_status` to generic `status`.
- **Preflight:** Exact count; no active claims; owner uniqueness/ownership conflicts; policy definitions; enum values.
- **Invariants:** One active claim per company; claimant identity matches auth identity; approval cannot steal an owned company; claim decision and company owner update are atomic and audited.
- **RLS:** Claimant self-service, company-safe visibility, explicit admin decision. Service role not required for claimant operations.
- **App dependencies:** Public claim page/form and claim/verify/setup/admin APIs must adopt production names and the selected authentication flow.
- **Recovery:** Suspend claim writes via policy; forward-fix workflow. If additive fields are unused and zero-row, they may be removed only after review.
- **Verification:** Submit/view/update/approve/reject tests, concurrent active-claim test, ownership conflict test, expired challenge test if applicable.
- **Downtime:** Claims may be feature-disabled during the coordinated cutover; public directory remains available.
- **Stop if:** Row count is no longer zero without a mapping, ownership conflict exists, pre-auth security design is unapproved, or approval is not atomic.

### M7 — Company profile, pricing, and subscription fields

- **Purpose:** Add only approved business fields currently modeled on legacy `advisors`.
- **Prerequisites:** Field-by-field product contract and mapping from UI; validation limits; production-data backfill plan.
- **Affected objects:** `companies` columns/checks/indexes only; no person-table business fields.
- **Transformations:** Backfills must be deterministic from existing company columns or an approved source. No cross-ID inference from advisors.
- **Preflight:** Nullability and default impact; index size; source completeness; row-count snapshot.
- **Invariants:** 202 company IDs preserved; every advisor remains linked to its existing company; defaults do not falsely publish/verify/subscribe companies.
- **RLS:** Owner updates only approved fields; admin-only fields protected through column-safe RPC or server authorization because PostgreSQL table RLS alone is not column-level authorization.
- **App dependencies:** Admin listing and company-owner profile routes/types/forms.
- **Recovery:** Forward-remove unused indexes; nullable new columns can remain during app rollback. Avoid destructive column removal until after observation.
- **Verification:** Field checks, owner/admin authorization tests, unchanged row counts and FK/orphan counts.
- **Downtime:** None if additive.
- **Stop if:** A field's entity ownership is ambiguous or a default mutates existing business state.

### M8 — People/team route cutover and legacy object retirement

- **Purpose:** Point team management at production `advisors` and prevent creation of `advisor_team_members`.
- **Prerequisites:** Company-owner profile cutover; mapping for any non-production/test team-member data if it exists elsewhere.
- **Affected objects:** Primarily application code; optional advisor constraints/indexes/RLS refinements.
- **Transformations:** None in production unless new person fields are approved.
- **Preflight:** Confirm 177 advisors and zero or absence of alternate team table; validate company ownership.
- **Invariants:** Person IDs stay person IDs; company cascade behavior understood; display order remains non-negative.
- **RLS:** Owners CRUD people for owned company; public sees active people only; admin explicit.
- **App dependencies:** All `/api/advisor/team` routes and team UI/types.
- **Recovery:** Roll back application release while additive DB changes remain compatible.
- **Verification:** Owner/non-owner CRUD tests and public active filtering.
- **Downtime:** None.
- **Stop if:** Any compatibility translation treats a company ID as advisor ID.

### M9 — User/profile and optional subsystem decisions

- **Purpose:** Consolidate `users_public` expectations into `users` or a safe view; separately introduce only approved blog, notification, import-log, or media integrations.
- **Prerequisites:** Privacy/public-profile contract and a decision for each optional subsystem.
- **Affected objects:** `users` additions or view; optional tables/migrations kept separate by feature.
- **Transformations:** Production user table has zero rows at baseline, but recheck. Auth identities are never recreated merely for migration convenience.
- **Preflight:** Exact counts, auth/profile orphan checks, dependency inventory.
- **Invariants:** One profile per auth user; no exposure of private auth fields; blog related entity uses `related_company_id`.
- **RLS:** Self-profile writes, deliberately scoped public reads, explicit author/admin policies.
- **App dependencies:** Auth callback, profile helper, review/blog author lookups, blog routes, CSV import.
- **Recovery:** Feature-disable optional subsystem; preserve user data; repair policies forward.
- **Verification:** Auth callback/upsert, privacy projection, author permissions, subsystem-specific tests.
- **Downtime:** None; optional features may stay disabled.
- **Stop if:** A public view exposes private fields, `users_public` and `users` become competing writable sources, or optional scope is unapproved.

## Deployment and recovery choreography

1. Build and validate M1 on a disposable, proven non-production Supabase project.
2. Compare its schema fingerprint with protected production evidence.
3. During an approved window, revalidate production identity, backup, checksum, catalog fingerprint, and exact counts.
4. **Completed for M1:** Adopt M1 history without executing its DDL. Apply only separately reviewed forward migrations in later releases.
5. Deploy schema additions before code that reads them. For entity renames in payloads, deploy boundary-compatible code only when it translates explicitly to `company_id`; remove compatibility promptly.
6. Run role/RLS and workflow tests using a disposable or staging target. Production smoke tests must be non-destructive unless separate test records and cleanup are explicitly approved.
7. If a forward migration fails, stop. Prefer a corrective forward migration. Restore is an incident-level option only after data loss/corruption and only through the backup runbook.

## Global stop conditions

Stop the entire migration process if any of the following occurs:

- The connected project reference cannot be proven non-production for testing or proven exactly production for a reviewed production change.
- Protected backup status or checksum validation fails.
- Current production fingerprint or exact row counts differ from the approved preflight without explanation.
- Any command would run the baseline DDL against an existing production schema.
- A migration contains `DROP SCHEMA`, broad `DROP TABLE`, `TRUNCATE`, `db reset`, restore, or ID remapping not explicitly approved.
- A company ID is assigned to an `advisor_id` column or parameter.
- Normal owner/user authorization works only through the service-role key.
- RLS tests fail for any role or admin authorization is recursive/ambiguous.
- Application and schema releases cannot be ordered without a period of corrupt or ambiguous writes.

## Work deliberately deferred

This foundation has now initialized production migration history with the approved baseline record only. It does not alter runtime code, run a backup restore, create a hosted disposable project, deploy, or change application schema/data. Reviews, leads, analytics, claim remediation, administrator authorization, and all later product migrations remain deferred. Full protected-backup restore validation remains a separate recovery gate; the canonical migration-chain fresh bootstrap is complete.
