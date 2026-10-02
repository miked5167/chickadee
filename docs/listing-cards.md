# Balanced listing cards

The shared `AdvisorCard` presents directory results, featured listings and saved
listings with a consistent logo space, readable company heading, location,
single business-verification label, two-line summary and aligned actions.
Missing or failed logos fall back to company initials. The existing reviewed
logo selection rules are preserved.

## Supporting data

`enrichListingCards` batches reads for the displayed company IDs through the
existing request-scoped Supabase client. It reads profile summaries and player
fit, active approved tag assignments and stored Elite Prospects measurements.
Supporting queries are independent; an unavailable table or rejected query does
not discard the companies or their other available information.

Cards show up to five active Services/Pathways tags in catalog order, using
filled service chips and outlined pathway chips. Player levels and ages appear
separately. Approved player-fit tags take precedence over existing profile
fields. Free-text specialties and services are not presented as approved tags.
Missing fields are omitted; no fees, tags, descriptions or client counts are
inferred from company names or websites.

The Elite Prospects strip uses the profile page's existing count/source rules.
It displays the stored count, including zero, a safe source link and the capture
month/year when available. A likely match is labelled as possible. Unmatched,
ambiguous, invalid or absent measurements are omitted.

The current public-feed preview remains isolated from local database reads.
It can display additional fields when supplied by the feed, but older feeds
produce sparse cards. No production data import or database write is part of
this card update.

## Validation

```text
npx vitest run tests/unit/listing-card.test.ts tests/unit/listing-card-data.test.ts tests/unit/company-logo.test.ts tests/unit/advisor-profile.test.ts
```

The focused suite covers approved-tag selection, batched company association,
missing optional tables, zero versus absent counts, source safety and dates,
summary fallbacks, logo failures, saved-listing behavior, verification labels
and card content in server-rendered markup.

Browser checks cover directory and saved-listing cards, keyboard saving,
desktop footer alignment, long company names, populated and sparse fixtures,
48-pixel actions, and layouts at 320- and 375-pixel mobile widths. Fixture
agencies and counts are illustrative, not listing data.

The API's card enrichment is committed independently of the pre-existing search
refactor. The working server-rendered search component also calls the same
enrichment helper; that component remains with the existing uncommitted search
work. Include that work when preparing a release of the current workspace.
