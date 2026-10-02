import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ComparisonTray } from '@/components/listing/ComparisonTray'
import { DIRECTORY_COMPARISON_ENABLED } from '@/lib/features'

beforeEach(() => localStorage.clear())

describe('temporarily hidden comparison feature', () => {
  it('keeps the central feature switch off', () => {
    expect(DIRECTORY_COMPARISON_ENABLED).toBe(false)
  })

  it('does not show the comparison tray for stored legacy selections', () => {
    localStorage.setItem('hockey-directory-compare-listings', JSON.stringify(['company-one', 'company-two']))
    render(createElement(ComparisonTray))
    expect(screen.queryByText('2 of 3 selected')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Compare' })).not.toBeInTheDocument()
  })
})
