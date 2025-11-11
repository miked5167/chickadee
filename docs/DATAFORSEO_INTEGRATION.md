# DataForSEO Integration Guide
## SEO Research & Analytics for The Hockey Directory

**Last Updated:** November 5, 2025
**Status:** ✅ Fully Integrated

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Quick Start](#quick-start)
4. [API Client](#api-client)
5. [Research Scripts](#research-scripts)
6. [Usage Examples](#usage-examples)
7. [API Costs](#api-costs)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

DataForSEO provides comprehensive SEO data including:
- **Keyword Research** - Search volumes, competition, CPC data
- **SERP Analysis** - Search engine results page data
- **Competitor Analysis** - Track competitor rankings
- **Local SEO** - Google Maps and local pack results
- **Backlink Data** - Domain authority and backlink profiles
- **On-Page SEO** - Technical SEO audits

### What's Integrated

✅ **API Client** - `lib/seo/dataforseo-client.ts`
✅ **Keyword Research Script** - `scripts/seo/keyword-research.ts`
✅ **Competitor Analysis Script** - `scripts/seo/competitor-analysis.ts`
✅ **Local SEO Analysis Script** - `scripts/seo/local-seo-analysis.ts`
✅ **NPM Scripts** - Easy command-line access

---

## Setup

### Prerequisites

- DataForSEO account (https://dataforseo.com/)
- API credentials (login email + API password)

### Environment Variables

Your credentials are stored in `.env.local`:

```bash
# DataForSEO API (SEO Research & Analytics)
DATAFORSEO_LOGIN=Miked5167@gmail.com
DATAFORSEO_PASSWORD=49efa539dadb04b1
```

⚠️ **Security Note:** These credentials are in `.env.local` which is gitignored. Never commit them to version control.

### Installation

Dependencies are already installed:
- `tsx` - For running TypeScript scripts
- Native Node.js `fetch` API

---

## Quick Start

### Run SEO Research Scripts

```bash
# Keyword research (15-20 minutes)
npm run seo:keywords

# Competitor analysis (10-15 minutes)
npm run seo:competitors

# Local SEO analysis (20-30 minutes)
npm run seo:local

# Run all three (45-60 minutes)
npm run seo:all
```

### Results Location

All reports are saved to `seo-research/`:

```
seo-research/
├── keyword-research-2025-11-05.json
├── competitor-analysis-2025-11-05.json
└── local-seo-analysis-2025-11-05.json
```

---

## API Client

### Basic Usage

```typescript
import { dataForSEO } from '@/lib/seo/dataforseo-client';

// Get keyword data
const keywords = await dataForSEO.getKeywordData([
  'hockey advisor',
  'hockey agent',
  'hockey recruiting'
]);

// Get SERP results
const serp = await dataForSEO.getSerpData('hockey advisor', 'United States');

// Get local results
const local = await dataForSEO.getLocalSearchResults(
  'hockey advisor toronto',
  'Toronto, Ontario, Canada'
);
```

### Available Methods

#### Keyword Research

```typescript
// Get search volume and competition data
getKeywordData(keywords: string[], location?: number, language?: string)

// Get related keyword suggestions
getKeywordSuggestions(keyword: string, location?: number, language?: string)

// Get keyword ideas for a seed keyword
getKeywordIdeas(keyword: string, location?: string, language?: string)
```

#### SERP Analysis

```typescript
// Get organic search results
getSerpData(keyword: string, location?: string, language?: string)

// Get local pack results (Google Maps)
getLocalSearchResults(keyword: string, location?: string)
```

#### Competitor Analysis

```typescript
// Analyze competitors in search results
getCompetitorAnalysis(keyword: string, location?: string)

// Get backlink data
getBacklinks(domain: string)

// Get domain authority metrics
getDomainMetrics(domain: string)
```

#### Technical SEO

```typescript
// On-page SEO analysis
getOnPageAnalysis(url: string)
```

#### Custom Methods

```typescript
// Pre-configured for hockey advisor research
getHockeyAdvisorKeywords()

// Analyze local competition in specific city
analyzeLocalCompetition(city: string, state: string)
```

---

## Research Scripts

### 1. Keyword Research

**Script:** `scripts/seo/keyword-research.ts`
**Command:** `npm run seo:keywords`
**Duration:** 15-20 minutes
**Cost:** ~$0.50

**What it does:**
1. Analyzes seed keywords (hockey advisor, hockey agent, etc.)
2. Gets search volume, competition, and CPC data
3. Finds related keyword opportunities
4. Identifies high-value, low-competition keywords
5. Generates comprehensive report

**Output:**
- Console report with keyword metrics
- JSON file: `seo-research/keyword-research-YYYY-MM-DD.json`
- Recommendations for target keywords

**Example Output:**
```
Top 20 Keywords by Search Volume:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1.  hockey advisor                          2900 vol  45% comp  $3.50
2.  hockey recruiting services              1800 vol  38% comp  $4.20
3.  youth hockey advisor                    1200 vol  32% comp  $2.80
...

💡 RECOMMENDATIONS
🎯 High-Volume, Low-Competition Opportunities:
1. hockey advisor near me (890 vol, 28% comp)
2. best hockey consultant (720 vol, 35% comp)
```

---

### 2. Competitor Analysis

**Script:** `scripts/seo/competitor-analysis.ts`
**Command:** `npm run seo:competitors`
**Duration:** 10-15 minutes
**Cost:** ~$0.30

**What it does:**
1. Analyzes top 20 organic results for target keywords
2. Identifies dominant competitors
3. Tracks competitor positions
4. Finds niche players and opportunities

**Output:**
- Console report with competitor rankings
- JSON file: `seo-research/competitor-analysis-YYYY-MM-DD.json`
- Competitor insights and strategies

**Example Output:**
```
Top Competitors (by appearances in SERPs):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. hockeyagent.com
   Appearances: 4/4
   Avg Position: 3.2
   Best Position: 1
   Keywords: hockey advisor, hockey agent, ...

💡 KEY INSIGHTS
🎯 Dominant Competitors (appear in 50%+ of keywords):
   • hockeyagent.com - 4 appearances, avg pos 3.2
   • eliteprospects.com - 4 appearances, avg pos 5.8
```

---

### 3. Local SEO Analysis

**Script:** `scripts/seo/local-seo-analysis.ts`
**Command:** `npm run seo:local`
**Duration:** 20-30 minutes
**Cost:** ~$0.80

**What it does:**
1. Analyzes 8 major hockey markets (Toronto, Vancouver, Boston, etc.)
2. Gets organic search results for each city
3. Gets Google Maps local pack results
4. Identifies low-competition opportunities
5. Finds national competitors

**Output:**
- Console report with city-by-city analysis
- JSON file: `seo-research/local-seo-analysis-YYYY-MM-DD.json`
- Local SEO opportunities and recommendations

**Example Output:**
```
Competition by City:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Toronto              Organic: 10  Local:  8  Competition: High
Vancouver            Organic:  9  Local:  3  Competition: Medium
Boston               Organic: 10  Local:  5  Competition: High
Minneapolis          Organic:  7  Local:  0  Competition: Low

💡 OPPORTUNITIES
🎯 Low Competition Markets (No Local Pack Results):
   • Minneapolis, Minnesota - Great opportunity for local SEO
   • Detroit, Michigan - Great opportunity for local SEO
```

---

## Usage Examples

### In Server Components

```typescript
// app/seo-research/page.tsx
import { dataForSEO } from '@/lib/seo/dataforseo-client';

export default async function SEOResearchPage() {
  const keywords = await dataForSEO.getKeywordData([
    'hockey advisor',
    'hockey agent'
  ]);

  return (
    <div>
      <h1>Keyword Research</h1>
      {/* Display keyword data */}
    </div>
  );
}
```

### In API Routes

```typescript
// app/api/seo/keywords/route.ts
import { NextResponse } from 'next/server';
import { dataForSEO } from '@/lib/seo/dataforseo-client';

export async function POST(request: Request) {
  const { keywords } = await request.json();

  try {
    const data = await dataForSEO.getKeywordData(keywords);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### Custom Analysis

```typescript
import { DataForSEOClient } from '@/lib/seo/dataforseo-client';

const client = new DataForSEOClient();

// Analyze specific city
async function analyzeCity(city: string, state: string) {
  const keyword = `hockey advisor ${city}`;
  const location = `${city}, ${state}, United States`;

  const [serp, local] = await Promise.all([
    client.getSerpData(keyword, location),
    client.getLocalSearchResults(keyword, location)
  ]);

  return { serp, local };
}

// Get keyword difficulty
async function getKeywordDifficulty(keywords: string[]) {
  const data = await client.getKeywordData(keywords);

  return keywords.map(kw => ({
    keyword: kw,
    volume: data.searchVolume,
    competition: data.competition,
    difficulty: data.competition > 0.7 ? 'Hard' :
                data.competition > 0.4 ? 'Medium' : 'Easy'
  }));
}
```

---

## API Costs

DataForSEO uses a credit-based system. Typical costs:

| Endpoint | Cost | Script Usage |
|----------|------|--------------|
| Keyword Data | $0.01-0.03 / request | Keyword Research |
| Keyword Suggestions | $0.01-0.05 / request | Keyword Research |
| SERP Data | $0.03-0.08 / request | Competitor Analysis |
| Local Pack Results | $0.05-0.10 / request | Local SEO Analysis |

### Script Costs

| Script | Estimated Cost |
|--------|----------------|
| `npm run seo:keywords` | ~$0.50 |
| `npm run seo:competitors` | ~$0.30 |
| `npm run seo:local` | ~$0.80 |
| **Total (all three)** | **~$1.60** |

💡 **Tip:** Run scripts during off-peak hours or batch research to optimize costs.

---

## Best Practices

### 1. Rate Limiting

Add delays between API calls to avoid hitting rate limits:

```typescript
// Delay between requests
await new Promise(resolve => setTimeout(resolve, 2000));
```

### 2. Error Handling

Always wrap API calls in try-catch blocks:

```typescript
try {
  const data = await dataForSEO.getKeywordData(keywords);
} catch (error) {
  console.error('DataForSEO API Error:', error);
  // Handle gracefully
}
```

### 3. Caching Results

Cache API responses to reduce costs:

```typescript
// Save results to database or file
const results = await dataForSEO.getKeywordData(keywords);
fs.writeFileSync('keyword-cache.json', JSON.stringify(results));

// Reuse cached data
const cached = JSON.parse(fs.readFileSync('keyword-cache.json', 'utf-8'));
```

### 4. Location Targeting

Use accurate location codes for better results:

```typescript
// Use location codes for precision
const USA = 2840;
const Canada = 2124;
const Toronto = 9170; // Specific city code

// Or use location names
const location = 'Toronto, Ontario, Canada';
```

### 5. Keyword Batching

Batch keywords to reduce API calls:

```typescript
// Instead of multiple calls
const result1 = await dataForSEO.getKeywordData(['keyword1']);
const result2 = await dataForSEO.getKeywordData(['keyword2']);

// Batch them together
const results = await dataForSEO.getKeywordData(['keyword1', 'keyword2']);
```

---

## Troubleshooting

### "DataForSEO credentials not found"

**Problem:** Environment variables not loaded

**Solution:**
```bash
# Verify .env.local exists
cat .env.local

# Ensure credentials are set
DATAFORSEO_LOGIN=your_email@example.com
DATAFORSEO_PASSWORD=your_api_password

# Restart dev server
npm run dev
```

### "401 Unauthorized"

**Problem:** Invalid credentials

**Solution:**
1. Check your DataForSEO dashboard
2. Verify API password (not account password)
3. Regenerate API password if needed

### "429 Too Many Requests"

**Problem:** Rate limit exceeded

**Solution:**
- Add delays between requests (2-3 seconds)
- Reduce number of concurrent requests
- Upgrade DataForSEO plan for higher limits

### "Insufficient credits"

**Problem:** No credits remaining in account

**Solution:**
1. Check balance at https://dataforseo.com/
2. Add credits to your account
3. Monitor usage to avoid unexpected charges

### Script Errors

**Problem:** TypeScript or runtime errors

**Solution:**
```bash
# Run with verbose logging
DEBUG=* npm run seo:keywords

# Check TypeScript compilation
npx tsc --noEmit

# Verify all dependencies installed
npm install
```

---

## Resources

- **DataForSEO Documentation:** https://docs.dataforseo.com/v3/
- **API Explorer:** https://app.dataforseo.com/api-dashboard
- **Pricing:** https://dataforseo.com/apis/pricing
- **Support:** support@dataforseo.com

---

## Next Steps

### Recommended Usage

1. **Week 6 (Now):** Run initial research to establish baseline
   ```bash
   npm run seo:all
   ```

2. **Week 7 (Pre-Launch):** Analyze competitor strategies
   ```bash
   npm run seo:competitors
   ```

3. **Post-Launch:** Monitor keyword rankings monthly
   ```bash
   npm run seo:keywords
   ```

4. **Quarterly:** Full local SEO analysis
   ```bash
   npm run seo:local
   ```

### Integration Ideas

- Create admin dashboard for real-time keyword tracking
- Add API endpoint for on-demand SEO analysis
- Integrate with blog to suggest optimized topics
- Build competitor monitoring alerts
- Create location-specific landing pages based on local data

---

**Questions or Issues?**

1. Check the [DataForSEO documentation](https://docs.dataforseo.com/v3/)
2. Review error messages in console output
3. Verify environment variables are set correctly
4. Check API credit balance

---

**Document Version:** 1.0
**Last Updated:** November 5, 2025
**Maintained By:** Development Team
