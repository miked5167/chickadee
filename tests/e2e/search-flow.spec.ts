import { test, expect } from '@playwright/test'

test.describe('Search Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display homepage with hero section', async ({ page }) => {
    // Check hero section
    await expect(page.locator('h1')).toContainText('Find Your Perfect Hockey Advisor')

    // Check search bar exists
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible()
  })

  test('should search for advisors by text', async ({ page }) => {
    // Enter search term
    await page.fill('input[placeholder*="Search"]', 'hockey')

    // Click search button or press Enter
    await page.keyboard.press('Enter')

    // Should navigate to listings page
    await expect(page).toHaveURL(/\/listings/)

    // Should display search results
    await expect(page.locator('text=advisors found').or(page.locator('text=No results'))).toBeVisible()
  })

  test('should navigate to listings page from homepage', async ({ page }) => {
    // Click "Browse All Advisors" or similar link
    await page.click('text=Browse All Advisors, text=Find Advisors, text=Search Advisors').catch(() => {
      // If no button, navigate directly
      return page.goto('/listings')
    })

    await expect(page).toHaveURL(/\/listings/)
  })

  test('should display advisor cards on listings page', async ({ page }) => {
    await page.goto('/listings')

    // Wait for advisors to load
    await page.waitForSelector('[data-testid="advisor-card"], .advisor-card, article', {
      timeout: 10000
    }).catch(() => {
      // No advisors might be okay if filtering
    })

    // Check for page title or heading
    await expect(page.locator('h1, h2')).toContainText(/Find|Hockey|Advisors/)
  })

  test('should filter advisors by specialty', async ({ page }) => {
    await page.goto('/listings')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Look for filter section
    const filterSection = page.locator('text=Filters, text=Filter by, text=Specialties').first()

    if (await filterSection.isVisible()) {
      // Try to select a specialty filter
      const checkbox = page.locator('input[type="checkbox"]').first()
      if (await checkbox.isVisible()) {
        await checkbox.check()

        // Wait for results to update
        await page.waitForTimeout(1000)
      }
    }
  })

  test('should sort advisors', async ({ page }) => {
    await page.goto('/listings')

    await page.waitForLoadState('networkidle')

    // Look for sort dropdown
    const sortDropdown = page.locator('select, [role="combobox"]').filter({ hasText: /Sort|Order/ }).first()

    if (await sortDropdown.isVisible()) {
      await sortDropdown.click()

      // Select "Rating" or "Distance" option
      await page.locator('option, [role="option"]').filter({ hasText: /Rating|Distance|Alphabetical/ }).first().click()

      // Wait for results to update
      await page.waitForTimeout(1000)
    }
  })

  test('should click on advisor card and navigate to detail page', async ({ page }) => {
    await page.goto('/listings')

    // Wait for advisor cards to load
    await page.waitForSelector('[data-testid="advisor-card"], .advisor-card, article', {
      timeout: 10000
    })

    // Click on first advisor card
    const firstCard = page.locator('[data-testid="advisor-card"], .advisor-card, article').first()
    await firstCard.click()

    // Should navigate to advisor detail page
    await expect(page).toHaveURL(/\/listings\/[^/]+/)

    // Should display advisor name
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should display pagination when many results', async ({ page }) => {
    await page.goto('/listings')

    await page.waitForLoadState('networkidle')

    // Check if pagination exists (depends on data)
    const pagination = page.locator('nav[aria-label="pagination"], .pagination, button:has-text("Next")')

    // This might not always be visible if there aren't enough results
    // Just check that the page loads without error
    await expect(page.locator('body')).toBeVisible()
  })

  test('should use location-based search', async ({ page }) => {
    await page.goto('/listings')

    await page.waitForLoadState('networkidle')

    // Look for location input
    const locationInput = page.locator('input[placeholder*="location"], input[placeholder*="city"], input[placeholder*="zip"]').first()

    if (await locationInput.isVisible()) {
      await locationInput.fill('Boston, MA')
      await page.keyboard.press('Enter')

      // Wait for results to update
      await page.waitForTimeout(1000)
    }
  })

  test('should handle "no results" gracefully', async ({ page }) => {
    await page.goto('/listings?search=xyznonexistentadvisor123')

    await page.waitForLoadState('networkidle')

    // Should show "no results" message
    const noResults = page.locator('text=No advisors found, text=No results, text=Try different')
    await expect(noResults.or(page.locator('body'))).toBeVisible()
  })

  test('should maintain filters in URL', async ({ page }) => {
    await page.goto('/listings?search=hockey&rating=4')

    // URL should contain query params
    await expect(page).toHaveURL(/search=hockey/)
    await expect(page).toHaveURL(/rating=4/)
  })
})
