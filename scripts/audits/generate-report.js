const fs = require('fs').promises;
const path = require('path');

/**
 * Format milliseconds to seconds
 */
function msToSeconds(ms) {
  return ms ? (ms / 1000).toFixed(2) : 'N/A';
}

/**
 * Get status emoji based on score
 */
function getScoreStatus(score, thresholds = { good: 90, ok: 50 }) {
  if (score >= thresholds.good) return '🟢';
  if (score >= thresholds.ok) return '🟡';
  return '🔴';
}

/**
 * Get Core Web Vitals status
 */
function getCWVStatus(metric, value) {
  if (value === null || value === undefined) return '⚪';

  const thresholds = {
    lcp: { good: 2500, poor: 4000 },
    cls: { good: 0.1, poor: 0.25 },
    tbt: { good: 200, poor: 600 },
    fcp: { good: 1800, poor: 3000 },
    si: { good: 3400, poor: 5800 },
  };

  const threshold = thresholds[metric];
  if (!threshold) return '⚪';

  if (value <= threshold.good) return '🟢';
  if (value <= threshold.poor) return '🟡';
  return '🔴';
}

/**
 * Calculate average scores
 */
function calculateAverages(results) {
  const byFormFactor = {
    desktop: results.filter(r => r.formFactor === 'desktop'),
    mobile: results.filter(r => r.formFactor === 'mobile'),
  };

  const averages = {};

  for (const [formFactor, data] of Object.entries(byFormFactor)) {
    if (data.length === 0) continue;

    averages[formFactor] = {
      performance: Math.round(data.reduce((sum, r) => sum + r.scores.performance, 0) / data.length),
      accessibility: Math.round(data.reduce((sum, r) => sum + r.scores.accessibility, 0) / data.length),
      bestPractices: Math.round(data.reduce((sum, r) => sum + r.scores.bestPractices, 0) / data.length),
      seo: Math.round(data.reduce((sum, r) => sum + r.scores.seo, 0) / data.length),
      lcp: data.reduce((sum, r) => sum + (r.coreWebVitals.lcp || 0), 0) / data.length,
      cls: data.reduce((sum, r) => sum + (r.coreWebVitals.cls || 0), 0) / data.length,
      tbt: data.reduce((sum, r) => sum + (r.coreWebVitals.tbt || 0), 0) / data.length,
    };
  }

  return averages;
}

/**
 * Identify key issues across all audits
 */
function identifyKeyIssues(results) {
  const issues = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  // Check average scores
  const averages = calculateAverages(results);

  for (const [formFactor, scores] of Object.entries(averages)) {
    if (scores.performance < 50) {
      issues.critical.push(`${formFactor} performance is critically low (${scores.performance})`);
    } else if (scores.performance < 70) {
      issues.high.push(`${formFactor} performance needs improvement (${scores.performance})`);
    } else if (scores.performance < 90) {
      issues.medium.push(`${formFactor} performance could be optimized (${scores.performance})`);
    }

    if (scores.accessibility < 90) {
      issues.high.push(`${formFactor} accessibility issues (${scores.accessibility})`);
    }

    if (scores.lcp > 4000) {
      issues.critical.push(`${formFactor} LCP is critically slow (${msToSeconds(scores.lcp)}s)`);
    } else if (scores.lcp > 2500) {
      issues.high.push(`${formFactor} LCP needs improvement (${msToSeconds(scores.lcp)}s)`);
    }

    if (scores.cls > 0.25) {
      issues.high.push(`${formFactor} CLS is high (${scores.cls.toFixed(3)})`);
    } else if (scores.cls > 0.1) {
      issues.medium.push(`${formFactor} CLS could be improved (${scores.cls.toFixed(3)})`);
    }
  }

  // Find pages with consistently low scores
  const pageScores = {};
  results.forEach(r => {
    if (!pageScores[r.name]) {
      pageScores[r.name] = [];
    }
    pageScores[r.name].push(r.scores.performance);
  });

  for (const [page, scores] of Object.entries(pageScores)) {
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avgScore < 70) {
      issues.high.push(`"${page}" page consistently underperforms (avg: ${Math.round(avgScore)})`);
    }
  }

  return issues;
}

/**
 * Collect all optimization opportunities
 */
function collectOpportunities(results) {
  const opportunitiesMap = new Map();

  results.forEach(result => {
    if (result.opportunities) {
      result.opportunities.forEach(opp => {
        if (!opportunitiesMap.has(opp.id)) {
          opportunitiesMap.set(opp.id, {
            id: opp.id,
            title: opp.title,
            occurrences: 0,
            totalSavingsMs: 0,
            pages: [],
          });
        }

        const existing = opportunitiesMap.get(opp.id);
        existing.occurrences++;
        existing.totalSavingsMs += opp.overallSavingsMs;
        existing.pages.push(`${result.name} (${result.formFactor})`);
      });
    }
  });

  return Array.from(opportunitiesMap.values())
    .sort((a, b) => b.totalSavingsMs - a.totalSavingsMs);
}

/**
 * Generate comprehensive markdown report
 */
function generateReport(results, timestamp) {
  const averages = calculateAverages(results);
  const issues = identifyKeyIssues(results);
  const opportunities = collectOpportunities(results);

  let report = `# Lighthouse Audit Report - The Hockey Directory\n\n`;
  report += `**Audit Date:** ${timestamp}\n`;
  report += `**Pages Audited:** ${results.length / 2} pages × 2 viewports = ${results.length} total audits\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += `---\n\n`;

  // Executive Summary
  report += `## 📊 Executive Summary\n\n`;

  if (averages.desktop) {
    report += `### Desktop Performance\n\n`;
    report += `| Category | Score | Status |\n`;
    report += `|----------|-------|--------|\n`;
    report += `| Performance | ${averages.desktop.performance} | ${getScoreStatus(averages.desktop.performance)} |\n`;
    report += `| Accessibility | ${averages.desktop.accessibility} | ${getScoreStatus(averages.desktop.accessibility)} |\n`;
    report += `| Best Practices | ${averages.desktop.bestPractices} | ${getScoreStatus(averages.desktop.bestPractices)} |\n`;
    report += `| SEO | ${averages.desktop.seo} | ${getScoreStatus(averages.desktop.seo)} |\n\n`;

    report += `**Core Web Vitals (Desktop):**\n`;
    report += `- ${getCWVStatus('lcp', averages.desktop.lcp)} LCP: ${msToSeconds(averages.desktop.lcp)}s\n`;
    report += `- ${getCWVStatus('cls', averages.desktop.cls)} CLS: ${averages.desktop.cls.toFixed(3)}\n`;
    report += `- ${getCWVStatus('tbt', averages.desktop.tbt)} TBT: ${msToSeconds(averages.desktop.tbt)}s\n\n`;
  }

  if (averages.mobile) {
    report += `### Mobile Performance\n\n`;
    report += `| Category | Score | Status |\n`;
    report += `|----------|-------|--------|\n`;
    report += `| Performance | ${averages.mobile.performance} | ${getScoreStatus(averages.mobile.performance)} |\n`;
    report += `| Accessibility | ${averages.mobile.accessibility} | ${getScoreStatus(averages.mobile.accessibility)} |\n`;
    report += `| Best Practices | ${averages.mobile.bestPractices} | ${getScoreStatus(averages.mobile.bestPractices)} |\n`;
    report += `| SEO | ${averages.mobile.seo} | ${getScoreStatus(averages.mobile.seo)} |\n\n`;

    report += `**Core Web Vitals (Mobile):**\n`;
    report += `- ${getCWVStatus('lcp', averages.mobile.lcp)} LCP: ${msToSeconds(averages.mobile.lcp)}s\n`;
    report += `- ${getCWVStatus('cls', averages.mobile.cls)} CLS: ${averages.mobile.cls.toFixed(3)}\n`;
    report += `- ${getCWVStatus('tbt', averages.mobile.tbt)} TBT: ${msToSeconds(averages.mobile.tbt)}s\n\n`;
  }

  // Key Issues
  report += `---\n\n## 🚨 Key Issues\n\n`;

  if (issues.critical.length > 0) {
    report += `### 🔴 Critical (Fix Immediately)\n\n`;
    issues.critical.forEach(issue => report += `- ${issue}\n`);
    report += `\n`;
  }

  if (issues.high.length > 0) {
    report += `### 🟡 High Priority\n\n`;
    issues.high.forEach(issue => report += `- ${issue}\n`);
    report += `\n`;
  }

  if (issues.medium.length > 0) {
    report += `### 🟢 Medium Priority\n\n`;
    issues.medium.forEach(issue => report += `- ${issue}\n`);
    report += `\n`;
  }

  if (issues.critical.length === 0 && issues.high.length === 0 && issues.medium.length === 0) {
    report += `✅ **Great job!** No critical issues detected. All metrics are performing well.\n\n`;
  }

  // Page-by-Page Analysis
  report += `---\n\n## 📄 Page-by-Page Analysis\n\n`;

  const pageNames = [...new Set(results.map(r => r.name))];

  pageNames.forEach(pageName => {
    const pageResults = results.filter(r => r.name === pageName);
    const desktop = pageResults.find(r => r.formFactor === 'desktop');
    const mobile = pageResults.find(r => r.formFactor === 'mobile');

    report += `### ${pageName}\n\n`;

    if (desktop) {
      report += `**Desktop:**\n`;
      report += `- Performance: ${getScoreStatus(desktop.scores.performance)} ${desktop.scores.performance} | `;
      report += `Accessibility: ${getScoreStatus(desktop.scores.accessibility)} ${desktop.scores.accessibility} | `;
      report += `Best Practices: ${getScoreStatus(desktop.scores.bestPractices)} ${desktop.scores.bestPractices} | `;
      report += `SEO: ${getScoreStatus(desktop.scores.seo)} ${desktop.scores.seo}\n`;
      report += `- LCP: ${getCWVStatus('lcp', desktop.coreWebVitals.lcp)} ${msToSeconds(desktop.coreWebVitals.lcp)}s | `;
      report += `CLS: ${getCWVStatus('cls', desktop.coreWebVitals.cls)} ${desktop.coreWebVitals.cls?.toFixed(3) || 'N/A'} | `;
      report += `TBT: ${getCWVStatus('tbt', desktop.coreWebVitals.tbt)} ${msToSeconds(desktop.coreWebVitals.tbt)}s\n\n`;
    }

    if (mobile) {
      report += `**Mobile:**\n`;
      report += `- Performance: ${getScoreStatus(mobile.scores.performance)} ${mobile.scores.performance} | `;
      report += `Accessibility: ${getScoreStatus(mobile.scores.accessibility)} ${mobile.scores.accessibility} | `;
      report += `Best Practices: ${getScoreStatus(mobile.scores.bestPractices)} ${mobile.scores.bestPractices} | `;
      report += `SEO: ${getScoreStatus(mobile.scores.seo)} ${mobile.scores.seo}\n`;
      report += `- LCP: ${getCWVStatus('lcp', mobile.coreWebVitals.lcp)} ${msToSeconds(mobile.coreWebVitals.lcp)}s | `;
      report += `CLS: ${getCWVStatus('cls', mobile.coreWebVitals.cls)} ${mobile.coreWebVitals.cls?.toFixed(3) || 'N/A'} | `;
      report += `TBT: ${getCWVStatus('tbt', mobile.coreWebVitals.tbt)} ${msToSeconds(mobile.coreWebVitals.tbt)}s\n\n`;
    }
  });

  // Optimization Opportunities
  report += `---\n\n## 🎯 Top Optimization Opportunities\n\n`;

  if (opportunities.length > 0) {
    report += `The following optimizations could save the most time across all pages:\n\n`;
    report += `| Priority | Opportunity | Total Savings | Occurrences |\n`;
    report += `|----------|-------------|---------------|-------------|\n`;

    opportunities.slice(0, 10).forEach((opp, index) => {
      const priority = opp.totalSavingsMs > 2000 ? '🔴 HIGH' :
                      opp.totalSavingsMs > 1000 ? '🟡 MEDIUM' : '🟢 LOW';
      report += `| ${priority} | ${opp.title} | ${msToSeconds(opp.totalSavingsMs)}s | ${opp.occurrences} pages |\n`;
    });

    report += `\n`;
  } else {
    report += `✅ No major optimization opportunities detected. Great job!\n\n`;
  }

  // Detailed Opportunities
  if (opportunities.length > 0) {
    report += `### Detailed Opportunity Breakdown\n\n`;

    opportunities.slice(0, 10).forEach((opp, index) => {
      report += `#### ${index + 1}. ${opp.title}\n\n`;
      report += `- **Total Potential Savings:** ${msToSeconds(opp.totalSavingsMs)}s\n`;
      report += `- **Affected Pages:** ${opp.occurrences}\n`;
      report += `- **Pages:** ${opp.pages.join(', ')}\n\n`;
    });
  }

  // Recommendations
  report += `---\n\n## 💡 Recommendations\n\n`;
  report += `Based on the audit results, here are prioritized recommendations:\n\n`;

  report += `### High Priority (Implement First)\n\n`;
  const highPriorityOpps = opportunities.filter(o => o.totalSavingsMs > 1000);
  if (highPriorityOpps.length > 0) {
    highPriorityOpps.forEach(opp => {
      report += `- **${opp.title}** - Potential savings: ${msToSeconds(opp.totalSavingsMs)}s\n`;
    });
  } else {
    report += `- No high-priority optimizations needed ✅\n`;
  }
  report += `\n`;

  report += `### Medium Priority\n\n`;
  const mediumPriorityOpps = opportunities.filter(o => o.totalSavingsMs >= 500 && o.totalSavingsMs <= 1000);
  if (mediumPriorityOpps.length > 0) {
    mediumPriorityOpps.forEach(opp => {
      report += `- **${opp.title}** - Potential savings: ${msToSeconds(opp.totalSavingsMs)}s\n`;
    });
  } else {
    report += `- Continue monitoring performance metrics\n`;
  }
  report += `\n`;

  report += `### Accessibility Improvements\n\n`;
  const accessibilityIssues = results.filter(r => r.scores.accessibility < 90);
  if (accessibilityIssues.length > 0) {
    report += `The following pages need accessibility improvements:\n\n`;
    accessibilityIssues.forEach(r => {
      report += `- **${r.name}** (${r.formFactor}): Score ${r.scores.accessibility}\n`;
    });
    report += `\n👉 Review the detailed HTML reports for specific WCAG violations.\n\n`;
  } else {
    report += `✅ All pages meet accessibility standards (90+ score)\n\n`;
  }

  // Next Steps
  report += `---\n\n## 🚀 Next Steps\n\n`;
  report += `1. **Review Detailed Reports**: Open the HTML reports in \`lighthouse-results/${timestamp}/\` for detailed audits\n`;
  report += `2. **Prioritize Fixes**: Start with high-priority opportunities that affect multiple pages\n`;
  report += `3. **Implement Changes**: Make code changes based on recommendations\n`;
  report += `4. **Re-audit**: Run audits again after changes to measure improvements\n`;
  report += `5. **Monitor**: Set up continuous Lighthouse audits in your CI/CD pipeline\n\n`;

  report += `---\n\n`;
  report += `**Report generated by:** Lighthouse Audit Script\n`;
  report += `**Full results:** \`lighthouse-results/${timestamp}/\`\n`;

  return report;
}

/**
 * Main function to generate report
 */
async function main(timestamp) {
  try {
    // Read summary file
    const summaryPath = path.join(__dirname, '..', '..', 'lighthouse-results', timestamp, 'summary.json');
    const summaryData = await fs.readFile(summaryPath, 'utf-8');
    const results = JSON.parse(summaryData);

    console.log('📊 Generating comprehensive report...');

    // Generate report
    const report = generateReport(results, timestamp);

    // Save report
    const reportPath = path.join(__dirname, '..', '..', 'lighthouse-results', timestamp, 'REPORT.md');
    await fs.writeFile(reportPath, report);

    console.log(`✅ Report generated: ${reportPath}`);
    console.log('\n' + '='.repeat(80));
    console.log('📄 PREVIEW:');
    console.log('='.repeat(80));
    console.log(report.split('---')[0]); // Show executive summary
    console.log('='.repeat(80));
    console.log(`\n📁 Full report saved to: ${reportPath}`);

    return reportPath;
  } catch (error) {
    console.error('❌ Error generating report:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const timestamp = process.argv[2] || new Date().toISOString().split('T')[0];
  main(timestamp)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { generateReport, main };
