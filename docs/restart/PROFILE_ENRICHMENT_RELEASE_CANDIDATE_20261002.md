# Profile enrichment local release candidate — 2026-10-02

## Outcome

The profile-enrichment work is packaged as one local release candidate on `codex/restart-foundation`. Nothing in this preparation pushed code, opened a pull request, deployed the application, changed production data, granted administrator access, or enabled unfinished administrator mutations.

## Included product changes

- A redesigned company profile that presents contact information, reviews, people, sources, location, social links, and Elite Prospects measurements more clearly.
- The same reviewed company logo resolver on directory cards and company profiles.
- 134 locally stored, reviewed company logos with source and hash records. Sixty-eight listings deliberately keep the neutral no-logo state.
- 48 reviewed personal LinkedIn links matched by exact company slug and normalized person name. The 28 name-only possibilities remain excluded for later human review.
- Safer company and personal LinkedIn URL normalization, including rejection of unsafe or unrelated destinations.
- Address or general-area maps that load Google content only after a visitor explicitly asks for the interactive map. A normal Google Maps link remains available without an embed key.
- Responsive header, shortlist comparison link, and compact empty-review presentation improvements required by the new profile layout.
- Reproducible offline research, logo-review, LinkedIn-review, and Elite Prospects import tools. Local Firecrawl evidence and draft overview data remain ignored and are not part of the release.

## Database relationship and ordering

The listing page reads `public.company_elite_prospects`. The repository migration for that table is `20260913004623_company_elite_prospects.sql`, SHA-256 `a7658ecc4ff0ccbb21c78d08d9ea98270a92abf9d94fb563465a4e91862ce789`.

The existing Elite Prospects checkpoint records that this migration and 202 measurement rows were already applied to the production Supabase project on 2026-09-13 while the website changes remained local. Before any website deployment, a separate read-only preflight must confirm that production still has the exact migration and expected rows. If it matches, the migration must not be applied again; the application can be deployed after the no-op database check.

The LinkedIn catalog and company-logo catalog are application files and need no production database write.

## Local validation

- Unit tests: 21 files, 224/224 tests passed.
- TypeScript: passed with `npm exec tsc -- --noEmit`.
- Production build: passed; 71 routes generated or registered.
- Focused release ESLint: zero errors. Two ordinary `no-img-element` warnings remain in the new profile/logo components.
- Repository-wide ESLint: passed with zero errors and 94 non-blocking warnings.
- Database migration/static validator: passed.
- Negative migration-rule validator: passed.
- Schema fingerprint check: passed.
- Generated database types check: passed.
- Whitespace/error check: passed.
- Credential-shaped literal scan across release files: no findings.

## CI lint gate resolution

The repository-wide `npm run lint` now passes with zero errors and 94 non-blocking warnings. Application code remains under the strict Next.js and TypeScript rules. Historical `*-old-backup.tsx` copies are excluded because they are not application source. Maintenance scripts and tests have a narrow override for `no-explicit-any` and CommonJS imports because they validate loosely shaped external/negative-test data at runtime; all other lint rules still apply to them.

CI now uses Node.js 20.x only and declares `node >=20.9.0`, matching Next.js 16.1.6. The obsolete Node.js 18 test job was removed because this version of Next.js does not support it.

## Pre-deploy checklist

- [x] Release scope and dependencies identified.
- [x] Focused lint, unit tests, TypeScript, production build, and database validators pass locally.
- [x] No credential-shaped literals found in release files.
- [x] Administrator access and unfinished administrator mutations remain unchanged.
- [x] Resolve the repository-wide CI lint blocker without relaxing application rules.
- [x] Perform a fresh read-only production database/migration preflight.
- [ ] Review the final commit diff and approve a feature-branch push.
- [ ] Open and review a pull request to `master`.
- [ ] Merge only after required checks and approval; a merge to `master` triggers the production Vercel workflow.
- [ ] Smoke-test directory cards and representative profiles after deployment.

## Rollback plan

If the deployed profile UI has a serious problem, revert the application release commit and redeploy the preceding `master` commit. The catalogs are local application assets and require no database rollback. Do not delete the Elite Prospects table or measurements as an application rollback; they predate this website release and are independently documented.

Rollback triggers include a broken listing page, missing directory results, unsafe outbound links, incorrect company-to-person matching, or a material increase in server errors.

## Read-only production preflight — 2026-10-02

- Supabase project `dqskdrqubqnhdssxpryx` is `ACTIVE_HEALTHY` in `ca-central-1` on PostgreSQL 17.6.
- Migration history is the exact ordered M1–M8 chain through `20260913004623_company_elite_prospects`.
- `public.company_elite_prospects` has the expected 202 rows: 163 exact, 30 likely, 8 none, and 1 ambiguous; 193 rows have counts.
- Every row retains source SHA-256 `38c5ac1b33a43e0992bb102af90ef21ca19114a6fe3f05b7b76c0053aceefe68`.
- The table contract, constraints, SELECT-only RLS policy, and grants match the repository migration. Anonymous and authenticated roles can select but cannot insert.
- Production has zero reviews and one administrator record. The administrator record is later production state associated with private analytics access; this release makes no administrator change and enables no new administrator mutation.
- The 2026-09-25 Supabase/PostgreSQL 17.11 breaking-change detection queries returned no `ltree` indexes, no `btree_gist` float indexes, and no custom estimator operators. No application-defined routine references PGP encryption or a legacy cipher option.
- Supabase advisor findings are pre-existing and outside this application-only release. They include PostGIS extension objects, a deliberately policy-free fail-closed intake table, existing RLS performance advice, and disabled leaked-password protection. No advisor finding is introduced or changed by this release.
- The production homepage, directory, and 2112 Hockey Agency profile each returned HTTP 200 before deployment.
