# Canonical schema fingerprint

`production-company-baseline.json` is the immutable, sanitized M1 fingerprint
of the guarded production-derived baseline. `current-target.json` is generated
deterministically from M1 plus every approved forward migration in the active
chain. Both contain definitions only and
covers required extensions, enum label order, tables and ordered columns,
constraints, explicit and constraint-backed indexes, RLS state, policies, the
timestamp function, triggers, ownership, and grants.

The generator verifies M1 evidence byte-for-byte and writes only the current
target; it never rewrites the adopted baseline evidence:

```powershell
npm run db:fingerprint:generate
npm run db:fingerprint:check
```

The database types under `supabase/types` are derived from the same fingerprint:

```powershell
npm run db:types:generate
npm run db:types:check
```

Run all repository-only migration safety checks with:

```powershell
npm run db:validate
```

To cross-check the M1-only production state against protected evidence, pass the protected
evidence directory at runtime. The script reads catalog CSVs and schema-only
evidence and prints no rows or sensitive paths:

```powershell
npm run db:validate:evidence -- <protected-evidence-directory> --target baseline
```

Use `--target m2` for the exact pre-M3 M1+M2 state. After M3 is approved and
applied, use `--target current`; that mode requires exact ordered M1+M2+M3
history and the complete authorization target fingerprint.

## Fresh-bootstrap gate

`npm run db:validate:bootstrap` is intentionally limited to an explicitly named
loopback database. It independently verifies that the server reports a loopback
address, that the database has the required disposable-name prefix, that the
application schema and validation ledger are blank, and that PostGIS plus
`uuid-ossp` are available before it changes anything. It then:

1. installs minimal Supabase-compatible auth/role stubs used only by the local
   validation target;
2. applies every active migration through a validation ledger;
3. confirms the second runner invocation applies zero migrations;
4. compares a schema-only dump with the current-target fingerprint;
5. checks the six tables, 11 policies, six triggers, RLS state, and entity
   naming; and
6. proves future company updates advance `updated_at`, direct M2/M3 re-execution
   and alternate/prerequisite guards fail closed, the M3 role matrix passes,
   catalog/security tampering is detected, and the baseline guard still rejects
   the now-existing schema.

The target database must be created separately and must have no application
objects. Supply only its non-secret local identity; never put a connection
string or password on the command line:

```powershell
npm run db:validate:bootstrap -- `
  --database hockey_advisor_migration_validation_<suffix> `
  --host 127.0.0.1 `
  --port <disposable-port> `
  --user postgres `
  --psql-path <disposable-postgresql-bin>\psql.exe `
  --pg-dump-path <disposable-postgresql-bin>\pg_dump.exe
```

If authentication is required, use an approved libpq credential mechanism;
never write a password or URL into the repository. No bootstrap is recorded as
passed until the harness completes on a proven disposable target.

Existing production never executes the baseline. Its adopted M1 history is
validated separately from the current target. M2 production execution remains
behind its explicit approval checkpoint.

### Historical M1-only validation result — 2026-07-19

The harness passed on a temporary PostgreSQL 18.4 cluster assembled outside the
repository from the installed PostgreSQL binaries and the checksum-verified
official PostGIS 3.6.2 PostgreSQL 18 bundle. The server bound only to
`127.0.0.1:55432`; its reported data directory was inside the temporary root.
The existing Windows PostgreSQL service remained running and unchanged.

- Target database: `hockey_advisor_migration_validation_20260719`.
- Required extensions: PostGIS 3.6.2 in `public`; `uuid-ossp` 1.1 in
  `extensions`.
- First migration run: applied `20260719000000` once.
- Second migration run: zero migrations applied.
- Schema comparison: exact canonical fingerprint match after deterministic
  normalization of policy-role set ordering.
- Catalog checks: five application tables, 10 policies, four triggers, five
  RLS-enabled/not-forced tables, and zero ambiguous company-targeted
  `advisor_id` columns.
- Data check: all five application tables contained zero rows.
- Guard check: direct execution against the bootstrapped schema aborted through
  the fresh-environment guard before any change.

The temporary server was stopped and its downloaded binaries, schema-only
diagnostic dump, empty validation database, and data directory were moved to the
Windows Recycle Bin after validation. It was never linked to an application or
external service.

### Current M1+M2 validation result — 2026-07-19

The complete active chain subsequently passed on an isolated PostgreSQL
18.4/PostGIS 3.6.2 cluster bound only to `127.0.0.1:55433`:

- M1 and M2 applied once in exact version order.
- The second migration-runner pass applied zero migrations.
- The schema-only dump matched `current-target.json` exactly.
- The catalog contained five application tables, 10 policies, five enabled
  timestamp triggers, five RLS-enabled/not-forced tables, and no ambiguous
  company-targeted `advisor_id` column.
- Direct M2 re-execution failed through the intended duplicate guard.
- Replacing the intended trigger with a differently named equivalent caused M2
  to fail through the equivalent-trigger guard; the disposable schema was then
  restored to the exact target.
- A rolled-back future UPDATE advanced `companies.updated_at` from a fixed
  historical timestamp.
- Direct M1 execution still failed through its fresh-environment guard.
- Generated row types were byte-for-byte identical for M1 and M1+M2.

The isolated server was stopped and the exact generated temporary runtime was
removed after validation. Production was not contacted or mutated by this test.

### Current M1+M2+M3 validation result — 2026-07-19

The complete chain passed on an isolated PostgreSQL 18.4/PostGIS 3.6.2 cluster
bound only to `127.0.0.1:55434`. All migrations applied once in order, the
runner rerun applied zero migrations, the authorization role matrix and
constraint behavior passed with zero retained administrator rows, deliberate
privilege/ownership/RLS/security-function drift was rejected, and the
schema-only dump matched `current-target.json` exactly. Production was not
contacted or mutated.
