/**
 * Test Logo Detection Script
 * Tests logo detection on a specific website
 */

import Firecrawl from '@mendable/firecrawl-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

if (!FIRECRAWL_API_KEY) {
  throw new Error('FIRECRAWL_API_KEY is required');
}

const firecrawl = new Firecrawl({ apiKey: FIRECRAWL_API_KEY });

/**
 * Extract logo URL from scraped website content
 */
function extractLogoFromContent(markdown: string, html: string, url: string): string | null {
  console.log('\n=== TESTING LOGO DETECTION STRATEGIES ===\n');

  // Strategy 1: Look for og:image in HTML
  console.log('Strategy 1: Checking og:image meta tag...');
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    const logoUrl = ogImageMatch[1];
    console.log('✓ Found og:image:', logoUrl);
    if (logoUrl && !logoUrl.includes('default') && !logoUrl.includes('placeholder')) {
      return makeAbsoluteUrl(logoUrl, url);
    }
  } else {
    console.log('✗ No og:image found');
  }

  // Strategy 2: Look for images with "logo" keyword in various attributes
  console.log('\nStrategy 2: Checking img tags with "logo" keyword...');
  const logoImgRegex = /<img[^>]*(?:class|id|alt|src|data-src)=["'][^"']*logo[^"']*["'][^>]*>/gi;
  const logoImgMatches = html.match(logoImgRegex);
  if (logoImgMatches) {
    console.log(`✓ Found ${logoImgMatches.length} img tags with "logo"`);
    logoImgMatches.forEach((tag, i) => {
      console.log(`  [${i + 1}] ${tag.substring(0, 150)}...`);
    });
    for (const imgTag of logoImgMatches) {
      const srcMatch = imgTag.match(/(?:src|data-src)=["']([^"']+)["']/i);
      if (srcMatch) {
        const logoUrl = srcMatch[1];
        if (logoUrl && !logoUrl.includes('data:image') && !logoUrl.includes('placeholder')) {
          console.log('  → Using:', logoUrl);
          return makeAbsoluteUrl(logoUrl, url);
        }
      }
    }
  } else {
    console.log('✗ No img tags with "logo" found');
  }

  // Strategy 3: Look for SVG with "logo" in class/id
  console.log('\nStrategy 3: Checking SVG with "logo" keyword...');
  const svgLogoRegex = /<svg[^>]*(?:class|id)=["'][^"']*logo[^"']*["'][^>]*>[\s\S]*?<\/svg>/gi;
  const svgMatches = html.match(svgLogoRegex);
  if (svgMatches && svgMatches.length > 0) {
    console.log(`✓ Found ${svgMatches.length} SVG elements with "logo"`);
    const svgImageMatch = svgMatches[0].match(/<image[^>]*(?:href|xlink:href)=["']([^"']+)["']/i);
    if (svgImageMatch) {
      console.log('  → Using:', svgImageMatch[1]);
      return makeAbsoluteUrl(svgImageMatch[1], url);
    }
  } else {
    console.log('✗ No SVG with "logo" found');
  }

  // Strategy 4: Look for images with "brand" keyword
  console.log('\nStrategy 4: Checking img tags with "brand" keyword...');
  const brandImgRegex = /<img[^>]*(?:class|id|alt)=["'][^"']*brand[^"']*["'][^>]*>/gi;
  const brandImgMatches = html.match(brandImgRegex);
  if (brandImgMatches) {
    console.log(`✓ Found ${brandImgMatches.length} img tags with "brand"`);
    for (const imgTag of brandImgMatches) {
      const srcMatch = imgTag.match(/(?:src|data-src)=["']([^"']+)["']/i);
      if (srcMatch) {
        const logoUrl = srcMatch[1];
        if (logoUrl && !logoUrl.includes('data:image') && !logoUrl.includes('placeholder')) {
          console.log('  → Using:', logoUrl);
          return makeAbsoluteUrl(logoUrl, url);
        }
      }
    }
  } else {
    console.log('✗ No img tags with "brand" found');
  }

  // Strategy 5: Look for images in header/nav with specific patterns
  console.log('\nStrategy 5: Checking images in <header> tag...');
  const headerRegex = /<header[^>]*>[\s\S]*?<\/header>/i;
  const headerMatch = html.match(headerRegex);
  if (headerMatch) {
    console.log('✓ Found <header> tag');
    const headerHtml = headerMatch[0];
    const headerImgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    const headerImages = [];
    while ((imgMatch = headerImgRegex.exec(headerHtml)) !== null) {
      headerImages.push(imgMatch[1]);
    }
    console.log(`  Found ${headerImages.length} images in header:`);
    headerImages.forEach((img, i) => {
      console.log(`    [${i + 1}] ${img}`);
    });

    for (const imgUrl of headerImages) {
      if (imgUrl && !imgUrl.includes('data:image') &&
          (imgUrl.toLowerCase().includes('logo') ||
           imgUrl.toLowerCase().includes('brand') ||
           imgUrl.match(/\.(png|svg)$/i))) {
        console.log('  → Using:', imgUrl);
        return makeAbsoluteUrl(imgUrl, url);
      }
    }
  } else {
    console.log('✗ No <header> tag found');
  }

  // Strategy 6: Look for nav area images
  console.log('\nStrategy 6: Checking images in <nav> tag...');
  const navRegex = /<nav[^>]*>[\s\S]*?<\/nav>/i;
  const navMatch = html.match(navRegex);
  if (navMatch) {
    console.log('✓ Found <nav> tag');
    const navHtml = navMatch[0];
    const navImgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    const navImages = [];
    while ((imgMatch = navImgRegex.exec(navHtml)) !== null) {
      navImages.push(imgMatch[1]);
    }
    console.log(`  Found ${navImages.length} images in nav:`);
    navImages.forEach((img, i) => {
      console.log(`    [${i + 1}] ${img}`);
    });

    for (const imgUrl of navImages) {
      if (imgUrl && !imgUrl.includes('data:image') &&
          (imgUrl.toLowerCase().includes('logo') ||
           imgUrl.toLowerCase().includes('brand') ||
           imgUrl.match(/\.(png|svg)$/i))) {
        console.log('  → Using:', imgUrl);
        return makeAbsoluteUrl(imgUrl, url);
      }
    }
  } else {
    console.log('✗ No <nav> tag found');
  }

  // Strategy 7: Look for schema.org logo
  console.log('\nStrategy 7: Checking schema.org logo...');
  const schemaLogoMatch = html.match(/"logo":\s*"([^"]+)"/i);
  if (schemaLogoMatch) {
    console.log('✓ Found schema.org logo:', schemaLogoMatch[1]);
    return makeAbsoluteUrl(schemaLogoMatch[1], url);
  } else {
    console.log('✗ No schema.org logo found');
  }

  // Strategy 8: Look for high-res favicon as last resort
  console.log('\nStrategy 8: Checking high-res favicon...');
  const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (faviconMatch) {
    const faviconUrl = faviconMatch[1];
    console.log('✓ Found favicon:', faviconUrl);
    if (faviconUrl && (faviconUrl.includes('192') || faviconUrl.includes('180') || faviconUrl.includes('512'))) {
      console.log('  → Using high-res favicon');
      return makeAbsoluteUrl(faviconUrl, url);
    } else {
      console.log('  → Skipping (not high-res)');
    }
  } else {
    console.log('✗ No favicon found');
  }

  return null;
}

/**
 * Convert relative URL to absolute URL
 */
function makeAbsoluteUrl(logoUrl: string, baseUrl: string): string {
  try {
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      return logoUrl;
    }

    const base = new URL(baseUrl);

    if (logoUrl.startsWith('//')) {
      return `${base.protocol}${logoUrl}`;
    }

    if (logoUrl.startsWith('/')) {
      return `${base.protocol}//${base.host}${logoUrl}`;
    }

    return `${base.protocol}//${base.host}/${logoUrl}`;
  } catch (error) {
    return logoUrl;
  }
}

async function testWebsite(url: string) {
  console.log('='.repeat(80));
  console.log('LOGO DETECTION TEST');
  console.log('='.repeat(80));
  console.log(`\nTesting: ${url}\n`);

  try {
    console.log('Scraping website with Firecrawl...');
    const result = await firecrawl.scrape(url, {
      formats: ['markdown', 'html'],
      onlyMainContent: false,
      timeout: 30000,
    });

    if (!result.markdown || !result.html) {
      console.error('Failed to scrape website content');
      return;
    }

    console.log('✓ Successfully scraped website\n');
    console.log(`HTML length: ${result.html.length} characters`);
    console.log(`Markdown length: ${result.markdown.length} characters\n`);

    // Debug: Show all images on the page
    console.log('=== ALL IMAGES ON PAGE ===\n');
    const allImgRegex = /<img[^>]*>/gi;
    const allImages = result.html.match(allImgRegex);
    if (allImages && allImages.length > 0) {
      console.log(`Found ${allImages.length} total <img> tags on page:\n`);
      allImages.slice(0, 20).forEach((img, i) => {
        console.log(`[${i + 1}] ${img}\n`);
      });
      if (allImages.length > 20) {
        console.log(`... and ${allImages.length - 20} more\n`);
      }
    } else {
      console.log('No <img> tags found on page\n');
    }

    // Debug: Show all SVGs on the page
    console.log('=== ALL SVGs ON PAGE ===\n');
    const allSvgRegex = /<svg[^>]*>[\s\S]*?<\/svg>/gi;
    const allSvgs = result.html.match(allSvgRegex);
    if (allSvgs && allSvgs.length > 0) {
      console.log(`Found ${allSvgs.length} total <svg> elements on page:\n`);
      allSvgs.slice(0, 5).forEach((svg, i) => {
        console.log(`[${i + 1}] ${svg.substring(0, 300)}...\n`);
      });
      if (allSvgs.length > 5) {
        console.log(`... and ${allSvgs.length - 5} more\n`);
      }
    } else {
      console.log('No <svg> elements found on page\n');
    }

    const logoUrl = extractLogoFromContent(result.markdown, result.html, url);

    console.log('\n' + '='.repeat(80));
    console.log('RESULT');
    console.log('='.repeat(80));

    if (logoUrl) {
      console.log(`\n✓ Logo found: ${logoUrl}\n`);
    } else {
      console.log('\n✗ No logo found - would use placeholder\n');
    }

    // Save HTML for manual inspection if needed
    console.log('Tip: You can save the HTML to a file for manual inspection if needed');

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Get URL from command line or use default
const testUrl = process.argv[2] || 'https://2112hockeyagency.com/';
testWebsite(testUrl);
