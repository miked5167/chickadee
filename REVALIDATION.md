# On-Demand Cache Revalidation

This document explains how to trigger cache revalidation after data mutations in the Hockey Directory application.

## Overview

The application uses Next.js Incremental Static Regeneration (ISR) to cache pages for better performance. When data changes (e.g., advisor updates their profile, new review is posted), we need to revalidate the cache to show fresh content.

## Architecture

### 1. API Route: `/api/revalidate`
- **Location**: `app/api/revalidate/route.ts`
- **Purpose**: Accepts POST requests to revalidate specific paths
- **Security**: Protected by `REVALIDATION_SECRET` environment variable

### 2. Utility Functions: `lib/revalidation.ts`
- `revalidateCache()` - Client-side helper
- `revalidateCacheServer()` - Server Action helper

## Setup

### Environment Variables

Add to your `.env.local`:

```bash
# Secret token for revalidation API (generate a strong random string)
REVALIDATION_SECRET=your-secret-token-here

# Public version for client-side calls (same value as above)
NEXT_PUBLIC_REVALIDATION_SECRET=your-secret-token-here

# Your app URL (required for server-side revalidation)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # In development
# NEXT_PUBLIC_APP_URL=https://thehockeydirectory.com  # In production
```

**Generate a secret token:**
```bash
# On macOS/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

## Usage Examples

### Direct Revalidation in API Routes (Recommended)

This is the simplest and most efficient approach - call `revalidatePath()` directly:

```typescript
import { revalidatePath } from 'next/cache'

export async function PATCH(request: NextRequest) {
  // ... your update logic ...

  const { data: updatedAdvisor, error } = await supabase
    .from('advisors')
    .update(updateData)
    .eq('id', advisorId)
    .select('slug')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Revalidate cache after successful update
  try {
    revalidatePath(`/listings/${updatedAdvisor.slug}`)  // Specific advisor page
    revalidatePath('/listings')                          // Listings browse page
    revalidatePath('/')                                  // Home page
  } catch (err) {
    console.error('Failed to revalidate:', err)
    // Don't fail the request if revalidation fails
  }

  return NextResponse.json({ success: true, advisor: updatedAdvisor })
}
```

### Using the Utility Function (Client-Side)

For client-side mutations (e.g., from a form submission):

```typescript
import { revalidateCache } from '@/lib/revalidation'

async function handleProfileUpdate(formData: FormData) {
  // Update the profile
  const response = await fetch('/api/advisor/profile', {
    method: 'PATCH',
    body: JSON.stringify(formData)
  })

  if (response.ok) {
    const { advisor } = await response.json()

    // Trigger cache revalidation
    await revalidateCache({
      advisorSlug: advisor.slug
    })

    toast.success('Profile updated!')
  }
}
```

### Using Server Actions

For Server Actions (e.g., form actions):

```typescript
'use server'

import { revalidateCacheServer } from '@/lib/revalidation'

export async function updateAdvisorProfile(formData: FormData) {
  // ... update logic ...

  const advisorSlug = formData.get('slug')

  // Revalidate cache
  await revalidateCacheServer({
    advisorSlug: advisorSlug as string
  })

  return { success: true }
}
```

## Common Scenarios

### 1. Advisor Updates Their Profile

**Where**: `app/api/advisor/profile/route.ts`

```typescript
// After successful update
revalidatePath(`/listings/${advisor.slug}`)
revalidatePath('/listings')
revalidatePath('/')
```

### 2. New Review Posted

**Where**: `app/api/reviews/route.ts`

```typescript
// After review is created
revalidatePath(`/listings/${advisorSlug}`)
revalidatePath('/')  // Home page shows review counts
```

### 3. Admin Approves/Publishes Advisor

**Where**: `app/api/admin/listings/[id]/route.ts`

```typescript
// After approval
revalidatePath(`/listings/${advisor.slug}`)
revalidatePath('/listings')  // Listings page shows new advisor
revalidatePath('/')           // May appear in featured section
```

### 4. Advisor Claims Listing

**Where**: `app/api/advisors/claim/route.ts`

```typescript
// After claim is completed
revalidatePath(`/listings/${advisor.slug}`)
revalidatePath('/listings')
```

### 5. Multiple Advisors Updated

**Where**: Bulk operations

```typescript
// Revalidate multiple advisor pages
for (const advisor of updatedAdvisors) {
  revalidatePath(`/listings/${advisor.slug}`)
}
revalidatePath('/listings')
revalidatePath('/')
```

## API Reference

### POST /api/revalidate

**Headers:**
```
Authorization: Bearer <REVALIDATION_SECRET>
Content-Type: application/json
```

**Request Body:**
```typescript
{
  advisorSlug?: string,    // Slug of advisor to revalidate
  paths?: string[]         // Additional paths to revalidate
}
```

**Response:**
```typescript
{
  success: boolean,
  message: string,
  paths: string[],         // All paths that were revalidated
  results: Array<{
    path: string,
    success: boolean,
    error?: string
  }>,
  stats: {
    successful: number,
    failed: number,
    total: number
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/revalidate \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "advisorSlug": "john-doe-hockey",
    "paths": ["/listings?state=CA"]
  }'
```

## Default Behavior

When you call revalidation with an `advisorSlug`, the following paths are **automatically** revalidated:

1. `/listings/{slug}` - The specific advisor page
2. `/listings` - The main listings browse page
3. `/` - The home page (featured advisors)

You can provide additional `paths` to revalidate beyond these defaults.

## Best Practices

1. ✅ **Do** call revalidation after successful mutations
2. ✅ **Do** wrap revalidation in try-catch to prevent failures from breaking user flow
3. ✅ **Do** log revalidation errors for monitoring
4. ❌ **Don't** fail the entire request if revalidation fails
5. ❌ **Don't** over-revalidate (only revalidate affected paths)
6. ✅ **Do** use direct `revalidatePath()` calls in API routes (simpler than HTTP calls)

## Monitoring

All revalidation operations are logged to the console:

```
✓ Successfully revalidated /listings/john-doe-hockey
✓ Successfully revalidated /listings
✓ Successfully revalidated /
```

Failures are also logged:
```
✗ Failed to revalidate /listings/john-doe-hockey: Error message
```

## Troubleshooting

### Revalidation not working?

1. Check that `REVALIDATION_SECRET` is set in environment variables
2. Verify the secret matches in both `.env.local` and Vercel dashboard
3. Check console logs for revalidation errors
4. Try accessing the page with `?revalidate=1` query parameter (Next.js debug feature)
5. Check Vercel deployment logs for errors

### Pages still showing old content?

1. ISR caching has a 1-hour default - revalidation should update it immediately
2. Check browser cache - try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
3. Check CDN cache - Vercel Edge Network may have cached responses
4. Verify revalidation was actually called (check logs)

## Future Enhancements

Possible improvements to consider:

1. **Supabase Webhooks**: Automatically trigger revalidation on database changes
2. **Batch Revalidation**: Queue multiple revalidations and process in batches
3. **Selective Revalidation**: More granular control over which paths to revalidate
4. **Regional Pages**: Revalidate state/city-specific listing pages
5. **Analytics**: Track revalidation frequency and performance

## Related Files

- `app/api/revalidate/route.ts` - Revalidation API endpoint
- `lib/revalidation.ts` - Helper utilities
- `app/api/advisor/profile/route.ts` - Example implementation
- `app/(public)/listings/[slug]/page.tsx` - ISR configuration (revalidate = 3600)
