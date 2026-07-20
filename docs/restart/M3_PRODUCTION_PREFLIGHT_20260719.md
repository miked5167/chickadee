# M3 Production Preflight Record — 2026-07-19

## Outcome

The credentialed M3 preflight passed with no production mutation. Production remains at exact M1+M2 history and M3 is not applied.

Protected package: `advisor-directory-production-pre-m3-20260719T181517Z`  
Protected location: `C:\Users\miked\HockeyAdvisorDirectory-Backups\production` (outside the repository and OneDrive)  
Capture completion: `2026-07-19T18:17:00.8378325Z`

## Reviewed migration

- File: `20260719000002_administrator_authorization_foundation.sql`
- SHA-256: `a968f41fb10e6ecbe1ff8363abe0322031defd6aa361ce3c98498603ade55f6d`
- Pinned CLI: Supabase `2.109.1`
- Dry-run result: exactly M3 pending
- Row-bearing DML: none
- First administrator identity/row: none
- Application deployment: none

M1 and M2 remained byte-for-byte exact:

- M1: `4b65fa234b56534985f249cc8061efd98b05ba927c5de130839b8fd35c1d1db8`
- M2: `95fb374bb07c5a4941b3dd78e6a6db9bf5b4b456c15670fb3ac9805e3a81b547`

## Production checks

- Routed database/user identity matched the expected production target.
- Migration history was exactly M1 plus M2, including version/name pairs.
- The exact enabled M2 companies timestamp trigger and adopted timestamp function matched.
- `auth.users(id)`, `auth.uid()`, API-role attributes, and revoked public-schema creation privileges met M3 prerequisites.
- All M3 objects were absent.
- Counts were companies 202, advisors 177, listing claims 0, media content 0, users 0 before and after all read-only queries.
- Public site returned HTTP 200; the advisor API returned total 202 and one requested row.
- Branch remained `codex/restart-foundation`; the existing dirty worktree was preserved; zero files were staged.

## Backup and evidence

- Archive size: 764,399 bytes
- Archive entries: 1,322
- Archive SHA-256: `f5afb063ececc52d3736b01a1a25fdb0be79c995fdeb73b46282d61b2cc9673f`
- Manifest coverage: 25 files; every entry independently rehashed successfully
- Archive listing: passed
- Schema-only stream: passed
- Data-only stream: passed
- Catalog/current-application agreement: passed against the exact M2 target
- `status.json`: success, `production_changes_made=false`, `baseline_ddl_executed=false`

## Diagnostic note

An earlier read-only attempt stopped before creating a backup because PowerShell JSON-array coercion caused a false history mismatch. The check was replaced by an exact scalar version/name signature and both positive and negative repository validators passed before the successful rerun. The failed attempt made no production change and retained no password.

## Mandatory stop

Do not run the application wrapper until the user supplies the exact phrase `APPROVE M3 PRODUCTION MIGRATION`. After approval, the wrapper repeats the preflight and all immediate safeguards, prompts for the password only through a masked interactive prompt, dry-runs exact M3 again, and applies only M3.
