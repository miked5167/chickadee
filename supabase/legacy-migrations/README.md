# Quarantined legacy migrations

These five files are preserved historical evidence of the incompatible model in
which `advisors` represented businesses and directory listings. Production uses
`companies` for businesses and `advisors` for individual people linked through
`company_id`.

Nothing in this directory is part of the active Supabase migration chain. Do not
copy, rename, or apply these files through an automated migration runner. They
assume objects that are absent from production, contain business-targeted
`advisor_id` relationships, and include data-changing statements.

The files were moved from `supabase/migrations` without changing their bytes.
`npm run db:validate` verifies these hashes and rejects the same versions if they
reappear in the active migration directory.

| Historical file | SHA-256 |
|---|---|
| `20250104000000_claim_improvements.sql` | `d75ccbad41a3dd118fdcd796a9ee73820b8a4a5d63471e1acaf763c5f5be601d` |
| `20251109000000_add_advisor_profile_fields.sql` | `683e5d708c096eade3ada2590de64a2b7a2d1876677f39ad39815dc2cc0fafdb` |
| `20251110000000_add_pricing_fields.sql` | `5b1d9c0269b7c7198aec3ee376ba713b1080c167c255f130034a66d9e51b630d` |
| `20251110120000_consolidate_pricing_engagement.sql` | `bb08050b57ce97f07c89800c2a0c867a583dc886636f7369a0dd6a3a0372c4a1` |
| `20251115_create_admin_users.sql` | `11c5bb4e7898900b1755a663b88096cc262d5cfe57c1e188308e547c2c2725d6` |

The canonical production-derived definition is the guarded baseline in
`supabase/migrations`. Existing production must eventually adopt that version
only through a separately reviewed fingerprint-and-history procedure that does
not execute the baseline DDL.
