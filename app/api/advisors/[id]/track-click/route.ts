import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { hashIP } from '@/lib/utils/security'

const clickSchema = z.object({ click_type: z.enum(['website', 'email', 'phone', 'profile_view']) })

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ success: true })
    const parsed = clickSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ success: true })

    const ip = (request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown').trim()
    const ipHash = hashIP(ip)
    const sessionCookie = request.cookies.get('directory_session')?.value
    const sessionId = sessionCookie && z.string().uuid().safeParse(sessionCookie).success ? sessionCookie : crypto.randomUUID()
    const eventType = parsed.data.click_type === 'profile_view' ? 'profile_view' : `${parsed.data.click_type}_click`
    const supabase = createAdminClient()

    const { data: company } = await supabase.from('companies').select('id').eq('id', id).maybeSingle()
    if (company) {
      const { error } = await supabase.from('directory_events').insert({
        company_id: company.id,
        event_type: eventType,
        session_id: sessionId,
        ip_hash: ipHash,
        user_agent: request.headers.get('user-agent')?.slice(0, 500) || null,
        referrer: request.headers.get('referer')?.slice(0, 2048) || null,
        metadata: {},
      })
      if (error) console.error('Directory click event insert failed:', error.code)
    }

    const response = NextResponse.json({ success: true })
    if (!sessionCookie) response.cookies.set('directory_session', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' })
    return response
  } catch (error) {
    console.error('Directory click tracking failed:', error)
    return NextResponse.json({ success: true })
  }
}
