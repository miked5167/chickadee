# SEO Implementation Plan - The Hockey Directory
## Actionable Task List with Timelines & Expected Results

**Start Date:** Week 7 (Current Week)
**Duration:** 16 Weeks (4 Months)
**Goal:** 1,500-3,000 organic visits/month by Week 20

---

## 📊 Research Summary (COMPLETED ✅)

**Date Completed:** November 5, 2025
**Research Cost:** ~$1.60
**Time Invested:** 1 hour

### Key Findings:
- ✅ 34 keywords identified (11,760 total searches/month)
- ✅ Top opportunity: "hockey training" (6,600 searches/month)
- ✅ ZERO local competition in 8 major cities
- ✅ Top competitor (ahadvising.com) only gets ~101 visits/month
- ✅ Clear path to market domination

**Reports Location:** `seo-research/`

---

## 🎯 WEEK 7: QUICK WINS (Current Week)
**Goal:** Foundation setup & immediate optimizations
**Estimated Time:** 6-8 hours
**Expected Impact:** +20-30 visits/month within 4 weeks

### Task 7.1: Homepage SEO Optimization ⚡ PRIORITY
**Time:** 1 hour
**File:** `app/(public)/page.tsx`

- [ ] Update page title
  ```typescript
  // BEFORE
  title: 'The Hockey Directory - Find Hockey Advisors'

  // AFTER
  title: 'Best Hockey Advisors Directory 2025 | 200+ Verified Advisors'
  ```

- [ ] Update meta description
  ```typescript
  description: 'Find the best hockey advisors near you. Compare 200+ verified hockey advisors, agents, and consultants. Free advisor matching. Start your hockey career today!'
  ```

- [ ] Add keywords metadata
  ```typescript
  keywords: 'hockey advisor, hockey agent, hockey consultant, hockey recruiting, hockey family advisor'
  ```

- [ ] Update H1 tag
  ```html
  <h1>Find the Best Hockey Advisors for Your Career</h1>
  <h2>Compare 200+ Verified Hockey Advisors, Agents & Consultants</h2>
  ```

**Testing:** View source, search "hockey advisor" in 2 weeks

---

### Task 7.2: Add Schema.org Markup
**Time:** 30 minutes
**File:** `app/(public)/page.tsx`

- [ ] Add ProfessionalService schema
  ```typescript
  <script type="application/ld+json" dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "The Hockey Directory",
      "description": "Leading directory of hockey advisors and agents",
      "url": "https://yourdomain.com",
      "areaServed": ["United States", "Canada"],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Hockey Advisor Services",
        "itemListElement": [{
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Hockey Career Advising"
          }
        }]
      }
    })
  }} />
  ```

**Testing:** Use Google's Rich Results Test

---

### Task 7.3: Google Search Console Setup
**Time:** 30 minutes
**Prerequisites:** Domain deployed to production

- [ ] Sign up at https://search.google.com/search-console
- [ ] Verify domain ownership (DNS or file verification)
- [ ] Submit sitemap: `https://yourdomain.com/sitemap.xml`
- [ ] Enable email notifications for issues
- [ ] Bookmark dashboard for weekly checks

**Testing:** Sitemap shows "Success" status

---

### Task 7.4: Google Analytics 4 Setup
**Time:** 30 minutes

- [ ] Create GA4 property at https://analytics.google.com/
- [ ] Get Measurement ID (G-XXXXXXXXXX)
- [ ] Add to `.env.local`:
  ```bash
  NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
  ```
- [ ] Add Google Analytics script to `app/layout.tsx`
- [ ] Set up conversion events:
  - `advisor_contact` (when contact form submitted)
  - `advisor_view` (when advisor profile viewed)
  - `search_performed` (when search used)

**Testing:** Real-time view shows your visit

---

### Task 7.5: Update Advisor Profiles Schema
**Time:** 1 hour
**File:** `app/(public)/listings/[slug]/page.tsx`

- [ ] Enhance LocalBusiness schema with:
  - `aggregateRating` (from reviews)
  - `priceRange` (if available)
  - `areaServed` (locations they cover)
  - `makesOffer` (services offered)

- [ ] Add BreadcrumbList schema
  ```typescript
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [{
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://yourdomain.com"
    }, {
      "@type": "ListItem",
      "position": 2,
      "name": "Advisors",
      "item": "https://yourdomain.com/listings"
    }, {
      "@type": "ListItem",
      "position": 3,
      "name": advisor.business_name
    }]
  }
  ```

**Testing:** Google Rich Results Test on 3 advisor pages

---

### Task 7.6: Internal Linking Structure
**Time:** 1 hour
**Files:** Multiple

- [ ] Homepage links to:
  - Top 10 advisors by rating
  - All city pages (when created)
  - Blog posts (when created)

- [ ] Footer links to:
  - Popular searches
  - City pages
  - Blog categories

- [ ] Advisor profiles link to:
  - Similar advisors (same specialty)
  - Same city advisors
  - Related blog posts

**Testing:** Check 5 pages have proper internal links

---

### Task 7.7: Image Optimization Audit
**Time:** 30 minutes

- [ ] Run Lighthouse audit on 3 pages
- [ ] Check all images have:
  - Alt text with keywords
  - Proper dimensions (width/height)
  - Optimized file sizes
- [ ] Fix any missing alt text
- [ ] Ensure Cloudinary is serving optimized formats

**Testing:** Lighthouse shows no image issues

---

## 📅 WEEK 8-9: HIGH-VALUE CONTENT PAGES
**Goal:** Capture high-volume keywords
**Estimated Time:** 12-16 hours
**Expected Impact:** +300-600 visits/month within 8 weeks

### Task 8.1: Create "Hockey Training" Landing Page 🔥
**Time:** 4-5 hours
**Target Keyword:** "hockey training" (6,600 searches/month)
**Priority:** HIGHEST IMPACT

**Step 1: Database Migration**
- [ ] Create migration file: `supabase/migrations/YYYYMMDD_add_training_services.sql`
  ```sql
  ALTER TABLE advisors ADD COLUMN offers_training BOOLEAN DEFAULT false;
  ALTER TABLE advisors ADD COLUMN training_description TEXT;
  ALTER TABLE advisors ADD COLUMN training_price_range VARCHAR(50);

  -- Update some advisors to offer training (review and set manually)
  ```

- [ ] Run migration: `npx supabase db push`

**Step 2: Create Page**
- [ ] Create file: `app/(public)/hockey-training/page.tsx`
- [ ] Add metadata:
  ```typescript
  export const metadata = {
    title: 'Hockey Training Programs & Coaches | Find Expert Training',
    description: 'Find professional hockey training programs and coaches. Compare 50+ certified trainers offering skill development, skating, shooting, and hockey IQ training.',
    keywords: 'hockey training, hockey coaches, hockey skills training, skating training, hockey development'
  };
  ```

- [ ] Page structure:
  ```typescript
  - Hero section with search
  - Filter by: Location, Age Group, Skill Level, Training Type
  - Grid of advisors who offer training (where offers_training = true)
  - "Benefits of Professional Hockey Training" content section
  - FAQ section
  - CTA: "Find a Training Program"
  ```

**Step 3: Content Writing**
- [ ] Write 800-1000 words about:
  - Types of hockey training (skills, skating, shooting, hockey IQ)
  - Benefits of professional training
  - What to look for in a trainer
  - Cost expectations
  - When to start training

- [ ] Include keywords naturally:
  - "hockey training"
  - "hockey skills development"
  - "professional hockey coach"
  - "youth hockey training"

**Step 4: Update Admin**
- [ ] Add "Offers Training" toggle to advisor dashboard
- [ ] Allow advisors to add training description and pricing

**Testing:**
- [ ] Page loads properly
- [ ] Filters work
- [ ] All advisors shown offer training
- [ ] Mobile responsive
- [ ] Add to sitemap (should be automatic)

**Expected Result:** 300-600 visits/month within 2-3 months

---

### Task 8.2: Create "Hockey Camps" Landing Page
**Time:** 3-4 hours
**Target Keyword:** "hockey camps" (1,600 searches/month)

**Step 1: Database**
- [ ] Add to migration:
  ```sql
  ALTER TABLE advisors ADD COLUMN offers_camps BOOLEAN DEFAULT false;
  ALTER TABLE advisors ADD COLUMN camp_description TEXT;
  ```

**Step 2: Create Page**
- [ ] Create file: `app/(public)/hockey-camps/page.tsx`
- [ ] Similar structure to training page
- [ ] Metadata:
  ```typescript
  title: 'Hockey Camps 2025 | Summer & Year-Round Programs'
  description: 'Find the best hockey camps for your child. Compare day camps, overnight camps, and specialized training camps. Expert instructors and proven results.'
  ```

**Step 3: Content**
- [ ] 800-1000 words about:
  - Types of camps (day, overnight, specialty)
  - Age groups and skill levels
  - What makes a great camp
  - Cost ranges
  - How to choose

**Testing:** Same as training page

**Expected Result:** 80-160 visits/month within 2-3 months

---

### Task 8.3: Add "Services" Navigation
**Time:** 30 minutes
**File:** `components/navigation/MainNav.tsx`

- [ ] Add dropdown to main navigation:
  ```
  Services ▼
    ├── Find an Advisor
    ├── Hockey Training
    ├── Hockey Camps
    └── Recruiting Services
  ```

- [ ] Update footer with service links

**Testing:** Navigation works on all pages

---

## 📅 WEEK 10-11: LOCAL SEO FOUNDATION
**Goal:** Dominate local searches (ZERO competition!)
**Estimated Time:** 10-12 hours
**Expected Impact:** +400-800 visits/month within 12 weeks

### Task 10.1: Create City Landing Pages (Tier 1)
**Time:** 8-10 hours
**Cities:** Toronto, Boston, Vancouver, Minneapolis
**Priority:** HIGH - Zero competition!

**Step 1: Create Dynamic Route**
- [ ] Create file: `app/(public)/hockey-advisors/[location]/page.tsx`

- [ ] Define cities array:
  ```typescript
  const CITIES = [
    { slug: 'toronto-ontario', city: 'Toronto', state: 'Ontario', country: 'Canada',
      coords: [43.6532, -79.3832], population: 2930000 },
    { slug: 'boston-massachusetts', city: 'Boston', state: 'Massachusetts', country: 'USA',
      coords: [42.3601, -71.0589], population: 675000 },
    { slug: 'vancouver-british-columbia', city: 'Vancouver', state: 'British Columbia', country: 'Canada',
      coords: [49.2827, -123.1207], population: 675000 },
    { slug: 'minneapolis-minnesota', city: 'Minneapolis', state: 'Minnesota', country: 'USA',
      coords: [44.9778, -93.2650], population: 430000 },
  ];
  ```

- [ ] Implement `generateStaticParams()` for ISR
- [ ] Implement `generateMetadata()` for SEO

**Step 2: Page Template**
- [ ] Hero with city name
- [ ] Map showing advisor locations
- [ ] Filter by specialty, rating, availability
- [ ] List of advisors within 50 miles
- [ ] City-specific content (500-700 words):
  - Hockey culture in [City]
  - Why hire an advisor in [City]
  - Youth hockey leagues in [City]
  - Local hockey resources

**Step 3: Schema Markup**
- [ ] Add LocalBusiness schema for each city page
- [ ] Add ItemList schema for advisor listings

**Step 4: Create Database Function**
- [ ] If not exists, create: `advisors_within_radius` function
  ```sql
  CREATE OR REPLACE FUNCTION advisors_within_radius(
    lat FLOAT,
    lng FLOAT,
    radius_miles INT
  )
  RETURNS TABLE (/* advisor columns */)
  AS $$
    -- Use PostGIS or simple distance calculation
  $$
  LANGUAGE plpgsql;
  ```

**Testing:**
- [ ] Each city page loads
- [ ] Shows correct advisors for location
- [ ] Map displays properly
- [ ] Content is unique per city
- [ ] Mobile responsive

**Expected Result:** 100-200 visits/month per city = 400-800 total

---

### Task 10.2: Add City Pages to Navigation
**Time:** 30 minutes

- [ ] Add "Locations" dropdown to nav
- [ ] Homepage: Add "Browse by Location" section
- [ ] Footer: Add all city links

---

### Task 10.3: Google Business Profile Setup
**Time:** 2 hours

- [ ] Create business profile: https://business.google.com/
- [ ] Complete all fields:
  - Business name: The Hockey Directory
  - Category: Business Consultant
  - Service area: United States, Canada
  - Hours: 24/7 (online service)
  - Website link
  - Description (include keywords)

- [ ] Add photos:
  - Logo
  - Screenshots of directory
  - Hockey-themed images

- [ ] Start collecting reviews (ask advisors)

**Testing:** Profile appears in Google Search

---

## 📅 WEEK 12-13: LOCAL SEO EXPANSION
**Goal:** Complete local coverage
**Estimated Time:** 6-8 hours
**Expected Impact:** +200-400 additional visits/month

### Task 12.1: Create City Pages (Tier 2)
**Time:** 6-8 hours
**Cities:** Chicago, Detroit, Montreal, New York

- [ ] Add 4 more cities to `CITIES` array
- [ ] Follow same template as Tier 1
- [ ] Write unique content for each city
- [ ] Test all pages

**Expected Result:** 50-100 visits/month per city = 200-400 total

---

### Task 12.2: Create "Locations" Hub Page
**Time:** 2 hours
**File:** `app/(public)/hockey-advisors/page.tsx`

- [ ] Create overview page linking to all 8 cities
- [ ] Map showing all cities
- [ ] Stats per city (# of advisors)
- [ ] "Explore by Location" grid

---

## 📅 WEEK 14-16: CONTENT MARKETING
**Goal:** Capture long-tail keywords
**Estimated Time:** 12-16 hours
**Expected Impact:** +100-200 visits/month

### Task 14.1: Blog Post #1 - "How Much Does a Hockey Advisor Cost?"
**Time:** 3-4 hours
**Target:** "hockey advisor cost" (20 searches/month)
**File:** Create in admin blog interface or `app/(public)/blog/[slug]/`

**Content Outline:**
- [ ] Introduction (100 words)
- [ ] Average costs breakdown ($2,000-$10,000 range)
- [ ] What affects pricing (experience, location, services)
- [ ] Cost vs. value analysis
- [ ] Payment structures (hourly, flat fee, commission)
- [ ] Red flags (too cheap, hidden fees)
- [ ] How to budget for an advisor
- [ ] Conclusion with CTA

**SEO Elements:**
- [ ] Title: "How Much Does a Hockey Advisor Cost? 2025 Pricing Guide"
- [ ] Meta description (155 chars)
- [ ] H2 headings with keywords
- [ ] Internal links to advisor profiles
- [ ] Include keyword naturally 8-10 times
- [ ] Add pricing table/comparison
- [ ] 1,500-2,000 words

**Testing:** Publish and share on social media

---

### Task 14.2: Blog Post #2 - "Best Hockey Advisors Near Me"
**Time:** 3-4 hours
**Target:** "hockey advisors near me" (20 searches/month)

**Content Outline:**
- [ ] How to find advisors locally
- [ ] Benefits of local vs. remote advisors
- [ ] Using The Hockey Directory's location filter
- [ ] Questions to ask potential advisors
- [ ] Red flags to watch for
- [ ] Success stories from local families
- [ ] How to evaluate advisors

**SEO Elements:**
- [ ] Title: "Find the Best Hockey Advisors Near You | Local Directory"
- [ ] Include city names naturally
- [ ] Link to all 8 city pages
- [ ] Embed location-based search widget
- [ ] 1,200-1,500 words

---

### Task 14.3: Blog Post #3 - "Hockey Agent vs Hockey Advisor"
**Time:** 2-3 hours
**Target:** "hockey agent" (170 searches/month)

**Content Outline:**
- [ ] Definition of each role
- [ ] Key differences
- [ ] When you need an agent vs advisor
- [ ] Can one person be both?
- [ ] Legal requirements (agent certification)
- [ ] Cost differences
- [ ] How to choose

**SEO Elements:**
- [ ] Title: "Hockey Agent vs Hockey Advisor: What's the Difference?"
- [ ] Target both "hockey agent" and "hockey advisor"
- [ ] Comparison table
- [ ] Link to agent profiles
- [ ] 1,200-1,500 words

---

### Task 14.4: Blog Post #4 - "NCAA Hockey Recruiting Guide"
**Time:** 3-4 hours
**Target:** "NCAA hockey recruiting" (110 searches/month)

**Content Outline:**
- [ ] NCAA recruiting timeline
- [ ] Eligibility requirements
- [ ] Division I vs II vs III
- [ ] Role of advisors in recruiting
- [ ] Creating a recruiting video
- [ ] Contacting coaches
- [ ] Combining athletics and academics
- [ ] Success stories

**SEO Elements:**
- [ ] Title: "NCAA Hockey Recruiting Guide: Everything You Need to Know"
- [ ] Include "NCAA hockey recruiting" in H1, H2s
- [ ] Downloadable recruiting checklist
- [ ] CTA to find recruiting specialist advisors
- [ ] 2,000+ words (comprehensive)

---

### Task 14.5: Blog Post #5 - "Do You Need a Junior Hockey Advisor?"
**Time:** 2-3 hours
**Target:** "junior hockey advisor" (10 searches/month)

**Content Outline:**
- [ ] What is junior hockey
- [ ] When to consider an advisor
- [ ] Benefits of having an advisor
- [ ] What they help with
- [ ] Cost-benefit analysis
- [ ] How to choose the right one
- [ ] Success rate statistics

**SEO Elements:**
- [ ] Title: "Junior Hockey Advisor: Do You Need One? Complete Guide"
- [ ] Target "junior hockey advisor"
- [ ] Link to advisors specializing in junior hockey
- [ ] 1,000-1,200 words

---

## 📅 WEEK 17-20: COMPETITIVE EDGE
**Goal:** Surpass ahadvising.com
**Estimated Time:** 10-15 hours
**Expected Impact:** Rank top 5 for "hockey advisor"

### Task 17.1: Link Building Campaign - Hockey Blogs
**Time:** 4-5 hours

- [ ] Identify 20 hockey blogs/websites
- [ ] Reach out with guest post proposals
- [ ] Topics:
  - "How Technology is Changing Hockey Advising"
  - "The Rise of Hockey Career Planning"
  - "What to Look for in a Hockey Advisor"

- [ ] Goal: 5 guest posts with backlinks

**List to Contact:**
- [ ] The Hockey Writers
- [ ] Hockey News
- [ ] Local hockey association blogs
- [ ] Youth hockey forums
- [ ] Hockey podcasts (for interviews)

---

### Task 17.2: Directory Submissions
**Time:** 3-4 hours

- [ ] Submit to hockey directories:
  - [ ] Elite Prospects (if applicable)
  - [ ] Hockey Canada resources
  - [ ] USA Hockey resources
  - [ ] State/provincial hockey associations

- [ ] General business directories:
  - [ ] Yelp
  - [ ] Yellow Pages
  - [ ] Business.com
  - [ ] Manta

- [ ] Goal: 10-15 quality directory listings

---

### Task 17.3: Social Media Presence
**Time:** 3-4 hours setup + ongoing

- [ ] Create profiles:
  - [ ] Twitter/X: @HockeyDirectory
  - [ ] LinkedIn: The Hockey Directory
  - [ ] Facebook: Hockey Directory Page
  - [ ] Instagram: @thehockeydirectory

- [ ] Post content:
  - [ ] Share blog posts (2x/week)
  - [ ] Feature advisor spotlights (1x/week)
  - [ ] Hockey news and tips (3x/week)

- [ ] Engage:
  - [ ] Join hockey groups
  - [ ] Comment on industry posts
  - [ ] Share relevant content

**Goal:** 500 followers across platforms in 3 months

---

### Task 17.4: Email Marketing Setup
**Time:** 2-3 hours

- [ ] Set up email marketing (Mailchimp/ConvertKit)
- [ ] Create signup forms on:
  - [ ] Homepage
  - [ ] Blog sidebar
  - [ ] Advisor profile pages

- [ ] Create welcome email series:
  - Email 1: Welcome + benefits
  - Email 2: How to use the directory
  - Email 3: Advisor spotlight
  - Email 4: Hockey career tips

- [ ] Monthly newsletter:
  - New advisors added
  - Featured blog posts
  - Hockey industry news

**Goal:** 100 subscribers in first 3 months

---

### Task 17.5: Advisor Engagement Program
**Time:** 2-3 hours

- [ ] Email all 201 advisors:
  - Ask them to link to their profile
  - Request testimonials
  - Encourage reviews
  - Share social media

- [ ] Create advisor resource center:
  - Marketing materials
  - Profile optimization tips
  - Social media templates

- [ ] Incentive program:
  - Featured placement for active advisors
  - Better ranking for complete profiles
  - Badges for top-rated advisors

**Goal:** 20% advisor engagement (40 advisors)

---

## 📊 TRACKING & MONITORING

### Weekly Tasks (Every Monday)
- [ ] Check Google Search Console:
  - Impressions and clicks
  - Average position for target keywords
  - Any crawl errors
  - New backlinks

- [ ] Check Google Analytics:
  - Total visits
  - Top pages
  - Traffic sources
  - Conversion rate

- [ ] Review rankings (manual or tool):
  - "hockey advisor"
  - "hockey training"
  - "hockey camps"
  - City-specific keywords

### Monthly Tasks (First Monday)
- [ ] Comprehensive ranking report
- [ ] Traffic analysis and trends
- [ ] Backlink audit
- [ ] Content performance review
- [ ] Competitor monitoring
- [ ] Update strategy based on data

### Quarterly Tasks
- [ ] Full SEO audit
- [ ] Lighthouse performance test
- [ ] Update keyword targets
- [ ] Refresh old content
- [ ] Review and update city pages

---

## 📈 SUCCESS METRICS & MILESTONES

### Month 1 (Weeks 7-10)
**Target:** Foundation complete
- [ ] 50-100 organic visits/month
- [ ] All pages indexed by Google
- [ ] 8 city pages live
- [ ] 2 new content pages (training, camps)
- [ ] Google Search Console setup

**Validation:**
- Check organic traffic in GA4
- Verify indexing in Search Console

---

### Month 2 (Weeks 11-14)
**Target:** Content & local SEO gaining traction
- [ ] 200-400 organic visits/month
- [ ] Ranking in top 20 for "hockey advisor"
- [ ] City pages ranking locally
- [ ] 3 blog posts published
- [ ] 5 backlinks acquired

**Validation:**
- Check ranking for "hockey advisor [city]" in each city
- Monitor "hockey training" rankings

---

### Month 3 (Weeks 15-18)
**Target:** Competitive positioning
- [ ] 400-800 organic visits/month
- [ ] Top 10 for "hockey advisor"
- [ ] Top 5 for city keywords
- [ ] 5 blog posts published
- [ ] 10 total backlinks
- [ ] 50+ email subscribers

**Validation:**
- Compare traffic to ahadvising.com (use SimilarWeb)
- Check featured snippets

---

### Month 4 (Weeks 19-20)
**Target:** Market leadership
- [ ] 800-1,500 organic visits/month
- [ ] Top 5 for "hockey advisor"
- [ ] #1-3 for multiple city keywords
- [ ] 8 blog posts published
- [ ] 15+ backlinks
- [ ] 100+ email subscribers
- [ ] Active social media presence

**Validation:**
- Traffic surpasses main competitors
- Multiple #1 rankings achieved

---

## 💰 BUDGET TRACKING

### One-Time Costs
- [ ] Domain: $12/year
- [ ] Logo/branding: $0-500 (optional)
- [ ] Professional photos: $0-200 (optional)
- **Total:** $12-712

### Monthly Costs
- [ ] Hosting (Vercel): $0-20/month
- [ ] Supabase: $25/month
- [ ] Email marketing: $0-15/month (free tier)
- [ ] SEO tools (optional): $0-99/month
- [ ] Content creation: $0-400/month (DIY vs. hire)
- [ ] Social media tools: $0-15/month
- **Total:** $25-574/month

### Quarterly Costs
- [ ] DataForSEO research: $5-10/quarter
- [ ] Competitor analysis: $5/quarter
- **Total:** $10-15/quarter

### Annual Budget
- **Minimum:** $312/year ($25 Supabase × 12)
- **Recommended:** $2,000-5,000/year (with content creation)
- **Maximum:** $8,000/year (with all tools and services)

---

## 🎯 KEY PERFORMANCE INDICATORS (KPIs)

### Traffic Metrics
| Metric | Month 1 | Month 2 | Month 3 | Month 4 | Month 6 | Month 12 |
|--------|---------|---------|---------|---------|---------|----------|
| Organic Visits | 50-100 | 200-400 | 400-800 | 800-1,500 | 1,500-2,500 | 3,000-5,000 |
| Pageviews | 150-300 | 600-1,200 | 1,200-2,400 | 2,400-4,500 | 4,500-7,500 | 9,000-15,000 |
| Avg. Session | 2-3 min | 2-3 min | 3-4 min | 3-4 min | 3-5 min | 4-5 min |

### Ranking Metrics
| Keyword | Month 1 | Month 2 | Month 3 | Month 4 | Month 6 | Month 12 |
|---------|---------|---------|---------|---------|---------|----------|
| "hockey advisor" | Not ranked | 20-50 | 10-20 | 5-10 | 3-5 | 1-3 |
| "hockey training" | Not ranked | 30-50 | 20-30 | 10-20 | 5-10 | 1-5 |
| City keywords | Not ranked | 10-20 | 5-10 | 1-5 | 1-3 | 1 |

### Conversion Metrics
| Metric | Month 1 | Month 2 | Month 3 | Month 4 | Month 6 | Month 12 |
|--------|---------|---------|---------|---------|---------|----------|
| Contact Forms | 1-2 | 4-8 | 8-16 | 16-30 | 30-50 | 60-100 |
| Conversion Rate | 2% | 2% | 2% | 2% | 2% | 2% |

### Business Metrics
| Metric | Month 4 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Advisor Signups | 5-10 | 10-20 | 25-50 |
| Revenue | $500-1,000 | $1,000-2,000 | $3,000-6,000 |
| ROI | 50-100% | 100-200% | 300-500% |

---

## ⚠️ IMPORTANT NOTES

### Do's ✅
- ✅ Focus on user experience first
- ✅ Write for humans, optimize for search engines
- ✅ Be patient - SEO takes 3-6 months
- ✅ Track everything - data drives decisions
- ✅ Update content regularly
- ✅ Build relationships with advisors
- ✅ Engage with the hockey community

### Don'ts ❌
- ❌ Keyword stuff
- ❌ Buy backlinks
- ❌ Copy competitor content
- ❌ Neglect mobile users
- ❌ Ignore technical SEO
- ❌ Give up after 2 months
- ❌ Focus only on rankings (traffic + conversions matter more)

---

## 🚨 RISK MITIGATION

### Risk: Google Algorithm Update
**Mitigation:**
- Focus on quality content
- Follow Google's guidelines
- Diversify traffic sources
- Build strong brand

### Risk: Competitor Response
**Mitigation:**
- Stay ahead with content
- Better user experience
- More advisors = more authority
- Build loyal user base

### Risk: Low Conversion Rate
**Mitigation:**
- A/B test CTAs
- Improve contact forms
- Add trust signals (reviews)
- Better advisor profiles

### Risk: Budget Constraints
**Mitigation:**
- Start with DIY content
- Use free tools
- Focus on quick wins
- Scale as revenue grows

---

## 📞 SUPPORT & RESOURCES

### Tools
- **Google Search Console:** https://search.google.com/search-console
- **Google Analytics:** https://analytics.google.com/
- **DataForSEO:** https://app.dataforseo.com/ (for research)
- **Lighthouse:** Built-in browser dev tools

### Documentation
- **SEO Strategy:** `SEO_STRATEGY.md`
- **Research Reports:** `seo-research/`
- **Lighthouse Plan:** `LIGHTHOUSE_OPTIMIZATION_PLAN.md`
- **DataForSEO Guide:** `docs/DATAFORSEO_INTEGRATION.md`

### Quick Commands
```bash
# Run SEO research
npm run seo:keywords      # Keyword research
npm run seo:competitors   # Competitor analysis
npm run seo:local         # Local SEO analysis
npm run seo:domain ahadvising.com  # Domain research

# Run audits
npm run audit             # Full Lighthouse audit
npm run audit:run         # Just run audits
npm run audit:report      # Generate report

# Development
npm run dev               # Start dev server
npm run build             # Build for production
npm start                 # Run production build
```

---

## ✅ COMPLETION CHECKLIST

### Week 7 (Current)
- [ ] Task 7.1: Homepage optimization
- [ ] Task 7.2: Schema markup
- [ ] Task 7.3: Search Console setup
- [ ] Task 7.4: Analytics setup
- [ ] Task 7.5: Advisor schema update
- [ ] Task 7.6: Internal linking
- [ ] Task 7.7: Image optimization

### Weeks 8-9
- [ ] Task 8.1: Training page
- [ ] Task 8.2: Camps page
- [ ] Task 8.3: Services navigation

### Weeks 10-11
- [ ] Task 10.1: City pages (Tier 1)
- [ ] Task 10.2: City navigation
- [ ] Task 10.3: Google Business Profile

### Weeks 12-13
- [ ] Task 12.1: City pages (Tier 2)
- [ ] Task 12.2: Locations hub page

### Weeks 14-16
- [ ] Task 14.1: Blog post #1
- [ ] Task 14.2: Blog post #2
- [ ] Task 14.3: Blog post #3
- [ ] Task 14.4: Blog post #4
- [ ] Task 14.5: Blog post #5

### Weeks 17-20
- [ ] Task 17.1: Link building
- [ ] Task 17.2: Directory submissions
- [ ] Task 17.3: Social media
- [ ] Task 17.4: Email marketing
- [ ] Task 17.5: Advisor engagement

---

## 📅 NEXT REVIEW DATE

**Scheduled:** December 5, 2025 (4 weeks from now)

**Review Agenda:**
1. Traffic analysis (actual vs. target)
2. Ranking improvements
3. Quick wins completed
4. Challenges encountered
5. Strategy adjustments needed
6. Budget review
7. Next 4-week goals

---

**Document Created:** November 5, 2025
**Last Updated:** November 5, 2025
**Version:** 1.0
**Status:** 🚀 READY TO EXECUTE

**Good luck! Let's dominate the hockey advisor market! 🏒**
