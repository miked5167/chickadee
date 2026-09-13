import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({ createClient: vi.fn(), createAdminClient: vi.fn(), loadAnalyticsReport: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient, createAdminClient: mocks.createAdminClient }))
vi.mock('@/lib/analytics/report-server', () => ({ loadAnalyticsReport: mocks.loadAnalyticsReport }))
import { GET } from '@/app/api/admin/analytics/route'
import { GET as exportGET } from '@/app/api/admin/analytics/export/route'
import { POST } from '@/app/api/advisors/[id]/track-click/route'
import { buildAnalyticsReport } from '@/lib/analytics/report'

const id = '11111111-1111-4111-8111-111111111111'
const eventId = '22222222-2222-4222-8222-222222222222'
const url = `https://thehockeydirectory.com/api/advisors/${id}/track-click`
function request(body: unknown, origin = 'https://thehockeydirectory.com') {
  return new NextRequest(url, { method: 'POST', headers: { origin, 'Content-Type': 'application/json', referer: 'https://thehockeydirectory.com/listings/advisor?email=private@example.com' }, body: JSON.stringify(body) })
}
const body = { click_type: 'profile_view', event_id: eventId, analytics_consent: true, referrer: 'https://google.com/search?q=private' }
const params = { params: Promise.resolve({ id }) }

beforeEach(() => { vi.clearAllMocks() })

describe('analytics administrator endpoints', () => {
  for (const handler of [GET, exportGET]) {
    it('rejects anonymous and non-admin requests before accessing the report', async () => {
      mocks.createClient.mockResolvedValue({ auth: { getUser: async () => ({ data: { user: null } }) } })
      expect((await handler(new Request('https://example.com/api/admin/analytics'))).status).toBe(401)
      mocks.createClient.mockResolvedValue({ auth: { getUser: async () => ({ data: { user: { id } } }) }, rpc: async () => ({ data: false }) })
      expect((await handler(new Request('https://example.com/api/admin/analytics'))).status).toBe(403)
      expect(mocks.loadAnalyticsReport).not.toHaveBeenCalled()
      expect(mocks.createAdminClient).not.toHaveBeenCalled()
    })
  }
  it('serves admin-only JSON and CSV, validates windows and reports failures accurately', async () => {
    mocks.createClient.mockResolvedValue({ auth: { getUser: async () => ({ data: { user: { id } } }) }, rpc: async () => ({ data: true }) })
    const report = buildAnalyticsReport(7, [], [], [], [])
    mocks.loadAnalyticsReport.mockResolvedValue(report)
    const response = await GET(new Request('https://example.com/api/admin/analytics?days=7'))
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toEqual({ data: report })
    expect((await exportGET(new Request('https://example.com/api/admin/analytics/export?days=7'))).headers.get('Content-Type')).toContain('text/csv')
    expect((await GET(new Request('https://example.com/api/admin/analytics?days=999'))).status).toBe(400)
    mocks.loadAnalyticsReport.mockRejectedValue(new Error('connection'))
    expect((await GET(new Request('https://example.com/api/admin/analytics'))).status).toBe(503)
  })
})

describe('directory event persistence', () => {
  function database(insertError: { code: string } | null = null, count = 0) {
    const insert = vi.fn(async () => ({ error: insertError }))
    mocks.createAdminClient.mockReturnValue({ from: (table: string) => table === 'companies' ? {
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id }, error: null }) }) }),
    } : { insert, select: () => ({ eq: () => ({ gte: async () => ({ count, error: null }) }) }) } })
    return insert
  }
  it('requires same-origin requests and explicit analytics consent', async () => {
    expect((await POST(request(body, 'https://elsewhere.com'), params)).status).toBe(403)
    expect((await POST(request({ ...body, analytics_consent: false }), params)).status).toBe(400)
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })
  it('saves a sanitized event and sets a short-lived session cookie', async () => {
    const insert = database()
    const response = await POST(request(body), params)
    expect(response.status).toBe(200)
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ id: eventId, company_id: id, event_type: 'profile_view', referrer: 'https://google.com/search', metadata: expect.objectContaining({ page_url: 'https://thehockeydirectory.com/listings/advisor' }) }))
    expect(response.headers.get('set-cookie')).toContain('Max-Age=1800')
    expect(JSON.stringify(insert.mock.calls)).not.toContain('private')
  })
  it('treats duplicate IDs as retries, but returns a failure when storage fails', async () => {
    database({ code: '23505' })
    expect((await POST(request(body), params)).status).toBe(200)
    database({ code: '42501' })
    expect((await POST(request(body), params)).status).toBe(503)
    database(null, 120)
    expect((await POST(request(body), params)).status).toBe(429)
  })
})
