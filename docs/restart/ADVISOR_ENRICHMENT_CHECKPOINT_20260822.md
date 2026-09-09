# Advisor enrichment checkpoint — 2026-08-22

## Outcome

The local directory list contains 202 unique advisor listings. Read-only research was completed with Firecrawl against the supplied advisor websites, public Google Maps business pages, and exact-name fallback searches for unavailable websites.

No production database, deployment, Git remote, or external account was changed.

## Official website research

- 174 official homepages were captured.
- 142 sites exposed useful About, Services, Team, Contact, Clients, or similar internal pages.
- 433 distinct follow-up page captures were included in the consolidated dataset.
- Clean fields include website summaries, emails, phone numbers, social links, page headings, address candidates, and discovered internal-page URLs.
- 115 sites exposed at least one email address.
- 84 sites exposed at least one phone number.
- 99 sites exposed at least one social link.
- 56 sites contained address-like text. These are evidence candidates, not automatically accepted business addresses.
- The remaining 28 listings were searched by exact name: 17 had unavailable or blocked known links and 11 had no usable website value. Search produced at least one candidate for 27 of them, but no candidate was automatically substituted for an official site.

Raw captures are stored under `.firecrawl/advisor-enrichment-20260822/` and are deliberately ignored by Git. Website content was treated as untrusted source material.

## Public Google business findings

- 202 public Google Maps searches were captured.
- 57 business matches were confirmed by the supplied official website domain.
- 3 additional matches were classified as possible, not confirmed.
- 29 matches exposed a rating.
- 8 exposed a public review count, including explicit zero-review results.
- 39 exposed a full address.
- 44 exposed a phone number.
- 38 exposed business hours.

Google's limited public view did not consistently expose review text or numeric review counts. No reviewer identity, quote, or review theme was invented, and Google findings were not mixed into the directory's own review records.

## Address decision

The directory already contains 58 street addresses. The local listing profile now displays the saved street address together with city, state/province, and country. Existing address schema remains available to search engines as `PostalAddress` data.

No new address passed the rule requiring confirmation by both the matched Google business and the official website with no identity conflict. Therefore, no new address was inserted automatically.

The three candidates needing manual review are:

| Listing | Google candidate | Reason it was not published |
|---|---|---|
| 3G Sports | 1199 W Hastings St #1000, Vancouver, BC V6E 3T5, Canada | Conflicts with the directory's existing postal code. |
| APX Advisors | 950 Mendota Heights Rd, Mendota Heights, MN 55120 | Google uses the name “APX Hockey” and shows a different phone number. |
| MAP Hockey Advisors | 1850 105th Ave NE, Blaine, MN 55449 | Google uses the name “MAP Hockey”; the result appears to describe a training center. |

## Elite Prospects

- 167 of the 202 directory names have an exact normalized match in the repository's Elite Prospects agency snapshot.
- The snapshot entered the repository on 2025-11-11, so every player count is labeled historical with that date.
- A current public agency-page check redirects to an Elite Prospects login page.
- No saved cookie, private session, or authenticated portal was used.

Current counts require the user's explicit approval to use an authorized Elite Prospects account. Until then, the historical counts must not be described as live.

## Clean outputs

- `advisor-enrichment.csv` — all 202 listings and all consolidated fields.
- `advisor-enrichment.json` — the same records with nested evidence fields.
- `website-research.csv` — official-site details and replacement-site search candidates.
- `google-business-findings.csv` — the 60 confirmed or possible Google business findings.
- `address-review.csv` — 58 existing addresses plus the 3 candidates requiring review.
- `elite-prospects-historical-counts.csv` — 167 historical exact-name matches and player counts.
- `summary.json` — final coverage totals and limitations.

All clean outputs are in `data/enrichment/advisor-research-20260822/`.

## Validation

- 202 records and 202 unique listing names.
- TypeScript passed.
- 125 unit tests passed.
- Focused lint passed with zero errors. Two existing `<img>` optimization warnings remain on the listing profile page.
- Research scripts passed JavaScript syntax checks.
- `.firecrawl/` is confirmed ignored by Git.

## Safest next decisions

1. Review the three disputed Google address candidates and accept none unless the advisor or another authoritative source confirms the office location.
2. Decide whether to approve authenticated, read-only Elite Prospects research for current player counts.
3. Review replacement-website search candidates before changing any listing URL.
4. Keep the enrichment local until the directory changes are reviewed as part of the broader restart branch.
