import { createElement } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdvisorFilters } from '@/components/search/AdvisorFilters'
import { filterDirectory } from '@/lib/tags/filter-logic'
import { parseFilterState } from '@/lib/tags/filter-state'
import { previewCatalog as catalog, previewListings as listings } from '@/lib/tags/preview-fixtures'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), useSearchParams: () => new URLSearchParams() }))
const data = (query = '') => ({ ...filterDirectory(listings, parseFilterState(new URLSearchParams(query), catalog), catalog), catalog, catalogAvailable: true })
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks() })

describe('counted mobile filter panel', () => {
  it('keeps draft selections private until Apply, then sends the counted selection to the URL', async () => {
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => data('tag=pathways:ncaa') }))
    vi.stubGlobal('fetch', fetcher)
    render(createElement(AdvisorFilters, { initialData: data() }))
    fireEvent.click(screen.getByRole('button', { name: 'Filters', exact: true }))
    const panel = within(screen.getByRole('dialog', { name: 'Filter advisors' }))
    expect(panel.getByRole('button', { name: 'Apply (5 results)' })).toBeEnabled()
    fireEvent.click(panel.getByRole('checkbox', { name: 'NCAA (2)' }))
    expect(push).not.toHaveBeenCalled()
    expect(panel.getByRole('button', { name: 'Updating result count…' })).toBeDisabled()
    await waitFor(() => expect(panel.getByRole('button', { name: 'Apply (2 results)' })).toBeEnabled())
    fireEvent.click(panel.getByRole('button', { name: 'Apply (2 results)' }))
    expect(push).toHaveBeenCalledWith('/listings?tag=pathways%3Ancaa&sort=name&page=1')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('Escape closes the panel, restores focus and discards the unapplied draft on reopening', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => data('tag=pathways:ncaa') })))
    render(createElement(AdvisorFilters, { initialData: data() }))
    const trigger = screen.getByRole('button', { name: 'Filters', exact: true })
    fireEvent.click(trigger)
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('checkbox', { name: 'NCAA (2)' }))
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' })
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(push).not.toHaveBeenCalled()
    fireEvent.click(trigger)
    const panel = within(screen.getByRole('dialog'))
    expect(panel.getByRole('checkbox', { name: 'NCAA (2)' })).not.toBeChecked()
    expect(panel.getByRole('button', { name: 'Apply (5 results)' })).toBeEnabled()
  })
  it('does not apply a stale count when the count request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })))
    render(createElement(AdvisorFilters, { initialData: data() }))
    fireEvent.click(screen.getByRole('button', { name: 'Filters', exact: true }))
    const panel = within(screen.getByRole('dialog'))
    fireEvent.click(panel.getByRole('checkbox', { name: 'NCAA (2)' }))
    await waitFor(() => expect(panel.getByRole('alert')).toHaveTextContent('could not be updated'))
    expect(panel.getByRole('button', { name: 'Count unavailable' })).toBeDisabled()
    expect(push).not.toHaveBeenCalled()
  })
  it('resets controls when the applied URL state changes through browser navigation', () => {
    const page = render(createElement(AdvisorFilters, { initialData: data('tag=pathways:ncaa') }))
    expect(screen.getByRole('checkbox', { name: 'NCAA (2)' })).toBeChecked()
    page.rerender(createElement(AdvisorFilters, { initialData: data() }))
    expect(screen.getByRole('checkbox', { name: 'NCAA (2)' })).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Apply (5 results)' })).toBeEnabled()
  })
})
