# SEO Research Scripts

Automated SEO research tools using DataForSEO API.

## Quick Start

```bash
# Keyword research
npm run seo:keywords

# Competitor analysis
npm run seo:competitors

# Local SEO analysis
npm run seo:local

# Run all three
npm run seo:all
```

## Scripts

### keyword-research.ts
- Analyzes keyword search volumes
- Finds related keywords
- Identifies opportunities
- Duration: 15-20 minutes
- Cost: ~$0.50

### competitor-analysis.ts
- Tracks competitor rankings
- Identifies dominant players
- Finds gaps and opportunities
- Duration: 10-15 minutes
- Cost: ~$0.30

### local-seo-analysis.ts
- Analyzes 8 major hockey markets
- Gets Google Maps results
- Identifies low-competition cities
- Duration: 20-30 minutes
- Cost: ~$0.80

## Output

All reports saved to `seo-research/`:
- `keyword-research-YYYY-MM-DD.json`
- `competitor-analysis-YYYY-MM-DD.json`
- `local-seo-analysis-YYYY-MM-DD.json`

## Documentation

See full documentation: `docs/DATAFORSEO_INTEGRATION.md`

## Requirements

- DataForSEO API credentials in `.env.local`
- Node.js 18+
- Internet connection

## Troubleshooting

**"DataForSEO credentials not found"**
- Check `.env.local` has `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD`

**"429 Too Many Requests"**
- Add delays between requests
- Scripts already include 2-3 second delays

**"Insufficient credits"**
- Check balance at https://dataforseo.com/
- Add credits to continue

For more help, see `docs/DATAFORSEO_INTEGRATION.md`
