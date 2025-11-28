# Admin Authentication Setup Guide

This guide explains how to set up and manage admin users for The Hockey Directory.

## Overview

Admin authentication uses two methods:
1. **Development**: Environment variable (`ADMIN_USER_EMAILS`)
2. **Production**: Database table (`admin_users`)

---

## Development Setup

For local development, you can use environment variables to grant admin access.

### Step 1: Add Your Email to .env.local

```bash
# In your .env.local file, add:
ADMIN_USER_EMAILS=your-email@example.com
```

**For multiple admins (comma-separated):**
```bash
ADMIN_USER_EMAILS=admin1@example.com,admin2@example.com,dev@example.com
```

### Step 2: Sign In

1. Start your development server: `npm run dev`
2. Navigate to http://localhost:3000
3. Sign in with Google OAuth using the email you added above
4. You now have admin access!

### Step 3: Verify Admin Access

Navigate to http://localhost:3000/admin/dashboard

If you see the admin dashboard, you're all set! ✅

---

## Production Setup

For production, admins are managed via the `admin_users` table in Supabase.

### Step 1: Run the Migration

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Run the migration file: `supabase/migrations/20251115_create_admin_users.sql`

This creates the `admin_users` table with proper RLS policies.

### Step 2: Bootstrap Your First Admin

⚠️ **IMPORTANT:** You must manually add your first admin user.

#### Find Your User ID

1. Go to Supabase → **SQL Editor**
2. Run this query:

```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'your-email@example.com';
```

3. Copy the `id` value (it's a UUID)

#### Insert Your Admin Record

```sql
INSERT INTO public.admin_users (user_id, email, notes)
VALUES (
  'YOUR_USER_ID_FROM_ABOVE',
  'your-email@example.com',
  'Bootstrap admin - first user created during setup'
);
```

### Step 3: Verify Production Admin Access

1. Deploy your application to production
2. Sign in with the email you added
3. Navigate to /admin/dashboard
4. You should have admin access! ✅

---

## Managing Admins (After Bootstrap)

Once you have your first admin, you can add more admins through the application.

### Add a New Admin

1. Create an API route at `/app/api/admin/users/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Check if current user is admin
  const userIsAdmin = await isAdmin()
  if (!userIsAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { user_id, email, notes } = await request.json()

  const supabase = await createClient()
  const currentUser = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      user_id,
      email,
      notes,
      granted_by: currentUser.data.user?.id
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
```

2. Create an admin management UI page (future enhancement)

### Deactivate an Admin

```sql
UPDATE public.admin_users
SET is_active = false
WHERE email = 'user-to-deactivate@example.com';
```

### Reactivate an Admin

```sql
UPDATE public.admin_users
SET is_active = true
WHERE email = 'user-to-reactivate@example.com';
```

### View All Admins

```sql
SELECT
  au.email,
  au.is_active,
  au.granted_at,
  au.notes,
  u.email as granted_by_email
FROM public.admin_users au
LEFT JOIN auth.users u ON u.id = au.granted_by
ORDER BY au.granted_at DESC;
```

---

## Security Considerations

### Development vs Production

- **Development (`NODE_ENV=development`)**:
  - Checks `ADMIN_USER_EMAILS` first
  - Falls back to database if env var not set
  - Logs admin authentication to console

- **Production (`NODE_ENV=production`)**:
  - Only checks `admin_users` table
  - No environment variable fallback
  - No console logging

### Row Level Security (RLS)

The `admin_users` table has RLS enabled with these policies:

- ✅ Only active admins can view admin_users records
- ✅ Only active admins can create new admins
- ✅ Only active admins can update admin records
- ✅ Only active admins can delete admin records

This means:
- Non-admins **cannot** see who the admins are
- Non-admins **cannot** make themselves admins
- Inactive admins **cannot** perform admin actions

### Best Practices

1. **Use Strong Email Verification**: Ensure users verify their email before granting admin access
2. **Document Why**: Always add notes when creating admins
3. **Regular Audits**: Periodically review the admin_users table
4. **Least Privilege**: Don't grant admin to users who don't need it
5. **Deactivate Instead of Delete**: Deactivate admins rather than deleting for audit trail
6. **Monitor Admin Actions**: Consider implementing audit logging for admin operations

---

## Troubleshooting

### "Unauthorized" when accessing /admin routes

**Check:**
1. Are you signed in?
2. Is your email in `ADMIN_USER_EMAILS` (dev) or `admin_users` table (prod)?
3. Is your admin record `is_active = true`?
4. Did you run the migration to create the `admin_users` table?

**Debug:**
```typescript
// Add this to any admin route to see what's happening
const user = await getCurrentUser()
const admin = await isAdmin()
console.log('User:', user?.email)
console.log('Is Admin:', admin)
```

### Migration fails with "table already exists"

The migration uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times.

If you need to reset:
```sql
DROP TABLE IF EXISTS public.admin_users CASCADE;
-- Then run the migration again
```

### Can't bootstrap first admin (RLS blocking)

The bootstrap INSERT should work because it's run in the Supabase SQL Editor, which bypasses RLS.

If you get an error, temporarily disable RLS:
```sql
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Insert your admin
INSERT INTO public.admin_users ...

-- Re-enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
```

---

## Quick Reference

### Environment Variable
```bash
# .env.local
ADMIN_USER_EMAILS=admin@example.com,dev@example.com
```

### Bootstrap First Admin
```sql
-- 1. Find user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- 2. Insert admin
INSERT INTO public.admin_users (user_id, email, notes)
VALUES ('user-id-from-step-1', 'your-email@example.com', 'Bootstrap admin');
```

### Check If User Is Admin
```sql
SELECT * FROM public.admin_users
WHERE user_id = 'user-id-here'
AND is_active = true;
```

---

## Related Files

- **Migration**: `supabase/migrations/20251115_create_admin_users.sql`
- **Auth Functions**: `lib/supabase/auth.ts`
- **Environment Example**: `.env.example`
- **Code Improvements**: `CODE_IMPROVEMENTS.md` (Task #1)

---

**Last Updated:** November 15, 2025
