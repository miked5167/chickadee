# M3 Administrator Authorization Foundation

**Migration:** `20260719000002_administrator_authorization_foundation.sql`  
**SHA-256:** `a968f41fb10e6ecbe1ff8363abe0322031defd6aa361ce3c98498603ade55f6d`  
**Status:** Applied to production after explicit approval and fully verified  
**Production administrator rows created by M3:** None

## Selected contract

M3 creates an empty `public.admin_users` grant registry keyed to `auth.users(id)` and a zero-argument `public.is_admin()` predicate for the current JWT subject.

The identity FK deliberately targets `auth.users`, not `public.users`:

- the application’s current administrator helper compares `admin_users.user_id` to the authenticated Auth user ID;
- production `public.users` has zero rows and the current callback writes the absent `users_public` object, so requiring a profile would make authorization depend on an unreconciled flow;
- authorization identity should remain available even when a non-authoritative profile row is missing;
- all three identity FKs use `ON UPDATE RESTRICT ON DELETE RESTRICT` so grant history cannot disappear through cascade deletion.

The table contains UUIDs, status, and audit timestamps only. It does not duplicate email, name, or other user PII.

## Least-privilege model

| Actor | `is_admin()` | `admin_users` read | Grant mutation |
|---|---|---|---|
| anonymous | no EXECUTE privilege | no table privilege | denied |
| authenticated non-admin | false | own row only, therefore zero rows | denied by table privilege; no write policy exists |
| active administrator | true | own active row only | denied by table privilege; no write policy exists |
| inactive administrator | false | own inactive row only | denied by table privilege; no write policy exists |
| service role | false without an impersonated JWT subject | full table access through the platform maintenance role | allowed for separately approved operational maintenance |

Authenticated administrators do not receive self-service grant management in M3. That is intentional: it prevents self-grant/escalation and keeps the first-admin/governance process outside the public API surface. A future audited grant-management RPC may be proposed separately.

## Objects and security properties

M3 creates only:

- `public.admin_users`, with primary/unique identity constraints, three restricted Auth FKs, lifecycle consistency checks, and self-grant/self-revoke checks;
- two partial FK indexes for grantor/revoker lookups;
- one SELECT-only own-row RLS policy;
- `public.is_admin()` as SQL, STABLE, PARALLEL SAFE, SECURITY DEFINER, owned by `postgres`, with `search_path` fixed to empty and all object names schema-qualified;
- one shared `updated_at` trigger calling the immutable M1 timestamp function;
- explicit table and function revokes/grants.

`PUBLIC` and `anon` cannot execute `is_admin()`. `authenticated` and `service_role` can execute it. `authenticated` receives only table SELECT; `service_role` receives table maintenance privileges.

## Fail-closed migration guards

The migration aborts before schema change unless all of these hold:

- execution owner is exactly `postgres`;
- `anon` and `authenticated` are non-superuser/non-BYPASSRLS roles;
- `service_role` is non-superuser and BYPASSRLS;
- untrusted API roles cannot create objects in `public`;
- `auth.users.id` is a non-null uniquely indexed UUID;
- `auth.uid()` has the required zero-argument UUID-returning stable security-invoker contract and authenticated execution privilege;
- the exact enabled M2 companies timestamp trigger exists;
- the shared timestamp function retains its adopted body, owner, language, volatility, security, and configuration;
- no M3 table, function, constraint, index, policy, or trigger collision exists.

M3 contains no row-bearing DML, identity, seed, replayed legacy SQL, destructive DDL, or unrelated application object.

## Disposable validation result

The full M1+M2+M3 chain passed on an isolated PostgreSQL 18.4/PostGIS 3.6.2 cluster bound only to `127.0.0.1:55434`:

- all three migrations applied exactly once in order;
- a second migration-runner pass applied zero migrations;
- direct M3 re-execution failed through the duplicate guard;
- missing M2 state, wrong execution owner, and unsafe role attributes failed through their named guards;
- deliberate RLS disablement, anonymous function grant, missing fixed search path, SECURITY INVOKER, and wrong function owner were all detected and restored;
- anonymous, authenticated non-admin, active admin, inactive admin, and service-role behavior matched the matrix above;
- authenticated self-service INSERT failed at table privilege, and self-grant/lifecycle constraint fixtures failed closed;
- the shared timestamp trigger advanced `updated_at`;
- schema-only dump matched the deterministic current-target fingerprint;
- the database retained zero rows in all application tables, including `admin_users`.

The M3 archive-object delta was independently measured as 15 objects over M2. The exact protected production archive expectation is therefore 1,337 entries after M3, from the verified 1,322-entry post-M2 state.

## Production preflight result

The credentialed read-only preflight completed at `2026-07-19T18:17:00Z` without production mutation. Protected package `advisor-directory-production-pre-m3-20260719T181517Z` is outside the repository.

- exact history: M1 plus M2, including the reviewed version/name pairs;
- migration hashes: exact adopted M1, applied M2, and reviewed M3 hashes;
- M3 objects: absent;
- M2 trigger, timestamp function, Auth identity/function, API roles, schema privileges, and M3 prerequisites: exact;
- application counts: unchanged at 202/177/0/0/0;
- archive: 764,399 bytes, 1,322 entries, SHA-256 `f5afb063ececc52d3736b01a1a25fdb0be79c995fdeb73b46282d61b2cc9673f`;
- archive list and schema/data streams: passed;
- evidence manifest: 25 entries, all independently rehashed successfully;
- pinned Supabase CLI `2.109.1` dry run: only `20260719000002_administrator_authorization_foundation.sql` pending;
- public smokes: site HTTP 200 and advisor API total 202;
- repository: expected branch, preserved dirty worktree, and zero staged files.

The first preflight attempt stopped before backup creation because its PowerShell JSON history comparison produced a false mismatch. No production change occurred. The check was replaced by an exact scalar version/name signature, repository tests were rerun, and the successful preflight independently proved the authoritative history.

## First administrator governance checkpoint

M3 does not choose or create a first administrator. No production administrator row may be inserted and no Auth email or other PII may be queried until a separate explicit decision and approval identifies:

- the exact Auth UUID through an approved, privacy-minimizing process;
- who is authorized to approve the bootstrap;
- the operational transaction and evidence retained for the one-time grant;
- the ongoing grant/revocation governance model.

This deferred identity decision does not alter the M3 schema. Applying M3 leaves administrator access fail-closed because the registry remains empty.

## Recovery

M3 is additive and changes no application rows. If authorization behavior is incorrect after application, stop administrator feature enablement and use a reviewed forward repair. Immediate containment is to revoke `is_admin()` execution from API roles; do not drop the table or erase grant history. The protected pre-M3 archive is the recovery reference, but restore is reserved for corruption/data loss and is never tested against production.

## Application release status

M3 is schema-compatible with the existing server-side `isAdmin()` table lookup, but the application is not safe to enable: 11 of 19 administrator API modules check authentication only, and four of those create a service-role client. See `M3_APPLICATION_AUTHORIZATION_AUDIT.md`. No runtime deployment is part of M3.

## Production application result

After explicit approval, pinned Supabase CLI `2.109.1` applied only M3. Protected post package `advisor-directory-production-post-m3-20260719T184639Z` proves exact M1+M2+M3 history, zero administrator rows, unchanged 202/177/0/0/0 application counts, complete authorization catalog/current-target agreement, public smokes, 28 validated checksums, and a 772,070-byte/1,337-entry archive with SHA-256 `a33a1f42c415a3aacfd4b19aafe8ec10d12f0aa707014971b282b3c668f0530c`. See `M3_PRODUCTION_EXECUTION_20260719.md`.
