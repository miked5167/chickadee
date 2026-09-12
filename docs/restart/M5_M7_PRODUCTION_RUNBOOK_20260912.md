# M5–M7 production release

## Scope and authorization

The operator approved protected backups, M4–M7 database upgrades, and the subsequent application deployment in this task. M4 is already applied and its captured backup has been validated (see M4_VERIFICATION_RECOVERY_20260912.md). This runner applies only the remaining reviewed migrations to the Hockey Directory project `dqskdrqubqnhdssxpryx`, never the AI Directory Factory database.

No administrator bootstrap, seed data, enrichment writes, billing, or application deployment is performed by this command.

## Operator command

```powershell
& "C:\Users\miked\OneDrive\Documents\Hockey Advisor Directory Project\scripts\database\run-m5-m7-production.ps1" -Mode Apply -ApprovalPhrase "APPROVE M5 M6 M7 PRODUCTION MIGRATIONS"
```

Enter the database password once at the hidden prompt. It is passed in process memory, not placed in arguments, a URL, the repository, or an evidence file. The wrapper clears its password environment variable and unmanaged buffer on exit.

The default mode is `Preflight` (backup and dry run only). `Verify` requires an exact M7 state and makes no database changes.

## Safeguards

- Fixed project, pooler, database, release branch, PostgreSQL tools, and Supabase CLI 2.109.1.
- Exact hashes for all seven migrations; exact active migration inventory.
- Accepts only ordered M1–M4, M1–M5, M1–M6, or M1–M7 history. Unknown/gapped/renamed history stops without automatic repair.
- Full new pre-upgrade backup outside OneDrive/repository; archive listing, complete schema/data-stream readability, checksums, reviewed schema fingerprint, and public/private read permissions verified.
- Exact existing counts: 202 companies, 177 advisors, zero claims/media/users/admins/reviews; newly introduced tables must also be empty before app launch.
- Existing row-content digests checked before and after, not only counts.
- Only exact remaining M5–M7 migrations are allowed in the isolated CLI dry run.
- Rechecks migration file hashes, data state, and working-tree state immediately before apply.
- Fresh post-upgrade backup and complete M7 verification; public website/API smoke checks before and after.
- No hardcoded overall archive-entry total. Expected application schema, grants, data entries, and file integrity are checked directly.

## Failure and recovery

Each run creates a unique evidence directory beneath `C:\Users\miked\HockeyAdvisorDirectory-Backups\production`. A failed apply attempt is explicitly recorded as uncertain until live history is inspected; it is never reported as no mutation.

Supabase applies migrations individually. If a later migration fails, earlier ones may have succeeded. Do not run old M4 commands or repair history manually. Inspect the failure/evidence first. A subsequently approved run with the same command validates the actual exact prefix and backs it up before considering only its remaining migrations. If M7 is already complete, the command performs verification without reapplying.

No destructive rollback is automatic. Keep the current application live until the full database release passes. After app deployment, roll back the application to its prior Vercel deployment if smoke checks fail; retain additive tables. Database restoration requires a separately reviewed recovery decision to avoid losing intervening writes.

## Verification performed before handoff

- 26 database tooling tests, including history drift, migration hash drift, incorrect dry-run scope, defaults/approval guards, and M4 recovery checks.
- New verifier validated the captured production M4 backup schema offline.
- Full isolated PostgreSQL 18/PostGIS rehearsal with synthetic 202-company/177-advisor fixtures: M4 backup, actual pinned CLI dry run and M5–M7 apply, M7 backup, schema/grants and role checks, exact existing record digests, completed-release no-pending dry run.
- Deliberately granting public access to the interest inbox in the disposable database was rejected by the snapshot validator.
- Test runtime shut down and successful rehearsal files cleaned up. An earlier setup-only copy at `C:\Users\miked\AppData\Local\Temp\hockey-advisor-m7-validation-777229bd91cf4299bd3e0e378d50406a` was interrupted and remains; it is not production evidence. The harness now copies only runtime bin/lib/share, never the installed service's data or pgAdmin.

## Production completion

The operator ran Apply successfully on September 12, 2026. Evidence: `C:\Users\miked\HockeyAdvisorDirectory-Backups\production\advisor-directory-m5-m7-20260912T200047444Z-fa431782`.

Independently rechecked all 25 release-package checksums, exact M7 schema, and unchanged existing row digests. The final report records success, M7 verified, and no administrator created. Both pre/post backups and role-read checks passed. The application release is a separate subsequent step.
