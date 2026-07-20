# Production Baseline Adoption Record

**Status:** Completed successfully
**Production project:** `dqskdrqubqnhdssxpryx`
**Adopted migration:** `20260719000000_production_company_baseline`
**Completion time:** 2026-07-19 15:07:56 UTC
**Approved scope:** Supabase migration history only

## Outcome

Production migration history now contains exactly one row:

| Version | Name | Parsed statements recorded |
|---|---|---:|
| `20260719000000` | `production_company_baseline` | 91 |

The Supabase migration-history schema/table was created because the standard relation was absent. The baseline migration SQL was not executed. No application schema object, production row, runtime configuration, credential, API setting, or deployment state was changed.

## Approval and command

The mandatory checkpoint was completed after the fresh read-only preflight. Explicit approval was received for the single history-only mutation before execution.

Executed with Supabase CLI `2.109.1` from an isolated, unlinked work directory containing exactly one migration whose SHA-256 matched the reviewed baseline:

```powershell
npx --yes supabase@2.109.1 --workdir "$AdoptionWorkDir" migration repair 20260719000000 --status applied --db-url "$ProductionPoolerUrlWithoutPassword"
```

The connection URI supplied to the command contained no password. The database password was entered through a masked local prompt, supplied only through the process environment, and cleared after execution.

## Pre-adoption verification

- Production project identity was verified immediately before execution.
- The standard migration-history relation was still absent.
- The baseline and isolated adoption copy shared SHA-256 `4b65fa234b56534985f249cc8061efd98b05ba927c5de130839b8fd35c1d1db8`.
- The isolated work directory was unlinked and contained exactly one migration.
- The logical backup was non-empty and passed archive listing plus schema/data stream parsing.
- All 21 pre-adoption manifest checksums matched; the archive contained 1,317 entries.
- The canonical schema fingerprint and complete application catalogs matched.
- Exact counts were companies 202, advisors 177, listing claims 0, media content 0, and users 0.
- Repository migration, safety-rule, fingerprint, derived-type, and protected-evidence validators passed.
- The guarded baseline was confirmed to abort before application DDL on an existing schema.
- The public site and advisor API smoke tests passed.

## Post-adoption verification

- The history relation exists and contains only the approved version/name.
- The recorded history metadata contains 91 parsed baseline statements.
- The post-adoption logical backup is non-empty and passes archive listing plus schema/data stream parsing.
- All 22 post-adoption manifest checksums match; the archive contains 1,321 entries, including the expected migration-history objects.
- Both pre- and post-adoption protected evidence packages pass the adoption-aware evidence validator.
- The canonical application schema fingerprint, catalogs, ownership, grants, RLS, policies, functions, triggers, enums, indexes, and constraints remain unchanged.
- Exact counts remain companies 202, advisors 177, listing claims 0, media content 0, and users 0.
- Baseline DDL execution is recorded as false by both execution and evidence status records.
- No backup, dump, catalog, connection detail, credential, or production row was added to the repository.
- The existing dirty worktree was preserved and nothing was staged, committed, pushed, restored, deployed, or linked.

## Recovery posture

No recovery action is required. If the history row is later proven incorrect, stop migration/deployment activity and use a separately reviewed Supabase migration-repair command with `--status reverted`. Do not execute the baseline SQL or rebuild the application schema.

