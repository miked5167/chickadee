# M4 verification recovery — September 12, 2026

## Release state

- User approved the protected backup, M4–M7 upgrades, and application deployment.
- M4 application completed, but its first post-application query failed. Do not rerun the M4 apply script.
- Protected apply receipt: `C:\Users\miked\HockeyAdvisorDirectory-Backups\production\advisor-directory-production-post-m4-20260912T193449Z`.
- Receipt contains the exact M4-only dry run, completed CLI application, reviewed M1–M4 migration copies, and 10 verified checksums.
- Original failed evidence remains unchanged. It is not a successful post-migration backup.
- Production REST checks confirmed reviews exists with 0 rows, companies has 202 rows, and advisors has 177 rows.
- Full SQL history, permissions, and post-upgrade archive validation are now complete for the captured backup (see archive-count recovery below).
- M5–M7 and the application release have not been applied/deployed by this recovery work.

## Root cause and fix

`information_schema.table_privileges.privilege_type` is an information-schema domain. Aggregating it without an explicit cast produced a domain array that PostgreSQL could not compare with `text[]`.

Both M4 scripts now aggregate `privilege_type::text`. The SQL migration itself is unchanged.

The post-verification script now has an explicit `-RecoverIncompleteVerification` mode. This verifies the checksummed incomplete apply receipt and its exact migration hashes rather than requiring a successful full archive before recovery can start. It does not skip the subsequent live identity, history, counts, permissions, restricted-column checks, fresh backup, or final full evidence validator. It cannot reapply the migration.

## Checks performed

- 11 receipt/regression tests passed: valid receipt, tampering, wrong failure, missing checksums, changed migrations, extra migrations, unfinished application, unsafe paths, and SQL cast/read-only guards.
- Migration validation and negative safety-rule tests passed.
- PowerShell recovery script syntax passed.
- On an isolated PostgreSQL 18 instance, the old comparison reproduced the exact error and the corrected comparison returned true. Test instance stopped afterward.
- Initial test orchestration waited for the server process tree; SQL checks were completed in a second session before stopping that isolated instance.

## Previous operator action (completed; do not rerun)

Run in PowerShell; enter the password only at its hidden local prompt:

```powershell
& "C:\Users\miked\OneDrive\Documents\Hockey Advisor Directory Project\scripts\database\run-m4-production-post-verification.ps1" -ApplyEvidenceDirectory "C:\Users\miked\HockeyAdvisorDirectory-Backups\production\advisor-directory-production-post-m4-20260912T193449Z" -RecoverIncompleteVerification
```

## Archive-count recovery

The read-only recovery completed its live database and role checks and created a full protected backup at `C:\Users\miked\HockeyAdvisorDirectory-Backups\production\advisor-directory-production-post-m4-verification-20260912T194120Z`. Its final count guard expected 1,356 entries, but the correct M4 archive has 1,361.

Comparison with the immediate pre-M4 archive found exactly 24 additions, all belonging to the reviewed reviews table: table/data, table ACL, nine column ACLs, two key constraints, two indexes, one trigger, two foreign keys, four policies, and row security. No pre-existing archive entries were removed. The old expected count undercounted the reviewed additions by five.

Both wrappers and the evidence validator now require 1,361 entries. The validator additionally checks the exact 24 review archive objects, not just a total. A narrowly scoped `--recover-m4-archive-count` option accepts only this specific failed verification status and still requires the captured role checks, checksummed archive/schema, full catalogs, exact counts, and migration history. It does not change the original evidence or status files.

Offline command completed successfully:

```powershell
node scripts/database/validate-production-evidence.mjs "C:\Users\miked\HockeyAdvisorDirectory-Backups\production\advisor-directory-production-post-m4-verification-20260912T194120Z" --target m4 --recover-m4-archive-count
```

Result: 29 verified checksums; 1,361 archive entries; exact M1–M4 history; unchanged 202 companies and 177 advisors; zero reviews/admin rows; complete canonical application schema/catalog agreement. Original failed status is preserved as historical evidence and requires the explicit recovery flag when validating this package. No further M4 password entry or application is needed.

M5–M7 and the application release remain pending. Do not publish the full application until its required database upgrades are verified.
