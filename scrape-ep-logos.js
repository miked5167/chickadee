const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Read cookies from the exported JSON file
const cookiesPath = 'c:\\Users\\miked\\Downloads\\www.eliteprospects.com_json_1762861884441.json';
const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));

// Convert cookies to a cookie string for HTTP headers
const cookieString = cookies
  .map(cookie => `${cookie.name}=${cookie.value}`)
  .join('; ');

// Headers to mimic a real browser
const headers = {
  'Cookie': cookieString,
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer': 'https://www.eliteprospects.com/',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Cache-Control': 'max-age=0'
};

async function getAdvisorsList() {
  console.log('Fetching agent portal page...');
  try {
    const response = await axios.get('https://www.eliteprospects.com/agent-portal', { headers });
    const html = response.data;

    // Parse HTML to extract advisor links
    // Look for links matching pattern: /agent-portal/[number]/[slug]
    const linkRegex = /href="\/agent-portal\/(\d+)\/([^"]+)"/g;
    const advisors = [];
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const id = match[1];
      const slug = match[2];
      advisors.push({
        id,
        slug,
        url: `https://www.eliteprospects.com/agent-portal/${id}/${slug}`
      });
    }

    // Remove duplicates
    const uniqueAdvisors = Array.from(
      new Map(advisors.map(a => [a.id, a])).values()
    );

    console.log(`Found ${uniqueAdvisors.length} unique advisors`);
    return uniqueAdvisors;
  } catch (error) {
    console.error('Error fetching advisors list:', error.message);
    return [];
  }
}

async function scrapeAdvisorLogo(advisor) {
  console.log(`Scraping ${advisor.slug}...`);

  try {
    const response = await axios.get(advisor.url, { headers });
    const html = response.data;

    // Extract advisor name from page title or h1
    let name = '';
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      name = titleMatch[1].replace(' - Elite Prospects', '').trim();
    }

    // Look for logo images - try multiple patterns
    let logoUrl = null;

    // Pattern 1: Look for agent/agency logo in img tags
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*(?:alt="[^"]*logo[^"]*"|class="[^"]*logo[^"]*")/gi;
    let imgMatch = imgRegex.exec(html);
    if (imgMatch) {
      logoUrl = imgMatch[1];
    }

    // Pattern 2: Look for profile image or company branding
    if (!logoUrl) {
      const profileRegex = /<img[^>]+src="([^"]+)"[^>]*(?:class="[^"]*(?:profile|company|brand)[^"]*")/gi;
      imgMatch = profileRegex.exec(html);
      if (imgMatch) {
        logoUrl = imgMatch[1];
      }
    }

    // Pattern 3: Look for any large image near the top of the page
    if (!logoUrl) {
      const topImgRegex = /<img[^>]+src="(https:\/\/[^"]+)"[^>]*>/i;
      imgMatch = topImgRegex.exec(html);
      if (imgMatch && !imgMatch[1].includes('icon') && !imgMatch[1].includes('favicon')) {
        logoUrl = imgMatch[1];
      }
    }

    // Make logo URL absolute if it's relative
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
    console.error(`Error scraping ${advisor.slug}:`, error.message);
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
  if (!advisorData.logoUrl) {
    console.log(`No logo found for ${advisorData.slug}`);
    return null;
  }

  try {
    console.log(`Downloading logo for ${advisorData.slug}...`);
    const response = await axios.get(advisorData.logoUrl, {
      headers,
      responseType: 'arraybuffer'
    });

    // Determine file extension from content-type or URL
    let ext = '.png';
    const contentType = response.headers['content-type'];
    if (contentType) {
      if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
      else if (contentType.includes('png')) ext = '.png';
      else if (contentType.includes('svg')) ext = '.svg';
      else if (contentType.includes('webp')) ext = '.webp';
    }

    const filename = `${advisorData.slug}-logo${ext}`;
    const filepath = path.join(__dirname, 'public', filename);

    fs.writeFileSync(filepath, response.data);
    console.log(`Saved logo to ${filename}`);

    return `/${filename}`;
  } catch (error) {
    console.error(`Error downloading logo for ${advisorData.slug}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('Starting Elite Prospects logo scraper...\n');

  // Get list of advisors
  const advisors = await getAdvisorsList();

  if (advisors.length === 0) {
    console.log('No advisors found. Exiting.');
    return;
  }

  // Scrape each advisor's page
  const results = [];
  for (const advisor of advisors.slice(0, 10)) { // Start with first 10 for testing
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between requests
    const data = await scrapeAdvisorLogo(advisor);
    results.push(data);
  }

  console.log(`\nScraped ${results.length} advisor pages`);
  console.log(`Found logos for ${results.filter(r => r.logoUrl).length} advisors`);

  // Save results to JSON
  fs.writeFileSync(
    path.join(__dirname, 'ep-advisors-logos.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('\nResults saved to ep-advisors-logos.json');
  console.log('\nAdvisors with logos:');
  results.filter(r => r.logoUrl).forEach(r => {
    console.log(`  - ${r.name}: ${r.logoUrl}`);
  });

  // Ask if user wants to download logos
  console.log('\nTo download the logos, uncomment the download section in the script.');
}

main().catch(console.error);
