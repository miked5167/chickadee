export type EventRow = { company_id: string; event_type: string; session_id: string; created_at: string; referrer: string | null; metadata: { environment?: string } | null }
export type LeadRow = { company_id: string; created_at: string; status: string }
export type ReviewRow = { company_id: string; created_at: string; rating: number; moderation_status: string }
export type CompanyRow = { id: string; name: string; slug: string }

export type ActivityCounts = { views: number; website: number; email: number; phone: number; leads: number; reviews: number }
export type AnalyticsReport = {
  days: number; from: string; through: string; generatedAt: string
  totals: ActivityCounts; sessions: number; previewEvents: number; legacyEvents: number
  latestLiveEvent: string | null; googleAnalyticsConfigured: boolean
  daily: (ActivityCounts & { date: string })[]
  companies: (ActivityCounts & CompanyRow)[]
  referrers: { source: string; views: number }[]
  leadStatuses: { status: string; count: number }[]
  averageRating: number | null
}

const empty = (): ActivityCounts => ({ views: 0, website: 0, email: 0, phone: 0, leads: 0, reviews: 0 })
const eventMetric: Record<string, keyof ActivityCounts> = { profile_view: 'views', website_click: 'website', email_click: 'email', phone_click: 'phone' }

export function reportingWindow(days: number, now = new Date()) {
  const from = new Date(now)
  from.setUTCHours(0, 0, 0, 0)
  from.setUTCDate(from.getUTCDate() - days + 1)
  return { from: from.toISOString(), through: now.toISOString() }
}

export function buildAnalyticsReport(days: number, events: EventRow[], leads: LeadRow[], reviews: ReviewRow[], companies: CompanyRow[], now = new Date()): AnalyticsReport {
  const { from, through } = reportingWindow(days, now)
  const daily = Array.from({ length: days }, (_, index) => ({ date: new Date(Date.parse(from) + index * 86_400_000).toISOString().slice(0, 10), ...empty() }))
  const byDay = new Map(daily.map(row => [row.date, row]))
  const byCompany = new Map(companies.map(company => [company.id, { ...company, ...empty() }]))
  const totals = empty()
  const sessions = new Set<string>()
  const sources = new Map<string, number>()
  const statuses = new Map<string, number>()
  let previewEvents = 0, legacyEvents = 0, latestLiveEvent: string | null = null, ratingSum = 0
  const inWindow = (created: string) => Date.parse(created) >= Date.parse(from) && Date.parse(created) <= Date.parse(through)
  const add = (companyId: string, created: string, metric: keyof ActivityCounts) => {
    totals[metric]++
    const day = byDay.get(created.slice(0, 10))
    if (day) day[metric]++
    const company = byCompany.get(companyId)
    if (company) company[metric]++
  }
  for (const event of events) {
    if (!inWindow(event.created_at)) continue
    if (!event.metadata?.environment) { legacyEvents++; continue }
    if (event.metadata.environment !== 'production') { previewEvents++; continue }
    if (!latestLiveEvent || event.created_at > latestLiveEvent) latestLiveEvent = event.created_at
    const metric = eventMetric[event.event_type]
    if (!metric) continue
    add(event.company_id, event.created_at, metric)
    sessions.add(event.session_id)
    if (metric === 'views') {
      let source = 'Direct / unknown'
      try { source = new URL(event.referrer || '').hostname } catch { /* No referrer. */ }
      sources.set(source, (sources.get(source) || 0) + 1)
    }
  }
  for (const lead of leads) {
    if (!inWindow(lead.created_at) || lead.status === 'spam') continue
    add(lead.company_id, lead.created_at, 'leads')
    statuses.set(lead.status, (statuses.get(lead.status) || 0) + 1)
  }
  for (const review of reviews) {
    if (!inWindow(review.created_at) || review.moderation_status !== 'approved') continue
    add(review.company_id, review.created_at, 'reviews')
    ratingSum += review.rating
  }
  return {
    days, from, through, generatedAt: now.toISOString(), totals, sessions: sessions.size,
    previewEvents, legacyEvents, latestLiveEvent, googleAnalyticsConfigured: false, daily,
    companies: [...byCompany.values()].filter(row => Object.keys(totals).some(key => row[key as keyof ActivityCounts] > 0))
      .sort((a, b) => b.views - a.views || b.leads - a.leads || a.name.localeCompare(b.name)),
    referrers: [...sources].map(([source, views]) => ({ source, views })).sort((a, b) => b.views - a.views),
    leadStatuses: [...statuses].map(([status, count]) => ({ status, count })),
    averageRating: totals.reviews ? ratingSum / totals.reviews : null,
  }
}

export function reportCsv(report: AnalyticsReport) {
  // Spreadsheet programs interpret leading formula characters even in quoted CSV.
  const cell = (value: string | number) => {
    let text = String(value)
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`
    return `"${text.replaceAll('"', '""')}"`
  }
  const rows: (string | number)[][] = [
    ['Report', 'From (UTC)', 'Through (UTC)'], ['Directory analytics', report.from, report.through], [],
    ['Metric', 'Count'], ...Object.entries(report.totals), ['Consented sessions', report.sessions],
    ['Preview events excluded', report.previewEvents], ['Unclassified legacy events excluded', report.legacyEvents], [],
    ['Date (UTC)', 'Profile views', 'Website clicks', 'Email clicks', 'Phone clicks', 'Inquiries', 'Approved reviews'],
    ...report.daily.map(r => [r.date, r.views, r.website, r.email, r.phone, r.leads, r.reviews]), [],
    ['Company', 'Profile slug', 'Profile views', 'Website clicks', 'Email clicks', 'Phone clicks', 'Inquiries', 'Approved reviews'],
    ...report.companies.map(r => [r.name, r.slug, r.views, r.website, r.email, r.phone, r.leads, r.reviews]), [],
    ['Referring host', 'Profile views'], ...report.referrers.map(r => [r.source, r.views]),
  ]
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n')
}
