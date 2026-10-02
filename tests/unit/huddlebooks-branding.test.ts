import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Footer } from '@/components/layout/Footer'
import AboutPage from '@/app/(public)/about/page'

describe('HuddleBooks brand connection', () => {
  it('credits and links HuddleBooks in the site footer', () => {
    render(createElement(Footer))
    expect(screen.getByText(/The Hockey Directory\. A/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'HuddleBooks' })).toHaveAttribute('href', 'https://huddlebooks.ca')
  })

  it('explains the relationship on the About page', () => {
    render(createElement(AboutPage))
    expect(screen.getByText(/The Hockey Directory is a/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'HuddleBooks' })).toHaveAttribute('href', 'https://huddlebooks.ca')
  })

  it('identifies HuddleBooks in public organization and legal content', () => {
    const files = [
      'app/page.tsx',
      'app/(public)/about/page.tsx',
      'app/(legal)/privacy/page.tsx',
      'app/(legal)/terms/page.tsx',
    ]
    for (const file of files) {
      const source = readFileSync(path.join(process.cwd(), file), 'utf8')
      expect(source).toContain('HuddleBooks')
      expect(source).toContain('https://huddlebooks.ca')
    }
  })
})
