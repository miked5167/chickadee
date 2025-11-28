# Admin Authentication Testing Guide

## Quick Test Steps (Development)

### Step 1: Add Your Email to .env.local

Add this line to your `.env.local` file (after the JWT_SECRET line):

```bash
# Admin Authentication (Development Only)
ADMIN_USER_EMAILS=your-google-email@gmail.com
```

Replace `your-google-email@gmail.com` with the email you use to sign in with Google OAuth.

### Step 2: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 3: Test Admin Access

1. **Open your browser**: http://localhost:3000
2. **Sign in** with Google using the email you added
3. **Navigate to admin dashboard**: http://localhost:3000/admin/dashboard

### Step 4: Verify Results

✅ **SUCCESS**: You see the admin dashboard with metrics and data

❌ **FAILURE**: You see "Unauthorized" or get redirected to /login

## Troubleshooting

### Issue: "Unauthorized" when accessing /admin

**Check:**
1. Did you add your email to .env.local?
2. Did you restart the dev server after adding the email?
3. Are you signed in with the same email?
4. Is there a typo in the email address?

**Debug:**
Add this temporarily to `app/(admin)/admin/dashboard/page.tsx`:

```typescript
import { getCurrentUser, isAdmin } from '@/lib/supabase/auth'

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()
  const admin = await isAdmin()

  console.log('Current User:', user?.email)
  console.log('Is Admin:', admin)
  console.log('ADMIN_USER_EMAILS:', process.env.ADMIN_USER_EMAILS)

  // Rest of your code...
}
```

Check the terminal console for the output.

### Issue: Multiple Admins Not Working

Make sure emails are **comma-separated** with no extra spaces:

```bash
# ✅ CORRECT
ADMIN_USER_EMAILS=admin1@gmail.com,admin2@gmail.com,dev@gmail.com

# ❌ WRONG (spaces after commas)
ADMIN_USER_EMAILS=admin1@gmail.com, admin2@gmail.com, dev@gmail.com
```

### Issue: Still Getting Unauthorized After Adding Email

1. **Check the console** - Look for "[DEV] User authenticated as admin via ADMIN_USER_EMAILS"
2. **Verify NODE_ENV** - Should be "development"
3. **Clear cookies** - Sign out and sign back in
4. **Check .env.local** - Make sure there are no syntax errors

## Testing Production Mode (Optional)

To test the database-based admin authentication:

### Step 1: Run the Migration

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `supabase/migrations/20251115_create_admin_users.sql`
3. Click "Run"

### Step 2: Find Your User ID

Run this query in Supabase SQL Editor:

```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'your-google-email@gmail.com';
```

Copy the `id` value.

### Step 3: Add Yourself as Admin

```sql
INSERT INTO public.admin_users (user_id, email, notes)
VALUES (
  'paste-user-id-here',
  'your-google-email@gmail.com',
  'Testing admin authentication - bootstrap admin'
);
```

### Step 4: Test with Production Check

1. Comment out or remove `ADMIN_USER_EMAILS` from `.env.local`
2. Restart dev server
3. Navigate to http://localhost:3000/admin/dashboard
4. Should still have admin access (now via database)

## Success Criteria

- ✅ Can access /admin/dashboard when email is in ADMIN_USER_EMAILS
- ✅ Cannot access /admin/dashboard when email is NOT in ADMIN_USER_EMAILS
- ✅ Can access /admin routes (listings, leads, reviews, claims)
- ✅ Non-admin users get "Unauthorized" error
- ✅ Console shows "[DEV] User authenticated as admin via ADMIN_USER_EMAILS" in development

## What Changed

### Files Modified:
1. **lib/supabase/auth.ts**
   - Fixed `isAdmin()` function
   - Added proper database check
   - Added environment variable fallback for development

2. **.env.example**
   - Added `ADMIN_USER_EMAILS` with documentation

3. **supabase/migrations/20251115_create_admin_users.sql**
   - New migration for admin_users table
   - Includes RLS policies

### Files Created:
1. **ADMIN_SETUP.md** - Comprehensive setup guide
2. **TEST_ADMIN_AUTH.md** - This testing guide

## Next Steps After Testing

Once you've confirmed admin authentication works:

1. **For Production**:
   - Run the migration in your production Supabase project
   - Add yourself as the first admin using the SQL commands above
   - Remove `ADMIN_USER_EMAILS` from production environment

2. **For Development**:
   - Keep `ADMIN_USER_EMAILS` in .env.local for convenience
   - Add team members' emails as needed

3. **Security**:
   - Never commit `.env.local` to git (already in .gitignore)
   - Document who has admin access
   - Periodically review admin_users table

---

**Testing Date:** November 15, 2025
**Status:** Ready for Testing
