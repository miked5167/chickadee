# M3 Application Authorization Audit

**Audit date:** 2026-07-19  
**Scope:** Current administrator authentication/authorization helpers, layouts, API routes, privileged database clients, direct database calls, and quarantined legacy administrator SQL  
**Application changes made:** None

## Executive finding

The current application has one production-shaped administrator check in `lib/supabase/auth.ts`, but administrator API authorization is inconsistent. The outer administrator route-group layout calls `isAdmin()`, so rendered administrator pages are centrally gated. API routes do not inherit layout authorization: 11 of 19 `/api/admin/**` route modules check only that a user is authenticated. Four of those modules then create a service-role client and therefore convert ordinary authentication into unrestricted database access.

M3 makes the existing `isAdmin()` table lookup work safely without deploying application code. It does not make the 11 authentication-only APIs safe. No coordinated application release is authorized by M3, so the administrator UI/APIs must remain unavailable until every administrator API performs the explicit predicate before any privileged client or query is created.

## Authentication and layout inventory

| Path | Current behavior | M3 compatibility / issue |
|---|---|---|
| `lib/supabase/auth.ts` | Gets the current user, optionally accepts `ADMIN_USER_EMAILS` only when `NODE_ENV=development`, then queries `admin_users` for `id`, `user_id`, and active state. Errors fail closed. | M3 deliberately includes `id`, `user_id`, and `is_active`; own-row SELECT RLS makes this lookup non-recursive. A later app release should call `rpc('is_admin')` so authorization has one database predicate. |
| `lib/supabase/server.ts` | `createClient()` uses the request session. `createAdminClient()` uses the service-role key and bypasses RLS. | Service-role creation must occur only after explicit administrator authorization. M3 does not make service-role use itself an authorization decision. |
| `app/(admin)/layout.tsx` | Server layout calls `isAdmin()` and redirects on false. | Compatible with M3 and fail-closed. |
| `app/(admin)/admin/layout.tsx` | Client layout checks authentication only and labels any signed-in user “Administrator.” | Parent server layout currently supplies the real page guard, but the nested layout is not independently authoritative and should not be copied into APIs. |
| Middleware / proxy | No `middleware.*` or `proxy.*` file exists. | There is no edge-level administrator authorization. Route handlers must authorize themselves. |

The development email fallback is not a production grant source, but deployments must preserve `NODE_ENV=production`. Email-based administrator identity is deliberately absent from M3.

## Administrator API route inventory

| Route module | Methods | Current authorization | Privileged client / queried objects |
|---|---|---|---|
| `app/api/admin/analytics/export/route.ts` | GET | Authentication only | Service role; click tracking, leads, listing views, reviews |
| `app/api/admin/analytics/route.ts` | GET | Authentication only | Service role; advisors plus missing analytics objects |
| `app/api/admin/blog/analytics/route.ts` | GET | Authentication only | Session client; missing blog objects |
| `app/api/admin/blog/categories/[id]/route.ts` | PATCH, DELETE | `isAdmin()` | Session client; missing blog objects |
| `app/api/admin/blog/categories/route.ts` | GET, POST | `isAdmin()` | Session client; missing blog objects |
| `app/api/admin/blog/posts/[id]/route.ts` | GET, PATCH, DELETE | `isAdmin()` | Session client; missing blog objects |
| `app/api/admin/blog/posts/route.ts` | GET, POST | `isAdmin()` | Session client; missing blog objects |
| `app/api/admin/blog/tags/[id]/route.ts` | PATCH, DELETE | `isAdmin()` | Session client; missing blog objects |
| `app/api/admin/blog/tags/route.ts` | GET, POST | `isAdmin()` | Session client; missing blog objects |
| `app/api/admin/claims/[id]/route.ts` | PATCH | Authentication only | Session client; legacy claim/advisor contract |
| `app/api/admin/claims/route.ts` | GET | Authentication only | Session client; legacy claim contract |
| `app/api/admin/csv/import/route.ts` | POST | `isAdmin()` | Indirect service-role use in CSV utility; legacy advisor/import objects |
| `app/api/admin/csv/validate/route.ts` | POST | `isAdmin()` | No direct Supabase client; legacy validation contract |
| `app/api/admin/dashboard/route.ts` | GET | Authentication only | Session client; legacy/missing aggregate objects |
| `app/api/admin/leads/route.ts` | GET | Authentication only | Session client; missing leads |
| `app/api/admin/listings/[id]/route.ts` | GET, PATCH, DELETE | Authentication only | Service role; incorrectly treats advisors as businesses |
| `app/api/admin/listings/route.ts` | POST, GET | Authentication only | Service role; incorrectly treats advisors as businesses |
| `app/api/admin/reviews/[id]/route.ts` | PATCH, DELETE | Authentication only | Session client; missing reviews |
| `app/api/admin/reviews/route.ts` | GET | Authentication only | Session client; missing reviews |

The 11 authentication-only modules are a release blocker. The four authentication-only modules using the service role are the highest-severity cases. The blog, analytics, lead, review, and import routes also target objects absent from the production contract and remain feature-blocked independently of M3.

## Legacy administrator migration assessment

The quarantined `20251115_create_admin_users.sql` must never be replayed:

- its four RLS policies recursively query `admin_users`, which can raise recursive-policy errors;
- it stores a redundant administrator email and invites PII lookup through `auth.users`;
- broad authenticated INSERT/UPDATE/DELETE policies allow self-modifying grant records;
- `IF NOT EXISTS` makes partial or drifted application non-deterministic;
- the timestamp function lacks a fixed search path and duplicates the shared trigger function;
- the commented bootstrap procedure asks operators to find an identity by email and manually insert it;
- ownership and execute/table grants are not explicitly constrained.

M3 uses none of that SQL and preserves it only as immutable archaeological evidence.

## Coordinated application release required later

Before administrator features are enabled:

1. Change `lib/supabase/auth.ts` to use `rpc('is_admin')` and retain fail-closed error handling.
2. Require that predicate in all 19 administrator API modules before privileged client creation or database access.
3. Add route-level tests proving anonymous, non-admin, inactive-admin, and active-admin behavior; service-role success must not stand in for user authorization.
4. Remove or tightly constrain the development email fallback if production build controls cannot prove it is unreachable.
5. Keep missing-schema and legacy-entity routes disabled until their own company-centric migrations are approved.

No runtime file was changed for M3.

## Application validation result

- `npm exec tsc -- --noEmit` passes with the derived M3 types present.
- `next build` compiles successfully, then stops during page-data collection because the local shell intentionally has no Supabase URL/key. No credential was added to make the build continue.
- Repository-wide ESLint reports 226 existing errors and 157 warnings across legacy application/pages/scripts. The failures predate and are outside the definitions-only M3 scope; the M3 database artifacts do not introduce an application lint failure.
- The lockfile-installed dependency audit reports existing transitive vulnerabilities. No automatic dependency upgrade or audit fix was run because that would be unrelated release scope.
