# Future Enhancements

This document tracks features and improvements to be implemented after the MVP launch.

## Post-MVP Enhancements

### Blog Editor Enhancements (Week 3 Remaining)
**Priority:** Medium
**Estimated Effort:** 4-6 hours
**Added:** November 2, 2025

**Description:**
Complete remaining blog editor features for improved content management workflow.

**Implementation Tasks:**
1. **Image Upload with Cloudinary**
   - Set up Cloudinary account and add credentials to .env.local
   - Create `components/editor/ImageUpload.tsx` component
   - Integrate Cloudinary upload widget
   - Add image cropping and optimization
   - Replace URL input with drag-and-drop upload

2. **Preview Feature**
   - Add "Preview" button to BlogPostForm
   - Create modal or side-by-side preview pane
   - Render markdown/HTML content as it would appear on blog
   - Include featured image in preview

3. **Auto-save Drafts**
   - Implement auto-save every 30 seconds
   - Add visual indicator showing "Saving..." / "Saved"
   - Store draft state in localStorage as backup
   - Restore unsaved content on page reload

4. **Blog Content Creation**
   - Write 10-15 initial blog posts with proper SEO
   - Add featured images to all posts
   - Verify SEO meta tags on all posts
   - Publish initial content

5. **RSS Feed Generation**
   - Create `app/api/blog/rss/route.ts`
   - Generate RSS 2.0 format feed
   - Include last 50 blog posts
   - Add RSS feed link to blog homepage

6. **Category/Tag Management Admin Pages**
   - Create `app/(admin)/admin/blog/categories/page.tsx`
   - Create `app/(admin)/admin/blog/tags/page.tsx`
   - Implement CRUD operations for both

**Current Status:**
- ✅ Admin blog dashboard complete
- ✅ Rich text editor with Tiptap complete
- ✅ Blog post form with all fields complete
- ✅ Draft/publish functionality complete
- ✅ API routes for CRUD operations complete
- ⏸️ Image upload (using URL input temporarily)
- ⏸️ Preview feature
- ⏸️ Auto-save drafts

---

### Business Hours Display
**Priority:** Medium
**Estimated Effort:** 2-3 hours
**Added:** November 2, 2025

**Description:**
Add business hours field to advisor profiles. The CSV import data included business hours information, but this field was not part of the original schema.

**Implementation Tasks:**
1. Add `business_hours` column to `advisors` table
   - Type: TEXT or JSONB for structured hours
   - Format: Consider storing as JSON: `{ "monday": "9AM-5PM", "tuesday": "9AM-5PM", ... }`
2. Update CSV import script to include business hours
3. Add business hours display to listing page sidebar
4. Add business hours field to advisor dashboard edit form
5. Optional: Add "Open Now" indicator based on current time

**Database Migration:**
```sql
ALTER TABLE advisors ADD COLUMN business_hours JSONB;
```

**UI Location:**
Display in the "Business Information" card on the listing page sidebar, below years in business and certifications.

**Design:**
- Show hours in clean, readable format
- Highlight current day
- Show "Open Now" / "Closed" status (optional)
- Allow advisors to mark "By Appointment Only"

---

## Other Future Enhancements

(Add more as identified during development)

### Email Notifications
- Notify advisors of new leads
- Notify advisors of new reviews
- Weekly digest for claimed listings

### Advanced Filters
- Price range slider
- Availability (accepting new clients)
- Languages spoken
- Remote vs. in-person services

### Map View
- Show advisors on an interactive map
- Cluster markers for dense areas
- Click marker to view advisor card

### Comparison Tool
- Side-by-side comparison of 2-3 advisors
- Compare services, pricing, ratings

### Saved Searches
- Allow users to save their search criteria
- Email alerts when new advisors match criteria
