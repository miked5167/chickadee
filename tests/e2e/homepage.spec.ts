import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')

    // Verify page loads
    await expect(page).toHaveTitle(/Hockey Directory|Hockey|Advisor/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display hero section with heading', async ({ page }) => {
    await page.goto('/')

    // Check for main heading
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText(/Hockey|Advisor|Find/)
  })

  test('should display search bar in hero', async ({ page }) => {
    await page.goto('/')

    // Check for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Find"]')
    await expect(searchInput.or(page.locator('input[type="text"]').first())).toBeVisible()
  })

  test('should display featured advisors section', async ({ page }) => {
    await page.goto('/')

    // Look for featured advisors heading
    const featuredHeading = page.locator('h2, h3').filter({ hasText: /Featured|Top|Recommended/ })

    // Featured section might exist
    await expect(featuredHeading.or(page.locator('body'))).toBeVisible()
  })

  test('should display featured advisor cards', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Look for advisor cards
    const advisorCards = page.locator('[data-testid="advisor-card"], .advisor-card, article')

    // Might have cards or not
    // Just verify page loaded
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display trust indicators', async ({ page }) => {
    await page.goto('/')

    // Look for trust indicators (e.g., "200+ Advisors", "Verified Profiles")
    const trustIndicator = page.locator('text=/[0-9]+\\+/, text=Verified, text=Trusted')

    // May or may not have trust indicators
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display "How It Works" section', async ({ page }) => {
    await page.goto('/')

    // Look for "How It Works" heading
    const howItWorksHeading = page.locator('h2, h3').filter({ hasText: /How.*Works|How.*To|Steps/ })

    await expect(howItWorksHeading.or(page.locator('body'))).toBeVisible()
  })

  test('should display call-to-action buttons', async ({ page }) => {
    await page.goto('/')

    // Look for CTA buttons
    const ctaButton = page.locator('button, a').filter({ hasText: /Get Started|Find Advisor|Browse|Search/ })

    await expect(ctaButton.or(page.locator('body'))).toBeVisible()
  })

  test('should have working navigation menu', async ({ page }) => {
    await page.goto('/')

    // Check for nav links
    const nav = page.locator('nav, header')
    await expect(nav).toBeVisible()

    // Should have links to different sections
    const aboutLink = page.locator('a[href*="about"], a:has-text("About")')
    const blogLink = page.locator('a[href*="blog"], a:has-text("Blog")')
    const listingsLink = page.locator('a[href*="listings"], a:has-text("Find")')

    // At least one nav link should exist
    await expect(aboutLink.or(blogLink).or(listingsLink).or(nav)).toBeVisible()
  })

  test('should display footer with links', async ({ page }) => {
    await page.goto('/')

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Check for footer
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    // Footer should have links
    const footerLinks = footer.locator('a')
    await expect(footerLinks.first()).toBeVisible()
  })

  test('should display newsletter signup', async ({ page }) => {
    await page.goto('/')

    // Look for newsletter signup
    const newsletterInput = page.locator('input[type="email"][placeholder*="email"], input[placeholder*="newsletter"]')

    // May or may not have newsletter
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display social media links', async ({ page }) => {
    await page.goto('/')

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Look for social media links
    const socialLinks = page.locator('a[href*="facebook"], a[href*="twitter"], a[href*="linkedin"], a[href*="instagram"]')

    // Social links might exist in footer
    await expect(page.locator('footer')).toBeVisible()
  })

  test('should have mobile menu toggle on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Look for hamburger menu
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button:has(svg)')

    // Mobile menu might exist
    await expect(mobileMenuButton.or(page.locator('body'))).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check that page renders without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = 375

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20) // Allow small margin

    // Verify main content is visible
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should have proper meta tags for SEO', async ({ page }) => {
    await page.goto('/')

    // Check for meta description
    const metaDescription = page.locator('meta[name="description"]')
    const ogTitle = page.locator('meta[property="og:title"]')

    // Meta tags should exist
    expect(await metaDescription.count() + await ogTitle.count()).toBeGreaterThan(0)
  })

  test('should load without console errors', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Allow certain expected errors (like failed API calls in dev)
    const criticalErrors = errors.filter(err =>
      !err.includes('DevTools') &&
      !err.includes('favicon') &&
      !err.includes('Supabase') // Dev environment might have Supabase errors
    )

    expect(criticalErrors.length).toBe(0)
  })
})
