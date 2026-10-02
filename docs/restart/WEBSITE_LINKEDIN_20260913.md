# Website LinkedIn links — 13 September 2026

Added LinkedIn destinations to 41 local profile previews: 24 company links and 71 named team-member links.

Company links appear beside Instagram, Facebook and X in the contact sidebar. Personal profiles appear with the named person under “People behind the company.” Existing staff biographies and titles are preserved when names match.

The source is the company’s saved official website text. Each link retains its source URL and original linked URL as evidence. Personal names were checked against visible text from the same official website. This does not independently verify that every LinkedIn destination is still active.

115 unique candidate links were found. Twenty were excluded or deduplicated, including articles, Wix/template links, external partners and unclear associations. The 98 Hockey Management capture contains Monarch branding; its LinkedIn link was not attached to the 98 listing. LDC Talent’s identity issue remains excluded. A Gryphon profile link reused under multiple names was left out.

Owner-only LinkedIn admin links were reduced to their public company IDs; profile overlays were reduced to the same public profile ID. Tracking parameters were removed, HTTP links upgraded to HTTPS, and LinkedIn locale subdomains normalized. Top Draft Hockey and Top Hockey Prospect link to business-named /in/ profiles from their own social menus; these remain business social links.

These additions are local development drafts only. No Supabase write, paid scraping call, or deployment was performed.

## Files

- `data/enrichment/linkedin-review-20260913.json` — added links, sources and skipped candidates.
- `.firecrawl/overview-editorial-20260913/linkedin-candidates.json` — source inventory.
- `.firecrawl/overview-editorial-20260913/linkedin-selections.json` — reviewed selections.
- `scripts/research/find-website-linkedin.mjs` — offline candidate discovery.
- `scripts/research/add-website-linkedin.mjs` — applies reviewed selections to existing research drafts.
- `lib/research/company-research.ts` — destination normalization and research types.
- `lib/research/company-research.server.ts` — first-party evidence checks.
- `components/listing/AdvisorProfile.tsx` — company and personal link presentation.

The overview JSON review bundle was rebuilt and includes the updated draft records. Regenerating an overview from an earlier editorial batch can overwrite its LinkedIn additions; rerun the LinkedIn application script afterward.

## Verification

35 focused tests passed, including public/admin URL normalization, unsafe destinations, legacy personal profiles, and company/personal link placement. TypeScript passed. All research source checks passed. Live HTTP/DOM checks confirmed expected links on six profiles: 2112 Hockey Agency, 3G Sports, Advancement Hockey Advising, APX Advisors, Potente Sports and Vaculik Hockey.

Preview example: http://127.0.0.1:3001/listings/2112-hockey-agency#team
