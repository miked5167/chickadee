# Advisor profile design preview — September 12, 2026

## Status

Implemented locally for review. No commit, push, deployment, migration, enrichment import, or production content write was performed for this design upgrade. The production release remains unchanged.

Local preview: http://127.0.0.1:3001/listings/2112-hockey-agency

The development server uses existing Supabase settings in its process environment and binds to 127.0.0.1. No credentials were added to tracked files. The local environment file itself was not changed; restarting the preview requires supplying the existing connection settings again.

## Direction and implementation

- A company scouting profile for families: company identity against arena navy, one rink-circle accent, quieter white content sections, and existing Barlow Condensed/Manrope typography.
- Services, player fit, fees, and availability have explicit missing-data states. Unknown location does not default to North America. Missing currency is not assumed to mean USD. No synthetic reviews, client counts, biographies, endorsements, or company facts.
- Team biographies expand with native details controls rather than being permanently truncated. Incomplete FAQ entries are omitted.
- Inquiry, direct website/email/phone, owner claim, and review routes remain intact. Existing consent-aware contact tracking is retained. No inquiry/review/claim was submitted during testing.
- Profile save/compare uses the existing shortlist storage. The comparison link includes selected IDs and is available when at least two companies are selected; otherwise guidance invites another selection. Other directory-card appearances remain unchanged by default.
- Displayed source links and last-reviewed dates use actual stored profile fields. Malformed web URLs and invalid dates are not linked/rendered. JSON-LD is retained and escapes less-than characters.
- The profile no longer adds a nested main landmark inside the root layout's main landmark.
- Shared header switches to its compact navigation below 1100px, avoiding the cramped desktop navigation observed on tablets. Its secondary banner label is hidden on smaller tablets.

## Validation

- Full unit suite: 157 passing tests across 13 files, including 16 new profile tests. Profile tests also rerun after the final missing-price copy adjustment.
- Separate TypeScript check: passed. The existing production build configuration skips type validation, so this separate check is important.
- Production build: passed.
- Targeted lint: zero errors; two image-optimization warnings for the existing external-logo/portrait img approach.
- Browser checks with real listings: 1Vision Sports & Entertainment (sparse) and 2112 Hockey Agency (team/contact information).
- Save/compare toggles and two-company comparison table verified in the browser. Temporary shortlist selections were removed afterward.
- Desktop, 390px phone, 768px tablet, and 820px tablet checked. Profile section navigation intentionally scrolls horizontally on narrow screens; the page itself does not overflow horizontally.
- Native biography and FAQ disclosure behavior, partial enrichment, explicit unavailable status, pricing variants, provenance, and unsafe-source handling covered with test fixtures; no enriched fixture data was inserted into the database.

## Next decision

Review the local design, then explicitly approve publication. Research/enrichment is separate work: verify facts and source dates before populating the currently sparse profiles. Historical EliteProspects client counts must not be represented as current counts.

## Follow-up: profile Google Maps locations

Added a Location section and contact-panel shortcut where a usable, sufficiently qualified address or city is available. The company search uses its name plus the recorded address/locality; a separate link opens the recorded address or general area. These are searches, not claimed verified Google Business matches. Country/region-only, placeholder, and ambiguous unqualified locations are omitted. City-only information is explicitly labeled as a general area, never an office or service-area assertion.

Google Maps links work without a key. Neither inspected local nor downloaded production configuration contains a Maps key. Embedded maps are prepared behind `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY`; without that setting no broken iframe or placeholder is shown. Enable Maps Embed API and restrict the dedicated browser key to approved website referrers before configuring it. Maps load only after the visitor clicks the disclosure button; no third-party map request is made on initial profile render. The live embed remains unverified until a real key is configured.

References: https://developers.google.com/maps/documentation/urls/get-started and https://developers.google.com/maps/documentation/embed/embedding-map

Validation: 170 unit tests passed (including 12 map/location tests and a profile integration test); separate TypeScript and targeted lint checks passed; production build passed. Desktop/390px phone location layout checked. The 2112 Hockey Agency link opened its Google Maps business page, with matching street address, website, and phone. No Google ratings, personal review information, or Place IDs were imported. The temporary Google Maps tab was closed. Production remains unchanged.

## Follow-up: official website logos (first reviewed batch)

The numeric `2` placeholder came from `company.name.charAt(0)`, not a ranking. The profile now uses a shared CompanyLogo component with a neutral missing-logo label and an image-error fallback. A small reviewed asset catalog supplies logos only when both the company slug and official website domain match. Explicitly saved logos take precedence; no company database rows were changed. The same resolver feeds directory cards, profile metadata, and business structured data.

The first three logos were checked against freshly captured official website headers on September 12, 2026, downloaded unchanged, and visually reviewed:

| Company | Official source page | Local file | SHA-256 |
| --- | --- | --- | --- |
| 2112 Hockey Agency | https://2112hockeyagency.com/ | public/company-logos/2112-hockey-agency.png | 80414A6816476643249F41A9C897F92E302FAC80CC552F3D3708F3F9A330EC6F |
| 3V Sports Management | https://www.3vsportsmgt.com/ | public/company-logos/3v-sports-management.png | D635D1B063FE2B71D7C554E34DCD12E2118ADBD3B71D1C9305C2A6D845E0231D |
| 4D Hockey Training | https://4dhockey.com/ | public/company-logos/4d-hockey-training.png | B947ECBBA59ACE688F0EA3737D249A52645ACA620E9BA80E013CE75CBF544A66 |

Exact source-image URLs and review dates are in lib/branding/company-logos.ts. Dark backing is used for the light 2112/3V artwork; no artwork was recolored, cropped, or generated. These identify the listed companies and do not imply endorsement.

Earlier research left 188 `ep-*` image files in public plus other individually sourced images. They were not bulk attached: their historical identities and branding still need review against official sources. The legacy scripts/scrape-logos.ts was not run because it prioritizes og:image, generates placeholders, and targets the old advisors data model. 1Vision's cached official site was unavailable; no replacement logo was guessed.

Checks: full suite passed at 178 tests, then the added card integration test passed with all nine logo tests (179 total tests now). Separate TypeScript check passed; targeted lint had no errors and one ordinary img optimization warning. Official 2112 logo visually confirmed in the local browser. No push, deployment, external upload, or database write was performed.

## Follow-up: branded social links

The profile contact panel now displays Instagram, Facebook, and X brand icons from the already-installed react-icons/fa6 package. Colored 36px icon badges sit above plain-text labels, with larger link targets and the existing keyboard focus indicator. Icons are decorative to assistive technology; accessible link names identify the network and new-tab behavior. Existing destinations and safe URL filtering are preserved; missing networks are omitted. No social network SDK, new package, or third-party image request was added.

All 19 profile tests and the separate TypeScript check passed. New tests cover the branded icons, destinations, new-tab safety, and missing/unsafe link handling. The social row was visually checked on the local 2112 profile. Production is unchanged.
