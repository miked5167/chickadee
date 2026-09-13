# Analytics setup — September 13, 2026

The owner requested analytics setup and identified the existing, verified directory account that should access private reports. That account received the first administrator grant through the authenticated database operator. No Auth account was created and no passwords were changed. The initial grant uses the schema's supported `granted_by = NULL` bootstrap case; no fictitious second approver was assigned. Subsequent administrator grants and revocations should identify their real operator and preserve the registry's audit history. This owner-directed bootstrap supersedes the earlier deferred identity decision in the M3 checkpoint.

## Google Analytics

- Account: Mike Dunbar Directory Account (370060438).
- Property: The Hockey Directory (553932046).
- Web stream: The Hockey Directory — Website (15769190608).
- Measurement ID: `G-2EYBTDPHEW`.
- Site: `https://thehockeydirectory.com`.
- Reporting zone/currency: Toronto / CAD.
- Event data retention: 14 months.
- Key event: `generate_lead`, triggered after a successful inquiry submission, counted once per event, with no assigned monetary value.
- Browser-history pageviews disabled in Enhanced Measurement because the application explicitly records route changes. Automatic form and site-search measurements disabled. Scroll, outbound-click, download, and video measurements enabled.
- Google Analytics loads only on public production pages after analytics consent. Revocation disables further measurement. Query strings and fragments are omitted from manual pageview URLs; contact form contents are never sent as event parameters.

## Directory records and reporting

- Consent-aware profile views and website/email/phone clicks are stored in `public.directory_events`.
- Every event has a UUID for retry deduplication, a short-lived anonymous session, hashed IP for rate limiting, and server-assigned environment metadata.
- A 30-minute HttpOnly session cookie groups recent activity. No IP address is stored in plaintext.
- Preview/development events and historical events with no environment label are excluded from live totals and counted separately in reporting diagnostics.
- Six unclassified historical profile views existed before this setup. They were preserved, not presented as verified production traffic.
- `/admin/analytics` and its JSON/CSV endpoints require the existing active-administrator predicate. Other administrator mutations remain disabled.
- Reports offer 7/30/90-day UTC windows, daily activity, company totals, consented sessions, referring hosts, saved non-spam inquiries, and approved reviews. Inquiry/review counts are operational records and do not depend on analytics consent. No misleading lead-to-view conversion percentage is displayed across these different populations.
- Reports page through all database results, avoid a silent 1,000-row cap, return no-store responses, and export spreadsheet-safe CSV without inquiry contents or personal contact details.
- Local server credentials are in ignored `.env.local`. The measurement ID is configured in Vercel Production. Never commit server credentials.

## Verification

Focused tests cover consent/withdrawal, initial consent on a profile, Strict Mode deduplication, cross-tab consent, GA navigation and preview exclusion, administrator denial, JSON/CSV access, rate limiting, database failures, date boundaries, exclusion rules, CSV escaping, and pagination.

`node scripts/analytics/verify-local.mjs` posts disposable events through the actual local endpoint, verifies saved records and a duplicate retry, confirms development labels and URL sanitization, and deletes only its generated test UUIDs. This check passed against the connected Supabase project.

Production deployment and final live verification are recorded below when complete.
