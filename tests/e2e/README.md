# End-to-End (E2E) Tests

This directory contains comprehensive E2E tests for The Hockey Directory using Playwright.

## Overview

The E2E test suite validates critical user journeys across the application with ~80 tests covering:
- Search and browse functionality
- Contact form submissions
- Review system
- Claim listing flow
- Authentication
- Homepage experience
- Blog functionality

## Test Files

### 1. `search-flow.spec.ts` (12 tests)
Tests the complete search and browse experience:
- Homepage display with hero section and search bar
- Text search functionality
- Advisor card display and navigation to detail pages
- Filtering by specialty
- Sorting options (rating, distance, alphabetical)
- Location-based search with distance calculations
- Pagination handling for large result sets
- "No results" state handling
- URL parameter persistence for shareable links

### 2. `contact-flow.spec.ts` (7 tests)
Tests lead generation and contact functionality:
- Contact button visibility on advisor pages
- Contact modal/page navigation
- Required field validation
- Email format validation
- Successful form submission with all fields
- Rate limiting behavior
- Advisor information display on contact page

### 3. `review-flow.spec.ts` (10 tests)
Tests the review submission and display system:
- Reviews section visibility on advisor pages
- "Write a Review" button display
- Authentication requirement for submissions
- Existing reviews display with ratings
- Average rating calculation and display
- Filter reviews by star rating (1-5 stars)
- Sort reviews (newest, highest rated, lowest rated)
- Pagination for many reviews
- Reviewer information display
- Verified badge display for verified reviews

### 4. `claim-flow.spec.ts` (8 tests)
Tests the listing claim workflow:
- "Claim This Listing" button for unclaimed listings
- Navigation to claim form
- Required field validation
- Successful claim request submission
- Duplicate claim prevention
- Email format validation
- Advisor info display on claim page
- Already claimed message handling

### 5. `auth-flow.spec.ts` (10 tests)
Tests authentication and user management:
- Sign in button in header
- Login page navigation
- Google OAuth button display
- Protected route authentication redirect
- User menu display when authenticated
- Menu options and dropdown
- Logout functionality
- OAuth callback handling
- Redirect URL maintenance after login
- Nav items for authenticated vs. unauthenticated users

### 6. `homepage.spec.ts` (16 tests)
Tests the landing page experience:
- Page loading with proper title
- Hero section with compelling heading
- Search bar functionality in hero
- Featured advisors section
- Trust indicators (advisor count, verification badges)
- "How It Works" section
- Call-to-action buttons
- Navigation menu functionality
- Footer with links (legal, social, categories)
- Newsletter signup form
- Social media links
- Mobile menu toggle on small screens
- Responsive design on mobile viewports
- SEO meta tags (description, Open Graph)
- Console error checking for runtime issues

### 7. `blog-flow.spec.ts` (17 tests)
Tests the blog and content experience:
- Blog homepage loading
- Blog post cards in grid layout
- Featured post display
- Navigation to individual blog posts
- Blog post content rendering
- Categories navigation and filtering
- Blog search functionality
- Pagination for many posts
- Sidebar with categories and recent posts
- Tags display on posts
- Social share buttons
- Table of contents for long posts
- Reading progress indicator
- Related posts section
- Author bio display
- RSS feed availability

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

### Run All Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test search-flow.spec.ts

# Run specific test
npx playwright test -g "should search for advisors"
```

### Debug Tests

```bash
# Debug mode with inspector
npm run test:e2e:debug

# Debug specific test
npx playwright test --debug search-flow.spec.ts
```

### View Test Reports

```bash
# Show HTML report after test run
npm run test:e2e:report
```

## Test Configuration

Tests are configured in `playwright.config.ts`:

**Test Projects:**
- Desktop Chrome (Chromium)
- Desktop Firefox
- Desktop Safari (WebKit)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

**Features:**
- Automatic dev server startup
- Screenshot on failure
- Video recording on failure
- Trace on first retry
- Parallel execution (disabled in CI)
- Retry on CI (2 retries)

## Environment Variables

E2E tests use the following environment:
- `PLAYWRIGHT_TEST_BASE_URL`: Base URL for tests (default: http://localhost:3000)

## Test Patterns

### Flexible Selectors
Tests use flexible selectors to handle UI variations:
```typescript
// Multiple selector strategies
const button = page.locator('button, a').filter({ hasText: /Contact|Get in Touch/ })

// Fallback patterns
await expect(element.or(page.locator('fallback'))).toBeVisible()
```

### Graceful Degradation
Tests handle missing features gracefully:
```typescript
if (await element.isVisible()) {
  // Test feature if present
  await element.click()
}
// Continue with test regardless
```

### Data-Independent Tests
Tests work regardless of data state:
- Handle empty result sets
- Handle missing optional features
- Verify page loads even if specific elements don't exist

## CI/CD Integration

E2E tests are integrated into GitHub Actions:

```yaml
# .github/workflows/ci.yml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true
```

## Best Practices

1. **Wait for Network Idle**: Use `waitForLoadState('networkidle')` before assertions
2. **Use Flexible Selectors**: Combine multiple selectors with `.or()` for resilience
3. **Test User Journeys**: Focus on complete workflows, not individual elements
4. **Handle Authentication**: Mock auth state or use test credentials
5. **Screenshot on Failure**: Automatically captured for debugging
6. **Clean Test Data**: Use unique identifiers (timestamps) for form submissions

## Troubleshooting

### Tests Fail Locally

**Dev server not running:**
```bash
# Playwright automatically starts dev server
# Just ensure no other process is using port 3000
```

**Browser installation issues:**
```bash
# Reinstall browsers
npx playwright install --force
```

**Timeout errors:**
```bash
# Increase timeout in test
test.setTimeout(60000)

# Or in config
timeout: 60000
```

### Tests Pass Locally But Fail in CI

- Check that all environment variables are set
- Verify database seeds are consistent
- Ensure sufficient CI resources (memory, CPU)
- Review CI-specific configurations in playwright.config.ts

### Flaky Tests

- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Use `toBeVisible()` instead of checking element count
- Increase retry count in config
- Check for race conditions in async operations

## Writing New Tests

Template for new test file:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/feature-path')
  })

  test('should do something', async ({ page }) => {
    // Arrange
    const element = page.locator('selector')

    // Act
    await element.click()

    // Assert
    await expect(result).toBeVisible()
  })
})
```

## Coverage

E2E tests cover:
- ✅ All critical user journeys
- ✅ Form submissions and validations
- ✅ Navigation and routing
- ✅ Authentication flows
- ✅ Mobile responsive behavior
- ✅ Error states and edge cases

Not covered (separate test types):
- Unit tests → `tests/unit/` (Vitest)
- API integration → Manual testing or separate suite
- Performance testing → Lighthouse CI
- Accessibility → axe-core (separate tool)

## Maintenance

- Update selectors when UI changes
- Add tests for new features before deployment
- Review and remove flaky tests
- Keep test data realistic but minimal
- Document new test patterns in this README

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Guide](https://playwright.dev/docs/ci)
