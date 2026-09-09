# M7 directory optimization checkpoint — 2026-08-21

## Status

- Branch: `codex/restart-foundation`
- Remote: `https://github.com/miked5167/chickadee.git`
- Production remains on `e7059b6b90f914792108bc84704caf1e5358398b`.
- No branch push, pull request, merge, deployment, production migration, production database write, administrator grant, or external message was performed during this work.
- M4 through M7 are local-only and have not been applied to production.

## What is complete locally

- Hockey-specific responsive design system and original hero artwork.
- Search filters, distance filtering, map view, saved listings, and three-listing comparison.
- Rich company profiles, owner claim flow, advisor dashboard, team profiles, inquiries, reviews, and consent-aware engagement totals.
- Regional and pathway landing pages, guide hub, four research guides, glossary, sitemap expansion, canonical URLs, breadcrumbs, and appropriate structured data.
- Honest privacy, cookie, terms, verification, review, sponsorship, and monetization language.
- A private advisor-interest form for testing demand before enabling prices or billing.
- Demo pages are clearly labelled and excluded from search indexing.
- Retired account-claim, blog, generic media-upload, and subscription-expiration workflows fail closed with HTTP 410 responses.
- Vercel's obsolete nightly subscription cron has been removed from `vercel.json`.
- Administrator pages and APIs remain behind the canonical authorization check and a deliberate safety lock.

## Database migrations

| Milestone | File | SHA-256 |
| --- | --- | --- |
| M4 reviews | `20260719000003_company_reviews.sql` | `05bbef023d1b74e5707d801554e2839248d9a976f71fea41155167b69f8f69f7` |
| M5 profiles | `20260821000000_company_profiles.sql` | `854df7aab36a71b229b92525194972144fa118e4dd537d7cb81ed26eb8de49cc` |
| M6 leads/events | `20260821000001_company_leads_and_events.sql` | `6eb36ca91d99dba5ee605a101cc48329c1d586ff0b2e0f14f864971e289673e9` |
| M7 advisor interest | `20260821000002_advisor_interest_submissions.sql` | `dd3633aa14ba58d2340c5e1512cf20353006ac1b98e3d4f75431d4322409234e` |

M7 stores no payment, subscription, ranking, verification, or entitlement state. Anonymous and authenticated roles have no table access or RLS policy. Only the server role can rate-limit and store a submission. IP addresses are one-way hashed before storage.

## Validation evidence

- TypeScript: passed.
- Unit tests: 125/125 passed across 9 files.
- Production build: passed; 71 static pages generated plus dynamic routes.
- Changed and new restart files: 0 lint errors and 5 warnings for arbitrary remote business-logo `<img>` elements.
- Full repository lint: 108 errors and 112 warnings remain in older code. This is improved from the handoff baseline of 204 errors and 150 warnings, but it is still separate technical debt.
- Database migration validator: passed.
- Negative migration/security rules: passed through M7.
- Deterministic schema fingerprint and generated database types: passed.
- Fresh disposable PostgreSQL 18/PostGIS M1→M7 bootstrap: passed, including no-op rerun, catalog comparison, permission guards, administrator matrix, and review matrix.
- Production build visual check: desktop and 390-pixel mobile layouts passed for `/for-advisors`.
- `git diff --check`: passed.
- Local port 3000: clear after validation.

## Deliberately not enabled

- No checkout, payment provider, subscription, paid entitlement, or paid ranking.
- No sponsored result placement.
- No administrator bootstrap or administrator mutations.
- No advisor review replies.
- No automatic ownership assignment from an email address.
- No production migrations or application deployment.

## Controlled next step

Do not push this mixed worktree yet. First review and separate the pre-existing user-owned M4 production scripts from the restart feature changes, then create a local checkpoint commit. After that, perform a new read-only deployment-configuration review against the connected hosting project before requesting approval for any branch push or preview deployment.

Production migration planning must treat M4 through M7 as an ordered chain and must use a new protected preflight/evidence package. The M4 evidence package from 2026-07-20 proves the earlier M4-only state; it must not be presented as evidence for M5 through M7.
