# SEO Quick Start Guide - THIS WEEK
## Your Immediate Action Plan (Week 7)

**Goal:** Complete foundational SEO setup
**Time Required:** 6-8 hours this week
**Expected Impact:** +20-30 visits/month within 4 weeks

---

## 🔥 TOP 3 PRIORITIES THIS WEEK

### 1. Homepage Optimization (1 hour) ⚡
**File:** `app/(public)/page.tsx`

**Change Title:**
```typescript
// Find and update
title: 'Best Hockey Advisors Directory 2025 | 200+ Verified Advisors'
```

**Change Description:**
```typescript
description: 'Find the best hockey advisors near you. Compare 200+ verified hockey advisors, agents, and consultants. Free advisor matching. Start your hockey career today!'
```

**Change H1:**
```html
<h1>Find the Best Hockey Advisors for Your Career</h1>
<h2>Compare 200+ Verified Hockey Advisors, Agents & Consultants</h2>
```

**✅ Done? Test:** View page source, look for new title

---

### 2. Google Search Console (30 min)
**URL:** https://search.google.com/search-console

**Steps:**
1. Sign in with Google account
2. Add property: `https://yourdomain.com`
3. Verify ownership (DNS or HTML file)
4. Submit sitemap: `https://yourdomain.com/sitemap.xml`
5. Enable email notifications

**✅ Done? Test:** Sitemap shows "Success"

---

### 3. Google Analytics 4 (30 min)
**URL:** https://analytics.google.com/

**Steps:**
1. Create new GA4 property
2. Get Measurement ID (G-XXXXXXXXXX)
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
4. Add script to `app/layout.tsx`:
   ```typescript
   <Script
     src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
     strategy="afterInteractive"
   />
   <Script id="google-analytics" strategy="afterInteractive">
     {`
       window.dataLayer = window.dataLayer || [];
       function gtag(){dataLayer.push(arguments);}
       gtag('js', new Date());
       gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
     `}
   </Script>
   ```

**✅ Done? Test:** Visit site, check Real-time view in GA4

---

## 📋 COMPLETE WEEK 7 CHECKLIST

**Monday:**
- [ ] Update homepage title, description, H1 (1 hour)
- [ ] Set up Google Search Console (30 min)
- [ ] Submit sitemap (5 min)

**Tuesday:**
- [ ] Set up Google Analytics 4 (30 min)
- [ ] Add Schema.org markup to homepage (30 min)
- [ ] Test on Rich Results Test tool (10 min)

**Wednesday:**
- [ ] Update advisor profile schemas (1 hour)
- [ ] Add breadcrumb markup (30 min)
- [ ] Test 3 advisor pages (15 min)

**Thursday:**
- [ ] Fix internal linking (1 hour)
  - Homepage → Top advisors
  - Footer → Important pages
  - Advisor profiles → Related advisors
- [ ] Audit images (30 min)
- [ ] Fix missing alt text (30 min)

**Friday:**
- [ ] Run Lighthouse audit (15 min)
- [ ] Review and fix any issues (1 hour)
- [ ] Document progress (15 min)
- [ ] Plan next week (15 min)

---

## 📊 HOW TO TRACK PROGRESS

### Daily (2 minutes)
**Google Analytics:**
- Check "Real-time" view
- Note any organic traffic

### Weekly (15 minutes)
**Google Search Console:**
1. Go to "Performance"
2. Check:
   - Total clicks
   - Total impressions
   - Average position
3. Note keywords showing up

**Google Analytics:**
1. Go to "Acquisition" → "Traffic acquisition"
2. Filter to "Organic Search"
3. Note total sessions

### Monthly (30 minutes)
**Full Report:**
- Export traffic data
- Check ranking improvements
- Review which pages are working
- Adjust strategy

---

## 🎯 SUCCESS METRICS (Week 7)

**By End of Week:**
- [ ] Google Search Console shows site
- [ ] Google Analytics tracking visits
- [ ] Homepage optimized
- [ ] All pages have proper schemas
- [ ] No major Lighthouse issues

**Within 2 Weeks:**
- [ ] First organic visit from Google
- [ ] Site appears in Search Console impressions
- [ ] Baseline rankings established

**Within 4 Weeks:**
- [ ] 10-20 organic visits/month
- [ ] Multiple pages indexed
- [ ] Ranking in top 100 for "hockey advisor"

---

## 💡 TIPS FOR SUCCESS

**Do This:**
✅ Work on tasks in order
✅ Test each change immediately
✅ Document what you did
✅ Check Analytics daily
✅ Be patient (results take 2-4 weeks)

**Avoid This:**
❌ Skipping testing
❌ Making changes without tracking
❌ Expecting immediate results
❌ Keyword stuffing
❌ Copying competitor content

---

## 🚨 COMMON ISSUES & FIXES

**Issue:** "Site not showing in Google"
**Fix:**
- Wait 1-2 weeks after submitting sitemap
- Check Search Console for crawl errors
- Verify robots.txt allows crawling

**Issue:** "No traffic yet"
**Fix:**
- Normal! SEO takes 2-4 weeks to start
- Keep working on tasks
- Focus on content creation

**Issue:** "Analytics not tracking"
**Fix:**
- Clear browser cache
- Check Measurement ID is correct
- Test in incognito mode
- View Real-time report while on site

---

## 📞 NEED HELP?

**Documentation:**
- Full Plan: `SEO_IMPLEMENTATION_PLAN.md`
- Strategy: `SEO_STRATEGY.md`
- Research: `seo-research/` folder

**Tools:**
- Google Search Console: https://search.google.com/search-console
- Google Analytics: https://analytics.google.com/
- Rich Results Test: https://search.google.com/test/rich-results
- Lighthouse: Browser DevTools (F12 → Lighthouse)

**Commands:**
```bash
# Start dev server
npm run dev

# Run Lighthouse audit
npm run audit

# Run SEO research
npm run seo:keywords
```

---

## ✅ QUICK WIN CHECKLIST

Use this to track your immediate progress:

**Setup (One-time):**
- [ ] Google Search Console configured
- [ ] Google Analytics 4 configured
- [ ] Sitemap submitted
- [ ] Domain verified

**Homepage:**
- [ ] Title optimized
- [ ] Meta description optimized
- [ ] H1 tag updated
- [ ] H2 tag added
- [ ] Schema.org markup added
- [ ] Keywords added naturally to content

**Technical:**
- [ ] All images have alt text
- [ ] Internal links working
- [ ] Mobile responsive
- [ ] Fast load times (Lighthouse >80)

**Content:**
- [ ] Homepage has 500+ words
- [ ] Keywords used naturally
- [ ] Clear CTAs present
- [ ] Contact forms working

---

## 🎯 THIS WEEK'S GOAL

**Complete these 7 tasks:**
1. ✅ Homepage SEO optimization
2. ✅ Google Search Console setup
3. ✅ Google Analytics setup
4. ✅ Schema markup added
5. ✅ Internal linking fixed
6. ✅ Image optimization
7. ✅ Lighthouse audit passed

**Time investment:** 6-8 hours
**Expected result:** Foundation for 1,500+ visits/month within 4 months

---

**Start now! Begin with homepage optimization (1 hour)** 🚀

**Document:** `SEO_QUICK_START.md`
**Full Plan:** `SEO_IMPLEMENTATION_PLAN.md`
**Created:** November 5, 2025
