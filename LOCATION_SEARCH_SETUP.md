# Location-Based Search Setup

## Status: Days 4-5 (Location-Based Search)

### ✅ Already Complete

All the code is implemented! Here's what exists:

1. **`lib/hooks/use-location.ts`** ✅
   - Browser geolocation with permission handling
   - Reverse geocoding integration
   - Error handling for denied permissions, timeouts, etc.

2. **`lib/utils/distance.ts`** ✅
   - Haversine formula for distance calculations
   - PostGIS query builders
   - Distance formatting utilities
   - Preset radius options (10, 25, 50, 100 miles)

3. **`app/api/location/route.ts`** ✅
   - Forward geocoding (address → coordinates)
   - Uses Google Geocoding API

4. **`app/api/location/reverse/route.ts`** ✅
   - Reverse geocoding (coordinates → address)
   - Extracts city, state, country, zip code

5. **SearchBar Component** ✅
   - "Near Me" button using geolocation
   - Google Places Autocomplete
   - Location selection and display

### 🔧 Setup Required

#### Step 1: Create PostGIS Distance Function

Run `scripts/create-distance-function.sql` in your Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Open `create-distance-function.sql`
3. Execute the SQL

This creates `search_advisors_by_distance()` function that:
- Accepts lat, lng, and radius in miles
- Uses PostGIS for efficient spatial queries
- Returns advisors sorted by distance
- Includes all advisor details + calculated distance

#### Step 2: Fix Environment Variable

The API routes need a small fix:

**File:** `app/api/location/route.ts` (line 19)
**Change:** `process.env.GOOGLE_MAPS_API_KEY`
**To:** `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**File:** `app/api/location/reverse/route.ts` (line 27)
**Change:** Same as above

### 🧪 Testing

After setup, run:
```bash
npx tsx scripts/test-location-search.ts
```

This will test:
- PostGIS distance queries
- Finding advisors near Boston, MA
- Distance calculations and formatting

### 📋 Next Steps

After this is working, we move to **Days 6-7: Search & Filter Page**:
- Complete search/filter UI
- Implement filters (specialty, rating, distance)
- Add sorting options
- Pagination

### 🎯 What Works Now

Once the PostGIS function is created:
- ✅ "Near Me" button gets user location
- ✅ Google Places Autocomplete for manual location entry
- ✅ Location-based search ready for listings page
- ✅ Distance calculations for all 201 advisors
- ✅ 58 advisors with full addresses have coordinates

## Summary

**Days 4-5 are ~95% complete!** Just need to:
1. Run the SQL function creation
2. Fix the env variable in 2 API files (or we can do it now)
3. Test to confirm it works

Then we're ready for Days 6-7 (Search & Filter Page)!
