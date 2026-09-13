import { createAdminClient } from '@/lib/supabase/server'
import { buildAnalyticsReport, reportingWindow, type EventRow, type LeadRow, type ReviewRow, type CompanyRow } from './report'

type PageResult<T> = { data: T[] | null; error: unknown }

// PostgREST caps each response. Read every page so a busy day is not undercounted.
export async function readAllPages<T>(page: (from: number, to: number) => PromiseLike<PageResult<T>>) {
  const rows: T[] = []
  for (let offset = 0; ; offset += 1000) {
    const result = await page(offset, offset + 999)
    if (result.error || !result.data) throw new Error('Analytics query failed')
    rows.push(...result.data)
    if (result.data.length < 1000) return rows
  }
}

/** Call only after authorizeAdminRequest has confirmed an active administrator. */
export async function loadAnalyticsReport(days: number, now = new Date()) {
  const client = createAdminClient()
  const { from, through } = reportingWindow(days, now)
  const [events, leads, reviews, companies] = await Promise.all([
    readAllPages<EventRow>((a, b) => client.from('directory_events').select('company_id,event_type,session_id,created_at,referrer,metadata').gte('created_at', from).lte('created_at', through).order('created_at').order('id').range(a, b)),
    readAllPages<LeadRow>((a, b) => client.from('company_leads').select('company_id,created_at,status').gte('created_at', from).lte('created_at', through).order('created_at').order('id').range(a, b)),
    readAllPages<ReviewRow>((a, b) => client.from('reviews').select('company_id,created_at,rating,moderation_status').gte('created_at', from).lte('created_at', through).order('created_at').order('id').range(a, b)),
    readAllPages<CompanyRow>((a, b) => client.from('companies').select('id,name,slug').order('id').range(a, b)),
  ])
  return { ...buildAnalyticsReport(days, events, leads, reviews, companies, now), googleAnalyticsConfigured: /^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '') }
}
