# M2 Production Execution Record — 2026-07-19

## Outcome

M2 `20260719000001_add_companies_updated_at_trigger.sql` was explicitly approved, applied to production through pinned Supabase CLI `2.109.1`, and independently verified. M1 SQL was not executed. No migration other than M2 was applied.

Reviewed migration SHA-256: `95fb374bb07c5a4941b3dd78e6a6db9bf5b4b456c15670fb3ac9805e3a81b547`.

## Applied schema change

```sql
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

The migration performed no row-bearing DML, function replacement, RLS or grant change, metadata creation, destructive DDL, or unrelated schema change. Supabase recorded the M2 history row.

## Approval and immediate safeguards

The user supplied the explicit phrase `APPROVE M2 PRODUCTION MIGRATION` before execution. Immediately before application, the guarded wrapper revalidated:

- production route/database/user identity;
- exact M1-only migration history;
- exact M1 and M2 file hashes;
- the companies `updated_at` column type;
- the adopted timestamp function signature, attributes, owner, and CRLF-normalized body;
- absence of the intended or any equivalent companies timestamp trigger;
- exact counts 202/177/0/0/0;
- public site and advisor API smokes;
- validated protected preflight evidence;
- branch, worktree, and zero-staging state; and
- a pinned dry-run containing only M2.

## Post-application evidence

Protected package: `advisor-directory-production-post-m2-20260719T172018Z`.

- Manifest coverage: 22/22 files.
- Archive size: 764,399 bytes.
- Archive entries: 1,322.
- Archive SHA-256: `84be451f779257f302255443dd96f82de0f683cfb265d4f4c89ce00a0ce6e4a7`.
- Schema-only and data-only streams: passed.
- Migration history: exact ordered M1 plus M2.
- Trigger: one non-internal `public.companies.update_companies_updated_at`, enabled `O`, BEFORE UPDATE, row-level, calling the adopted function.
- Application counts: companies 202, advisors 177, listing claims 0, media content 0, users 0.
- Current-target fingerprint/catalog: exact match.
- Public smokes: site HTTP 200; advisor API total 202 with one requested row.
- Repository safeguards: validators, negative rules, fingerprints, derived types, migration hashes, branch, worktree preservation, and zero staged files passed.

## Verification-resume note

The first post-application history check stopped after a local Windows PowerShell JSON-array counting error. The protected CLI output and failed-package status correctly recorded that production had changed, so the migration was not rerun. The corrected `-ResumePostVerification` path required exact already-applied M1+M2 history, explicitly recorded `apply_reinvoked = false`, and performed only post-application verification and evidence capture.
