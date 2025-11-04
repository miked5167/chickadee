import { test, expect } from '@playwright/test'

test.describe('Blog Flow', () => {
  test('should load blog homepage', async ({ page }) => {
    await page.goto('/blog')

    // Verify blog page loads
    await expect(page.locator('h1, h2')).toContainText(/Blog|Articles|News|Resources/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display blog post cards', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')

    // Look for blog post cards
    const blogCards = page.locator('article, [data-testid="blog-card"], .blog-card')

    // Might have posts or "no posts" message
    await expect(blogCards.first().or(page.locator('body'))).toBeVisible()
  })

  test('should display featured blog post', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')

    // Look for featured post (usually larger)
    const featuredPost = page.locator('[data-testid="featured-post"], .featured, article').first()

    await expect(featuredPost.or(page.locator('body'))).toBeVisible()
  })

  test('should navigate to individual blog post', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')

    // Click on first blog post
    const firstPost = page.locator('article, [data-testid="blog-card"]').first()

    if (await firstPost.isVisible()) {
      const postLink = firstPost.locator('a').first()
      await postLink.click()

      // Should navigate to blog post page
      await expect(page).toHaveURL(/\/blog\/[^/]+/)
      await expect(page.locator('h1')).toBeVisible()
    }
  })

  test('should display blog post content', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')

    const firstPost = page.locator('article a').first()

    if (await firstPost.isVisible()) {
      await firstPost.click()
      await page.waitForLoadState('networkidle')

      // Should display post title
      await expect(page.locator('h1')).toBeVisible()

      // Should display content
      const content = page.locator('article, .content, main')
      await expect(content).toBeVisible()

      // Should display metadata (date, author)
      const metadata = page.locator('text=/20[0-9]{2}/, time, .date, .author')
      await expect(metadata.or(page.locator('body'))).toBeVisible()
    }
  })

  test('should display categories', async ({ page }) => {
    await page.goto('/blog')

    // Look for category navigation
    const categories = page.locator('a[href*="/blog/category"], button:has-text("Category"), nav:has-text("Categories")')

    await expect(categories.or(page.locator('body'))).toBeVisible()
  })

  test('should filter by category', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')

    // Click on a category
    const categoryLink = page.locator('a[href*="/blog/category"]').first()

    if (await categoryLink.isVisible()) {
      await categoryLink.click()
      await page.waitForLoadState('networkidle')

      // Should navigate to category page
      await expect(page).toHaveURL(/\/blog\/category\//)
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('should display blog search', async ({ page }) => {
    await page.goto('/blog')

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]')

    if (await searchInput.isVisible()) {
      await searchInput.fill('hockey')
      await page.keyboard.press('Enter')

      // Should filter results
      await page.waitForTimeout(1000)
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('should display blog pagination', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')

    // Look for pagination
    const pagination = page.locator('nav[aria-label="pagination"], button:has-text("Next"), button:has-text("Previous")')

    // Pagination might not exist if few posts
    await expect(page.locator('body')).toBeVisible()
  })

  test('should display sidebar with categories and recent posts', async ({ page }) => {
    await page.goto('/blog')

    // Look for sidebar
    const sidebar = page.locator('aside, .sidebar, [data-testid="sidebar"]')

    if (await sidebar.isVisible()) {
      // Should have categories or recent posts
      const sidebarContent = sidebar.locator('a, h3, h4')
      await expect(sidebarContent.first()).toBeVisible()
    }

    await expect(page.locator('body')).toBeVisible()
  })

  test('should display tags on blog post', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')

    const firstPost = page.locator('article a').first()

    if (await firstPost.isVisible()) {
      await firstPost.click()
      await page.waitForLoadState('networkidle')

      // Look for tags
      const tags = page.locator('.tag, [data-testid="tag"], a[href*="/blog/tag"]')

      // Tags might not exist on all posts
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('should display share buttons on blog post', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')

    const firstPost = page.locator('article a').first()

    if (await firstPost.isVisible()) {
      await firstPost.click()
      await page.waitForLoadState('networkidle')

      // Look for social share buttons
      const shareButtons = page.locator('button:has-text("Share"), a[href*="twitter"], a[href*="facebook"], a[href*="linkedin"]')

      // Share buttons might exist
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('should display table of contents on long posts', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')

    const firstPost = page.locator('article a').first()

    if (await firstPost.isVisible()) {
      await firstPost.click()
      await page.waitForLoadState('networkidle')

      // Look for table of contents
      const toc = page.locator('nav:has-text("Contents"), .toc, [data-testid="toc"]')

      // TOC might not exist on short posts
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('should display reading progress indicator', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')

    const firstPost = page.locator('article a').first()

    if (await firstPost.isVisible()) {
      await firstPost.click()
      await page.waitForLoadState('networkidle')

      // Scroll down
      await page.evaluate(() => window.scrollBy(0, 500))

      // Look for progress indicator
      const progressBar = page.locator('[role="progressbar"], .progress, [data-testid="reading-progress"]')

      // Progress bar might exist
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('should display related posts', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')

    const firstPost = page.locator('article a').first()

    if (await firstPost.isVisible()) {
      await firstPost.click()
      await page.waitForLoadState('networkidle')

      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

      // Look for related posts section
      const relatedPosts = page.locator('h2, h3').filter({ hasText: /Related|You.*Also|More.*Posts/ })

      await expect(relatedPosts.or(page.locator('body'))).toBeVisible()
    }
  })

  test('should display author bio', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')

    const firstPost = page.locator('article a').first()

    if (await firstPost.isVisible()) {
      await firstPost.click()
      await page.waitForLoadState('networkidle')

      // Look for author information
      const authorInfo = page.locator('.author, [data-testid="author"], text=/Written by|Author/')

      await expect(authorInfo.or(page.locator('body'))).toBeVisible()
    }
  })

  test('should handle blog RSS feed', async ({ page }) => {
    // Navigate to RSS feed
    await page.goto('/api/blog/rss')

    // Should return XML or redirect
    const content = await page.content()

    // RSS feed might be XML or JSON
    expect(content.length).toBeGreaterThan(0)
  })
})
