# Database Setup Instructions

This directory contains the complete database schema for The Hockey Directory.

## Prerequisites

1. A Supabase project created and configured
2. Your Supabase project URL and keys added to `.env.local`

## Running the Schema

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `setup-schema.sql`
5. Click **Run** to execute the script
6. Verify the output shows success messages

### Option 2: Via Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

## Verification Steps

After running the schema, verify it was successful:

### 1. Check Tables Created

Run this query in SQL Editor:

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

You should see 14 tables:
- advisors
- blog_categories
- blog_comments
- blog_post_tags
- blog_post_views
- blog_posts
- blog_tags
- click_tracking
- csv_import_logs
- leads
- listing_claims
- listing_views
- reviews
- users_public

### 2. Check PostGIS Extension

```sql
SELECT * FROM pg_extension WHERE extname = 'postgis';
```

Should return one row showing PostGIS is enabled.

### 3. Check Triggers

```sql
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname NOT LIKE 'RI_%';
```

Should show 7 triggers created.

### 4. Check Blog Categories Seeded

```sql
SELECT name, slug FROM blog_categories ORDER BY name;
```

Should return 6 categories:
- Player Development
- College Recruitment
- Parent Tips
- Women's Hockey
- Industry News
- Advisor Spotlights

## Troubleshooting

### PostGIS Extension Error

If you get an error about PostGIS:

1. Go to **Database** > **Extensions** in Supabase dashboard
2. Search for "postgis"
3. Click **Enable**
4. Re-run the schema script

### Permission Errors

Make sure you're using the correct Supabase credentials with admin/service role access.

### Duplicate Object Errors

If you need to reset and start fresh:

```sql
-- WARNING: This will delete all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then re-run `setup-schema.sql`.

## Next Steps

After successful schema setup:

1. ✅ Enable Row Level Security (RLS) policies (optional for now)
2. ✅ Update your `.env.local` with real Supabase credentials
3. ✅ Import the 180 advisor listings CSV (Week 1, Days 5-7)
4. ✅ Start building the Next.js application

## Schema Documentation

The complete database schema includes:

- **Core Tables**: advisors, leads, reviews, listing_claims
- **Analytics**: click_tracking, listing_views
- **Blog System**: blog_posts, blog_categories, blog_tags, blog_comments, blog_post_views
- **Users**: users_public (extends auth.users)
- **Utilities**: csv_import_logs

All tables include appropriate indexes for performance and triggers for automated calculations (data quality scores, rating aggregation, view counts, etc.).
