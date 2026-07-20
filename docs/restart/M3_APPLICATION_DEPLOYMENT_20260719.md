# M3 Application Authorization Deployment — 2026-07-19

## Approval and scope

The user approved the application deployment and first-administrator bootstrap on 2026-07-19. Bootstrap remains pending because no candidate or distinct approver/revoker Auth UUID was supplied. No Auth identity or PII query was performed and no `public.admin_users` row was inserted.

Only the reviewed application cutover, its tests, and its checkpoint record were committed. Pre-existing package, migration-quarantine, validation, fingerprint, type, and other restart-document worktree changes were not staged or committed.

- Commit: `e7059b6b90f914792108bc84704caf1e5358398b`
- Commit subject: `security: enforce administrator authorization cutover`
- Push: exact commit from `codex/restart-foundation` to `origin/master`
- Production deployment ID: `5514519943`
- Production deployment created: `2026-07-19T21:39:24Z`
- GitHub deployment status: `success` — `Deployment has completed`
- Deployment URL: `https://chickadee-j35971d8r-miked5167-3573s-projects.vercel.app`
- Canonical site: `https://thehockeydirectory.com`

## Verification

The GitHub `Deploy to Vercel` workflow run `29704724502` reported failure at the Vercel action step, but GitHub's deployment record for the exact commit reports success and the canonical production domain serves the new cutover behavior. The failure occurred after dependency installation and did not prevent publication. Exact private action logs require an authenticated GitHub session and were not available through the public API.

Read-only production smokes after publication:

- canonical homepage: HTTP 200;
- public advisor API: total 202 and one requested row;
- anonymous administrator dashboard, analytics, claims, listings, reviews, and blog-post endpoints: generic HTTP 401 `{"error":"Authentication required."}`;
- administrator responses include `Cache-Control: no-store`;
- POST-only CSV validation returns HTTP 405 to GET, as expected.

CI run `29704724484` failed at repository-wide ESLint on the known pre-existing backlog and skipped its later type/test/build steps. The cutover's relevant-file lint, TypeScript, 110 unit tests, database validators, derived-type check, and loopback production build had already passed locally before the approved push.

## Remaining gate

Do not bootstrap until the user supplies:

1. exact candidate Auth UUID;
2. exact, distinct approver/revoker Auth UUID.

The UUIDs must be supplied through the approved privacy-minimizing process. Do not query Auth email, metadata, or other PII to discover them. After receipt, repeat the protected production bootstrap preflight and execute only the separately reviewed one-row transaction.
