# Production Supabase Baseline

**Captured:** 2026-07-19 07:05 EDT
**Repository:** Hockey Advisor Directory application repository
**Branch:** `codex/restart-foundation`
**Baseline commit:** `e8a60ee4b249221779c08af5dd5d85d1d2253a87`
**Production changes made:** None

## Outcome

This is a completed read-only production baseline. The repository, public application, authenticated Vercel configuration, Supabase project identity, production PostgreSQL catalog, and exact row counts were inspected. A timestamped logical database archive, roles export, catalog inventory, and SHA-256 manifest were created in the protected backup directory. Archive structure plus schema and data streams were validated without restoring. No production schema or data was changed.

The most important finding is a mixed and incomplete data-model migration:

- The deployed public API successfully returns records through the `companies` data path and reported 202 total records at capture time. This is evidence that a production `companies` object exists, although the API result is not a substitute for a direct catalog inventory or exact privileged row count.
- No file in `supabase/migrations` creates `companies`, defines its RLS policies, or migrates legacy `advisors` business records and foreign keys to it.
- Public pages use `companies` as the business/listing entity and use `advisors` as people linked by `company_id`.
- Most admin, advisor-dashboard, review, lead, analytics, and import code still treats `advisors` as the business/listing entity and uses `advisor_id` foreign keys.
- The checked-in migration chain cannot initialize a fresh database: its first migration alters pre-existing tables that are defined only in `scripts/setup-schema.sql`.

Do not make further schema changes until a privileged production inventory and a validated backup are completed.

## Repository and Git safety check

After `git fetch origin master --prune`:

- Current branch: `codex/restart-foundation`
- `HEAD`: `e8a60ee4b249221779c08af5dd5d85d1d2253a87`
- `origin/master`: `e8a60ee4b249221779c08af5dd5d85d1d2253a87`
- `origin/master` is an ancestor of `HEAD`; at capture time they were identical.
- The working tree was clean before these baseline documents were created.
- Existing files and changes were preserved.
- Nothing was committed, pushed, deployed, or applied to Supabase.

## Access and linkage status

The production project identity is confirmed:

| Field | Confirmed value |
|---|---|
| Project name | `Advisor Directory - Production` |
| Organization | Confirmed Supabase organization (name omitted) |
| Project reference | `dqskdrqubqnhdssxpryx` |
| Dashboard Database Settings access | Confirmed by project owner |
| Dashboard Database Backups access | Confirmed by project owner |

The deployed site's public assets also contain this exact project reference. The local repository remains **unlinked**, so any future CLI or database connection must still be checked against `dqskdrqubqnhdssxpryx` before use.

Observed locally, without printing any values:

| Check | Result |
|---|---|
| `supabase/config.toml` | Absent |
| `supabase/.temp/project-ref` | Absent |
| `.vercel/` project link | Absent |
| Vercel project | `chickadee`, confirmed through authenticated read-only dashboard inspection |
| Vercel project variables | Exactly the three Supabase application variables documented below; names only were inspected |
| Vercel shared variables | None linked to `chickadee` |
| Supabase CLI login/config locations | Absent |
| Supabase CLI in `PATH` | Absent |
| PostgreSQL tools | PostgreSQL 18.4 `pg_dump`, `pg_dumpall`, `pg_restore`, and `psql` installed under `C:\Program Files\PostgreSQL\18\bin` |
| Docker in `PATH` | Absent; Windows hardware virtualization check reported disabled |
| Local `.env.local` or other credential-bearing env file | Absent |
| Relevant Supabase/database process variables | Not set |
| Only `.env.example` | Present; variable names/placeholders only |

The system drive has approximately 667 GB free. Windows Device Encryption was confirmed **On** by the project owner. A backup root was created under `%USERPROFILE%\HockeyAdvisorDirectory-Backups\production`, outside OneDrive and Git, with explicit full-control access limited to the current Windows user, `SYSTEM`, and local administrators.

## Backup status

| Item | Status |
|---|---|
| Timestamped production backup | **Complete** at `2026-07-19T12:03:34Z` |
| Backup storage location | `%USERPROFILE%\HockeyAdvisorDirectory-Backups\production\advisor-directory-production-20260719T120005Z` |
| Database archive | `production-20260719T120005Z.dump` — 758,629 bytes, PostgreSQL custom format |
| Roles export | `roles-20260719T120005Z.sql` — role definitions without password hashes |
| Dump checksum manifest | `SHA256SUMS.txt`; every listed hash independently rechecked successfully |
| Dump content inventory | 1,317 archive table-of-contents entries plus CSV catalog inventories |
| Non-production restore test | Not run; a disposable target has not been provided |

Supabase dashboard recovery status, confirmed by the project owner:

- Most recent managed backup: `2026-07-19 09:59:48 UTC`.
- The dashboard offers **Restore** but no **Download** action.
- Point-in-Time Recovery is not enabled.
- The managed recovery point must not be restored during this baseline; it does not replace the independently stored and validated logical backup required here.

The required procedure and safety gates are in [BACKUP_AND_RESTORE_RUNBOOK.md](./BACKUP_AND_RESTORE_RUNBOOK.md).

Validation completed with PostgreSQL 18.4 `pg_restore`: archive listing passed, schema-only stream parsing passed, and data-only stream parsing passed. The archive contains data sections for 40 of 41 catalog tables; the sole exception is the empty, zero-byte partitioned parent `realtime.messages`, for which PostgreSQL correctly emits no parent data section. No restore command targeted production. Two earlier timestamped attempts remain in the same protected root with `status.json` marked `failed`; neither is accepted as a valid backup. The successful directory above is the recovery artifact for this baseline.

## Supabase configuration and deployment review

### Checked-in Supabase directory

Only five SQL migrations are tracked:

| Migration | Main actions | Baseline concern |
|---|---|---|
| `20250104000000_claim_improvements.sql` | Alters `listing_claims`, `reviews`, `advisors`, and `leads`; creates `advisor_team_members`, `notifications`, one function, and one trigger | Assumes four legacy tables already exist; most statements are not safely repeatable; all relationships target legacy `advisors` |
| `20251109000000_add_advisor_profile_fields.sql` | Adds profile columns and indexes to `advisors`; copies `specialties` data | Contains production data updates; has no `companies` equivalent |
| `20251110000000_add_pricing_fields.sql` | Adds pricing columns, constraints, and indexes; transforms legacy pricing data | Contains production data updates; constraints are not guarded against reruns; targets legacy `advisors` |
| `20251110120000_consolidate_pricing_engagement.sql` | Transforms `engagement_types` into `pricing_structure` | Data migration only; targets legacy `advisors` |
| `20251115_create_admin_users.sql` | Creates `admin_users`, four RLS policies, function, and trigger | Filename uses an inconsistent short version; trigger/policies are not rerun-safe; policies query the protected table itself and need recursion testing |

Missing Supabase project artifacts include:

- `supabase/config.toml`
- a base-schema migration
- a `companies` migration
- checked-in production migration history or a remote/local history comparison
- `supabase/roles.sql`
- `supabase/seed.sql`
- migrations for most RLS policies, PostGIS setup, helper functions, and triggers
- a database backup workflow or pre-deployment drift check

### SQL outside the migration chain

The repository contains important database definitions under `scripts/`, but `supabase db push` does not apply them as migrations:

- `scripts/setup-schema.sql`: 14 base tables, 7 functions, 7 triggers, indexes, and blog category seed data.
- `scripts/setup-rls-policies.sql`: enables RLS on 14 tables and creates 31 policies.
- `scripts/create-distance-function.sql`: `search_advisors_by_distance`.
- `scripts/update-postgis-function.sql`: `update_postgis_locations`, `auto_update_location`, and `trigger_auto_update_location`.
- `scripts/add-is-verified.sql`: legacy `advisors.is_verified` column and index.
- `scripts/make-state-nullable.sql`: changes legacy `advisors.state` nullability.

These files are schema history fragments, not a reproducible migration chain.

### Environment-variable requirements

Supabase application access requires:

| Variable | Use | Handling |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/server project URL | Public identifier, but must point to the intended environment |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/server anonymous API access | Public client key; authorization must rely on RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server/admin client and maintenance scripts | Secret; server-side only; bypasses RLS |

An authenticated, read-only Chrome inspection of Vercel project `chickadee` on 2026-07-19 confirmed that these are its only three project environment variables. No shared variables are linked. In particular, none of `DATABASE_URL`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `SUPABASE_DB_URL`, `SUPABASE_DB_PASSWORD`, `POSTGRES_PASSWORD`, or `POSTGRES_HOST` is configured in Vercel. Values were never revealed or read, and no Vercel setting was changed.

Backup and privileged inventory work additionally requires the database password or a database connection URL supplied through a private interactive prompt. That credential is not an application runtime variable and is not currently available. Because Vercel has no direct PostgreSQL/password variable, a controlled Supabase database-password reset should not affect the deployed application's Vercel configuration; other external clients must still be checked before rotation.

The code also directly reads `ADMIN_USER_EMAILS`, `CRON_SECRET`, `IP_SALT`, email, Cloudinary, Google Maps, analytics, revalidation, and content-research variables. `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` are used by code but absent from `.env.example`; this is a documentation gap outside the database baseline.

### Deployment path

- `.github/workflows/deploy.yml` deploys Vercel production on pushes to `main` or `master`.
- The deploy workflow does not apply or validate Supabase migrations and does not create a database backup.
- `.github/workflows/ci.yml` passes Supabase URL/key secrets to tests and builds, but does not compare local and remote database schemas.
- `docs/DEPLOYMENT.md`, `DEPLOYMENT_CHECKLIST.md`, `ADMIN_SETUP.md`, and `scripts/README.md` describe manual dashboard/SQL steps. This makes production history dependent on operator actions that are not captured in `supabase/migrations`.

## Production inventory status

The privileged catalog inventory was captured from PostgreSQL 17.6 through the Supabase shared Session Pooler. It contains 41 non-system tables, 820 non-system functions, 21 aggregates, 10 RLS policies, 9 non-internal triggers, role definitions, privileges, columns, constraints, extensions, and exact counts for every table.

### Application tables and exact production counts

| Table | Rows | RLS | Purpose / key relationship |
|---|---:|---|---|
| `public.companies` | 202 | Enabled; 2 policies | Listing/business entity; optional `verified_owner_id -> public.users.id` |
| `public.advisors` | 177 | Enabled; 2 policies | People/team members; `company_id -> companies.id ON DELETE CASCADE` |
| `public.listing_claims` | 0 | Enabled; 3 policies | Company claims; `company_id -> companies.id`, claimant/reviewer -> `public.users.id` |
| `public.media_content` | 0 | Enabled; 2 policies | Company media; company/uploader FKs |
| `public.users` | 0 | Enabled; 1 policy | Application profile; `id -> auth.users.id ON DELETE CASCADE` |

`public.spatial_ref_sys` has 8,500 extension rows and no RLS. The other managed schemas contain 23 `auth` tables, 3 `realtime` tables, 8 `storage` tables, and `vault.secrets`. All application auth/user/claim/media tables currently have zero rows. The exact `companies` count independently matches the deployed API's 202-record observation.

### Production security and executable objects

- RLS is enabled, but not forced, on all five application tables. The 10 deployed policies are company-centric and do not match the 31 legacy policies in `scripts/setup-rls-policies.sql` or the four `admin_users` policies in tracked migrations.
- The only custom application function owned by `postgres` is `public.update_updated_at_column()`; it is `SECURITY INVOKER` and returns `trigger`. The remaining inventoried functions/aggregates are primarily Supabase-managed or PostGIS extension objects.
- Four application triggers call the timestamp function: `update_advisors_updated_at`, `update_listing_claims_updated_at`, `update_media_content_updated_at`, and `update_users_updated_at`. Five additional triggers belong to managed `realtime`/`storage` schemas.
- Eight deployed application foreign keys form a coherent company-centric model. No deployed FK targets legacy `advisors` as a listing/business entity.
- `storage.buckets` and `storage.objects` both contain zero rows; there are no Supabase Storage buckets or object metadata to export separately. Cloudinary remains the apparent application media store.
- The standard relation `supabase_migrations.schema_migrations` does not exist. Production therefore has no standard Supabase migration-history rows to reconcile with the five local migration files.
- The roles export and inventories include roles, memberships/configuration visible to the database owner, table grants, object ownership, RLS definitions, functions, triggers, and storage metadata. Role password hashes were intentionally excluded.

## Repository schema inventory

### Legacy/base tables defined only in `scripts/setup-schema.sql`

| Table | Repository relationship(s) | RLS definition location |
|---|---|---|
| `advisors` | `claimed_by_user_id -> auth.users.id` | `scripts/setup-rls-policies.sql` |
| `listing_claims` | `advisor_id -> advisors.id`; `reviewed_by -> auth.users.id` | `scripts/setup-rls-policies.sql` |
| `leads` | `advisor_id -> advisors.id` | `scripts/setup-rls-policies.sql` |
| `reviews` | `advisor_id -> advisors.id`; `user_id -> auth.users.id`; unique `(advisor_id, user_id)` | `scripts/setup-rls-policies.sql` |
| `click_tracking` | `advisor_id -> advisors.id` | `scripts/setup-rls-policies.sql` |
| `listing_views` | `advisor_id -> advisors.id` | `scripts/setup-rls-policies.sql` |
| `users_public` | `id -> auth.users.id` | `scripts/setup-rls-policies.sql` |
| `csv_import_logs` | `imported_by -> auth.users.id` | RLS enabled in script; no policy is defined |
| `blog_categories` | Referenced by `blog_posts.category_id` | `scripts/setup-rls-policies.sql` |
| `blog_tags` | Referenced by `blog_post_tags.tag_id` | `scripts/setup-rls-policies.sql` |
| `blog_posts` | `author_id -> auth.users.id`; `category_id -> blog_categories.id`; `related_advisor_id -> advisors.id` | `scripts/setup-rls-policies.sql` |
| `blog_post_tags` | `post_id -> blog_posts.id`; `tag_id -> blog_tags.id` | `scripts/setup-rls-policies.sql` |
| `blog_comments` | `post_id -> blog_posts.id`; `user_id -> auth.users.id`; self-reference through `parent_comment_id` | `scripts/setup-rls-policies.sql` |
| `blog_post_views` | `post_id -> blog_posts.id` | `scripts/setup-rls-policies.sql` |

### Tables introduced by tracked migrations

| Table | Relationship(s) | RLS in migrations |
|---|---|---|
| `advisor_team_members` | `advisor_id -> advisors.id` | No |
| `notifications` | `user_id -> auth.users.id`; `advisor_id -> advisors.id` | No |
| `admin_users` | `user_id -> auth.users.id`; `granted_by -> auth.users.id` | Yes, four policies |

`companies` is absent from both lists because no checked-in SQL defines it.

### Functions and triggers represented in the repository

| Source | Functions | Triggers |
|---|---|---|
| `scripts/setup-schema.sql` | `calculate_data_quality_score`, `update_advisor_rating`, `set_published_at`, `calculate_read_time`, `update_tag_count`, `update_category_count`, `update_blog_view_count` | `update_advisor_quality_score`, `update_rating_on_review_change`, `auto_set_published_at`, `auto_calculate_read_time`, `update_tag_count_trigger`, `update_category_count_trigger`, `update_blog_view_count_trigger` |
| Claim migration | `update_advisor_team_count` | `trigger_update_team_count` |
| Admin migration | `update_admin_users_updated_at` | `admin_users_updated_at` |
| `scripts/create-distance-function.sql` | `search_advisors_by_distance` | None |
| `scripts/update-postgis-function.sql` | `update_postgis_locations`, `auto_update_location` | `trigger_auto_update_location` |

None of those repository functions or triggers is present as a custom production object. Production instead contains only `update_updated_at_column()` and four timestamp triggers for the company-centric tables.

## `companies` versus `advisors` migration risks

### 1. Entire production application schema is missing from migrations — catalog-confirmed

No tracked migration creates any of the five deployed application tables: `companies`, the person/team-member version of `advisors`, company-centric `listing_claims`, `media_content`, or `users`. Their five enum types, 10 policies, timestamp function, four triggers, indexes, constraints, ownership, and grants are also absent. This is broader than the previously inferred missing `companies` table.

### 2. Entity meaning is split across the application

The public listing page treats:

- `companies` as a business/listing; and
- `advisors` as team members with `company_id`, `active`, and `display_order`.

The legacy schema and most protected application routes treat `advisors` as the business/listing itself, with location, contact, publishing, ownership, pricing, ratings, and subscription fields. No migration documents the transformation between these meanings.

### 3. Foreign-key and ID-domain mismatch risk

Public contact and review pages pass `company.id` into components and queries still named `advisorId`/`advisor_id`. Repository SQL defines `reviews.advisor_id`, `leads.advisor_id`, `listing_claims.advisor_id`, analytics foreign keys, and team-member foreign keys against legacy `advisors.id`. Unless production has undocumented FK rewrites or IDs were intentionally preserved, inserts may fail or associate records with the wrong entity.

### 4. Claim schema is internally inconsistent

The public claim page expects `listing_claims.company_id` and `claim_status`. Claim submission, verification, password setup, and admin claim routes still use `advisor_id` and `status`, and join through `listing_claims_advisor_id_fkey`. No migration adds the company-centric columns or migrates existing claims.

### 5. Review schema is internally inconsistent

The public review page checks `reviews.reviewer_id`, while `scripts/setup-schema.sql` and RLS policies use `reviews.user_id`. Review API paths also mix `reviewer_id` and legacy advisor validation. The deployed definition and policy predicates must be inventoried before any review migration.

### 6. RLS coverage is not reproducible

Production has 10 company-centric policies across all five application tables, but none is checked into migrations. The 31 legacy policies are outside migrations and describe mostly absent tables/columns. `advisor_team_members` and `notifications` have no RLS statements in the migration that creates them and do not exist in production. The application frequently uses a service-role client, so policy behavior still requires dedicated authorization tests before migration work.

### 7. Fresh database and recovery are currently unproven

Running the tracked migrations against an empty Supabase database would fail before producing the application schema. The validated archive now provides a recovery source, but reproducible schema-as-code and a disposable restore test are still required before Step 3 migration changes.

## Production objects missing from `supabase/migrations`

### Catalog-confirmed production objects absent from tracked migrations

- Tables: `public.companies`, `public.advisors`, `public.listing_claims`, `public.media_content`, and `public.users`.
- Enum types: `claim_status`, `media_type`, `moderation_status`, `user_type`, and `verification_method`.
- Company-centric columns and relationships, including `advisors.company_id`, `listing_claims.company_id`, and the eight deployed application FKs.
- All 10 deployed RLS policies and RLS enablement for the five application tables.
- `public.update_updated_at_column()` and the four application timestamp triggers.
- All deployed application constraints and indexes, including the unique active-claim constraint.
- Application grants, object ownership, and default privileges represented in the archive.

### Tracked/repository objects absent from production

- Migration-created tables `advisor_team_members`, `notifications`, and `admin_users`.
- Legacy tables `leads`, `reviews`, `click_tracking`, `listing_views`, `users_public`, `csv_import_logs`, and all blog tables.
- Every repository-defined custom function/trigger except that production has a differently named generic timestamp function.
- All 31 policies in `scripts/setup-rls-policies.sql` and all four `admin_users` policies.
- Legacy business-listing fields expected on `advisors`, including slug/location/publishing/rating/subscription/pricing fields added or altered by tracked migrations.
- `supabase_migrations.schema_migrations` itself; therefore none of the five tracked migration versions is recorded through the standard mechanism.

## Remaining safety gate

Completion record and remaining requirement—not credentials to paste into chat, source files, command history, logs, or Git:

1. ~~The expected production Supabase project reference or project name, so the target can be independently confirmed.~~ **Complete.**
2. ~~Supabase organization/project access that can list the project and read database settings and backups.~~ **Complete.**
3. ~~A database password/connection URL supplied through a private interactive prompt; never paste it into chat or Git.~~ **Complete:** the password was entered only into hidden local prompts, used in process memory, and not saved.
4. ~~Permission to install/use PostgreSQL client tools on this machine.~~ **Complete:** PostgreSQL 18.4 tools are installed and the local PostgreSQL 18 service is running. Docker is not required for the native backup path.
5. ~~A secure, access-controlled backup destination outside this repository with enough free space for roles, schema, data, migration history, and metadata dumps.~~ **Complete:** encrypted system drive and restricted external backup root confirmed.
6. **Still required before any migration fix:** a disposable Supabase project or compatible isolated PostgreSQL/Supabase target for restore validation. It must not be the production project.

The backup, hash verification, catalog export, and migration comparison are complete. Only the disposable restore test remains outstanding; do not restore into production.
