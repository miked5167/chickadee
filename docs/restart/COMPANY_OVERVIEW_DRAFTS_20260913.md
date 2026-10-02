# Company overview drafts — 13 September 2026

## Outcome

All 202 directory records were processed: 156 have local overview drafts and 46 need source or identity review. This pass used existing official website captures, direct HTTP requests, and the Codex web reader. It made zero additional paid Firecrawl calls and zero separate model API calls. Normal Codex usage still applies.

Preview: http://127.0.0.1:3001/research/overviews
Example: http://127.0.0.1:3001/listings/2112-hockey-agency#overview

The review page includes company search, draft/exception filters, the full overview text, source links and profile links.

## Scope and publication

These are editorial drafts, not company-confirmed statements. No overview was written to Supabase or deployed. The earlier Elite Prospects count import is separate and remains in Supabase.

The profile loader reads local drafts only in development. The review route also returns 404 outside development. No fetched website text or draft is served from a production public asset.

Only the overview was populated in each research result. Empty service/team/pricing arrays mean those structured fields were not part of this editorial pass; they do not mean the company lacks those services or information. Existing profile fields remain available.

Drafts are original summaries with source references. Unsupported claims, promotional rankings, guaranteed outcomes, and current numerical client claims were omitted. Brief source material produced shorter summaries; the 150–250-word editorial suggestion was not enforced as a minimum. The 350-word maximum is validated.

## Review files

Local exports, intentionally ignored by git:
- `data/enrichment/company-overview-review-20260913.html`
- `data/enrichment/company-overview-review-20260913.csv`
- `data/enrichment/company-overview-review-20260913.json` — includes all drafts and exceptions.

Research inputs and per-company draft results:
- `.firecrawl/profile-enrichment-20260912/inputs.json`
- `.firecrawl/profile-enrichment-20260912/results/<slug>.json`
- `.firecrawl/overview-editorial-20260913/` — editorial batches, issues, direct-fetch attempts and supplemental official web captures.

The JSON export preserves draft content independently of the per-company results. Keep it with the project’s local backup.

## Exceptions to prioritize

- LDC Talent links to Cook Stark Management, which already has its own record. Confirm identity or duplication.
- P4 Sports Agency’s website announces an acquisition by New Wave Media Corp.
- Prep Hockey Advisors and TBC Hockey Advisors have unrelated gambling/spam content in their saved website captures.
- AMG Sport’s supplied website describes an unrelated motorsports business.
- C20 Hockey’s supplied Facebook URL names Creative Artists Agency.
- HPA Sports Management has a malformed website URL; the corrected domain was not retrievable.
- PCI Hockey’s older contact page points to `pci.hockey`, where company information is available. Confirm/update the directory website before admitting that new domain as profile evidence.
- Other exceptions include absent website URLs, inaccessible social-only pages, unavailable domains, holding pages and configuration errors. A failed fetch is not evidence that a business is closed.

## Implementation

- `scripts/research/write-cached-overviews.mjs` reads source excerpts and writes human-authored draft batches, checking source quotes.
- `scripts/research/fetch-missing-overview-sources.mjs` performs limited direct public-page retrieval without a paid scraper or model.
- `scripts/research/build-overview-review.mjs` validates identity, source domains, source quotes and length, then rebuilds the three exports.
- `app/research/overviews/route.ts` serves the local review HTML only in development.
- `components/listing/AdvisorProfile.tsx` shows the local overview paragraphs and source links ahead of the stored description when a draft is available.

Rebuild the review after edits:

```powershell
node scripts/research/build-overview-review.mjs
```

## Verification

- All 156 draft identities, source URLs, evidence quotes and word limits passed validation.
- TypeScript `npx tsc --noEmit` passed.
- Existing advisor profile suite: 24 tests passed.
- Review HTML: 202 records; filters return 156 drafts and 46 exceptions; company search passed.
- HTTP checks confirmed the expected draft text on 2112 Hockey Agency, Lora Athletes, Clarion Sports Management, Swan Hockey and Zero Klub Hockey.
- Review route returned HTTP 200 with noindex/nofollow headers.
- The review route returned HTTP 404 when invoked in production mode.
- Focused ESLint check found no errors; its unused import warning was corrected.
