/**
 * Discord Access via Playwright - EXPERIMENTAL
 *
 * ⚠️  WARNING: This may violate Discord's Terms of Service
 * ⚠️  Your account could be banned
 * ⚠️  Use Discord's official API instead
 *
 * This is for educational purposes only
 */

import { chromium } from 'playwright';

async function accessDiscordChannel() {
  console.log('⚠️  WARNING: Automated Discord access may violate ToS');
  console.log('Consider using Discord API instead\n');

  const browser = await chromium.launch({
    headless: false, // Show browser so you can see what's happening
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  try {
    console.log('1. Navigating to Discord...');
    await page.goto('https://discord.com/channels/1032361689678610463/1032361690311962757', {
      waitUntil: 'networkidle',
    });

    console.log('2. Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Check if we're redirected to login
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('/login')) {
      console.log('\n❌ Not logged in - redirected to login page');
      console.log('\nOptions:');
      console.log('1. Log in manually in the browser (recommended for testing)');
      console.log('2. Provide credentials (NOT recommended - security risk)');
      console.log('3. Use stored authentication cookies');
      console.log('4. Use Discord API instead (BEST option)');

      // Wait for manual login
      console.log('\n⏳ Waiting 60 seconds for you to log in manually...');
      await page.waitForTimeout(60000);

      // Try navigating again after login
      await page.goto('https://discord.com/channels/1032361689678610463/1032361690311962757');
      await page.waitForTimeout(5000);
    }

    // Check if we successfully accessed the channel
    const isLoggedIn = !page.url().includes('/login');

    if (isLoggedIn) {
      console.log('✅ Successfully accessed Discord');

      // Try to get channel name
      console.log('\n3. Looking for channel information...');

      // Discord uses complex selectors - this may need adjustment
      const channelName = await page.locator('h3[class*="title"]').first().textContent().catch(() => null);
      if (channelName) {
        console.log(`Channel: ${channelName}`);
      }

      // Try to get recent messages
      console.log('\n4. Looking for messages...');
      const messages = await page.locator('[class*="message"]').count();
      console.log(`Found ${messages} message elements`);

      // Take a screenshot
      await page.screenshot({ path: 'discord-screenshot.png', fullPage: true });
      console.log('\n📸 Screenshot saved to discord-screenshot.png');

    } else {
      console.log('❌ Could not access Discord channel');
      console.log('Still on login page or blocked');
    }

  } catch (error) {
    console.error('Error accessing Discord:', error);
  } finally {
    console.log('\n⏳ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// Run
accessDiscordChannel()
  .then(() => {
    console.log('\n✅ Script complete');
    console.log('\n💡 Recommendation: Use Discord API instead of Playwright');
  })
  .catch(error => {
    console.error('Error:', error);
  });
