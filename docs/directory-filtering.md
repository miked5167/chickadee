# Directory filtering and tag review

## Current behavior

`/listings` and `GET /api/advisors` share `lib/tags/directory-search.ts`.
The page renders the first results, count, filter form, chips and pagination
on the server. Native GET forms and links work without JavaScript. The mobile
fallback uses a native disclosure; with JavaScript it opens a Radix slide-up
dialog with a fixed Apply button, focus containment, Escape and focus restoration.
Draft filters do not change the URL until Apply. Count requests are debounced
and aborted on replacement; Apply is disabled while counting or on failure.

Each selected group matches **any** selected option; separate groups must
**all** match. Example: AA + AAA and NCAA finds NCAA advisors who serve either
AA or AAA. Counts apply all other groups but omit the option's own group so
visitors can select additional alternatives. Counts cover all matches before
pagination. Selected zero-result options remain removable; other zero options
are disabled, with unused province/state options hidden. Parent regions include
their assigned children. Office country and Regions served remain independent.

Shareable state uses repeated stable tag IDs:

```text
/listings?tag=pathways%3Ancaa&tag=player_level%3Aaaa&sort=ep_clients&page=1
```

Search, country/state, availability, coordinates/radius, sort and pagination
also persist in the URL. Changing a filter resets pagination. Removing a chip
preserves the other filters; Clear all preserves sort and page size. Browser
back/forward restores applied selections. Legacy service/pathway/level/language
links resolve exact catalog labels or slugs; unmatched values show no results.
The old Specialty/free-text filter is replaced by Services and Pathways;
existing free-text profile data is preserved but is not treated as an approved tag.
Prices remain optional advisor data and are hidden from visitor filters.

Elite Prospects sorting uses stored sourced counts passing the existing source
validation for exact/likely matches. Known zero is distinct from unknown;
unknown and unsafe-source counts sort last. No advisor-declared total is used.
No live scraping occurs during search.

At the current directory size, full candidates are read for complete counts,
then enriched in bounded batches so joined tag assignments fit the API row cap.
Before growth beyond 1,000 listings, replace the candidate read with paged reads
or a database filtering/facet function. Optional enrichment failures preserve
listing availability, but cannot supply missing tag/count data. Missing catalog
tables show starter labels with zero tag counts until the migration is released.

## Local review

`/demo/tagging` exists only in local development without `VERCEL_ENV`. Its
fictional listings demonstrate populated filters and the real tag picker
without database writes. The matching `demo=tags` API switch has the same guard;
production requests cannot obtain demo records. Public-data preview mode uses
the source website's catalog and listings together and never mixes local tag
assignments into foreign listing records.

## Backfill review

Run from the repository root:

```text
npx tsx scripts/propose-directory-tags.ts --output data/enrichment/directory-tag-review --concurrency 4
```

Alternatively pass `--input <public-listing-export.json>`; `--skip-websites`
uses only that listing text. The script reads the public directory API and
public advisor homepages, checks public DNS/IP destinations and redirects,
and caps page sizes and request times. Website failures are recorded for
manual review. It produces:

- `listing-input.json`: the public records reviewed.
- `tag-proposals.csv`: one row per listing, proposed IDs, core count, missing
  selection evidence, website status, pending review status and blank approval fields.
- `tag-evidence.csv`: source URL and excerpt for each proposed tag.

Proposals are heuristic and all require human review. Text mentioning a league
can describe history rather than current service; read the source in context.
No price or language is inferred from a website's language. Ages require
explicit age text; regions require explicit coverage text, not an address.
No tags are invented just to meet the 3–5 core requirement. CSV cells are
escaped and spreadsheet-formula prefixes neutralized.

Review each row, fill `approved_tag_ids` with active catalog IDs, and record
decisions in `review_status` and `review_notes`. Any approved selection needs
3–5 Services/Pathways tags, including a Service. Supplemental selections are
optional. The script has **no database client, write or import mode** and rejects
write-related flags. Database application must be a separate reviewed step
after the user approves the CSV; generating or editing proposals is not approval.

Release the additive tag migration, seed and atomic claim-tag migration through
the repository's existing database release checks before deploying the app.
Repository commits and previewing this feature do not execute that release.
