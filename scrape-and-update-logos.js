const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read cookies from the exported JSON file
const cookiesPath = 'c:\\Users\\miked\\Downloads\\www.eliteprospects.com_json_1762861884441.json';
const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));

// Convert cookies to a cookie string
const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

const headers = {
  'Cookie': cookieString,
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Referer': 'https://www.eliteprospects.com/',
};

async function getAdvisorsList() {
  console.log('Fetching agent portal page...');
  const response = await axios.get('https://www.eliteprospects.com/agent-portal', { headers });
  const html = response.data;

  const linkRegex = /href="\/agent-portal\/(\d+)\/([^"]+)"/g;
  const advisors = [];
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    advisors.push({
      id: match[1],
      slug: match[2],
      url: `https://www.eliteprospects.com/agent-portal/${match[1]}/${match[2]}`
    });
  }

  return Array.from(new Map(advisors.map(a => [a.id, a])).values());
}

async function scrapeAdvisorLogo(advisor) {
  try {
    const response = await axios.get(advisor.url, { headers });
    const html = response.data;

    let name = '';
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      name = titleMatch[1].replace(' - Elite Prospects', '').replace(' - EliteProspects.com', '').trim();
    }

    let logoUrl = null;

    // Look for logo in img tags
    const logoPatterns = [
      /<img[^>]+src="([^"]+)"[^>]*(?:class="[^"]*(?:logo|profile|company|brand)[^"]*"|alt="[^"]*logo[^"]*")/gi,
      /https:\/\/files\.eliteprospects\.com\/layout\/agency\/[^"'\s]+/gi,
    ];

    for (const pattern of logoPatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        logoUrl = matches[0].replace(/^<img[^>]+src="/, '').replace(/".*$/, '');
        if (logoUrl && !logoUrl.includes('placeholder') && !logoUrl.includes('no-logo')) {
          break;
        }
      }
    }

    if (logoUrl && !logoUrl.startsWith('http')) {
      logoUrl = `https://www.eliteprospects.com${logoUrl}`;
    }

    return {
      id: advisor.id,
      slug: advisor.slug,
      name: name || advisor.slug.replace(/-/g, ' '),
      url: advisor.url,
      logoUrl
    };
  } catch (error) {
    return {
      id: advisor.id,
      slug: advisor.slug,
      name: advisor.slug.replace(/-/g, ' '),
      url: advisor.url,
      logoUrl: null,
      error: error.message
    };
  }
}

async function downloadLogo(advisorData) {
  if (!advisorData.logoUrl || advisorData.logoUrl.includes('placeholder') || advisorData.logoUrl.includes('no-logo')) {
    return null;
  }

  try {
    const response = await axios.get(advisorData.logoUrl, {
      headers,
      responseType: 'arraybuffer',
      timeout: 10000
    });

    let ext = '.png';
    const contentType = response.headers['content-type'];
    if (contentType) {
      if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
      else if (contentType.includes('png')) ext = '.png';
      else if (contentType.includes('svg')) ext = '.svg';
      else if (contentType.includes('webp')) ext = '.webp';
    } else {
      // Guess from URL
      if (advisorData.logoUrl.endsWith('.jpg') || advisorData.logoUrl.endsWith('.jpeg')) ext = '.jpg';
      else if (advisorData.logoUrl.endsWith('.svg')) ext = '.svg';
      else if (advisorData.logoUrl.endsWith('.webp')) ext = '.webp';
    }

    const filename = `ep-${advisorData.slug}${ext}`;
    const filepath = path.join(__dirname, 'public', filename);

    fs.writeFileSync(filepath, response.data);
    return `/${filename}`;
  } catch (error) {
    console.error(`Error downloading logo for ${advisorData.slug}:`, error.message);
    return null;
  }
}

function normalizeAdvisorName(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function matchWithDatabase(epAdvisorData) {
  const normalized = normalizeAdvisorName(epAdvisorData.name);

  // Query database for matching advisor
  const { data, error } = await supabase
    .from('advisors')
    .select('id, name, slug, logo_url')
    .or(`name.ilike.%${normalized}%,slug.ilike.%${epAdvisorData.slug}%`);

  if (error || !data || data.length === 0) {
    return null;
  }

  // Find best match
  let bestMatch = null;
  let highestScore = 0;

  for (const advisor of data) {
    const nameNorm = normalizeAdvisorName(advisor.name);
    let score = 0;

    // Exact match
    if (nameNorm === normalized) score += 100;
    // Contains match
    else if (nameNorm.includes(normalized) || normalized.includes(nameNorm)) score += 50;
    // Word overlap
    else {
      const words1 = normalized.split(' ');
      const words2 = nameNorm.split(' ');
      const overlap = words1.filter(w => words2.includes(w)).length;
      score += overlap * 10;
    }

    // Slug match bonus
    if (advisor.slug === epAdvisorData.slug) score += 50;

    if (score > highestScore) {
      highestScore = score;
      bestMatch = advisor;
    }
  }

  return highestScore > 30 ? bestMatch : null;
}

async function updateAdvisorLogo(advisorId, logoPath) {
  const { error } = await supabase
    .from('advisors')
    .update({ logo_url: logoPath })
    .eq('id', advisorId);

  if (error) {
    console.error(`Error updating advisor ${advisorId}:`, error.message);
    return false;
  }

  return true;
}

async function main() {
  console.log('Starting Elite Prospects logo scraper and updater...\n');

  // Get list of advisors
  const advisors = await getAdvisorsList();
  console.log(`Found ${advisors.length} advisors on Elite Prospects\n`);

  const results = [];
  let processed = 0;
  let matched = 0;
  let updated = 0;

  for (const advisor of advisors) {
    processed++;

    if (processed % 10 === 0) {
      console.log(`Progress: ${processed}/${advisors.length} (${Math.round(processed/advisors.length*100)}%)`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));

    // Scrape advisor page
    const epData = await scrapeAdvisorLogo(advisor);

    if (!epData.logoUrl || epData.logoUrl.includes('placeholder')) {
      continue;
    }

    // Match with database
    const dbMatch = await matchWithDatabase(epData);

    if (dbMatch) {
      matched++;
      console.log(`✓ Matched: ${epData.name} -> ${dbMatch.name}`);

      // Download logo
      const logoPath = await downloadLogo(epData);

      if (logoPath) {
        // Update database
        const success = await updateAdvisorLogo(dbMatch.id, logoPath);
        if (success) {
          updated++;
          console.log(`  ✓ Updated logo for ${dbMatch.name}`);
        }
      }

      results.push({
        epName: epData.name,
        dbName: dbMatch.name,
        dbId: dbMatch.id,
        logoUrl: epData.logoUrl,
        localPath: logoPath,
        updated: !!logoPath
      });
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total advisors on EP: ${advisors.length}`);
  console.log(`Matched with database: ${matched}`);
  console.log(`Logos updated: ${updated}`);

  // Save results
  fs.writeFileSync(
    path.join(__dirname, 'logo-update-results.json'),
    JSON.stringify(results, null, 2)
  );

  console.log(`\nResults saved to logo-update-results.json`);
}

main().catch(console.error);
