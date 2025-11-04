# Accessibility Guidelines for The Hockey Directory

**Last Updated:** November 4, 2025

This document outlines accessibility requirements and recommendations for The Hockey Directory to meet WCAG 2.1 AA standards.

## Table of Contents
1. [Current Status](#current-status)
2. [Keyboard Navigation](#keyboard-navigation)
3. [Screen Reader Support](#screen-reader-support)
4. [Color Contrast](#color-contrast)
5. [Form Accessibility](#form-accessibility)
6. [Interactive Elements](#interactive-elements)
7. [Images and Media](#images-and-media)
8. [Testing Tools](#testing-tools)
9. [Implementation Checklist](#implementation-checklist)

---

## Current Status

The Hockey Directory has been built with accessibility in mind, but requires additional testing and enhancements to meet WCAG 2.1 AA standards.

### Completed Accessibility Features
- ✅ Semantic HTML5 elements throughout
- ✅ Proper heading hierarchy (H1 → H2 → H3)
- ✅ Form labels associated with inputs
- ✅ Alt text on images (where implemented)
- ✅ Responsive design for various viewport sizes
- ✅ Focus-visible styles on interactive elements
- ✅ Skip to content links (implemented in Header)

### Required Improvements
- [ ] Comprehensive ARIA labels and roles
- [ ] Keyboard navigation testing across all components
- [ ] Color contrast audit
- [ ] Screen reader testing
- [ ] Focus management in modals and dialogs
- [ ] Error announcements for form validation

---

## Keyboard Navigation

### Requirements
All interactive elements must be keyboard accessible using standard keyboard shortcuts:
- **Tab**: Move forward through interactive elements
- **Shift + Tab**: Move backward through interactive elements
- **Enter/Space**: Activate buttons and links
- **Escape**: Close modals and dropdowns
- **Arrow keys**: Navigate within components (dropdowns, sliders)

### Implementation Checklist

#### Navigation Menu
```tsx
// Add keyboard event handlers to mobile menu toggle
<button
  aria-label="Toggle menu"
  aria-expanded={isOpen}
  onClick={toggleMenu}
  onKeyDown={(e) => {
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false)
    }
  }}
>
  Menu
</button>
```

#### Search Filters
```tsx
// Specialty filter checkboxes
<div role="group" aria-labelledby="specialty-filters-label">
  <h3 id="specialty-filters-label">Filter by Specialty</h3>
  {specialties.map((specialty) => (
    <label key={specialty}>
      <input
        type="checkbox"
        checked={selectedSpecialties.includes(specialty)}
        onChange={() => toggleSpecialty(specialty)}
      />
      {specialty}
    </label>
  ))}
</div>
```

#### Modal Dialogs
```tsx
// Focus trap in modals
useEffect(() => {
  if (isOpen) {
    const firstFocusable = modalRef.current?.querySelector('button, input, textarea')
    firstFocusable?.focus()
  }
}, [isOpen])

// Escape key to close
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  onKeyDown={(e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }}
>
```

#### Custom Components
- **Star Rating**: Make keyboard navigable with arrow keys
- **Distance Slider**: Ensure arrow keys adjust values
- **Pagination**: Tab through page numbers, Enter to navigate

---

## Screen Reader Support

### ARIA Labels and Descriptions

#### Advisor Cards
```tsx
<article aria-labelledby={`advisor-${id}-name`}>
  <h3 id={`advisor-${id}-name`}>{name}</h3>
  <div aria-label={`Rating: ${rating} out of 5 stars`}>
    <StarRating value={rating} />
  </div>
  <div aria-label={`${reviewCount} reviews`}>
    {reviewCount} reviews
  </div>
</article>
```

#### Search Results
```tsx
<div role="region" aria-live="polite" aria-label="Search results">
  <p>{totalResults} advisors found</p>
  <div role="list">
    {advisors.map((advisor) => (
      <div key={advisor.id} role="listitem">
        <AdvisorCard {...advisor} />
      </div>
    ))}
  </div>
</div>
```

#### Form Validation
```tsx
// Error messages
<div role="alert" aria-live="assertive" aria-atomic="true">
  {error && <p>{error}</p>}
</div>

// Input with error
<input
  id="email"
  type="email"
  aria-required="true"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? "email-error" : undefined}
/>
{errors.email && (
  <p id="email-error" className="error-text">
    {errors.email}
  </p>
)}
```

#### Loading States
```tsx
<div
  role="status"
  aria-live="polite"
  aria-label="Loading advisors"
>
  {isLoading && <Spinner />}
</div>
```

### Landmark Regions
Ensure all major sections have appropriate landmark roles:

```tsx
<header role="banner">
  <nav role="navigation" aria-label="Main navigation">
    {/* Navigation items */}
  </nav>
</header>

<main role="main" id="main-content">
  {/* Main content */}
</main>

<aside role="complementary" aria-label="Blog sidebar">
  {/* Sidebar content */}
</aside>

<footer role="contentinfo">
  {/* Footer content */}
</footer>
```

---

## Color Contrast

### WCAG 2.1 AA Requirements
- **Normal text**: Minimum contrast ratio of 4.5:1
- **Large text** (18pt or 14pt bold): Minimum contrast ratio of 3:1
- **UI components and graphics**: Minimum contrast ratio of 3:1

### Current Color Palette Audit

#### Text on Backgrounds
```css
/* Primary text on white - CHECK CONTRAST */
.text-gray-900 on bg-white: #111827 on #FFFFFF = 18.07:1 ✅

/* Secondary text on white */
.text-gray-600 on bg-white: #4B5563 on #FFFFFF = 7.93:1 ✅

/* Link text on white */
.text-blue-600 on bg-white: #2563EB on #FFFFFF = 5.14:1 ✅

/* White text on primary brand color - VERIFY */
.text-white on bg-blue-600: #FFFFFF on #2563EB = 5.14:1 ✅
```

#### Action Buttons
```css
/* Primary button */
bg-blue-600 text-white: Good contrast ✅
hover:bg-blue-700: Maintain contrast ✅

/* Secondary button */
bg-gray-200 text-gray-900: Check contrast ratio

/* Danger button */
bg-red-600 text-white: #DC2626 on #FFFFFF = Good ✅
```

#### Focus Indicators
```css
/* Ensure visible focus ring */
.focus-visible\:ring-2 {
  ring-color: theme('colors.blue.500');
  ring-offset: 2px;
}

/* Minimum 2px solid outline recommended */
*:focus-visible {
  outline: 2px solid #2563EB;
  outline-offset: 2px;
}
```

### Tools for Contrast Checking
- Chrome DevTools: Inspect element → Color contrast ratio
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)

---

## Form Accessibility

### Contact Form Enhancement
```tsx
<form aria-labelledby="contact-form-title">
  <h2 id="contact-form-title">Contact {advisorName}</h2>

  <div>
    <label htmlFor="parent-name">
      Your Name <span aria-label="required">*</span>
    </label>
    <input
      id="parent-name"
      name="parentName"
      type="text"
      required
      aria-required="true"
      aria-describedby="name-hint"
    />
    <p id="name-hint" className="text-sm text-gray-600">
      Enter your full name
    </p>
  </div>

  <div>
    <label htmlFor="email">
      Email Address <span aria-label="required">*</span>
    </label>
    <input
      id="email"
      name="email"
      type="email"
      required
      aria-required="true"
      aria-invalid={!!errors.email}
      aria-describedby={errors.email ? "email-error" : "email-hint"}
    />
    <p id="email-hint" className="text-sm text-gray-600">
      We'll never share your email
    </p>
    {errors.email && (
      <p id="email-error" role="alert" className="text-red-600">
        {errors.email}
      </p>
    )}
  </div>

  <button
    type="submit"
    disabled={isSubmitting}
    aria-busy={isSubmitting}
  >
    {isSubmitting ? 'Sending...' : 'Send Message'}
  </button>
</form>
```

### Review Form
```tsx
// Star rating accessibility
<fieldset>
  <legend>Rate your experience</legend>
  <div role="radiogroup" aria-label="Star rating">
    {[1, 2, 3, 4, 5].map((value) => (
      <label key={value}>
        <input
          type="radio"
          name="rating"
          value={value}
          aria-label={`${value} out of 5 stars`}
          checked={rating === value}
          onChange={() => setRating(value)}
        />
        <Star filled={value <= rating} />
      </label>
    ))}
  </div>
</fieldset>
```

---

## Interactive Elements

### Buttons vs Links
- **Buttons**: Use for actions (submit, toggle, open modal)
- **Links**: Use for navigation (go to page, external link)

```tsx
// Good examples
<button onClick={handleSubmit}>Submit Form</button>
<Link href="/listings">Browse Advisors</Link>

// Bad examples
<a onClick={handleSubmit}>Submit Form</a> ❌
<button onClick={() => router.push('/listings')}>Browse</button> ❌
```

### Tooltips and Popovers
```tsx
<button
  aria-describedby={showTooltip ? "tooltip-1" : undefined}
  onMouseEnter={() => setShowTooltip(true)}
  onFocus={() => setShowTooltip(true)}
  onMouseLeave={() => setShowTooltip(false)}
  onBlur={() => setShowTooltip(false)}
>
  Info
</button>
{showTooltip && (
  <div id="tooltip-1" role="tooltip">
    Additional information here
  </div>
)}
```

### Dropdowns and Menus
```tsx
<div>
  <button
    id="sort-button"
    aria-haspopup="menu"
    aria-expanded={isOpen}
    onClick={toggleMenu}
  >
    Sort by: {sortBy}
  </button>

  {isOpen && (
    <ul
      role="menu"
      aria-labelledby="sort-button"
      onKeyDown={handleKeyNavigation}
    >
      {sortOptions.map((option) => (
        <li key={option.value} role="none">
          <button
            role="menuitem"
            onClick={() => handleSort(option.value)}
          >
            {option.label}
          </button>
        </li>
      ))}
    </ul>
  )}
</div>
```

---

## Images and Media

### Alt Text Guidelines

#### Informative Images
```tsx
// Advisor logo
<img
  src={logoUrl}
  alt={`${advisorName} logo`}
  width={100}
  height={100}
/>

// Featured image on blog post
<img
  src={featuredImage}
  alt={imageAlt || `Featured image for ${postTitle}`}
/>
```

#### Decorative Images
```tsx
// Background patterns, decorative elements
<img src={patternUrl} alt="" role="presentation" />

// Or use CSS background images for purely decorative elements
<div className="bg-pattern" role="presentation" />
```

#### Icon Buttons
```tsx
// Icon with visible label - icon is decorative
<button>
  <SearchIcon aria-hidden="true" />
  <span>Search</span>
</button>

// Icon-only button - needs accessible label
<button aria-label="Close dialog">
  <XIcon aria-hidden="true" />
</button>
```

### Video and Audio
```tsx
// Ensure captions and transcripts
<video controls>
  <source src="video.mp4" type="video/mp4" />
  <track kind="captions" src="captions.vtt" label="English" default />
  <p>Your browser doesn't support video. <a href="transcript.txt">Read transcript</a></p>
</video>
```

---

## Testing Tools

### Automated Testing
1. **axe DevTools** (Browser Extension)
   - Install: [Chrome](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd) | [Firefox](https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/)
   - Run on every page
   - Fix all critical and serious issues

2. **Lighthouse** (Chrome DevTools)
   ```bash
   # Run Lighthouse audit
   npm run build
   npx lighthouse http://localhost:3000 --view
   ```
   - Target: Accessibility score >95

3. **pa11y** (Command Line)
   ```bash
   npm install -g pa11y
   pa11y http://localhost:3000
   ```

4. **jest-axe** (Automated Testing)
   ```bash
   npm install --save-dev jest-axe
   ```
   ```typescript
   import { axe, toHaveNoViolations } from 'jest-axe'
   expect.extend(toHaveNoViolations)

   test('should have no accessibility violations', async () => {
     const { container } = render(<ContactForm />)
     const results = await axe(container)
     expect(results).toHaveNoViolations()
   })
   ```

### Manual Testing

#### Keyboard Navigation Test
1. Unplug your mouse
2. Navigate the entire site using only keyboard
3. Ensure all functionality is accessible
4. Check that focus is always visible

#### Screen Reader Testing
**Windows:**
- NVDA (free): [Download](https://www.nvaccess.org/download/)
- JAWS (paid): [Freedom Scientific](https://www.freedomscientific.com/products/software/jaws/)

**Mac:**
- VoiceOver (built-in): Cmd + F5

**Test scenarios:**
- Navigate homepage
- Search for advisors
- Read listing page
- Submit contact form
- Navigate blog

#### Color Blindness Simulation
Use browser extensions to simulate different types of color blindness:
- Chrome: [Colorblinding](https://chrome.google.com/webstore/detail/colorblinding/dgbgleaofjainknadoffbjkclicbbgaa)
- Firefox: [Colorblindly](https://addons.mozilla.org/en-US/firefox/addon/colorblindly/)

---

## Implementation Checklist

### Priority 1: Critical (Must Fix)
- [ ] Add ARIA labels to all form inputs
- [ ] Ensure all images have alt text
- [ ] Fix color contrast issues (if any found)
- [ ] Add keyboard navigation to modals
- [ ] Ensure focus management in interactive components
- [ ] Add skip navigation links
- [ ] Make star rating keyboard accessible
- [ ] Add error announcements with aria-live

### Priority 2: Important (Should Fix)
- [ ] Add ARIA landmarks to all pages
- [ ] Enhance screen reader announcements for dynamic content
- [ ] Add loading state announcements
- [ ] Improve mobile menu accessibility
- [ ] Add tooltips for icon-only buttons
- [ ] Test with screen readers (NVDA, VoiceOver)
- [ ] Ensure proper heading hierarchy on all pages
- [ ] Add focus trap in modal dialogs

### Priority 3: Enhancement (Nice to Have)
- [ ] Add keyboard shortcuts for power users
- [ ] Implement reduced motion preferences
- [ ] Add high contrast mode support
- [ ] Provide text size adjustment options
- [ ] Add breadcrumb navigation for screen readers
- [ ] Implement custom focus indicators matching brand
- [ ] Add ARIA descriptions to complex UI elements

---

## Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Wave Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

### Testing
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [VoiceOver User Guide](https://support.apple.com/guide/voiceover/welcome/mac)
- [Keyboard Accessibility Guide](https://webaim.org/techniques/keyboard/)

---

## Contact

For accessibility-related questions or to report accessibility issues:
- **Email:** accessibility@thehockeydirectory.com
- **GitHub:** [Report Issue](https://github.com/miked5167/chickadee/issues)

We are committed to making The Hockey Directory accessible to all users.
