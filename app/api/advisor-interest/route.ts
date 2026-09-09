import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { hashIP } from '@/lib/utils/security'

export const dynamic = 'force-dynamic'

const interestOptions = ['profile_plus', 'sponsored_placement', 'enhanced_analytics'] as const

const interestSchema = z.object({
  contact_name: z.string().trim().min(2).max(100),
  business_name: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(320),
  website_url: z.union([z.literal(''), z.string().trim().url().max(2048)]).optional(),
  interests: z.array(z.enum(interestOptions)).min(1).max(3),
  message: z.string().trim().max(2000).optional(),
  consent_confirmed: z.literal(true),
  company_fax: z.string().max(0).optional(),
})

function requestIp(request: NextRequest) {
  return (request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown').trim()
}

export async function POST(request: NextRequest) {
  try {
    const parsed = interestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Please check the form.' },
        { status: 400 },
      )
    }

    const input = parsed.data
    const ipHash = hashIP(requestIp(request))
    const supabase = createAdminClient()
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count, error: rateError } = await supabase
      .from('advisor_interest_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', oneDayAgo)

    if (rateError) {
      console.error('Advisor-interest rate-limit check failed:', rateError.code)
      return NextResponse.json({ error: 'The interest form is temporarily unavailable.' }, { status: 503 })
    }
    if ((count || 0) >= 3) {
      return NextResponse.json({ error: 'Too many submissions were received. Please try again tomorrow.' }, { status: 429 })
    }

    const { error: insertError } = await supabase
      .from('advisor_interest_submissions')
      .insert({
        contact_name: input.contact_name,
        business_name: input.business_name,
        email: input.email,
        website_url: input.website_url || null,
        interests: [...new Set(input.interests)],
        message: input.message || null,
        consent_confirmed: true,
        ip_hash: ipHash,
        user_agent: request.headers.get('user-agent')?.slice(0, 500) || null,
      })

    if (insertError) {
      console.error('Advisor-interest insert failed:', insertError.code)
      return NextResponse.json({ error: 'Your interest could not be saved.' }, { status: 500 })
    }

    return NextResponse.json(
      { success: true, message: 'Thanks. Your feedback was saved; this is not a purchase or reservation.' },
      { status: 201 },
    )
  } catch {
    return NextResponse.json({ error: 'The interest form is temporarily unavailable.' }, { status: 503 })
  }
}
