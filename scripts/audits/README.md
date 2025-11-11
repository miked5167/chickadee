# Lighthouse Audit Scripts

Automated Lighthouse auditing system for The Hockey Directory project.

## Overview

These scripts run comprehensive Lighthouse audits on key pages of the application, measuring:
- **Performance** - Page load speed, Core Web Vitals
- **Accessibility** - WCAG compliance, screen reader support
- **Best Practices** - Security, modern web standards
- **SEO** - Search engine optimization

## Quick Start

### Prerequisites

1. **Development server must be running:**
   ```bash
   npm run dev
   ```

2. **Ensure server is accessible at http://localhost:3000**

### Running Audits

Run audits with a single command:

```bash
npm run audit
```

This will:
1. Run Lighthouse audits on all configured pages
2. Test both desktop and mobile viewports
3. Save detailed HTML and JSON reports
4. Generate a comprehensive markdown summary

## What Gets Audited

The script audits **6 pages × 2 viewports = 12 total audits:**

### Tier 1 - Critical Pages
- **Homepage** - Main landing page
- **Listings Page** - Search/filter interface
- **Listing Detail** - Individual advisor profile

### Tier 2 - Important Pages
- **Blog Homepage** - Article listings
- **Blog Article** - Sample post
- **Demo Dashboard** - Feature showcase

## Configuration

### Pages Configuration

Edit `scripts/audits/config/pages.json` to add/remove pages:

```json
{
  "name": "page-name",
  "url": "http://localhost:3000/path",
  "description": "Page description",
  "tier": 1,
  "priority": "critical"
}
```

### Lighthouse Configuration

Desktop settings: `scripts/audits/config/lighthouse.json`
Mobile settings: `scripts/audits/config/lighthouse-mobile.json`

Customize:
- Throttling settings
- Screen emulation
- Audit categories
- Performance budgets

## Output Structure

```
lighthouse-results/
└── 2025-11-05/                    # Date of audit
    ├── summary.json               # All results in JSON
    ├── REPORT.md                  # Comprehensive markdown report
    ├── homepage/
    │   ├── desktop.html          # Visual report
    │   ├── desktop.json          # Raw data
    │   ├── mobile.html
    │   └── mobile.json
    ├── listings/
    ├── listing-detail/
    ├── blog/
    ├── blog-article/
    └── demo-dashboard/
```

## Understanding Results

### Lighthouse Scores (0-100)

- **90-100** 🟢 Good - No action needed
- **50-89** 🟡 Needs Improvement - Optimize when possible
- **0-49** 🔴 Poor - Immediate attention required

### Core Web Vitals

**Largest Contentful Paint (LCP)**
- 🟢 Good: < 2.5s
- 🟡 Needs Work: 2.5s - 4.0s
- 🔴 Poor: > 4.0s

**Cumulative Layout Shift (CLS)**
- 🟢 Good: < 0.1
- 🟡 Needs Work: 0.1 - 0.25
- 🔴 Poor: > 0.25

**Total Blocking Time (TBT)**
- 🟢 Good: < 200ms
- 🟡 Needs Work: 200ms - 600ms
- 🔴 Poor: > 600ms

### Interpreting the Report

1. **Executive Summary** - Overall health of the site
2. **Key Issues** - Prioritized problems to fix
3. **Page-by-Page Analysis** - Detailed scores for each page
4. **Optimization Opportunities** - Specific fixes with time savings
5. **Recommendations** - Action plan for improvements

## Common Optimizations

Based on typical Lighthouse findings:

### Performance

- **Reduce unused JavaScript** - Code splitting, lazy loading
- **Optimize images** - Proper sizing, modern formats (WebP)
- **Minimize main-thread work** - Reduce JavaScript execution time
- **Eliminate render-blocking resources** - Defer non-critical CSS/JS
- **Use HTTP/2** - Parallel resource loading
- **Enable text compression** - Gzip/Brotli

### Accessibility

- **Color contrast** - Ensure 4.5:1 ratio for normal text
- **Alt text** - Descriptive alt attributes on images
- **Form labels** - Proper label associations
- **ARIA attributes** - Correct usage of ARIA roles
- **Keyboard navigation** - Ensure all interactive elements are keyboard-accessible
- **Heading hierarchy** - Proper H1-H6 structure

### Best Practices

- **HTTPS** - Secure connections only
- **No console errors** - Fix JavaScript errors
- **Modern JavaScript** - Avoid deprecated APIs
- **Image aspect ratios** - Prevent layout shifts
- **CSP headers** - Content Security Policy

### SEO

- **Meta descriptions** - Unique, descriptive meta tags
- **Title tags** - Descriptive page titles
- **Mobile-friendly** - Responsive design
- **Structured data** - Schema.org markup
- **Robots.txt** - Proper crawl configuration
- **Sitemap** - XML sitemap for search engines

## Tracking Progress

Run audits periodically and compare results:

```bash
# Run baseline audit
npm run audit

# Make optimizations
# ...

# Run follow-up audit
npm run audit

# Compare results in lighthouse-results/ directory
```

## Integration with CI/CD

To run audits automatically:

1. **GitHub Actions** - Add to `.github/workflows/lighthouse.yml`
2. **Pre-deployment** - Run before production deploys
3. **Scheduled** - Weekly/monthly audits
4. **Pull Requests** - Compare before/after changes

## Troubleshooting

### "Chrome failed to start"

Ensure Chrome/Chromium is installed:
```bash
# Windows: Chrome should be installed
# Linux: sudo apt-get install chromium-browser
# Mac: Lighthouse uses system Chrome
```

### "Port 3000 is not accessible"

Verify dev server is running:
```bash
npm run dev
```

### "Timeout waiting for page load"

Increase timeout in audit script or check for:
- Network issues
- Long-running database queries
- Missing environment variables

### "Module not found: chrome-launcher"

Install dependencies:
```bash
npm install --save-dev chrome-launcher
```

## Advanced Usage

### Run audits programmatically

```javascript
const { runAllAudits } = require('./run-audits');

(async () => {
  const results = await runAllAudits();
  console.log('Audits complete:', results);
})();
```

### Generate report from existing results

```bash
node scripts/audits/generate-report.js 2025-11-05
```

### Audit specific pages only

Modify `pages.json` to include only desired pages, then run:
```bash
npm run audit
```

## Best Practices

1. **Run audits on stable build** - Avoid running during active development
2. **Use consistent environment** - Same hardware, network conditions
3. **Run multiple times** - Average results to account for variance
4. **Focus on trends** - Track improvements over time
5. **Fix high-impact issues first** - Prioritize by time savings
6. **Test mobile** - Mobile performance is critical

## Resources

- [Lighthouse Docs](https://developers.google.com/web/tools/lighthouse)
- [Core Web Vitals](https://web.dev/vitals/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)

## Support

For issues with the audit scripts:
1. Check this README for troubleshooting
2. Verify dev server is running
3. Review console output for errors
4. Check lighthouse-results/ for detailed reports

---

**Last Updated:** November 5, 2025
