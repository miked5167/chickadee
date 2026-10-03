import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), createAdminClient: vi.fn(), revalidatePath: vi.fn() }))
vi.mock('@/lib/supabase/server', () => mocks)
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))

import { POST, GET as ownSuggestions } from '@/app/api/advisor/tag-suggestions/route'
import { GET as queue } from '@/app/api/admin/tag-suggestions/route'
import { PATCH as review } from '@/app/api/admin/tag-suggestions/[id]/route'

const userId = '00000000-0000-4000-8000-000000000001'
const id = '30000000-0000-4000-8000-000000000001'
const suggestion = { company_id: '10000000-0000-4000-8000-000000000001', group_key: 'languages', label: 'Spanish', reason: 'Clients request this language.' }
let user: { id: string } | null
let admin: boolean
let failure: { code: string } | null
let insert: ReturnType<typeof vi.fn>
let rpc: ReturnType<typeof vi.fn>
let from: ReturnType<typeof vi.fn>
const request = (body: unknown, method = 'POST') => new NextRequest('https://directory.test/api/tag-suggestions', { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
const context = { params: Promise.resolve({ id }) }

beforeEach(() => {
  vi.clearAllMocks()
  user = { id: userId }; admin = false; failure = null
  const result = () => Promise.resolve({ data: { id, ...suggestion }, error: failure })
  const query = { select: () => query, eq: vi.fn(() => query), order: () => query, limit: () => result(), single: () => result(), insert: vi.fn(() => query) }
  insert = query.insert
  from = vi.fn(() => query)
  rpc = vi.fn((name: string) => Promise.resolve(name === 'is_admin' ? { data: admin, error: null } : { data: 'languages:spanish', error: failure }))
  mocks.createClient.mockResolvedValue({ auth: { getUser: async () => ({ data: { user }, error: null }) }, from, rpc })
})

describe('advisor tag suggestions', () => {
  it('requires sign-in for submitting and reading suggestions', async () => {
    user = null
    expect((await POST(request(suggestion))).status).toBe(401)
    expect((await ownSuggestions()).status).toBe(401)
    expect(from).not.toHaveBeenCalled()
  })
  it('derives requester identity from the existing session', async () => {
    const response = await POST(request(suggestion))
    expect(response.status).toBe(201)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(insert).toHaveBeenCalledWith({ ...suggestion, requester_user_id: userId })
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })
  it('rejects attempts to supply moderation fields before writing', async () => {
    expect((await POST(request({ ...suggestion, status: 'approved' }))).status).toBe(400)
    expect(insert).not.toHaveBeenCalled()
  })
  it.each([['42501', 403], ['23505', 409], ['42P01', 503]])('handles database rejection %s', async (code, status) => {
    failure = { code: String(code) }
    expect((await POST(request(suggestion))).status).toBe(status)
  })
  it('handles malformed JSON', async () => {
    const malformed = new NextRequest('https://directory.test/api/tag-suggestions', { method: 'POST', body: '{bad' })
    expect((await POST(malformed)).status).toBe(400)
    expect(insert).not.toHaveBeenCalled()
  })
})

describe('administrator tag review', () => {
  it('checks authentication and administrator status before accessing the queue or mutation', async () => {
    user = null
    expect((await queue()).status).toBe(401)
    expect((await review(request({ action: 'reject' }, 'PATCH'), context)).status).toBe(401)
    user = { id: userId }
    expect((await queue()).status).toBe(403)
    expect((await review(request({ action: 'reject' }, 'PATCH'), context)).status).toBe(403)
    expect(from).not.toHaveBeenCalled()
    expect(rpc.mock.calls.every(([name]) => name === 'is_admin')).toBe(true)
  })
  it('passes an approved label to the atomic, database-authorized review function', async () => {
    admin = true
    const response = await review(request({ action: 'approve', slug: 'spanish', label: 'Spanish', note: 'Reviewed evidence' }, 'PATCH'), context)
    expect(response.status).toBe(200)
    expect(rpc).toHaveBeenCalledWith('review_directory_tag_suggestion', { p_suggestion_id: id, p_action: 'approve', p_slug: 'spanish', p_label: 'Spanish', p_note: 'Reviewed evidence' })
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })
  it('allows rejection without creating a controlled label', async () => {
    admin = true
    expect((await review(request({ action: 'reject' }, 'PATCH'), context)).status).toBe(200)
    expect(rpc).toHaveBeenCalledWith('review_directory_tag_suggestion', { p_suggestion_id: id, p_action: 'reject', p_slug: null, p_label: null, p_note: null })
  })
  it('rejects invalid IDs and invalid approval payloads', async () => {
    admin = true
    expect((await review(request({ action: 'approve' }, 'PATCH'), context)).status).toBe(400)
    expect((await review(request({ action: 'reject' }, 'PATCH'), { params: Promise.resolve({ id: 'bad' }) })).status).toBe(400)
    expect(rpc.mock.calls.every(([name]) => name === 'is_admin')).toBe(true)
  })
  it.each([['22023', 409], ['42501', 403], ['42P01', 503]])('handles review failure %s without invalidating results', async (code, status) => {
    admin = true; failure = { code: String(code) }
    expect((await review(request({ action: 'reject' }, 'PATCH'), context)).status).toBe(status)
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })
})
