# Ahrefs MCP Verification Prompt

## Context

I'm working on a Hockey Directory project and have been doing SEO keyword research using DataForSEO. I just set up the Ahrefs MCP server and want to verify the data accuracy between DataForSEO and Ahrefs.

## Background

We previously ran keyword research for hockey-related categories using DataForSEO (US + Canada combined data). The results are documented in:
- `SEO_NEW_SECTIONS_STRATEGY.md` - Training, Tournaments, Prep Schools (18,820 total searches/month)
- `HOCKEY_CATEGORY_OPPORTUNITIES.md` - 12 additional categories including Equipment (139K), Camps (4,940), Coaching (2,530)

## Previous Data Discrepancy

Earlier we noticed a discrepancy between DataForSEO and Ahrefs:
- **"hockey coaching"** in DataForSEO: 1,880 searches (US + CA)
- **"hockey coaching"** in Ahrefs: 90 searches (US + CA)

DataForSEO uses Google Ads Keyword Planner data (groups related keywords), while Ahrefs uses clickstream data (exact-match only).

## Task

Please use the newly configured Ahrefs MCP tools to:

1. **Verify key hockey keywords** and compare with our DataForSEO results:
   - "hockey training"
   - "hockey coaching"
   - "hockey coach"
   - "hockey camp"
   - "hockey tournament"
   - "hockey prep school"
   - "hockey equipment"

2. **Compare the data sources:**
   - What search volumes does Ahrefs show for these keywords?
   - How do they compare to our DataForSEO data?
   - Which data source should we trust for our strategy?

3. **Check keyword difficulty and competition:**
   - Use Ahrefs to assess ranking difficulty for our target keywords
   - Identify which keywords have the best opportunity (high volume, low competition)

4. **Analyze competitors:**
   - Use Ahrefs to see what domains rank for "hockey training", "hockey camps", etc.
   - Identify our main competitors in the hockey directory space

## Expected Output

- Comparison table showing DataForSEO vs Ahrefs data
- Recommendations on which data source to use going forward
- Keyword difficulty insights
- Competitor analysis summary

## Files to Reference

- `scripts/seo/new-sections-research.ts` - Our DataForSEO keyword research script
- `scripts/seo/hockey-category-exploration.ts` - Category exploration script
- `seo-research/new-sections-keywords-2025-11-05.json` - DataForSEO results
- `seo-research/hockey-categories-2025-11-05.json` - Category research results

---

**Start Here:** First, check if the Ahrefs MCP tools are available, then run a test query to verify the connection is working.
