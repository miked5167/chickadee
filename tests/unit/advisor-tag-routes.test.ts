import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import starter from '@/data/directory-tags.json'
import { GET, PUT } from '@/app/api/advisor/tags/route'
import { POST } from '@/app/api/advisors/claim/route'

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), catalog: vi.fn(), revalidate: vi.fn(), rpc: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }))
vi.mock('@/lib/tags/catalog', () => ({ readTagCatalog: mocks.catalog }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }))
let signedIn = true
let owner = true
const company = { id: '10000000-0000-4000-8000-000000000001', slug: 'example', verified_owner_id: null }
const ids = ['services:advisor', 'pathways:junior', 'pathways:ncaa']
beforeEach(() => {
  vi.clearAllMocks(); signedIn = true; owner = true
  mocks.catalog.mockResolvedValue(starter)
  mocks.rpc.mockResolvedValue({ data: ids, error: null })
  mocks.createClient.mockResolvedValue({
    auth: { getUser: async () => ({ data: { user: signedIn ? { id: 'owner', email: 'owner@example.com' } : null }, error: null }) },
    rpc: mocks.rpc,
    from: (table: string) => {
      const rows = table === 'company_tags' ? ids.map((tag_id) => ({ tag_id })) : []
      const result = Promise.resolve({ data: rows, error: null })
      const query = { select: () => query, eq: () => query, in: () => query, order: () => query, limit: () => query,
        maybeSingle: async () => ({ data: table === 'companies' && owner ? company : null, error: null }), then: result.then.bind(result) }
      return query
    },
  })
})
const request = (body: unknown, method = 'PUT') => new NextRequest('https://directory.test/api/advisor/tags', { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
describe('advisor tag assignments', () => {
  it('returns the owned listing selection and approved catalog', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    expect((await response.json()).tag_ids).toEqual(ids)
  })
  it('rejects signed-out users and disconnected accounts before saving', async () => {
    signedIn = false; expect((await PUT(request({ tag_ids: ids }))).status).toBe(401)
    signedIn = true; owner = false; expect((await PUT(request({ tag_ids: ids }))).status).toBe(404)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
  it('rejects incomplete and invented tags without changing stored assignments', async () => {
    expect((await PUT(request({ tag_ids: ids.slice(0, 2) }))).status).toBe(400)
    expect((await PUT(request({ tag_ids: [...ids.slice(0, 2), 'services:made-up'] }))).status).toBe(400)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
  it('uses the ownership-checked replacement RPC and invalidates public pages', async () => {
    expect((await PUT(request({ tag_ids: ids, company_id: 'someone-else' }))).status).toBe(200)
    expect(mocks.rpc).toHaveBeenCalledWith('replace_company_tags', { p_company_id: company.id, p_tag_ids: [...ids].sort() })
    expect(mocks.revalidate).toHaveBeenCalledWith('/listings/example')
  })
  it('reports catalog and database failures without success', async () => {
    mocks.catalog.mockRejectedValueOnce(new Error('unavailable'))
    expect((await PUT(request({ tag_ids: ids }))).status).toBe(503)
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: '42501' } })
    expect((await PUT(request({ tag_ids: ids }))).status).toBe(403)
  })
})
describe('claim tag transaction', () => {
  const claim = { company_id: company.id, business_email: 'owner@example.com', relationship: 'I am the owner of this business.', verification_details: 'The official company website lists my full name and business email address.', tag_ids: ids }
  it('requires a complete controlled selection before creating the claim', async () => {
    expect((await POST(request({ ...claim, tag_ids: [] }, 'POST'))).status).toBe(400)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
  it('rejects phone values beyond the existing database column limit before writing', async () => {
    expect((await POST(request({ ...claim, business_phone: '1'.repeat(21) }, 'POST'))).status).toBe(400)
    expect(mocks.rpc).not.toHaveBeenCalled()
  })
  it('saves the claim and private selections with one RPC', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: { id: 'claim-id', claim_status: 'pending', submitted_at: '2026-10-03' }, error: null })
    const response = await POST(request(claim, 'POST'))
    expect(response.status).toBe(201)
    expect((await response.json()).claimId).toBe('claim-id')
    expect(mocks.rpc.mock.calls[0][0]).toBe('submit_directory_claim')
    expect(mocks.rpc.mock.calls[0][1].p_tag_ids).toEqual([...ids].sort())
  })
  it('reports the existing active-claim exclusion as a conflict', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: '23P01' } })
    expect((await POST(request(claim, 'POST'))).status).toBe(409)
  })
})
