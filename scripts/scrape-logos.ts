/**
 * Logo Scraping Script
 *
 * Scrapes company logos from advisor websites using Firecrawl and uploads to Cloudinary.
 * Generates placeholder images when logos cannot be found.
 *
 * Usage:
 *   npm run scrape-logos -- --batch-size 5
 *   npm run scrape-logos -- --batch-size 12 --offset 5
 *   npm run scrape-logos -- --batch-size 12 --offset 17 --auto-approve
 *   npm run scrape-logos -- --all
 *
 * Options:
 *   --batch-size N    Process N advisors (default: 5)
 *   --offset N        Start from advisor N (default: 0)
 *   --auto-approve    Skip preview confirmation
 *   --all             Process all advisors
 *
 * Features:
 * - Scrapes logos from all advisors with website URLs
 * - Multiple logo detection strategies (og:image, img tags, favicons, schema.org)
 * - Generates placeholder images for missing logos
 * - Preview mode with confirmation before upload
 * - Rate limiting and error handling
 * - Detailed progress reporting
 */

import Firecrawl from '@mendable/firecrawl-js';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import * as readline from 'readline';
import * as https from 'https';
import * as http from 'http';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { generatePlaceholderBuffer } from '../lib/generate-placeholder';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Environment variables
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Validate environment variables
if (!FIRECRAWL_API_KEY) {
  throw new Error('FIRECRAWL_API_KEY is required');
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Supabase credentials are required');
}
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error('Cloudinary credentials are required');
}

// Initialize clients
const firecrawl = new Firecrawl({ apiKey: FIRECRAWL_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// Types
interface Advisor {
  id: string;
  name: string;
  slug: string;
  website_url: string;
  logo_url: string | null;
}

interface LogoResult {
  advisor: Advisor;
  logoUrl: string | null;
  source: 'scraped' | 'placeholder' | 'error';
  error?: string;
  imageBuffer?: Buffer;
  mimeType?: string;
}

interface ProcessedResult {
  success: number;
  scraped: number;
  placeholders: number;
  errors: number;
  skipped: number;
  details: Array<{
    name: string;
    website: string;
    status: string;
    logoUrl?: string;
    error?: string;
  }>;
}

/**
 * Download image from URL and return buffer
 */
async function downloadImage(url: string): Promise<{ buffer: Buffer; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const mimeType = response.headers['content-type'] || 'image/png';
        resolve({ buffer, mimeType });
      });
    }).on('error', reject);
  });
}

/**
 * Extract logo URL from scraped website content
 */
function extractLogoFromContent(markdown: string, html: string, url: string): string | null {
  // Strategy 1: Look for og:image in HTML
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    const logoUrl = ogImageMatch[1];
    if (logoUrl && !logoUrl.includes('default') && !logoUrl.includes('placeholder')) {
      return makeAbsoluteUrl(logoUrl, url);
    }
  }

  // Strategy 2: Look for images with "logo" keyword in various attributes
  const logoImgRegex = /<img[^>]*(?:class|id|alt|src|data-src)=["'][^"']*logo[^"']*["'][^>]*>/gi;
  const logoImgMatches = html.match(logoImgRegex);
  if (logoImgMatches) {
    for (const imgTag of logoImgMatches) {
      const srcMatch = imgTag.match(/(?:src|data-src)=["']([^"']+)["']/i);
      if (srcMatch) {
        const logoUrl = srcMatch[1];
        if (logoUrl && !logoUrl.includes('data:image') && !logoUrl.includes('placeholder')) {
          return makeAbsoluteUrl(logoUrl, url);
        }
      }
    }
  }

  // Strategy 3: Look for SVG with "logo" in class/id
  const svgLogoRegex = /<svg[^>]*(?:class|id)=["'][^"']*logo[^"']*["'][^>]*>[\s\S]*?<\/svg>/gi;
  const svgMatches = html.match(svgLogoRegex);
  if (svgMatches && svgMatches.length > 0) {
    // For SVG, we need to look for images referenced within
    const svgImageMatch = svgMatches[0].match(/<image[^>]*(?:href|xlink:href)=["']([^"']+)["']/i);
    if (svgImageMatch) {
      return makeAbsoluteUrl(svgImageMatch[1], url);
    }
  }

  // Strategy 4: Look for images with "brand" keyword
  const brandImgRegex = /<img[^>]*(?:class|id|alt)=["'][^"']*brand[^"']*["'][^>]*>/gi;
  const brandImgMatches = html.match(brandImgRegex);
  if (brandImgMatches) {
    for (const imgTag of brandImgMatches) {
      const srcMatch = imgTag.match(/(?:src|data-src)=["']([^"']+)["']/i);
      if (srcMatch) {
        const logoUrl = srcMatch[1];
        if (logoUrl && !logoUrl.includes('data:image') && !logoUrl.includes('placeholder')) {
          return makeAbsoluteUrl(logoUrl, url);
        }
      }
    }
  }

  // Strategy 5: Look for images in header/nav with specific patterns
  const headerRegex = /<header[^>]*>[\s\S]*?<\/header>/i;
  const headerMatch = html.match(headerRegex);
  if (headerMatch) {
    const headerHtml = headerMatch[0];
    const headerImgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    while ((imgMatch = headerImgRegex.exec(headerHtml)) !== null) {
      const imgUrl = imgMatch[1];
      // Look for PNG, SVG, or files with logo/brand in the name
      if (imgUrl && !imgUrl.includes('data:image') &&
          (imgUrl.toLowerCase().includes('logo') ||
           imgUrl.toLowerCase().includes('brand') ||
           imgUrl.match(/\.(png|svg)$/i))) {
        return makeAbsoluteUrl(imgUrl, url);
      }
    }
  }

  // Strategy 6: Look for nav area images
  const navRegex = /<nav[^>]*>[\s\S]*?<\/nav>/i;
  const navMatch = html.match(navRegex);
  if (navMatch) {
    const navHtml = navMatch[0];
    const navImgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    while ((imgMatch = navImgRegex.exec(navHtml)) !== null) {
      const imgUrl = imgMatch[1];
      if (imgUrl && !imgUrl.includes('data:image') &&
          (imgUrl.toLowerCase().includes('logo') ||
           imgUrl.toLowerCase().includes('brand') ||
           imgUrl.match(/\.(png|svg)$/i))) {
        return makeAbsoluteUrl(imgUrl, url);
      }
    }
  }

  // Strategy 7: Look for schema.org logo
  const schemaLogoMatch = html.match(/"logo":\s*"([^"]+)"/i);
  if (schemaLogoMatch) {
    return makeAbsoluteUrl(schemaLogoMatch[1], url);
  }

  // Strategy 8: Look for images with "removebg" in filename (background-removed images are typically logos)
  const removeBgRegex = /<img[^>]*src=["']([^"']*removebg[^"']*)["'][^>]*>/i;
  const removeBgMatch = html.match(removeBgRegex);
  if (removeBgMatch) {
    return makeAbsoluteUrl(removeBgMatch[1], url);
  }

  // Strategy 9: Look for WordPress images with low ID numbers (wp-image-1 through wp-image-50)
  // These are often logos as they're uploaded first
  const wpLogoRegex = /<img[^>]*class=["'][^"']*wp-image-([1-9]|[1-4][0-9]|50)\b[^"']*["'][^>]*src=["']([^"']+)["'][^>]*>/i;
  const wpLogoMatch = html.match(wpLogoRegex);
  if (wpLogoMatch) {
    const imgSrc = wpLogoMatch[2];
    // Make sure it's not a slider/gallery image
    if (!imgSrc.includes('slider') && !imgSrc.includes('gallery') && !imgSrc.includes('dummy')) {
      return makeAbsoluteUrl(imgSrc, url);
    }
  }

  // Strategy 10: Look for images with logo-like dimensions (roughly horizontal, reasonable size)
  // Scan first 20 images for logo dimensions
  const dimensionRegex = /<img[^>]*width=["'](\d+)["'][^>]*height=["'](\d+)["'][^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  let count = 0;
  while ((match = dimensionRegex.exec(html)) !== null && count < 20) {
    count++;
    const width = parseInt(match[1], 10);
    const height = parseInt(match[2], 10);
    const imgSrc = match[3];

    // Logo criteria: width > height, width between 100-600px, aspect ratio reasonable
    if (width > height &&
        width >= 100 && width <= 600 &&
        height >= 50 && height <= 300 &&
        !imgSrc.includes('data:image') &&
        !imgSrc.includes('dummy') &&
        !imgSrc.includes('slider') &&
        !imgSrc.includes('placeholder')) {
      return makeAbsoluteUrl(imgSrc, url);
    }
  }

  // Strategy 11: Look for high-res favicon as last resort
  const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (faviconMatch) {
    const faviconUrl = faviconMatch[1];
    // Only use favicons that are likely high-res (size indicators in filename)
    if (faviconUrl && (faviconUrl.includes('192') || faviconUrl.includes('180') || faviconUrl.includes('512'))) {
      return makeAbsoluteUrl(faviconUrl, url);
    }
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

/**
 * Scrape website for logo
 */
async function scrapeLogoFromWebsite(advisor: Advisor): Promise<LogoResult> {
  try {
    console.log(`  Scraping: ${advisor.website_url}`);

    // Use Firecrawl to get page content
    const result = await firecrawl.scrape(advisor.website_url, {
      formats: ['markdown', 'html'],
      onlyMainContent: false,
      timeout: 30000,
    });

    if (!result.markdown || !result.html) {
      throw new Error('Failed to scrape website content');
    }

    // Extract logo URL
    const logoUrl = extractLogoFromContent(result.markdown, result.html, advisor.website_url);

    if (logoUrl) {
      // Download the image
      const { buffer, mimeType } = await downloadImage(logoUrl);

      return {
        advisor,
        logoUrl,
        source: 'scraped',
        imageBuffer: buffer,
        mimeType,
      };
    } else {
      // Generate placeholder
      console.log(`  No logo found, generating placeholder`);
      const buffer = generatePlaceholderBuffer(advisor.name);

      return {
        advisor,
        logoUrl: null,
        source: 'placeholder',
        imageBuffer: buffer,
        mimeType: 'image/svg+xml',
      };
    }
  } catch (error) {
    console.error(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

    // On error, generate placeholder
    const buffer = generatePlaceholderBuffer(advisor.name);

    return {
      advisor,
      logoUrl: null,
      source: 'placeholder',
      imageBuffer: buffer,
      mimeType: 'image/svg+xml',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload logo to Cloudinary
 */
async function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string,
  advisorSlug: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'advisors/logos',
        public_id: advisorSlug,
        overwrite: true,
        transformation: [
          { width: 400, height: 400, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Upload failed: no result'));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Update advisor logo in database
 */
async function updateAdvisorLogo(advisorId: string, logoUrl: string): Promise<void> {
  const { error } = await supabase
    .from('advisors')
    .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
    .eq('id', advisorId);

  if (error) {
    throw new Error(`Failed to update database: ${error.message}`);
  }
}

/**
 * Display preview of results and ask for confirmation
 */
async function showPreviewAndConfirm(results: LogoResult[]): Promise<boolean> {
  console.log('\n' + '='.repeat(80));
  console.log('LOGO SCRAPING RESULTS - PREVIEW');
  console.log('='.repeat(80) + '\n');

  const scraped = results.filter(r => r.source === 'scraped');
  const placeholders = results.filter(r => r.source === 'placeholder');
  const errors = results.filter(r => r.error);

  console.log(`Total processed: ${results.length}`);
  console.log(`✓ Logos found: ${scraped.length}`);
  console.log(`⊕ Placeholders: ${placeholders.length}`);
  console.log(`✗ Errors: ${errors.length}\n`);

  // Show sample results
  console.log('Sample Results:');
  console.log('-'.repeat(80));

  results.slice(0, 10).forEach(result => {
    const status = result.source === 'scraped' ? '✓' : '⊕';
    const source = result.logoUrl || '(placeholder)';
    console.log(`${status} ${result.advisor.name}`);
    console.log(`  Website: ${result.advisor.website_url}`);
    console.log(`  Logo: ${source}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    console.log('');
  });

  if (results.length > 10) {
    console.log(`... and ${results.length - 10} more\n`);
  }

  // Ask for confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('\nDo you want to upload these logos to Cloudinary and update the database? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Process and upload logos
 */
async function uploadLogos(results: LogoResult[]): Promise<ProcessedResult> {
  const processed: ProcessedResult = {
    success: 0,
    scraped: 0,
    placeholders: 0,
    errors: 0,
    skipped: 0,
    details: [],
  };

  console.log('\n' + '='.repeat(80));
  console.log('UPLOADING LOGOS TO CLOUDINARY');
  console.log('='.repeat(80) + '\n');

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const progress = `[${i + 1}/${results.length}]`;

    try {
      console.log(`${progress} Uploading: ${result.advisor.name}`);

      if (!result.imageBuffer) {
        throw new Error('No image buffer available');
      }

      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(
        result.imageBuffer,
        result.mimeType || 'image/png',
        result.advisor.slug
      );

      // Update database
      await updateAdvisorLogo(result.advisor.id, cloudinaryUrl);

      processed.success++;
      if (result.source === 'scraped') {
        processed.scraped++;
      } else {
        processed.placeholders++;
      }

      processed.details.push({
        name: result.advisor.name,
        website: result.advisor.website_url,
        status: 'success',
        logoUrl: cloudinaryUrl,
      });

      console.log(`  ✓ Success: ${cloudinaryUrl}\n`);

      // Rate limiting
      if (i < results.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      processed.errors++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      processed.details.push({
        name: result.advisor.name,
        website: result.advisor.website_url,
        status: 'error',
        error: errorMessage,
      });

      console.error(`  ✗ Error: ${errorMessage}\n`);
    }
  }

  return processed;
}

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    batchSize: 5,
    offset: 0,
    autoApprove: false,
    all: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--batch-size' && args[i + 1]) {
      options.batchSize = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--offset' && args[i + 1]) {
      options.offset = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--auto-approve') {
      options.autoApprove = true;
    } else if (arg === '--all') {
      options.all = true;
    }
  }

  return options;
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();

  console.log('='.repeat(80));
  console.log('ADVISOR LOGO SCRAPING TOOL');
  console.log('='.repeat(80) + '\n');

  // Query advisors with website URLs
  console.log('Fetching advisors from database...');
  const { data: advisors, error } = await supabase
    .from('advisors')
    .select('id, name, slug, website_url, logo_url')
    .not('website_url', 'is', null)
    .order('name');

  if (error) {
    console.error('Error fetching advisors:', error);
    process.exit(1);
  }

  if (!advisors || advisors.length === 0) {
    console.log('No advisors found with website URLs');
    process.exit(0);
  }

  console.log(`Found ${advisors.length} advisors with website URLs\n`);

  // Determine which advisors to process based on options
  let advisorsToProcess: Advisor[];

  if (options.all) {
    advisorsToProcess = advisors;
    console.log(`Processing ALL ${advisorsToProcess.length} advisors...\n`);
  } else {
    const start = options.offset;
    const end = Math.min(start + options.batchSize, advisors.length);
    advisorsToProcess = advisors.slice(start, end);
    console.log(`Processing advisors ${start + 1}-${end} (batch of ${advisorsToProcess.length})...\n`);

    if (end < advisors.length) {
      console.log(`Next batch: npm run scrape-logos -- --batch-size ${options.batchSize} --offset ${end}\n`);
    } else {
      console.log('This is the last batch!\n');
    }
  }

  if (advisorsToProcess.length === 0) {
    console.log('No advisors to process in this range');
    process.exit(0);
  }

  // Scrape logos
  const results: LogoResult[] = [];

  for (let i = 0; i < advisorsToProcess.length; i++) {
    const advisor = advisorsToProcess[i];
    const progress = `[${i + 1}/${advisorsToProcess.length}]`;

    console.log(`${progress} Processing: ${advisor.name}`);

    const result = await scrapeLogoFromWebsite(advisor);
    results.push(result);

    // Rate limiting between requests
    if (i < advisorsToProcess.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Show preview and ask for confirmation (unless auto-approve)
  let confirmed = options.autoApprove;

  if (!options.autoApprove) {
    confirmed = await showPreviewAndConfirm(results);
  } else {
    console.log('\n' + '='.repeat(80));
    console.log('AUTO-APPROVE MODE - Skipping preview');
    console.log('='.repeat(80) + '\n');
  }

  if (!confirmed) {
    console.log('\nUpload cancelled by user');
    process.exit(0);
  }

  // Upload logos
  const processed = await uploadLogos(results);

  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(80) + '\n');
  console.log(`Total processed: ${advisorsToProcess.length}`);
  console.log(`✓ Successful uploads: ${processed.success}`);
  console.log(`  - Scraped logos: ${processed.scraped}`);
  console.log(`  - Placeholders: ${processed.placeholders}`);
  console.log(`✗ Errors: ${processed.errors}`);
  console.log('');

  if (processed.errors > 0) {
    console.log('Errors:');
    processed.details
      .filter(d => d.status === 'error')
      .forEach(d => {
        console.log(`  - ${d.name}: ${d.error}`);
      });
  }

  console.log('\nDone!');
}

// Run the script
main().catch(console.error);
