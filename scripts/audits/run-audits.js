const { default: lighthouse } = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const pages = require('./config/pages.json');
const desktopConfig = require('./config/lighthouse.json');
const mobileConfig = require('./config/lighthouse-mobile.json');

// Create timestamp for this audit run
const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const resultsDir = path.join(__dirname, '..', '..', 'lighthouse-results', timestamp);

/**
 * Run Lighthouse audit for a single page and configuration
 */
async function runAudit(url, name, formFactor, config) {
  console.log(`\n🔍 Auditing: ${name} (${formFactor})`);
  console.log(`   URL: ${url}`);

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
  });

  try {
    const options = {
      logLevel: 'info',
      output: ['html', 'json'],
      port: chrome.port,
    };

    const runnerResult = await lighthouse(url, options, config);

    // Create output directory
    const pageDir = path.join(resultsDir, name);
    await fs.mkdir(pageDir, { recursive: true });

    // Save HTML report
    const htmlPath = path.join(pageDir, `${formFactor}.html`);
    await fs.writeFile(htmlPath, runnerResult.report[0]);

    // Save JSON data
    const jsonPath = path.join(pageDir, `${formFactor}.json`);
    await fs.writeFile(jsonPath, runnerResult.report[1]);

    // Extract key metrics
    const { categories, audits } = runnerResult.lhr;
    const metrics = {
      timestamp: new Date().toISOString(),
      url,
      name,
      formFactor,
      scores: {
        performance: Math.round(categories.performance.score * 100),
        accessibility: Math.round(categories.accessibility.score * 100),
        bestPractices: Math.round(categories['best-practices'].score * 100),
        seo: Math.round(categories.seo.score * 100),
      },
      coreWebVitals: {
        lcp: audits['largest-contentful-paint']?.numericValue || null,
        cls: audits['cumulative-layout-shift']?.numericValue || null,
        tbt: audits['total-blocking-time']?.numericValue || null,
        fcp: audits['first-contentful-paint']?.numericValue || null,
        si: audits['speed-index']?.numericValue || null,
      },
      opportunities: audits['diagnostics'] ?
        Object.keys(audits)
          .filter(key => audits[key].details && audits[key].details.type === 'opportunity')
          .map(key => ({
            id: key,
            title: audits[key].title,
            overallSavingsMs: audits[key].details.overallSavingsMs || 0,
          }))
          .filter(opp => opp.overallSavingsMs > 0)
          .sort((a, b) => b.overallSavingsMs - a.overallSavingsMs)
        : [],
    };

    console.log(`   ✅ Performance: ${metrics.scores.performance}`);
    console.log(`   ✅ Accessibility: ${metrics.scores.accessibility}`);
    console.log(`   ✅ Best Practices: ${metrics.scores.bestPractices}`);
    console.log(`   ✅ SEO: ${metrics.scores.seo}`);
    console.log(`   📊 LCP: ${(metrics.coreWebVitals.lcp / 1000).toFixed(2)}s`);
    console.log(`   📊 CLS: ${metrics.coreWebVitals.cls?.toFixed(3) || 'N/A'}`);

    return metrics;
  } finally {
    await chrome.kill();
  }
}

/**
 * Run all audits
 */
async function runAllAudits() {
  console.log('🚀 Starting Lighthouse Audits');
  console.log(`📁 Results will be saved to: ${resultsDir}`);
  console.log(`📊 Auditing ${pages.length} pages × 2 viewports = ${pages.length * 2} total audits\n`);

  const allResults = [];
  let completedCount = 0;
  const totalAudits = pages.length * 2;

  // Create results directory
  await fs.mkdir(resultsDir, { recursive: true });

  // Run audits for each page (desktop and mobile)
  for (const page of pages) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📄 Page: ${page.name} (${page.description})`);
    console.log(`${'='.repeat(80)}`);

    try {
      // Desktop audit
      const desktopResults = await runAudit(page.url, page.name, 'desktop', desktopConfig);
      allResults.push(desktopResults);
      completedCount++;
      console.log(`\n✅ Progress: ${completedCount}/${totalAudits} audits complete`);

      // Small delay between audits
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mobile audit
      const mobileResults = await runAudit(page.url, page.name, 'mobile', mobileConfig);
      allResults.push(mobileResults);
      completedCount++;
      console.log(`\n✅ Progress: ${completedCount}/${totalAudits} audits complete`);

      // Small delay between pages
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`\n❌ Error auditing ${page.name}:`, error.message);
    }
  }

  // Save summary
  const summaryPath = path.join(resultsDir, 'summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(allResults, null, 2));

  console.log(`\n${'='.repeat(80)}`);
  console.log('✅ All audits complete!');
  console.log(`📁 Results saved to: ${resultsDir}`);
  console.log(`📊 Summary saved to: ${summaryPath}`);
  console.log(`${'='.repeat(80)}\n`);

  return allResults;
}

// Run if called directly
if (require.main === module) {
  runAllAudits()
    .then(() => {
      console.log('✅ Audit process completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Audit process failed:', error);
      process.exit(1);
    });
}

module.exports = { runAllAudits };
