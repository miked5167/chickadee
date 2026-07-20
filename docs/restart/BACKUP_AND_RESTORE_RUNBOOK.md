# Runbook: Supabase Production Backup and Safe Restore Validation

**Owner:** Project owner / database administrator
**Frequency:** Before every production schema change and at least monthly
**Last updated:** 2026-07-19
**Last run:** Completed 2026-07-19; archive validated without restore

## Purpose

Create a timestamped, access-controlled logical backup of the Hockey Advisor Directory production database, inventory the production catalog, validate the backup without touching production, and restore only to an explicitly non-production target.

The database backup covers roles, schema, table data, RLS policies, functions, triggers, available migration history, and relevant Supabase Storage database metadata. Supabase Storage object bytes live outside Postgres and require a separate object export if they are in use.

This runbook follows Supabase's current [CLI backup/restore guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), [CLI reference](https://supabase.com/docs/reference/cli/supabase-projects-create#supabase-db-dump), and [Storage download guidance](https://supabase.com/docs/guides/storage/management/download-objects).

## Non-negotiable safety rules

- Never paste credentials into this repository, documentation, chat, screenshots, terminal output, or command arguments that will be saved in shell history.
- Inject secrets into the current process from an approved password manager or a hidden interactive prompt. Do not save the password merely to automate a backup.
- Never echo or print secret-bearing environment variables.
- Never run `supabase db push`, `supabase db reset --linked`, restore commands, migrations, DDL, or data-changing SQL against production during backup.
- Keep backup files outside Git and outside the repository. Treat roles, auth data, user data, claims, leads, reviews, analytics, and storage metadata as sensitive PII.
- A restore target must have a different project reference from production. Stop if this cannot be proven.
- Do not switch application traffic, environment variables, DNS, or integrations to the restore target as part of this runbook.

## Completed baseline record — 2026-07-19

| Item | Result |
|---|---|
| Production project | `Advisor Directory - Production` / `dqskdrqubqnhdssxpryx` |
| Connection | Shared Session Pooler over IPv4; PostgreSQL server 17.6 |
| Backup directory | `%USERPROFILE%\HockeyAdvisorDirectory-Backups\production\advisor-directory-production-20260719T120005Z` |
| Database archive | `production-20260719T120005Z.dump`, custom format, 758,629 bytes |
| Roles | `roles-20260719T120005Z.sql`; password hashes excluded |
| Archive inventory | 1,317 table-of-contents entries |
| Catalog inventory | 41 tables, exact counts, columns, constraints, RLS, policies, functions, aggregates, triggers, extensions, roles, privileges, and storage metadata |
| Migration history | `supabase_migrations.schema_migrations` is absent; recorded in `migration-history-status.csv` |
| Storage | Zero buckets and zero objects; no object-byte export required at capture time |
| Validation | Archive listing, schema stream, data stream, and independent SHA-256 recheck all passed |
| Restore | Not performed; disposable target still required |
| Production writes | None |

Two earlier directories from the same session are marked failed in their `status.json` files. They are retained in the restricted backup root for auditability but are not accepted recovery artifacts. The successful directory above is authoritative.

### Native PostgreSQL procedure used on this workstation

PostgreSQL 18.4 client tools were used against the Supabase shared Session Pooler because the direct database endpoint is IPv6-only from this network and Docker/Supabase CLI were unavailable. The password was entered with `Read-Host -AsSecureString`, converted only in process memory, passed to child PostgreSQL tools through the process-scoped `PGPASSWORD`, cleared in `finally`, and never written to disk or command history.

The logical archive was created with `pg_dump --format=custom --compress=9`. Roles were captured with `pg_dumpall --roles-only --no-role-passwords`. Validation used:

```powershell
pg_restore --list --file archive-contents.txt production-20260719T120005Z.dump
pg_restore --schema-only --file NUL production-20260719T120005Z.dump
pg_restore --data-only --file NUL production-20260719T120005Z.dump
```

These commands parse the archive without connecting to or restoring over any database. `SHA256SUMS.txt` must then be independently rechecked. A full restore test remains mandatory on a proven non-production target.

When inventorying functions, restrict `pg_get_functiondef` to `pg_proc.prokind IN ('f','p')` and inventory aggregates (`prokind = 'a'`) separately. Calling `pg_get_functiondef` on the PostGIS `st_extent` aggregate raises `ERROR: "st_extent" is an aggregate function`. Also test `to_regclass('supabase_migrations.schema_migrations')` before querying migration rows; this production project has no such table.

## Prerequisites

- [ ] The expected production Supabase project reference is recorded from an authoritative source.
- [ ] The operator can list/open that project in the Supabase dashboard.
- [ ] Either Supabase CLI plus its required Docker runtime is available, **or** compatible native `pg_dump`, `pg_dumpall`, `pg_restore`, and `psql` clients are installed.
- [ ] Native PostgreSQL client version is the same as or newer than the production server version.
- [ ] Authentication is available through interactive CLI login or approved process-level secrets.
- [ ] The database password is available through a password manager or hidden interactive prompt; it must not be pasted into chat or saved in scripts.
- [ ] A BitLocker-encrypted, access-controlled directory outside the repository has sufficient free space.
- [ ] A disposable local or hosted Supabase target is available for a restore test.
- [ ] A maintenance/change ticket records who is running the backup and why.

## Procedure

### Step 1: Verify repository and production target

From the repository root:

```powershell
git status --short --branch
git branch --show-current
git fetch origin master --prune
git merge-base --is-ancestor origin/master HEAD
if ($LASTEXITCODE -ne 0) { throw 'Current branch is not based on origin/master.' }
```

**Expected result:** The intended restart branch is active, existing changes are understood and preserved, and the ancestry check exits successfully.

Set the expected project reference as a non-secret identifier:

```powershell
$ExpectedProjectRef = '<expected-production-project-ref>'
if ($ExpectedProjectRef -eq '<expected-production-project-ref>') {
  throw 'Set ExpectedProjectRef from the authoritative production project record.'
}
```

Authenticate interactively and inspect the project list:

```powershell
supabase login
supabase projects list
```

Confirm the expected reference, project name, organization, region, and production status in both the CLI list and Supabase dashboard. Do not continue on a name-only match.

Do not link from the repository yet. Step 2 creates an isolated Supabase CLI work directory outside Git and links from there.

**Expected result:** The CLI and dashboard both identify the expected production project, without changing repository files.

**If it fails:** Stop. Do not dump, diff, or run SQL until project identity is resolved. Never guess based on the application URL alone.

### Step 2: Create a secure timestamped destination

The default below is outside the OneDrive repository. Change it only to another approved encrypted location.

```powershell
$RepositoryRoot = (Resolve-Path '.').Path
$BackupRoot = Join-Path $env:USERPROFILE 'HockeyAdvisorDirectory-Backups\production'
$Stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$BackupDir = Join-Path $BackupRoot $Stamp

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$ResolvedBackupDir = (Resolve-Path $BackupDir).Path

if ($ResolvedBackupDir.StartsWith($RepositoryRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Backup directory is inside the Git repository.'
}
```

Create and link an isolated CLI project inside the protected backup directory:

```powershell
$CliWorkDir = Join-Path $BackupDir 'supabase-cli-work'
New-Item -ItemType Directory -Force -Path $CliWorkDir | Out-Null
Push-Location $CliWorkDir
try {
  supabase init
  supabase link --project-ref $ExpectedProjectRef
  $LinkedProjectRef = (Get-Content -Raw 'supabase\.temp\project-ref').Trim()
  if ($LinkedProjectRef -ne $ExpectedProjectRef) {
    throw 'Linked Supabase project does not match the expected production project.'
  }
} finally {
  Pop-Location
}
```

Restrict access according to the workstation's security policy. Confirm BitLocker/encryption and ensure OneDrive or another consumer sync agent will not replicate the dump unexpectedly:

```powershell
manage-bde -status (Split-Path -Qualifier $ResolvedBackupDir)
```

**Expected result:** A new timestamped directory under `%USERPROFILE%\HockeyAdvisorDirectory-Backups\production` exists outside Git, and its isolated CLI link exactly matches the expected production reference.

**If it fails:** Stop and choose a secure local or organizational backup location. Do not fall back to a tracked repository directory.

### Step 3: Capture pre-backup metadata

Record tool versions and non-secret identifiers:

```powershell
supabase --version | Set-Content -Encoding utf8 (Join-Path $BackupDir 'supabase-cli-version.txt')
psql --version | Set-Content -Encoding utf8 (Join-Path $BackupDir 'psql-version.txt')
git rev-parse HEAD | Set-Content -Encoding ascii (Join-Path $BackupDir 'repository-commit.txt')
$ExpectedProjectRef | Set-Content -Encoding ascii (Join-Path $BackupDir 'project-ref.txt')
(Get-Date).ToUniversalTime().ToString('o') | Set-Content -Encoding ascii (Join-Path $BackupDir 'captured-at-utc.txt')
```

Do not write database URLs, access tokens, passwords, API keys, or service-role keys into metadata files.

### Step 4: Create logical dumps

Use the isolated linked project so the connection secret is not placed on the command line:

```powershell
Push-Location $CliWorkDir
try {
  supabase db dump --linked --file (Join-Path $BackupDir 'roles.sql') --role-only
  supabase db dump --linked --file (Join-Path $BackupDir 'schema.sql')
  supabase db dump --linked --file (Join-Path $BackupDir 'data.sql') --use-copy --data-only --exclude 'storage.buckets_vectors' --exclude 'storage.vector_indexes'
} finally {
  Pop-Location
}
```

Capture migration history explicitly:

```powershell
Push-Location $CliWorkDir
try {
  supabase db dump --linked --file (Join-Path $BackupDir 'migration-history-schema.sql') --schema supabase_migrations
  supabase db dump --linked --file (Join-Path $BackupDir 'migration-history-data.sql') --use-copy --data-only --schema supabase_migrations
} finally {
  Pop-Location
}
```

Capture custom definitions in Supabase-managed schemas:

```powershell
Push-Location $CliWorkDir
try {
  supabase db diff --linked --schema auth,storage |
    Set-Content -Encoding utf8 (Join-Path $BackupDir 'auth-storage-customizations.sql')
} finally {
  Pop-Location
}
```

Check whether storage metadata is present in the data dump:

```powershell
$DataDump = Join-Path $BackupDir 'data.sql'
$StorageMetadataPresent = [bool](Select-String -Path $DataDump -Pattern '^COPY storage\.(buckets|objects) ' -Quiet)
$StorageMetadataPresent | Set-Content -Encoding ascii (Join-Path $BackupDir 'storage-metadata-present.txt')
```

If `storage-metadata-present.txt` says `False`, create a supplemental metadata dump and record that it must be restored exactly once:

```powershell
Push-Location $CliWorkDir
try {
  supabase db dump --linked --file (Join-Path $BackupDir 'storage-metadata.sql') --use-copy --data-only --schema storage --exclude 'storage.buckets_vectors' --exclude 'storage.vector_indexes'
} finally {
  Pop-Location
}
```

**Expected result:** Plain SQL files exist for roles, schema, data, migration history, and auth/storage customizations; storage metadata is either present in `data.sql` or captured separately.

**If it fails:** Preserve the timestamped directory and command error separately without credentials. Do not delete a partial backup until its status is documented. Resolve Docker, network, pooler, password, or disk-space issues and start a new timestamped run.

### Step 5: Export the production catalog in read-only mode

Have the password manager inject `SUPABASE_DB_URL` into the current process. Do not set it by pasting the value into a script or checked-in `.env` file. Confirm the connection string contains the expected project reference without printing it:

```powershell
if ([string]::IsNullOrWhiteSpace($env:SUPABASE_DB_URL)) {
  throw 'SUPABASE_DB_URL is not available in the current process.'
}
if (-not $env:SUPABASE_DB_URL.Contains($ExpectedProjectRef)) {
  throw 'Database URL does not contain the expected production project reference.'
}
```

Run every catalog query in a read-only transaction. Save the following as a temporary local SQL file in the backup directory, not the repository:

```sql
BEGIN READ ONLY;

-- Tables and RLS status
SELECT n.nspname AS schema_name,
       c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced,
       pg_get_userbyid(c.relowner) AS owner,
       pg_total_relation_size(c.oid) AS total_bytes
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind IN ('r', 'p')
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY 1, 2;

-- Foreign-key relationships
SELECT tc.table_schema,
       tc.table_name,
       tc.constraint_name,
       kcu.column_name,
       ccu.table_schema AS referenced_schema,
       ccu.table_name AS referenced_table,
       ccu.column_name AS referenced_column,
       rc.update_rule,
       rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_name = tc.constraint_name
 AND kcu.constraint_schema = tc.constraint_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
 AND ccu.constraint_schema = tc.constraint_schema
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
 AND rc.constraint_schema = tc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY 1, 2, 3, kcu.ordinal_position;

-- RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
ORDER BY 1, 2, 3;

-- User-visible functions
SELECT n.nspname AS schema_name,
       p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       pg_get_userbyid(p.proowner) AS owner,
       p.prosecdef AS security_definer,
       l.lanname AS language,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND p.prokind = 'f'
ORDER BY 1, 2, 3;

-- Triggers
SELECT event_object_schema,
       event_object_table,
       trigger_name,
       action_timing,
       event_manipulation,
       action_statement
FROM information_schema.triggers
ORDER BY 1, 2, 3, 5;

-- Applied migrations
SELECT *
FROM supabase_migrations.schema_migrations
ORDER BY version;

COMMIT;
```

Run it with tuple output redirected to a local file. Do not allow query results onto a shared terminal or CI log:

```powershell
$InventorySql = Join-Path $BackupDir 'catalog-inventory.sql'
$InventoryOutput = Join-Path $BackupDir 'catalog-inventory.txt'
psql $env:SUPABASE_DB_URL -X --set ON_ERROR_STOP=1 --file $InventorySql *> $InventoryOutput
if ($LASTEXITCODE -ne 0) { throw 'Catalog inventory failed.' }
```

Collect exact row counts without writing to production. Generate one read-only `COUNT(*)` statement per non-system table and execute it locally:

```powershell
$TableList = psql $env:SUPABASE_DB_URL -X -At --set ON_ERROR_STOP=1 --command "SELECT quote_ident(schemaname) || '.' || quote_ident(tablename) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY 1"
if ($LASTEXITCODE -ne 0) { throw 'Could not list tables.' }

$RowCounts = foreach ($TableName in $TableList) {
  $CountOutput = psql $env:SUPABASE_DB_URL -X -Atq --set ON_ERROR_STOP=1 --command "BEGIN READ ONLY; SELECT count(*) FROM $TableName; ROLLBACK;"
  if ($LASTEXITCODE -ne 0) { throw "Row count failed for $TableName" }
  $CountLine = @($CountOutput | Where-Object { $_ -match '^\d+$' } | Select-Object -Last 1)
  if ($CountLine.Count -ne 1) { throw "Could not parse row count for $TableName" }
  [pscustomobject]@{ table = $TableName; row_count = [int64]$CountLine[0] }
}
$RowCounts | Export-Csv -NoTypeInformation -Encoding utf8 (Join-Path $BackupDir 'row-counts.csv')
```

Inspect the generated CSV for every table. Never change the SQL from `BEGIN READ ONLY` to a writable transaction.

**Expected result:** The backup directory contains table/RLS, relationship, policy, function, trigger, migration, and exact row-count inventories.

**If it fails:** Retain completed dumps. Diagnose permissions using a read-only query only. Do not substitute the service-role REST API for a catalog inventory because it cannot prove roles, policies, triggers, or migration history.

### Step 6: Validate dump integrity and contents

Confirm required files exist and are non-empty:

```powershell
$RequiredFiles = @(
  'roles.sql',
  'schema.sql',
  'data.sql',
  'migration-history-schema.sql',
  'migration-history-data.sql',
  'auth-storage-customizations.sql',
  'catalog-inventory.txt',
  'row-counts.csv'
)

foreach ($Name in $RequiredFiles) {
  $Path = Join-Path $BackupDir $Name
  if (-not (Test-Path -LiteralPath $Path)) { throw "Missing backup file: $Name" }
}

$CoreFiles = @(
  'roles.sql',
  'schema.sql',
  'data.sql',
  'migration-history-schema.sql',
  'migration-history-data.sql',
  'catalog-inventory.txt',
  'row-counts.csv'
)

foreach ($Name in $CoreFiles) {
  $Path = Join-Path $BackupDir $Name
  if ((Get-Item -LiteralPath $Path).Length -eq 0) { throw "Empty backup file: $Name" }
}
```

`auth-storage-customizations.sql` may legitimately be empty when no custom changes exist; its existence and the catalog comparison still need to be recorded.

Create a checksum and size manifest:

```powershell
Get-ChildItem -LiteralPath $BackupDir -File |
  ForEach-Object {
    $Hash = Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName
    [pscustomobject]@{
      file = $_.Name
      bytes = $_.Length
      sha256 = $Hash.Hash
    }
  } |
  Export-Csv -NoTypeInformation -Encoding utf8 (Join-Path $BackupDir 'manifest-sha256.csv')
```

Inventory dump statements without displaying row data:

```powershell
$SchemaDump = Join-Path $BackupDir 'schema.sql'
$DataDump = Join-Path $BackupDir 'data.sql'

Select-String -Path $SchemaDump -Pattern '^CREATE TABLE ', '^CREATE POLICY ', '^CREATE FUNCTION ', '^CREATE TRIGGER ' |
  ForEach-Object { $_.Line } |
  Set-Content -Encoding utf8 (Join-Path $BackupDir 'schema-object-inventory.txt')

Select-String -Path $DataDump -Pattern '^COPY ' |
  ForEach-Object { $_.Line } |
  Set-Content -Encoding utf8 (Join-Path $BackupDir 'data-section-inventory.txt')
```

Compare the production catalog inventory with:

- the schema-object inventory from the dump;
- `supabase/migrations` object definitions;
- the repository-only SQL files under `scripts/`; and
- the expected `companies`/`advisors` relationships listed in `PRODUCTION_BASELINE.md`.

Minimum acceptance criteria:

- [ ] Every production non-system table appears in the schema dump or is documented as a managed-schema exception.
- [ ] Every exact row count has a corresponding data section, or a documented reason for exclusion.
- [ ] Roles, RLS policies, functions, triggers, and migration history are present in the appropriate dump/inventory.
- [ ] `storage.buckets` and `storage.objects` metadata are present when Supabase Storage is used.
- [ ] SHA-256 hashes and file sizes are recorded.
- [ ] No credential appears in any backup metadata or manifest.
- [ ] No backup file is tracked by Git.

### Step 7: Restore-test only on a disposable target

Set non-secret project references and have the password manager inject target/source connection URLs. Prove that the target is not production before doing anything else:

```powershell
$ProductionProjectRef = $ExpectedProjectRef
$TargetProjectRef = '<disposable-project-ref>'

if ($TargetProjectRef -eq '<disposable-project-ref>') { throw 'Set a disposable target reference.' }
if ($TargetProjectRef -eq $ProductionProjectRef) { throw 'Restore target is production.' }
if (-not $env:RESTORE_TARGET_DB_URL.Contains($TargetProjectRef)) { throw 'Target URL/reference mismatch.' }
if ($env:RESTORE_TARGET_DB_URL.Contains($ProductionProjectRef)) { throw 'Target URL contains production reference.' }
```

Disable or isolate outbound integrations on the disposable project before restoring. In particular, do not configure production OAuth callbacks, email delivery, webhooks, cron jobs, or application secrets.

Use Supabase's documented restore order:

```powershell
psql $env:RESTORE_TARGET_DB_URL `
  --single-transaction `
  --variable ON_ERROR_STOP=1 `
  --file (Join-Path $BackupDir 'roles.sql') `
  --file (Join-Path $BackupDir 'schema.sql') `
  --command 'SET session_replication_role = replica' `
  --file (Join-Path $BackupDir 'data.sql')

if ($LASTEXITCODE -ne 0) { throw 'Disposable restore failed.' }
```

Restore migration history only to the disposable target:

```powershell
psql $env:RESTORE_TARGET_DB_URL `
  --single-transaction `
  --variable ON_ERROR_STOP=1 `
  --file (Join-Path $BackupDir 'migration-history-schema.sql') `
  --file (Join-Path $BackupDir 'migration-history-data.sql')

if ($LASTEXITCODE -ne 0) { throw 'Migration-history restore failed.' }
```

Review `auth-storage-customizations.sql` before applying it. Supabase-managed `auth` and `storage` schemas already exist on a new project and may require a selective restore. Apply only to the disposable target and document every expected conflict.

If `storage-metadata.sql` was created because metadata was absent from `data.sql`, restore it once to the disposable target. Do not restore the same rows from both files.

Re-run the catalog and row-count inventory against the disposable target and compare it with production:

- tables and relationships match;
- row counts match for included tables;
- RLS flags and policies match;
- function definitions, security mode, grants, and triggers match;
- migration history matches;
- storage bucket/object metadata counts match;
- application-facing smoke queries work with anon and authenticated roles.

**Expected result:** A complete restore succeeds on the disposable target with documented, understood managed-schema exceptions. Production remains untouched.

**If it fails:** Keep the failed target isolated. Save sanitized errors with the backup record. Fix the backup procedure or managed-schema ordering and create a new validation run; never experiment on production.

### Step 8: Close out and protect the backup

Verify Git cannot see backup artifacts:

```powershell
git status --short
git ls-files | Select-String -Pattern '(?i)(backup|dump|roles\.sql|schema\.sql|data\.sql)'
```

Review matches: repository migration/source SQL is expected; a timestamped production dump is not.

Record:

- timestamp and operator;
- production project reference;
- backup directory;
- file sizes and checksums;
- validation target project reference;
- catalog comparison result;
- exceptions, especially managed auth/storage schemas and storage object bytes;
- retention/deletion date under the organization's PII policy.

Clear secret-bearing process variables when the session ends:

```powershell
Remove-Item Env:SUPABASE_DB_URL -ErrorAction SilentlyContinue
Remove-Item Env:RESTORE_TARGET_DB_URL -ErrorAction SilentlyContinue
Remove-Item Env:SUPABASE_ACCESS_TOKEN -ErrorAction SilentlyContinue
Remove-Item Env:SUPABASE_DB_PASSWORD -ErrorAction SilentlyContinue
```

Do not delete the validated backup until its retention requirement is met and another verified recovery point exists.

## Verification checklist

- [x] Correct production project independently confirmed.
- [x] Timestamped backup directory is outside Git and access-controlled.
- [x] Roles, schema, data, and available migration-history status captured. The standard migration table is absent.
- [x] Relevant storage metadata captured; zero buckets/objects means no object-byte export was required at capture time.
- [x] Table, relationship, row-count, RLS, function, aggregate, trigger, and migration-status inventories captured.
- [x] SHA-256 manifest created and independently checked.
- [x] Archive table of contents and schema/data streams validated against the catalog inventory.
- [ ] Restore succeeded only on a disposable target.
- [ ] Restored inventory matches production within documented exceptions.
- [x] No credential or database dump is tracked or logged.
- [x] Production received no schema/data changes.

## Troubleshooting

| Symptom | Likely cause | Safe response |
|---|---|---|
| Project reference mismatch | Wrong account, organization, or link | Stop and verify in the dashboard; do not relink by guessing |
| Supabase CLI cannot dump | Docker unavailable, authentication expired, password/pooler issue | Repair tooling/authentication; rerun into a new timestamped directory |
| IPv6/direct connection failure | Network lacks IPv6 support | Use the Supabase session pooler connection recommended by the dashboard |
| Dump file is empty | Command failed or path/disk problem | Preserve logs without secrets, check disk/path, and create a new run |
| Catalog query permission denied | Connection lacks catalog/table read access | Obtain a read-capable database role; do not use write workarounds |
| `auth`/`storage` restore conflicts | Target contains Supabase-managed schemas | Follow the official managed-schema guidance and apply only reviewed custom differences |
| Storage metadata exists but files do not | Postgres metadata does not include S3 object bytes | Export object bytes separately via the S3-compatible or documented migration flow |
| Row counts differ after restore | Excluded tables, concurrent writes during dump, failed data section, or trigger behavior | Keep target isolated, identify the exact tables, and repeat backup/validation |
| Git shows a dump | Backup was written inside repository | Stop; move it to the approved secure location without staging it, then verify status |

## Rollback

Backup is read-only, so there is no production rollback. If restore validation fails, leave production untouched and discard or retain the isolated disposable target according to the change record. Never point production traffic at a partially restored target.

If a backup artifact was accidentally staged, unstage it without deleting the local file, move it to the secure external directory, and verify that no commit or remote push contains it. If it was pushed, treat it as a credential/PII incident and escalate immediately; deleting the Git file alone is insufficient.

## Escalation

| Situation | Contact | Method |
|---|---|---|
| Production project identity is ambiguous | Project owner / Supabase organization admin | Approved internal channel |
| Database access or backup service is unavailable | Supabase organization admin, then Supabase Support | Dashboard support route |
| Backup contains credentials or was committed/pushed | Security/privacy owner and repository administrator | Incident process, immediately |
| Restore validation exposes schema drift | Database owner and application owner | Block migration work; attach sanitized comparison |
| Storage object bytes are required for recovery | Storage owner / platform administrator | Approved secure transfer process |

## History

| Date | Run by | Notes |
|---|---|---|
| 2026-07-19 | Codex local inspection | Runbook created. Backup not run because project linkage, credentials, Supabase CLI, Docker, and PostgreSQL tools were unavailable. |
| 2026-07-19 | Project owner + Codex | Project confirmed; PostgreSQL 18.4 installed; password supplied only through hidden prompt; native custom-format archive, roles, catalog, exact counts, and checksums completed. Archive/list/schema/data validation passed. Standard Supabase migration-history table absent. Disposable restore remains pending. |
