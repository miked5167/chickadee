# Future Enhancements

This document tracks features and improvements to be implemented after the MVP launch.

## Post-MVP Enhancements

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
