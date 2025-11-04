# Performance Optimization Guide for The Hockey Directory

**Last Updated:** November 4, 2025

This document outlines performance optimization strategies and recommendations for The Hockey Directory to achieve >90 Lighthouse scores.

## Table of Contents
1. [Current Status](#current-status)
2. [Image Optimization](#image-optimization)
3. [Code Splitting](#code-splitting)
4. [Caching Strategy](#caching-strategy)
5. [Database Optimization](#database-optimization)
6. [Bundle Size Optimization](#bundle-size-optimization)
7. [Rendering Performance](#rendering-performance)
8. [Third-Party Scripts](#third-party-scripts)
9. [Performance Monitoring](#performance-monitoring)
10. [Implementation Checklist](#implementation-checklist)

---

## Current Status

### Performance Goals
- **Lighthouse Performance Score:** >90
- **First Contentful Paint (FCP):** <1.8s
- **Largest Contentful Paint (LCP):** <2.5s
- **Time to Interactive (TTI):** <3.8s
- **Cumulative Layout Shift (CLS):** <0.1
- **Total Blocking Time (TBT):** <300ms

### Completed Optimizations
- ✅ Next.js 14 with App Router (automatic code splitting)
- ✅ Image optimization with next/image
- ✅ Static page generation where possible
- ✅ Database indexing on critical fields
- ✅ Tailwind CSS (utility-first, tree-shakeable)

### Required Optimizations
- [ ] Implement ISR (Incremental Static Regeneration)
- [ ] Lazy load non-critical components
- [ ] Optimize Google Maps loading
- [ ] Implement advanced caching strategies
- [ ] Optimize bundle size
- [ ] Implement service worker for offline support
- [ ] Add loading skeletons
- [ ] Optimize third-party scripts

---

## Image Optimization

### Next.js Image Component

Replace all `<img>` tags with Next.js `<Image>` component:

```tsx
// Before
<img src={advisor.logo_url} alt={advisor.name} />

// After
import Image from 'next/image'

<Image
  src={advisor.logo_url}
  alt={advisor.name}
  width={200}
  height={200}
  placeholder="blur"
  blurDataURL={generateBlurDataURL(advisor.logo_url)}
  loading="lazy"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### Cloudinary Integration

Configure Cloudinary for automatic optimization:

```typescript
// lib/cloudinary.ts
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    quality?: 'auto' | number
    format?: 'auto' | 'webp' | 'avif'
  } = {}
) {
  const {
    width = 800,
    height,
    quality = 'auto',
    format = 'auto',
  } = options

  const baseUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`

  const transformations = [
    `w_${width}`,
    height ? `h_${height}` : null,
    `q_${quality}`,
    `f_${format}`,
    'c_fill',
    'g_auto', // Auto crop
  ].filter(Boolean).join(',')

  return `${baseUrl}/${transformations}/${publicId}`
}
```

Usage:
```tsx
<Image
  src={getOptimizedImageUrl(advisor.logo_public_id, { width: 400, format: 'webp' })}
  alt={advisor.name}
  width={400}
  height={400}
/>
```

### Responsive Images

Use srcSet for different viewport sizes:

```tsx
<Image
  src={featuredImage}
  alt={imageAlt}
  width={1200}
  height={630}
  sizes="(max-width: 640px) 100vw,
         (max-width: 1024px) 80vw,
         1200px"
  priority={isFeatured} // Load immediately for above-the-fold images
/>
```

### Image Format Priority
1. **AVIF** (best compression) - Use where supported
2. **WebP** (good compression) - Fallback for older browsers
3. **JPEG/PNG** (universal support) - Final fallback

### Lazy Loading

```tsx
// Lazy load images below the fold
<Image
  src={imageUrl}
  alt={imageAlt}
  loading="lazy"
  width={800}
  height={600}
/>

// Priority load for above-the-fold images
<Image
  src={heroImage}
  alt="Hero"
  priority
  width={1920}
  height={1080}
/>
```

---

## Code Splitting

### Dynamic Imports

Lazy load non-critical components:

```tsx
// components/lazy-loaded.tsx
import dynamic from 'next/dynamic'

// Lazy load Google Maps
const LocationMap = dynamic(
  () => import('@/components/listing/LocationMap'),
  {
    loading: () => <MapSkeleton />,
    ssr: false, // Don't render on server (Google Maps requires window)
  }
)

// Lazy load heavy components
const RichTextEditor = dynamic(
  () => import('@/components/editor/RichTextEditor'),
  {
    loading: () => <EditorSkeleton />,
    ssr: false,
  }
)

// Lazy load modal content
const ContactModal = dynamic(
  () => import('@/components/forms/ContactModal'),
  {
    loading: () => <div>Loading...</div>,
  }
)
```

### Route-Based Code Splitting

Next.js automatically code-splits by route. Ensure heavy dependencies are imported only where needed:

```tsx
// Good - Import only in admin routes
// app/(admin)/admin/blog/new/page.tsx
import RichTextEditor from '@/components/editor/RichTextEditor'

// Bad - Don't import in public routes
// app/(public)/listings/page.tsx
import RichTextEditor from '@/components/editor/RichTextEditor' // ❌
```

### Component-Level Code Splitting

```tsx
// Split large component libraries
const Icons = {
  Search: dynamic(() => import('react-icons/fa').then(mod => ({ default: mod.FaSearch }))),
  User: dynamic(() => import('react-icons/fa').then(mod => ({ default: mod.FaUser }))),
  Star: dynamic(() => import('react-icons/fa').then(mod => ({ default: mod.FaStar }))),
}
```

---

## Caching Strategy

### Incremental Static Regeneration (ISR)

Implement ISR for listing and blog pages:

```tsx
// app/(public)/listings/[slug]/page.tsx
export const revalidate = 3600 // Revalidate every hour

export async function generateStaticParams() {
  const supabase = await createClient()
  const { data: advisors } = await supabase
    .from('advisors')
    .select('slug')
    .eq('is_published', true)
    .limit(100) // Generate top 100 pages at build time

  return advisors?.map((advisor) => ({
    slug: advisor.slug,
  })) || []
}

export default async function AdvisorPage({ params }: { params: { slug: string } }) {
  // This page will be statically generated and revalidated every hour
  const advisor = await getAdvisorBySlug(params.slug)
  return <AdvisorDetails advisor={advisor} />
}
```

```tsx
// app/(public)/blog/[slug]/page.tsx
export const revalidate = 600 // Revalidate every 10 minutes

export async function generateStaticParams() {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('status', 'published')
    .limit(50) // Generate top 50 blog posts at build time

  return posts?.map((post) => ({
    slug: post.slug,
  })) || []
}
```

### API Route Caching

Add caching headers to API routes:

```tsx
// app/api/advisors/route.ts
export async function GET(request: Request) {
  const advisors = await getAdvisors()

  return NextResponse.json(advisors, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  })
}
```

### Browser Caching

Configure Next.js to cache static assets:

```js
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        ],
      },
    ]
  },
}
```

### Redis Caching (Optional)

For high-traffic scenarios, implement Redis caching:

```typescript
// lib/cache/redis.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // Try to get from cache
  const cached = await redis.get<T>(key)
  if (cached) return cached

  // Fetch fresh data
  const data = await fetcher()

  // Cache for next time
  await redis.set(key, data, { ex: ttl })

  return data
}

// Usage
const advisors = await getCached(
  'advisors:featured',
  async () => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('advisors')
      .select('*')
      .eq('is_featured', true)
      .limit(6)
    return data
  },
  3600 // Cache for 1 hour
)
```

---

## Database Optimization

### Query Optimization

```sql
-- Add indexes for frequently queried columns (ALREADY IMPLEMENTED)
CREATE INDEX IF NOT EXISTS idx_advisors_slug ON advisors(slug);
CREATE INDEX IF NOT EXISTS idx_advisors_location ON advisors USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_advisors_rating ON advisors(average_rating DESC, review_count DESC);
CREATE INDEX IF NOT EXISTS idx_advisors_search ON advisors USING GIN(search_vector);

-- Add composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_advisors_published_featured ON advisors(is_published, is_featured, average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_advisors_published_location ON advisors(is_published) WHERE location IS NOT NULL;
```

### Select Only Required Columns

```typescript
// Bad - Fetching all columns
const { data } = await supabase
  .from('advisors')
  .select('*')

// Good - Fetch only what you need
const { data } = await supabase
  .from('advisors')
  .select('id, name, slug, logo_url, average_rating, review_count, city, state')
```

### Pagination

Always use pagination for lists:

```typescript
const PAGE_SIZE = 30

const { data, count } = await supabase
  .from('advisors')
  .select('*', { count: 'exact' })
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
```

### Connection Pooling

Supabase automatically handles connection pooling. For custom Postgres connections:

```typescript
// lib/db/pool.ts
import { Pool } from 'pg'

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

---

## Bundle Size Optimization

### Analyze Bundle

```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Configure in next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // your config
})

# Run analysis
ANALYZE=true npm run build
```

### Tree Shaking

Import only what you need:

```typescript
// Bad
import _ from 'lodash' // Imports entire library (70KB)

// Good
import debounce from 'lodash/debounce' // Only imports debounce (2KB)

// Even better - use native alternatives
const debounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
```

### Remove Unused Dependencies

```bash
# Find unused dependencies
npx depcheck

# Remove unused packages
npm uninstall <package-name>
```

### Use Lighter Alternatives

```typescript
// Heavy: moment.js (288KB)
import moment from 'moment'

// Light: date-fns (13KB tree-shakeable)
import { format, parseISO } from 'date-fns'

// Even lighter: native Intl API (0KB)
new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium'
}).format(new Date())
```

---

## Rendering Performance

### Loading Skeletons

Replace loading spinners with content skeletons:

```tsx
// components/skeletons/AdvisorCardSkeleton.tsx
export function AdvisorCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 h-48 w-full rounded-t-lg" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  )
}

// Usage
<Suspense fallback={<AdvisorCardSkeleton />}>
  <AdvisorCard advisor={advisor} />
</Suspense>
```

### Debounce Heavy Operations

```typescript
// lib/hooks/use-debounce.ts
import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Usage in search
const [searchTerm, setSearchTerm] = useState('')
const debouncedSearchTerm = useDebounce(searchTerm, 300)

useEffect(() => {
  if (debouncedSearchTerm) {
    searchAdvisors(debouncedSearchTerm)
  }
}, [debouncedSearchTerm])
```

### Virtual Scrolling

For very long lists (100+ items), implement virtual scrolling:

```bash
npm install react-window
```

```tsx
import { FixedSizeList } from 'react-window'

function AdvisorList({ advisors }: { advisors: Advisor[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <AdvisorCard advisor={advisors[index]} />
    </div>
  )

  return (
    <FixedSizeList
      height={800}
      itemCount={advisors.length}
      itemSize={300}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}
```

### Memoization

Prevent unnecessary re-renders:

```tsx
import { memo, useMemo, useCallback } from 'react'

// Memoize expensive components
export const AdvisorCard = memo(function AdvisorCard({ advisor }: { advisor: Advisor }) {
  return <div>{/* Card content */}</div>
})

// Memoize expensive calculations
function SearchResults({ advisors, filters }: Props) {
  const filteredAdvisors = useMemo(() => {
    return advisors.filter(/* complex filtering logic */)
  }, [advisors, filters])

  const handleClick = useCallback((id: string) => {
    // Handle click
  }, [])

  return <div>{/* Results */}</div>
}
```

---

## Third-Party Scripts

### Google Maps Optimization

Load Google Maps only when needed:

```tsx
// components/listing/LocationMap.tsx
import { useEffect, useState } from 'react'

export function LocationMap({ lat, lng }: { lat: number; lng: number }) {
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    // Load Google Maps script dynamically
    if (!window.google) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => setMapLoaded(true)
      document.head.appendChild(script)
    } else {
      setMapLoaded(true)
    }
  }, [])

  if (!mapLoaded) {
    return <MapSkeleton />
  }

  return <div id="map">{/* Google Map */}</div>
}
```

Or use next/script:

```tsx
import Script from 'next/script'

export function LocationMap() {
  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
        strategy="lazyOnload"
        onLoad={() => initializeMap()}
      />
      <div id="map" />
    </>
  )
}
```

### Google Analytics Optimization

```tsx
// app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* Load Google Analytics with partytown */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </body>
    </html>
  )
}
```

---

## Performance Monitoring

### Lighthouse CI

```bash
# Install Lighthouse CI
npm install --save-dev @lhci/cli

# Create lighthouserc.json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run start",
      "url": [
        "http://localhost:3000",
        "http://localhost:3000/listings",
        "http://localhost:3000/blog"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}

# Run Lighthouse CI
npm run build
npx lhci autorun
```

### Web Vitals Monitoring

```tsx
// app/web-vitals.tsx
'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_label: metric.id,
        non_interaction: true,
      })
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(metric)
    }
  })

  return null
}

// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <WebVitals />
      </body>
    </html>
  )
}
```

### Performance API

```typescript
// lib/performance.ts
export function measurePerformance(name: string) {
  const start = performance.now()

  return {
    end: () => {
      const duration = performance.now() - start
      console.log(`${name} took ${duration.toFixed(2)}ms`)

      // Send to analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'timing_complete', {
          name,
          value: Math.round(duration),
          event_category: 'Performance',
        })
      }
    },
  }
}

// Usage
const perf = measurePerformance('Search Advisors')
const results = await searchAdvisors(query)
perf.end()
```

---

## Implementation Checklist

### Priority 1: High Impact (Implement First)
- [ ] Convert all images to Next.js Image component
- [ ] Implement ISR for listing pages (revalidate: 3600)
- [ ] Implement ISR for blog pages (revalidate: 600)
- [ ] Add loading skeletons for all async components
- [ ] Lazy load Google Maps component
- [ ] Lazy load RichTextEditor component
- [ ] Add API route caching headers
- [ ] Debounce search input (300ms delay)
- [ ] Run Lighthouse audits and fix critical issues

### Priority 2: Medium Impact (Implement Next)
- [ ] Implement Cloudinary integration for image optimization
- [ ] Add Redis caching for featured advisors
- [ ] Analyze bundle size and remove unused dependencies
- [ ] Implement virtual scrolling for long lists (if needed)
- [ ] Add Web Vitals monitoring
- [ ] Optimize third-party scripts (Google Analytics, Maps)
- [ ] Add service worker for offline support
- [ ] Implement memoization for expensive components

### Priority 3: Low Impact (Implement Last)
- [ ] Add Lighthouse CI to GitHub Actions
- [ ] Implement advanced image formats (AVIF)
- [ ] Add performance budgets
- [ ] Implement CDN for static assets
- [ ] Add compression middleware
- [ ] Optimize font loading strategy
- [ ] Add preconnect/prefetch hints
- [ ] Implement HTTP/2 server push

---

## Performance Metrics Target

### Core Web Vitals
| Metric | Target | Good | Needs Improvement | Poor |
|--------|--------|------|-------------------|------|
| LCP | <2.5s | <2.5s | 2.5s - 4.0s | >4.0s |
| FID | <100ms | <100ms | 100ms - 300ms | >300ms |
| CLS | <0.1 | <0.1 | 0.1 - 0.25 | >0.25 |

### Lighthouse Scores
| Category | Target | Current |
|----------|--------|---------|
| Performance | >90 | TBD |
| Accessibility | >95 | TBD |
| Best Practices | >95 | TBD |
| SEO | >95 | TBD |

### Other Metrics
- **Time to First Byte (TTFB):** <600ms
- **First Contentful Paint (FCP):** <1.8s
- **Total Blocking Time (TBT):** <300ms
- **Speed Index:** <3.4s

---

## Resources

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

### Documentation
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web.dev Performance](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [React Performance](https://react.dev/learn/render-and-commit)

---

## Contact

For performance-related questions:
- **Email:** performance@thehockeydirectory.com
- **GitHub:** [Report Issue](https://github.com/miked5167/chickadee/issues)

We continuously monitor and optimize performance for the best user experience.
