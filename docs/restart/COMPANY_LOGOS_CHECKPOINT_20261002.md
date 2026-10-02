# Company logos checkpoint — 2026-10-02

## Outcome

The local directory now has 134 reviewed company logos: the 3-logo September batch plus 131 newly reviewed official-site logos. The shared resolver displays the same asset on Find Advisors cards and company profile pages. No company row, production database, hosted site, or external account was changed.

## Collection and review

- Directory inventory: 202 company listings.
- Listings with a website field: 191.
- Previously reviewed logos: 3.
- Own-domain sites eligible for the new Firecrawl branding pass: 179.
- Official-site logo candidates returned: 150.
- Candidates that passed source, image, identity, and visual review: 131.
- Total local coverage after installation: 134 of 202 listings.
- Listings still showing the neutral missing-logo state: 68.

The remaining 68 consist of 11 listings without a valid website, 9 social-profile-only listings, 16 site-capture failures, 13 sites with no detected logo, and 19 rejected candidates.

## Safety decisions

Candidates were not accepted merely because an image existed. The review rejected generic Wix, GoDaddy, and WordPress icons; a loading spinner; a player photo; a broken 404 image; and known identity problems. In particular:

- LDC Talent was excluded because its website field resolves to Cook Stark Management.
- Optimize Sport was excluded because the detected image was a promotional player photo.
- Prep Hockey Advisors and TBC Hockey Advisors were excluded because their listed domains currently present unrelated gambling branding.
- Default platform icons were excluded for Atlas Management Group, Bishop Sports, Blase Management Firm, East Coast Elite Hockey, Groupe Smart Hockey, New Era Player Development, PARAPHE Sports Management, RSA - Rick Sports Agency, Sport Prospects, Swan Hockey, TSA Athletic Consulting, Zenith Hockey Management, and Zero Klub Hockey.
- KB Advising was excluded because Firecrawl detected a loading spinner instead of a logo.
- Monarch Advisory Group was excluded because the detected image returned 404.

The accepted images were copied locally and normalized to PNG for reliable display. Artwork was not recolored, stretched, or replaced. White logo variants use a dark presentation background. `lib/branding/company-logo-catalog.json` records each official website, source page, source image, review date, background choice, and local file hash.

## Files and reproducibility

- Reviewed asset catalog: `lib/branding/company-logo-catalog.json`
- Local assets: `public/company-logos/`
- Shared resolver: `lib/branding/company-logos.ts`
- Collector: `scripts/research/collect-company-logo-branding.mjs`
- Candidate preparation and contact sheets: `scripts/research/prepare-company-logo-candidates.mjs`
- Catalog installer: `scripts/research/install-company-logo-catalog.mjs`
- Raw captures and visual-review sheets: `.firecrawl/logo-branding-20261002/` and `.firecrawl/logo-candidates-20261002/` (ignored research evidence)

## Validation

- Logo unit and integration tests: 9/9 passed.
- TypeScript: passed.
- Lint for the new catalog and research scripts: passed.
- Local browser: confirmed reviewed logos on the Find Advisors grid and on the 369 Sports & Entertainment profile at mobile width.
- Wider logo frames were added to keep horizontal marks legible without stretching square marks.

A broader targeted lint command also included the already in-progress `AdvisorProfile.tsx` and reported its two existing nested-component errors plus two ordinary `<img>` warnings. Those findings are outside this logo catalog change.

## Deployment state

Local workspace only. Nothing was pushed, deployed, uploaded to production storage, or written to a database.
