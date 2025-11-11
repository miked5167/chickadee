# Lighthouse Audit Report - The Hockey Directory

**Audit Date:** 2025-11-05
**Pages Audited:** 6 pages × 2 viewports = 12 total audits
**Generated:** 2025-11-05T13:42:33.445Z

---

## 📊 Executive Summary

### Desktop Performance

| Category | Score | Status |
|----------|-------|--------|
| Performance | 72 | 🟡 |
| Accessibility | 81 | 🟡 |
| Best Practices | 83 | 🟡 |
| SEO | 73 | 🟡 |

**Core Web Vitals (Desktop):**
- 🟢 LCP: 1.29s
- 🟢 CLS: 0.037
- 🟢 TBT: 0.14s

### Mobile Performance

| Category | Score | Status |
|----------|-------|--------|
| Performance | 41 | 🔴 |
| Accessibility | 81 | 🟡 |
| Best Practices | 83 | 🟡 |
| SEO | 73 | 🟡 |

**Core Web Vitals (Mobile):**
- 🔴 LCP: 8.18s
- 🟢 CLS: 0.071
- 🔴 TBT: 1.06s

---

## 🚨 Key Issues

### 🔴 Critical (Fix Immediately)

- mobile performance is critically low (41)
- mobile LCP is critically slow (8.18s)

### 🟡 High Priority

- desktop accessibility issues (81)
- mobile accessibility issues (81)
- "listings" page consistently underperforms (avg: 59)
- "blog" page consistently underperforms (avg: 55)
- "blog-article" page consistently underperforms (avg: 0)

### 🟢 Medium Priority

- desktop performance could be optimized (72)

---

## 📄 Page-by-Page Analysis

### homepage

**Desktop:**
- Performance: 🟢 95 | Accessibility: 🟢 96 | Best Practices: 🟢 100 | SEO: 🟢 91
- LCP: 🟢 0.69s | CLS: 🟢 0.003 | TBT: 🟢 0.09s

**Mobile:**
- Performance: 🟡 52 | Accessibility: 🟢 96 | Best Practices: 🟢 100 | SEO: 🟢 91
- LCP: 🔴 11.84s | CLS: ⚪ N/A | TBT: 🔴 0.98s

### listings

**Desktop:**
- Performance: 🟡 70 | Accessibility: 🟢 95 | Best Practices: 🟢 100 | SEO: 🟢 91
- LCP: 🟢 1.83s | CLS: 🟢 0.001 | TBT: 🟡 0.47s

**Mobile:**
- Performance: 🔴 47 | Accessibility: 🟢 100 | Best Practices: 🟢 100 | SEO: 🟢 91
- LCP: 🔴 9.74s | CLS: ⚪ N/A | TBT: 🔴 2.31s

### listing-detail

**Desktop:**
- Performance: 🟡 89 | Accessibility: 🟢 98 | Best Practices: 🟢 100 | SEO: 🟢 91
- LCP: 🟢 1.85s | CLS: 🟢 0.001 | TBT: 🟢 0.13s

**Mobile:**
- Performance: 🟡 52 | Accessibility: 🟢 98 | Best Practices: 🟢 100 | SEO: 🟢 91
- LCP: 🔴 9.75s | CLS: ⚪ N/A | TBT: 🔴 1.12s

### blog

**Desktop:**
- Performance: 🟡 79 | Accessibility: 🟢 96 | Best Practices: 🟢 100 | SEO: 🟡 83
- LCP: 🟢 1.97s | CLS: 🟡 0.218 | TBT: 🟢 0.08s

**Mobile:**
- Performance: 🔴 31 | Accessibility: 🟢 96 | Best Practices: 🟢 100 | SEO: 🟡 83
- LCP: 🔴 10.67s | CLS: 🔴 0.423 | TBT: 🔴 1.34s

### blog-article

**Desktop:**
- Performance: 🔴 0 | Accessibility: 🔴 0 | Best Practices: 🔴 0 | SEO: 🔴 0
- LCP: ⚪ N/As | CLS: ⚪ N/A | TBT: ⚪ N/As

**Mobile:**
- Performance: 🔴 0 | Accessibility: 🔴 0 | Best Practices: 🔴 0 | SEO: 🔴 0
- LCP: ⚪ N/As | CLS: ⚪ N/A | TBT: ⚪ N/As

### demo-dashboard

**Desktop:**
- Performance: 🟢 96 | Accessibility: 🟢 98 | Best Practices: 🟢 100 | SEO: 🟡 82
- LCP: 🟢 1.40s | CLS: 🟢 0.001 | TBT: 🟢 0.06s

**Mobile:**
- Performance: 🟡 62 | Accessibility: 🟢 98 | Best Practices: 🟢 100 | SEO: 🟡 82
- LCP: 🔴 7.10s | CLS: ⚪ N/A | TBT: 🟡 0.58s

---

## 🎯 Top Optimization Opportunities

The following optimizations could save the most time across all pages:

| Priority | Opportunity | Total Savings | Occurrences |
|----------|-------------|---------------|-------------|
| 🔴 HIGH | Reduce unused JavaScript | 19.24s | 10 pages |
| 🔴 HIGH | Minify JavaScript | 9.19s | 10 pages |
| 🔴 HIGH | Reduce initial server response time | 6.89s | 10 pages |
| 🟢 LOW | Preconnect to required origins | 0.33s | 1 pages |
| 🟢 LOW | Avoid serving legacy JavaScript to modern browsers | 0.31s | 3 pages |
| 🟢 LOW | Properly size images | 0.23s | 2 pages |
| 🟢 LOW | Enable text compression | 0.04s | 1 pages |

### Detailed Opportunity Breakdown

#### 1. Reduce unused JavaScript

- **Total Potential Savings:** 19.24s
- **Affected Pages:** 10
- **Pages:** homepage (desktop), homepage (mobile), listings (desktop), listings (mobile), listing-detail (desktop), listing-detail (mobile), blog (desktop), blog (mobile), demo-dashboard (desktop), demo-dashboard (mobile)

#### 2. Minify JavaScript

- **Total Potential Savings:** 9.19s
- **Affected Pages:** 10
- **Pages:** homepage (desktop), homepage (mobile), listings (desktop), listings (mobile), listing-detail (desktop), listing-detail (mobile), blog (desktop), blog (mobile), demo-dashboard (desktop), demo-dashboard (mobile)

#### 3. Reduce initial server response time

- **Total Potential Savings:** 6.89s
- **Affected Pages:** 10
- **Pages:** homepage (desktop), homepage (mobile), listings (desktop), listings (mobile), listing-detail (desktop), listing-detail (mobile), blog (desktop), blog (mobile), demo-dashboard (desktop), demo-dashboard (mobile)

#### 4. Preconnect to required origins

- **Total Potential Savings:** 0.33s
- **Affected Pages:** 1
- **Pages:** homepage (mobile)

#### 5. Avoid serving legacy JavaScript to modern browsers

- **Total Potential Savings:** 0.31s
- **Affected Pages:** 3
- **Pages:** homepage (mobile), listings (desktop), listing-detail (mobile)

#### 6. Properly size images

- **Total Potential Savings:** 0.23s
- **Affected Pages:** 2
- **Pages:** blog (desktop), blog (mobile)

#### 7. Enable text compression

- **Total Potential Savings:** 0.04s
- **Affected Pages:** 1
- **Pages:** blog (desktop)

---

## 💡 Recommendations

Based on the audit results, here are prioritized recommendations:

### High Priority (Implement First)

- **Reduce unused JavaScript** - Potential savings: 19.24s
- **Minify JavaScript** - Potential savings: 9.19s
- **Reduce initial server response time** - Potential savings: 6.89s

### Medium Priority

- Continue monitoring performance metrics

### Accessibility Improvements

The following pages need accessibility improvements:

- **blog-article** (desktop): Score 0
- **blog-article** (mobile): Score 0

👉 Review the detailed HTML reports for specific WCAG violations.

---

## 🚀 Next Steps

1. **Review Detailed Reports**: Open the HTML reports in `lighthouse-results/2025-11-05/` for detailed audits
2. **Prioritize Fixes**: Start with high-priority opportunities that affect multiple pages
3. **Implement Changes**: Make code changes based on recommendations
4. **Re-audit**: Run audits again after changes to measure improvements
5. **Monitor**: Set up continuous Lighthouse audits in your CI/CD pipeline

---

**Report generated by:** Lighthouse Audit Script
**Full results:** `lighthouse-results/2025-11-05/`
