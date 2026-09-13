import { describe, expect, it, vi } from 'vitest'
import { buildAnalyticsReport, reportCsv, reportingWindow, type EventRow } from '@/lib/analytics/report'
vi.mock('@/lib/supabase/server', () => ({ createAdminClient: vi.fn() }))
import { readAllPages } from '@/lib/analytics/report-server'

const now = new Date('2026-09-13T14:00:00Z')
const company = { id: 'a', name: '=Unsafe,"Name"', slug: 'advisor' }
const event = (type = 'profile_view', environment = 'production'): EventRow => ({ company_id: 'a', event_type: type, session_id: 'session-a', created_at: '2026-09-13T12:00:00Z', referrer: 'https://google.com/search?q=hockey', metadata: { environment } })

describe('analytics reports', () => {
  it('uses an inclusive UTC date window and zero-fills days', () => {
    expect(reportingWindow(7, now).from).toBe('2026-09-07T00:00:00.000Z')
    const report = buildAnalyticsReport(7, [{ ...event(), created_at: '2026-09-06T23:59:59Z' }, { ...event(), created_at: '2026-09-14T00:00:00Z' }], [], [], [company], now)
    expect(report.daily).toHaveLength(7)
    expect(report.totals.views).toBe(0)
  })
  it('separates preview and unclassified history, and counts sessions once', () => {
    const report = buildAnalyticsReport(7, [event(), event('website_click'), event('profile_view', 'development'), { ...event(), metadata: {} }], [], [], [company], now)
    expect(report.totals).toMatchObject({ views: 1, website: 1, email: 0 })
    expect(report.sessions).toBe(1)
    expect(report.previewEvents).toBe(1)
    expect(report.legacyEvents).toBe(1)
    expect(report.referrers).toEqual([{ source: 'google.com', views: 1 }])
  })
  it('uses saved non-spam inquiries and approved reviews without exposing their contents', () => {
    const lead = { company_id: 'a', created_at: '2026-09-13T12:00:00Z', status: 'new' }
    const review = { ...lead, moderation_status: 'approved', rating: 4 }
    const report = buildAnalyticsReport(7, [], [lead, { ...lead, status: 'spam' }], [review, { ...review, moderation_status: 'pending' }], [company], now)
    expect(report.totals).toMatchObject({ leads: 1, reviews: 1 })
    expect(report.averageRating).toBe(4)
    expect(report.companies[0]).toMatchObject({ leads: 1, reviews: 1 })
    const csv = reportCsv(report)
    expect(csv).toContain('"\'=Unsafe,""Name"""')
    expect(csv).not.toContain('contact_email')
  })
  it('reads beyond the 1,000-row response limit and fails rather than returning partial counts', async () => {
    const page = vi.fn().mockResolvedValueOnce({ data: Array(1000).fill({ id: 1 }), error: null }).mockResolvedValueOnce({ data: [{ id: 2 }], error: null })
    expect(await readAllPages(page)).toHaveLength(1001)
    expect(page).toHaveBeenLastCalledWith(1000, 1999)
    await expect(readAllPages(async () => ({ data: null, error: { code: 'failure' } }))).rejects.toThrow('Analytics query failed')
  })
})
