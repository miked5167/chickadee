# Directory tags release candidate — October 2, 2026

Prepared on `codex/tags-release`, starting from production commit `b4af828`
(the listing card release, PR #9). This candidate contains the tagging/filtering
commits and focused release fixes. Unrelated work in the primary checkout is
excluded. Authentication is unchanged. No listing backfill is applied.

## What visitors and advisors get

- Controlled Services, Pathways, current player level, ages 13+, regions and
  languages. Require 3–5 Services/Pathways tags, including a Service;
  supplemental selections are optional. Price ranges remain optional profile
  data and are excluded from visitor filters.
- Advisor claim and profile-edit selection, a completeness indicator, accessible
  selection tabs, and suggestions reviewed by administrators.
- Counted filters, active chips, clear all, shareable URL state, server-rendered
  initial results/count, and a mobile panel with an Apply count.
- Within a group, selections match any option; between groups they must all
  match. Facet counts omit that facet's own selections. Regions include their
  descendants; the Country filter refers to office location.
- Elite Prospects sorting uses stored source counts. An unknown count is not
  reported as zero or replaced by an advisor's claim.
- A CSV proposal script that cannot write listing tags to the database. Human
  review and approval of assignments are a separate deferred step.

## Production observations — read only

Project: `dqskdrqubqnhdssxpryx`, Advisor Directory - Production.
Observed at `2026-10-03T01:36:04Z` (October 2 in Toronto), using
`supabase/validation/directory-tags-release-preflight.sql`:

| Check | Observed |
| --- | --- |
| Companies | 202 |
| Tag groups / active catalog options | 7 / 93 |
| Public listing assignments / private claim assignments | 0 / 0 |
| Price filter enabled | false |
| Claim phone column maximum | 20 characters |
| Tag tables with row-level security | All five |
| Existing tag function owners and search paths | postgres; fixed empty search path |
| Atomic claim-submit function | Missing |

The tag foundation `20261002000000_directory_tags` is already applied and its
catalog is already seeded. Do not apply that migration or seed again as part of
this release. Production also records
`20261002000001_directory_admin_and_billing`, which is not in this feature
branch. Preserve that applied history and its schema; this candidate does not
include or change the unrelated admin/billing work.

The only missing feature migration is
`supabase/migrations/20261003000000_directory_claim_tags.sql`. Its committed LF
SHA-256 is
`c9fd43d1c4188198ae74806ad6e9b3167289c04a4ad7b4bede40cfc5ba93f98d`.
It adds `public.submit_directory_claim(uuid,text,text,jsonb,text[])` to save
a pending claim and its private selections atomically, using existing identity
and ownership checks. It grants execution to authenticated users, not anon.

**Do not run a generic `supabase db push` from this checkout, delete migration
history, or mark missing migrations applied to bypass the extra live entry.**
The targeted deployment method must preserve the entire existing ledger and
record the actual applied claim migration. A migration API can assign a new
timestamp; if used, retain its receipt and review alignment with the repository
filename before any subsequent CLI push. The local bootstrap runner targets a
fresh disposable database and is not a production deployment command.

## Validation completed locally

- Application suite: 317 tests passed before the release fixes; the nine claim
  route tests passed afterward, including two new compatibility cases.
- ESLint passed with existing warnings; separate TypeScript check and production
  build passed. The build used a reserved `.invalid` database hostname.
- Real PostgreSQL tag permission/transaction suite: 53 checks passed.
- Fresh PostGIS baseline through the claim migration passed, including schema
  fingerprints, generated types, migration guards and role permission matrices.
- The fresh-database rehearsal submitted private claim tags, rejected invalid
  selections and oversized phone input without orphan claims, published tags
  after a fixture ownership approval, replaced tags, and verified the actual
  filtering/facets and URL round trip against persisted records. Fixtures rolled
  back. This tests the outcome of ownership approval, not an admin browser flow.
- Reviewed alternative PostgreSQL CHECK renderings have exact allowlists and
  negative tests. Changed/weakened constraints still fail validation. Previously
  applied migration files were not edited.

Run the application checks and the new Directory tag database checks job on the
pull request. All required jobs must pass before merge.

## Remaining hosted verification

No separate Advisor Directory staging database or development database branch
was available during preparation. The Vercel connector returned 403 for this
project, but opening draft PR #10 triggered the existing GitHub/Vercel integration
and its preview built successfully. No production deployment or hosted write
smoke test has been performed.

Preview:
`https://chickadee-git-codex-tags-release-miked5167-3573s-projects.vercel.app/listings`.
Read-only HTTP checks against its server-rendered HTML passed: 202 total
advisors, 93 Canadian offices, 109 US offices with Elite Prospects sorting,
native GET filter forms and initial cards, no price options, and a removable
NCAA chip with zero results while no tags are assigned. The hosted demo route
returned 404. These checks do not establish a separate preview database or
complete the interactive keyboard/mobile and claim-edit browser checklist.

Verify the preview's Supabase project ID and environment settings before any
fixture write. A preview pointed at production is not a disposable staging
database. Use an explicitly isolated target with the existing auth configuration;
do not change production authentication to make tests work.

On that target, complete this browser checklist:

- Claim a fixture listing with 3 core tags and an optional player-level tag;
  confirm the pending claim is private and the public listing has no tags yet.
- Complete the existing ownership-review flow, then use profile editing to
  publish/replace tags. Confirm invalid selections keep the previous tags.
- Suggest an option; confirm it remains unavailable until admin approval.
- Select multiple options and groups, share/reload the URL, use browser Back,
  remove chips, and clear all. Confirm pagination and sorting retain filters.
- Confirm visible results and facet counts against the fixture assignments.
  Test Elite Prospects known-zero and unknown values independently.
- Disable JavaScript and submit the filter form. Initial cards, count, chip
  removal and pagination must still work.
- On a narrow screen, use Apply, keyboard Tab, Escape and focus restoration.
  Check tab selection with arrow keys and visible labels/announcements.
- Confirm price filters are absent, empty options are disabled, and
  `/demo/tagging` returns 404 in the production/hosted preview environment.

## Deployment order and release gates

1. Review the feature diff and all green pull request checks. Complete the
   isolated hosted verification above and confirm access to the Vercel project.
2. Re-run the read-only preflight against the approved target. Confirm the
   missing function and applied history still match these observations. Capture
   the existing deployment ID and a current database backup/restore point.
3. Resolve the targeted migration/history procedure described above; verify the
   reviewed SQL checksum, apply only the missing claim migration transactionally
   as postgres, and retain the migration receipt. No listing assignments belong
   in this step.
4. Re-run preflight: the claim function must exist, anon execute must be false,
   authenticated execute true, owner postgres, search path fixed empty. Existing
   company/claim assignments and the price setting must remain unchanged.
5. Deploy this reviewed application revision through the existing Vercel
   project. Do not deploy the primary checkout's unrelated changes.
6. Check live listing/count rendering, Country and Elite Prospects sorting,
   URL state and mobile opening. Keep write smoke tests on the isolated target.
   Monitor claim/tag API errors after rollout.

With zero published assignments, tag counts will be zero and options disabled.
Do not infer tags from legacy prose or import the unapproved CSV to make the
filters appear populated. Advisors can fill them through the new setup/editing
flow; the reviewed backfill can follow later.

The public search currently reads the directory into memory (202 listings).
Revisit batching/database search as the directory approaches the API row cap.

## Rollback

Roll back the application to the captured previous Vercel deployment if claims
start failing, tag permissions leak, or result/count behaviour regresses. The
previous source baseline is `b4af828`. Keep the additive tables/catalog and claim
function in place: an application rollback does not require dropping data or
removing migration history. Preserve any advisor submissions made after launch.
Verify the previous listing/claim behaviour after rollback and retain receipts.

Preparation status: reviewable candidate; hosted verification, targeted
production migration procedure and deployment remain release gates.
