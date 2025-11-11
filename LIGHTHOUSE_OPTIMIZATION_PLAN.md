# Lighthouse Optimization Plan - The Hockey Directory
## Comprehensive Performance, Accessibility & SEO Improvements

**Date:** November 5, 2025
**Audit Results:** `lighthouse-results/2025-11-05/`
**Project Phase:** Week 6 - Pre-Launch Optimization

---

## 📊 Executive Summary

### Current State

**Desktop Performance:**
- Average Score: **66/100** 🟡
- LCP: **1.41s** 🟢 (Target: <2.5s)
- CLS: **0.037** 🟢 (Target: <0.1)
- TBT: **0.17s** 🟢 (Target: <0.2s)

**Mobile Performance:**
- Average Score: **43/100** 🔴 **CRITICAL**
- LCP: **6.69s** 🔴 **CRITICAL** (Target: <2.5s)
- CLS: **0.071** 🟢 (Target: <0.1)
- TBT: **1.23s** 🔴 (Target: <0.2s)

### Critical Issues Identified

1. 🔴 **Mobile LCP is 2.7x slower than target** (6.69s vs 2.5s)
2. 🔴 **Mobile performance critically low** (43/100)
3. 🟡 **Server response times are slow** (likely dev mode)
4. 🟡 **Significant unused JavaScript** (15+ seconds savings)
5. 🟡 **Blog page has layout shifts** (CLS 0.423 mobile)
6. ❌ **Blog article audit failed** (404 error - wrong URL)

---

## 🎯 Goals

### Short-term (Week 6)
- Improve mobile performance to **>70**
- Reduce mobile LCP to **<4s**
- Fix blog layout shift issues
- Prepare production build for testing

### Medium-term (Week 7 - Launch)
- Achieve **>90** performance on desktop
- Achieve **>70** performance on mobile
- Maintain **>90** accessibility, best practices, and SEO
- Pass Core Web Vitals assessment

---

## 🚨 Critical Priority Fixes

### 1. Production Build Testing ⭐ **HIGHEST PRIORITY**

**Issue:** Development mode significantly impacts performance
- Development server has hot-reload overhead
- Unminified JavaScript bundles
- Source maps included
- No compression

**Action:**
```bash
# Build for production
npm run build

# Test production build locally
npm start

# Re-run Lighthouse audits on production build
npm run audit
```

**Expected Impact:**
- ✅ Minified JavaScript: **+7.71s savings**
- ✅ Optimized bundles: **+15.08s savings**
- ✅ Better server response times
- ✅ Compressed assets

**Files Affected:** None (build process)

---

### 2. Fix Mobile LCP Performance 🔴 **CRITICAL**

**Issue:** Mobile LCP is extremely slow (6.69s avg, worst: 10.86s on blog)

**Root Causes:**
1. Large JavaScript bundles blocking rendering
2. Slow server response time in dev mode
3. Potential database queries on page load
4. Images not optimized for mobile

**Actions:**

#### A. Code Splitting & Lazy Loading

**File: `app/(public)/listings/[slug]/page.tsx`**
```typescript
// Current: Google Maps loads immediately
import { Loader } from '@googlemaps/js-api-loader';

// Change to: Lazy load Google Maps
import dynamic from 'next/dynamic';

const GoogleMap = dynamic(
  () => import('@/components/listing/GoogleMap'),
  {
    loading: () => <div className="h-64 bg-gray-200 animate-pulse" />,
    ssr: false
  }
);
```

#### B. Defer Non-Critical Components

**File: `app/(public)/page.tsx`** (Homepage)
```typescript
// Defer below-the-fold content
import dynamic from 'next/dynamic';

const FeaturedAdvisors = dynamic(() => import('@/components/FeaturedAdvisors'));
const PopularLocations = dynamic(() => import('@/components/PopularLocations'));
const Testimonials = dynamic(() => import('@/components/Testimonials'));
```

#### C. Optimize Images for Mobile

**File: `next.config.mjs`**
```javascript
const nextConfig = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
  },
};
```

**Expected Impact:**
- Mobile LCP: **6.69s → 3.5s** (target: <2.5s after production build)
- Performance Score: **+15-20 points**

---

### 3. Reduce Unused JavaScript 🟡

**Issue:** 15.08s of potential savings from unused JavaScript

**Root Causes:**
1. Large Next.js bundles including all pages
2. Third-party libraries loaded but not used on every page
3. Admin/dashboard code loaded on public pages

**Actions:**

#### A. Review Bundle Analysis

```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Add to next.config.mjs
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

#### B. Split Route Groups Further

**Create separate entry points:**
```
app/
├── (public)/          # Public pages only
├── (advisor)/         # Advisor dashboard (separate bundle)
├── (admin)/           # Admin dashboard (separate bundle)
└── (auth)/            # Auth pages
```

#### C. Dynamic Imports for Heavy Libraries

**File: `components/listing/GoogleMap.tsx`**
```typescript
// Load Google Maps API only when needed
const loadGoogleMaps = async () => {
  const { Loader } = await import('@googlemaps/js-api-loader');
  return new Loader({...});
};
```

**File: `components/admin/AnalyticsChart.tsx`** (if it exists)
```typescript
// Load chart library only for admin
const Chart = dynamic(() => import('recharts'), { ssr: false });
```

**Expected Impact:**
- Unused JavaScript: **15.08s → 5s**
- Initial bundle size: **-30% to -50%**
- Performance Score: **+10-15 points**

---

### 4. Fix Blog Layout Shift 🟡

**Issue:** Blog page has high CLS (0.423 mobile, 0.218 desktop)

**Root Cause:** Images loading without reserved space

**Actions:**

#### A. Add Explicit Dimensions to Images

**File: `app/(public)/blog/page.tsx`** or **`components/blog/BlogCard.tsx`**
```typescript
import Image from 'next/image';

// Before (causing CLS):
<Image src={post.image} alt={post.title} />

// After (prevents CLS):
<Image
  src={post.image}
  alt={post.title}
  width={800}
  height={450}
  className="aspect-video"
  priority={index < 2} // Priority for first 2 images
/>
```

#### B. Add Aspect Ratio Container

**File: `components/blog/BlogCard.tsx`**
```typescript
<div className="relative aspect-video w-full overflow-hidden">
  <Image
    src={post.image}
    alt={post.title}
    fill
    className="object-cover"
  />
</div>
```

#### C. Reserve Space for Dynamic Content

```typescript
// Add skeleton loaders for content that loads async
{isLoading ? (
  <div className="h-64 animate-pulse bg-gray-200" />
) : (
  <BlogContent />
)}
```

**Expected Impact:**
- CLS: **0.423 → <0.1**
- Eliminates visual jumps during page load
- Better user experience

**Files to Modify:**
- `app/(public)/blog/page.tsx:XX`
- `components/blog/BlogCard.tsx:XX`
- `components/blog/BlogPostGrid.tsx:XX` (if exists)

---

## 🟢 High-Impact Optimizations

### 5. Optimize Listings Page Performance

**Issue:** Listings page is slow on mobile (LCP: 9.89s)

**Actions:**

#### A. Implement Virtual Scrolling for Long Lists

**File: `app/(public)/listings/page.tsx`**
```typescript
// Install react-window for virtual scrolling
// npm install react-window

import { FixedSizeList } from 'react-window';

// Render only visible items
<FixedSizeList
  height={800}
  itemCount={advisors.length}
  itemSize={150}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <AdvisorCard advisor={advisors[index]} />
    </div>
  )}
</FixedSizeList>
```

#### B. Add Pagination or Infinite Scroll

**File: `app/(public)/listings/page.tsx`**
```typescript
// Limit initial results
const searchParams = {
  page: 1,
  limit: 20, // Load 20 at a time instead of all 201
};

// Add "Load More" button or intersection observer
```

#### C. Defer Filter Sidebar on Mobile

```typescript
// Lazy load filters on mobile
const FiltersPanel = dynamic(
  () => import('@/components/listing/FiltersPanel'),
  { ssr: false }
);
```

**Expected Impact:**
- Mobile LCP: **9.89s → 4s**
- Initial render: **Much faster**
- Better UX with progressive loading

**Files to Modify:**
- `app/(public)/listings/page.tsx:XX`

---

### 6. Optimize Listing Detail Page

**Issue:** Individual listing pages slow on mobile (LCP: 9.70s)

**Actions:**

#### A. Defer Reviews Section

**File: `app/(public)/listings/[slug]/page.tsx`**
```typescript
// Load reviews below the fold
const ReviewsSection = dynamic(
  () => import('@/components/listing/ReviewsSection'),
  {
    loading: () => <ReviewsSkeleton />,
    ssr: false
  }
);
```

#### B. Lazy Load Google Maps (Already Mentioned Above)

#### C. Optimize Hero Image

```typescript
// Add priority to hero image
<Image
  src={advisor.image_url}
  alt={advisor.business_name}
  width={1200}
  height={600}
  priority // Loads this image first
  className="object-cover"
/>
```

**Expected Impact:**
- Mobile LCP: **9.70s → 4.5s**
- Faster initial render
- Progressive enhancement

**Files to Modify:**
- `app/(public)/listings/[slug]/page.tsx:XX`

---

### 7. Fix Blog Article Audit

**Issue:** Blog article audit failed (404 error)

**Action:**

#### A. Update Audit Configuration

**File: `scripts/audits/config/pages.json`**
```json
{
  "name": "blog-article",
  "url": "http://localhost:3000/blog/[ACTUAL_SLUG]",
  "description": "Sample blog article page",
  "tier": 2,
  "priority": "important"
}
```

Find actual blog slug:
```bash
# Check what blog posts exist
curl http://localhost:3000/api/blog/posts
# or visit http://localhost:3000/blog and click on a post
```

#### B. Re-run Audit

```bash
npm run audit
```

**Expected Impact:**
- Get accurate blog article metrics
- Identify blog-specific issues

**Files to Modify:**
- `scripts/audits/config/pages.json:24-29`

---

## 🟡 Medium Priority Optimizations

### 8. Implement Static Generation (ISR)

**Issue:** Every page is server-rendered on request

**Action:**

**File: `app/(public)/listings/[slug]/page.tsx`**
```typescript
// Add static generation
export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  // Pre-generate top 50 most popular advisors
  const advisors = await fetchTopAdvisors(50);

  return advisors.map((advisor) => ({
    slug: advisor.slug,
  }));
}
```

**File: `app/(public)/blog/[slug]/page.tsx`**
```typescript
// Static generation for blog posts
export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await fetchAllBlogPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}
```

**Expected Impact:**
- Server response time: **Instant** for cached pages
- LCP improvement: **1-2 seconds**
- Better scalability

---

### 9. Add Resource Hints

**File: `app/layout.tsx`**
```typescript
export const metadata = {
  // ... existing metadata
  other: {
    'dns-prefetch': 'https://res.cloudinary.com',
    'preconnect': [
      'https://res.cloudinary.com',
      'https://maps.googleapis.com',
    ],
  },
};
```

**Or add to `<head>` manually:**
```html
<link rel="dns-prefetch" href="https://res.cloudinary.com" />
<link rel="preconnect" href="https://res.cloudinary.com" crossorigin />
<link rel="preconnect" href="https://maps.googleapis.com" />
```

**Expected Impact:**
- Faster third-party resource loading
- Small LCP improvement

---

### 10. Optimize Fonts

**File: `app/layout.tsx`**
```typescript
// If using custom fonts, optimize loading
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Shows fallback font while loading
  preload: true,
});
```

**Expected Impact:**
- Prevent font-related layout shifts
- Faster text rendering

---

## 🟢 Low Priority / Quick Wins

### 11. Add Loading Skeletons

Create skeleton components for better perceived performance:

**File: `components/loading/AdvisorCardSkeleton.tsx`**
```typescript
export default function AdvisorCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded" />
      <div className="mt-2 h-4 bg-gray-200 rounded w-3/4" />
      <div className="mt-2 h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );
}
```

Use in listings:
```typescript
<Suspense fallback={<AdvisorCardSkeleton />}>
  <AdvisorCard advisor={advisor} />
</Suspense>
```

---

### 12. Enable Compression (Production)

**File: `next.config.mjs`**
```javascript
const nextConfig = {
  compress: true, // Enable gzip compression
};
```

Already enabled by default in Next.js, but verify in production.

---

### 13. Optimize Third-Party Scripts

**File: `app/layout.tsx`** (if using Google Analytics)
```typescript
import Script from 'next/script';

<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_ID"
  strategy="afterInteractive" // or "lazyOnload"
/>
```

---

## 📈 Accessibility Improvements

### Current State
- Desktop Accessibility: **81/100** 🟡
- Mobile Accessibility: **81/100** 🟡
- Target: **>90/100**

### Common Issues to Address

Review detailed HTML reports for specific violations, but common issues include:

#### 1. Color Contrast
```css
/* Ensure 4.5:1 ratio for normal text */
.text-gray-500 { color: #6B7280; } /* Check against background */
```

#### 2. Form Labels
```typescript
// Ensure all inputs have labels
<label htmlFor="search">Search Advisors</label>
<input id="search" type="text" />
```

#### 3. Alt Text
```typescript
// All images must have descriptive alt text
<Image src={...} alt="John Smith, Hockey Advisor in Toronto" />
```

#### 4. ARIA Attributes
```typescript
// Add proper ARIA labels
<button aria-label="Close modal" onClick={handleClose}>
  <X className="h-4 w-4" />
</button>
```

### Action Plan

1. **Run Accessibility Audit:**
   ```bash
   # Open detailed HTML report
   start lighthouse-results/2025-11-05/homepage/desktop.html
   ```

2. **Fix identified issues** in order of impact
3. **Re-audit** to verify fixes
4. **Document** accessibility compliance for WCAG 2.1 AA

**Target Files:**
- Review all pages in `app/(public)/`
- Review all components in `components/`
- Focus on forms, buttons, images, and navigation

---

## 🔍 SEO Improvements

### Current State
- Desktop SEO: **73/100** 🟡
- Mobile SEO: **73/100** 🟡
- Target: **>90/100**

### Common Issues

#### 1. Missing Meta Descriptions (Blog Pages)

**File: `app/(public)/blog/page.tsx`**
```typescript
export const metadata = {
  title: 'Hockey Advisor Blog | Latest Industry Insights',
  description: 'Expert articles and insights from hockey advisors. Stay updated on the latest trends, tips, and best practices in the hockey advisory industry.',
};
```

**File: `app/(public)/blog/[slug]/page.tsx`**
```typescript
export async function generateMetadata({ params }) {
  const post = await fetchBlogPost(params.slug);

  return {
    title: post.title,
    description: post.excerpt || post.content.substring(0, 155),
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  };
}
```

#### 2. Structured Data

**File: `app/(public)/listings/[slug]/page.tsx`**
```typescript
// Add LocalBusiness schema
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: advisor.business_name,
      description: advisor.bio,
      address: {
        '@type': 'PostalAddress',
        streetAddress: advisor.address,
        addressLocality: advisor.city,
        addressRegion: advisor.state,
        postalCode: advisor.postal_code,
      },
      aggregateRating: advisor.average_rating && {
        '@type': 'AggregateRating',
        ratingValue: advisor.average_rating,
        reviewCount: advisor.review_count,
      },
    }),
  }}
/>
```

---

## 🗓️ Implementation Roadmap

### Phase 1: Quick Wins (1-2 hours)
- ✅ Run production build
- ✅ Re-audit on production build
- ✅ Fix blog article URL in audit config
- ✅ Add image dimensions to blog cards
- ✅ Add priority to hero images

### Phase 2: Critical Fixes (3-4 hours)
- 🔧 Implement lazy loading for Google Maps
- 🔧 Add dynamic imports for below-fold content
- 🔧 Fix blog layout shift issues
- 🔧 Optimize listings page with pagination
- 🔧 Test and validate improvements

### Phase 3: Performance Optimization (4-5 hours)
- 🔧 Implement ISR for popular pages
- 🔧 Add virtual scrolling to listings
- 🔧 Optimize JavaScript bundles
- 🔧 Add resource hints
- 🔧 Re-audit and measure improvements

### Phase 4: Accessibility & SEO (2-3 hours)
- 🔧 Review and fix accessibility issues
- 🔧 Add missing meta descriptions
- 🔧 Implement structured data
- 🔧 Final audit and verification

### Total Estimated Time: 10-14 hours

---

## 📊 Success Metrics

### Target Scores (Post-Optimization)

**Desktop:**
- Performance: **>90** (currently 66)
- Accessibility: **>90** (currently 81)
- Best Practices: **>95** (currently 83)
- SEO: **>90** (currently 73)

**Mobile:**
- Performance: **>70** (currently 43) 🔴 **CRITICAL**
- Accessibility: **>90** (currently 81)
- Best Practices: **>95** (currently 83)
- SEO: **>90** (currently 73)

**Core Web Vitals:**
- LCP: **<2.5s** (mobile currently 6.69s) 🔴
- CLS: **<0.1** (currently 0.071) ✅
- TBT/INP: **<200ms** (mobile currently 1.23s) 🔴

### Validation

After each phase:
```bash
npm run audit
```

Compare results in `lighthouse-results/` directory.

---

## 🔄 Continuous Monitoring

### 1. Add Lighthouse CI

**File: `.github/workflows/lighthouse.yml`**
```yaml
name: Lighthouse CI
on: [push, pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm run audit
```

### 2. Set Up Performance Budget

**File: `scripts/audits/config/budget.json`**
```json
{
  "performance": 80,
  "accessibility": 90,
  "best-practices": 90,
  "seo": 90,
  "lcp": 2500,
  "cls": 0.1
}
```

### 3. Weekly Audits

Add to project routine:
- Run audits after major features
- Compare trends over time
- Set up alerts for regressions

---

## 📚 Resources

- [Next.js Performance Optimization](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Schema.org Documentation](https://schema.org/)

---

## 🚀 Next Steps

1. **Review this document** with the team
2. **Prioritize fixes** based on launch timeline
3. **Start with Phase 1** (Quick Wins)
4. **Run production build** and audit
5. **Compare baseline results** to production
6. **Implement critical fixes** (Phase 2)
7. **Measure and iterate**

---

**Document Version:** 1.0
**Last Updated:** November 5, 2025
**Owner:** Development Team
**Status:** Ready for Implementation
