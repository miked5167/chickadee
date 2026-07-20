# M2 Reconciliation Guardrails and Timestamp Consistency

**Status:** Applied to production and independently verified on 2026-07-19  
**Production mutation performed:** Yes—only reviewed M2  
**Version:** `20260719000001`  
**Migration:** `20260719000001_add_companies_updated_at_trigger.sql`  
**Reviewed SHA-256:** `95fb374bb07c5a4941b3dd78e6a6db9bf5b4b456c15670fb3ac9805e3a81b547`

## Exact scope

M2 creates one application object:

```sql
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

Before that statement, the migration sets conservative timeouts and fails closed unless:

- `public.companies` is a table and its `updated_at` column is unmodified `timestamp with time zone`;
- `public.update_updated_at_column()` has the adopted signature, result, language, volatility, parallel mode, security mode, strict/leakproof/config state, owner, and body;
- `update_companies_updated_at` is absent; and
- no differently named companies UPDATE trigger already calls the timestamp function.

It does not modify the function, perform DML, rewrite a table, add metadata, change RLS/grants, or touch another application object.

The body comparison normalizes only CRLF line endings to LF before exact comparison. Production stores the adopted four-line body with CRLF, while PostgreSQL's disposable bootstrap stores the same body with LF; all non-line-ending content and every function attribute must still match exactly.

## Evidence architecture

- `production-company-baseline.json` remains immutable M1 evidence.
- `current-target.json` is generated deterministically from exact M1 plus M2.
- Fresh bootstrap compares the fully migrated database to `current-target.json`.
- Protected evidence validation uses `--target baseline` for exact M1-only production evidence and `--target current` only for exact M1+M2 history/evidence.
- M1 migration SHA-256 remains `4b65fa234b56534985f249cc8061efd98b05ba927c5de130839b8fd35c1d1db8`.
- Derived types remain byte-for-byte unchanged because M2 adds no row shape.

## Completed validation

Completed on a disposable PostgreSQL 18.4/PostGIS 3.6.2 cluster bound only to loopback:

- exact active migration ordering and uniqueness;
- exact M2 statement scope and prerequisite/duplicate/equivalent-trigger guards;
- fresh M1 then M2 bootstrap;
- second migration-runner pass applying zero migrations;
- direct M2 re-execution failing through its duplicate guard;
- differently named equivalent companies trigger failing through its equivalent-trigger guard;
- M1 baseline execution still failing on the existing schema;
- deterministic current-target fingerprint and exact five-trigger catalog;
- unchanged derived database types; and
- a rolled-back future `UPDATE` advancing `companies.updated_at` from a fixed historical value.

The previously protected post-M1 package also passed its checksum, 1,321-entry archive, exact M1 history, exact application catalog/fingerprint, and 202/177/0/0/0 count validation. Fresh public smoke tests returned HTTP 200 for the site and total 202 from `/api/advisors?limit=1`.

## Production preflight evidence

Credentialed read-only preflight completed on 2026-07-19 and produced protected package `advisor-directory-production-20260719T165915Z` outside the repository. Independent validation confirmed:

- 23 manifest entries cover all 23 evidence files;
- the custom archive is 763,170 bytes with SHA-256 `8f20bd7c6fdb0081a7eec899d2516fc9fda6cea1f7d1e9e6e5c7f8368d17aa5d` and exactly 1,321 entries;
- archive listing plus schema-only and data-only streams validate;
- routed production identity and exact M1-only history match;
- the adopted timestamp function matches after line-ending normalization and no intended/equivalent companies trigger exists;
- application counts remain 202/177/0/0/0 before and after capture;
- protected schema/catalog evidence matches the immutable M1 fingerprint;
- pinned Supabase CLI `2.109.1` dry-run lists only `20260719000001_add_companies_updated_at_trigger.sql`;
- public site HTTP status is 200 and advisor API total is 202; and
- branch, unstaged-only worktree preservation, migration hashes, and repository validators pass.

Explicit approval `APPROVE M2 PRODUCTION MIGRATION` was received before mutation. Immediately before application, the wrapper repeated production identity, exact M1-only history, function, trigger absence, hashes, counts, public smokes, repository safeguards, and the pinned dry-run containing only M2.

## Production result

Pinned Supabase CLI `2.109.1` applied only `20260719000001_add_companies_updated_at_trigger.sql`. Post-application verification confirmed:

- exact ordered history `20260719000000_production_company_baseline` plus `20260719000001_add_companies_updated_at_trigger`;
- exactly one non-internal companies trigger named `update_companies_updated_at`, enabled `O`, `BEFORE UPDATE`, row-level, calling `public.update_updated_at_column()`;
- unchanged application counts 202/177/0/0/0;
- protected package `advisor-directory-production-post-m2-20260719T172018Z` with 22/22 checksums;
- a 764,399-byte custom archive with exactly 1,322 entries and SHA-256 `84be451f779257f302255443dd96f82de0f683cfb265d4f4c89ce00a0ce6e4a7`;
- current-target schema/catalog/fingerprint agreement, valid schema/data streams, and exact M1+M2 history;
- site HTTP 200 and advisor API total 202; and
- passing repository, negative-rule, fingerprint, type, branch, migration-hash, worktree-preservation, and zero-staging checks.

The initial post-check reported a false history mismatch because Windows PowerShell preserved the JSON array as one pipeline object and the wrapper wrapped it again. The protected apply output showed M2 completed, so the workflow stopped without reapplying. Verification-resume mode required exact M1+M2 history, did not invoke `db push`, and completed the full post-M2 evidence run.
