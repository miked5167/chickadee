# Controlled directory tags — Step 1

## Status and scope

The tag foundation is additive. No company, advisor, claim, legacy profile field,
ownership record or Elite Prospects measurement is rewritten or backfilled by
the migration or seed. Authentication and the locked administrator workflows
are unchanged. Production application requires the existing reviewed migration
release procedure; these repository changes do not execute a production push.

## Taxonomy

The starter catalog is `data/directory-tags.json`; the runtime catalog comes
from the database, including subsequently approved suggestions. Stable IDs use
`group:slug`, such as `services:advisor` and `pathways:ncaa`.

| Group | Starter options |
| --- | --- |
| Services | Hockey advising, agent representation, scouting/player evaluation, video analysis, recruiting/placement, skills coaching |
| Pathways | Prep school, junior, NCAA, U SPORTS, professional |
| Current player level | AA, AAA, prep/high school, junior, college/university, professional |
| Age groups served | 13–14, 15–17, 18–20, 21 and older |
| Regions served | Canada, United States, 13 Canadian provinces/territories and 50 US states |
| Languages | English and French |
| Typical engagement price | Under $1,000, $1,000–$2,499, $2,500–$4,999, $5,000–$9,999, $10,000+ |

Regions describe client coverage, independently of office location. Province
and state tags have their country as `parent_id`; IDs distinguish California
(`regions:us-ca`) from Canada (`regions:ca`). Age labels describe service fit,
not league eligibility. Pricing remains optional and its group starts with
`filter_enabled = false`. Price bands describe a typical total engagement;
currency and billing details remain in the existing profile pricing fields.
No price, age, service or level is inferred by this seed.

Advisors choose **3–5 core tags across Services and Pathways**, including at
least one Service. Supplemental groups do not consume those slots. Price range
is single-select. All selections use active, approved catalog IDs. Duplicates,
unknown/retired tags, missing services and invalid core counts are rejected in
both application validation and the database. Untagged legacy listings remain
valid until an owner or reviewed backfill supplies a selection.

## Storage and access

- `directory_tag_groups`: controlled group definitions and filter visibility.
- `directory_tags`: approved options, stable IDs, labels and optional hierarchy.
- `company_tags`: public assignments keyed to `companies.id`.
- `claim_tags`: private selections keyed to `listing_claims.id`.
- `directory_tag_suggestions`: private proposals with an approval/rejection audit.

Authenticated clients cannot directly mutate the catalog or assignments.
`replace_company_tags(p_company_id, p_tag_ids)` checks verified ownership or
existing administrator authorization, locks the company and atomically
replaces its tag set. `replace_claim_tags(p_claim_id, p_tag_ids)` accepts only
the submitting user's pending/under-review claim. Claim selections do not
publish company tags and never grant ownership. Both functions validate the
complete selection before replacing saved data.

Suggestions have exactly one context: an owned company or the submitter's
pending claim. RLS enforces that context and submitter identity. Insert
privileges exclude publication status, reviewer identity and approved tag ID.
Reviewing a suggestion checks administrator authorization again in the
database, locks the proposal and creates/reuses an approved tag in the same
transaction as its audit. Approval does not auto-assign the tag to any listing.

## API and administrator review

- `GET /api/directory-tags`: database-backed catalog, including visibility flags.
- `GET /api/advisor/tag-suggestions`: the signed-in user's suggestions.
- `POST /api/advisor/tag-suggestions`: `{ company_id | claim_id, group_key, label, reason }`.
- `GET /api/admin/tag-suggestions`: oldest 100 pending proposals.
- `PATCH /api/admin/tag-suggestions/{id}`: `{ action: "approve", slug, label, note? }` or `{ action: "reject", note? }`.
- `/admin/tag-suggestions`: dedicated review page using the existing administrator guard, outside the layout that suppresses locked workflows.

The API uses request-scoped session clients and existing guards; no service-role
client is created. All responses are no-store. Requesters cannot self-approve.
The advisor-facing picker and suggestion form belong to Step 2.

## Migration, seed and validation

`supabase/migrations/20261002000000_directory_tags.sql` contains schema and
functions only. Apply it transactionally through the migration runner on an
approved target. Seed separately with `supabase/seeds/directory-tags.sql`.
Seed reruns insert missing starter options without overwriting administrator
labels, visibility changes or retired tags.

```text
node scripts/database/generate-tag-seed.mjs --check
node scripts/database/generate-schema-fingerprint.mjs --check
node scripts/database/generate-database-types.mjs --check
node scripts/database/validate-migrations.mjs
node scripts/database/test-validation-rules.mjs
node scripts/database/test-directory-tags.mjs
npx vitest run tests/unit/directory-tags.test.ts tests/unit/tag-suggestion-routes.test.ts
```

The PostgreSQL test starts a fresh cluster bound to loopback, independently
verifies its database/port/data directory, uses minimal dependency fixtures,
executes the real migration and seed, exercises privileges/RLS and transaction
behavior, then stops and removes only its checked temporary directory. Supply
`--pg-bin <installed PostgreSQL bin directory>` when needed. This test does not
substitute for the complete PostGIS bootstrap or production release preflight.

The existing schema fingerprint/type generation and full-bootstrap catalog
checks include the new objects. The immutable baseline and all older migrations
remain unchanged. Human-reviewed backfill and Elite Prospects sorting are
later implementation steps.
