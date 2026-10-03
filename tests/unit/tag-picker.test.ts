import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TagPicker } from '@/components/tags/TagPicker'
import starter from '@/data/directory-tags.json'
import type { TagCatalog } from '@/lib/tags/types'

afterEach(cleanup)
const catalog = starter as TagCatalog
describe('controlled advisor tag picker', () => {
  it('limits core selection while allowing optional fit tags and deselection', () => {
    const ids = ['services:advisor', 'services:agent', 'services:scouting', 'pathways:junior', 'pathways:ncaa']
    const changes: string[][] = []
    render(createElement(TagPicker, { catalog, value: ids, onChange: (value) => changes.push(value) }))
    expect(screen.getByLabelText('Video analysis')).toBeDisabled()
    expect(screen.getByLabelText('AAA')).toBeEnabled()
    fireEvent.click(screen.getByLabelText('AAA'))
    expect(changes[0]).toContain('player_level:aaa')
    fireEvent.click(screen.getByLabelText('NCAA'))
    expect(changes[1]).not.toContain('pathways:ncaa')
    expect(screen.getByRole('status')).toHaveTextContent('5 of 3–5')
  })
  it('only renders active approved options, with visible labels and fieldsets', () => {
    render(createElement(TagPicker, { catalog: { ...catalog, tags: catalog.tags.map((tag) => ({ ...tag, is_active: tag.id !== 'services:video' })) }, value: [], onChange: () => {} }))
    expect(screen.queryByLabelText('Video analysis')).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Services · core tags' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/12 and under|Recreational|House league/)).not.toBeInTheDocument()
  })
})
