# Elite Prospects client counts

Imported the user-supplied `C:/Users/miked/HockeyDirectory/ep-pilot/results-master.csv` into the Hockey Directory production Supabase project `dqskdrqubqnhdssxpryx` on September 13, 2026 (UTC). Website changes remain local; no deployment was made.

- Database table: `public.company_elite_prospects`, keyed by `company_id`.
- 202 rows matched existing company slugs and names without fuzzy matching.
- 163 exact EP matches, 30 likely matches, 8 missing matches, 1 ambiguous match.
- 193 counts stored, including 10 genuine zeros. The 9 unresolved records have NULL counts.
- Source CSV SHA-256: `38c5ac1b33a43e0992bb102af90ef21ca19114a6fe3f05b7b76c0053aceefe68`.
- Total across supplied counts: 11,112. This is a source-data checksum total, not a claim about unique players across agencies.
- Source capture date was not supplied and is NULL; import time is recorded separately.
- Each row retains the agency name, URL, match status, notes, source filename and hash.
- Public and signed-in users can read these records but cannot write them. Only privileged database imports can update them.

## Display and review

The local listing page reads the count directly from Supabase in the same server query group as company details and reviews. An Elite Prospects section under the company overview shows the count and agency link. Likely matches explicitly show “Possible agency match” and remain unconfirmed. Missing and ambiguous matches show unavailable counts. These counts describe clients listed by Elite Prospects, not lifetime clients served or independently confirmed agency totals.

The user plans to confirm likely matches manually later. A review CSV is saved at `data/enrichment/elite-prospects-20260913/likely-matches-for-review.csv` (30 rows). Do not silently promote these to exact matches.

## Reproduction and validation

Migration `20260913004623_company_elite_prospects.sql` matches the version recorded in Supabase. The current schema fingerprint and derived types include the new table; the original M1–M7 migrations are unchanged.

Generate an atomic SQL import with:

```powershell
node scripts/research/import-elite-prospects-counts.mjs C:/Users/miked/HockeyDirectory/ep-pilot/results-master.csv data/enrichment/elite-prospects-20260913/import.sql
```

The generator validates URLs, counts, duplicate company slugs and duplicate agency identities. SQL checks every company slug/name before writing and verifies every imported count and source before committing. Reimporting an unchanged file preserves import timestamps. Inspect a new file before executing its generated SQL; a changed source replaces measurements for the companies in that file.

Verified: 32 profile/import tests; TypeScript; targeted ESLint (one pre-existing img warning); schema and migration rule checks; live database totals/hash/read-only public privileges; HTTP 200 and expected content on four local profiles (2112 = 57, 3V = 201 with likely label, 369 = 0, Next Level Hockey = unresolved).

Earlier website overview/team/pricing research remains a separate development-only preview and has not been imported by this count update.
