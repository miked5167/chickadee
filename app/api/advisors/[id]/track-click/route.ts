import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { hashIP } from '@/lib/utils/security'

const clickSchema = z.object({
  click_type: z.enum(['website', 'email', 'phone', 'profile_view']),
  event_id: z.string().uuid(),
  analytics_consent: z.literal(true),
  referrer: z.string().max(2048).optional(),
})

function safeUrl(value: string | null | undefined) {
  try {
    const url = new URL(value || '')
    return ['http:', 'https:'].includes(url.protocol) ? `${url.origin}${url.pathname}`.slice(0, 2048) : null
  } catch { return null }
}

function reply(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Next's dev server can normalize 127.0.0.1 to localhost in nextUrl.
  // The Host header retains the actual browser-facing address.
  let sameOrigin = false
  try {
    const origin = new URL(request.headers.get('origin') || '')
    sameOrigin = ['http:', 'https:'].includes(origin.protocol) && origin.host === (request.headers.get('host') || request.nextUrl.host)
  } catch { /* Missing or invalid origins are rejected. */ }
  if (!sameOrigin) return reply(403, 'Origin not allowed.')
  const { id } = await params
  const parsed = clickSchema.safeParse(await request.json().catch(() => null))
  if (!z.string().uuid().safeParse(id).success || !parsed.success) return reply(400, 'Invalid analytics event.')
  try {
    const ip = (request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown').trim()
    const ipHash = hashIP(ip)
    const sessionCookie = request.cookies.get('directory_session')?.value
    const sessionId = sessionCookie && z.string().uuid().safeParse(sessionCookie).success ? sessionCookie : crypto.randomUUID()
    const eventType = parsed.data.click_type === 'profile_view' ? 'profile_view' : `${parsed.data.click_type}_click`
    const supabase = createAdminClient()
    const { count, error: rateError } = await supabase.from('directory_events')
      .select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash)
      .gte('created_at', new Date(Date.now() - 60_000).toISOString())
    if (rateError) throw new Error(rateError.code)
    if ((count || 0) >= 120) return reply(429, 'Too many events.')
    const { data: company, error: companyError } = await supabase.from('companies').select('id').eq('id', id).maybeSingle()
    if (companyError) throw new Error(companyError.code)
    if (!company) return reply(404, 'Company not found.')
    const environment = process.env.VERCEL_ENV || (process.env.NODE_ENV === 'production' ? 'production' : 'development')
      const { error } = await supabase.from('directory_events').insert({
        id: parsed.data.event_id,
        company_id: company.id,
        event_type: eventType,
        session_id: sessionId,
        ip_hash: ipHash,
        user_agent: request.headers.get('user-agent')?.slice(0, 500) || null,
        referrer: safeUrl(parsed.data.referrer),
        metadata: { environment, page_url: safeUrl(request.headers.get('referer')), consent: 'analytics', version: 1 },
      })
    // Repeated event IDs are retries and must not inflate the report.
    if (error && error.code !== '23505') throw new Error(error.code)

    const response = NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
    response.cookies.set('directory_session', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 1800, path: '/' })
    return response
  } catch {
    console.error('Directory analytics could not be saved.')
    return reply(503, 'Analytics temporarily unavailable.')
  }
}
