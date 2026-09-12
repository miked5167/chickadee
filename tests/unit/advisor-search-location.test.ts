import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/advisors/route'

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))
vi.mock('@/lib/preview/advisor-feed', () => ({ publicPreviewFeedUrl: () => null, publicPreviewProfileUrl: () => null }))

beforeEach(() => {
  const companies = [
    { id: 'ny', name: 'New York Firm', slug: 'new-york-firm', location: 'POINT(-74 40.7)', created_at: null },
    { id: 'zero', name: 'Zero Coordinate Firm', slug: 'zero-coordinate-firm', location: 'POINT(0 0)', created_at: null },
  ]
  mocks.createClient.mockResolvedValue({ from: (table: string) => {
    const result = Promise.resolve({ data: table === 'companies' ? companies : [], error: null })
    const query = { select: () => query, eq: () => query, in: () => query, or: () => query, then: result.then.bind(result) }
    return query
  } })
})

describe('optional advisor search location', () => {
  it.each(['', '&lat=&lng=', '&lat=40.7', '&lng=-74', '&lat=bad&lng=-74'])('does not apply a radius for absent/incomplete/invalid coordinates: %s', async (coordinates) => {
    const response = await GET(new NextRequest(`https://directory.test/api/advisors?limit=100${coordinates}`))
    expect(response.status).toBe(200)
    expect((await response.json()).pagination.total).toBe(2)
  })
  it('retains explicit zero coordinates as a real location', async () => {
    const response = await GET(new NextRequest('https://directory.test/api/advisors?lat=0&lng=0&radius=5'))
    const body = await response.json()
    expect(body.pagination.total).toBe(1)
    expect(body.advisors[0].id).toBe('zero')
  })
  it('filters around an explicitly supplied nonzero location', async () => {
    const response = await GET(new NextRequest('https://directory.test/api/advisors?lat=40.7&lng=-74&radius=5'))
    const body = await response.json()
    expect(body.pagination.total).toBe(1)
    expect(body.advisors[0].id).toBe('ny')
  })
})
