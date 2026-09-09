import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { hashIP } from '@/lib/utils/security'
import { sendLeadConfirmationEmail, sendLeadNotificationEmail } from '@/lib/utils/email'

export const dynamic = 'force-dynamic'

const leadSchema = z.object({
  company_id: z.string().uuid().optional(),
  advisor_id: z.string().uuid().optional(),
  contact_name: z.string().trim().min(2).max(100).optional(),
  parent_name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).nullable().optional(),
  player_age: z.number().int().min(5).max(30).nullable().optional(),
  child_age: z.number().int().min(5).max(30).nullable().optional(),
  player_level: z.string().trim().max(100).nullable().optional(),
  goals: z.array(z.string().trim().min(1).max(100)).max(12).optional(),
  message: z.string().trim().min(50).max(2000),
  elite_prospects_link: z.string().trim().url().max(2048).nullable().optional(),
  consent_confirmed: z.literal(true),
}).refine((value) => Boolean(value.company_id || value.advisor_id), { message: 'A company is required.' })
  .refine((value) => Boolean(value.contact_name || value.parent_name), { message: 'Your name is required.' })

function requestIp(request: NextRequest) {
  return (request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown').trim()
}

export async function POST(request: NextRequest) {
  try {
    const parsed = leadSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid inquiry.' }, { status: 400 })

    const input = parsed.data
    const companyId = input.company_id || input.advisor_id!
    const contactName = input.contact_name || input.parent_name!
    const supabase = createAdminClient()
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, email, verified_owner_id')
      .eq('id', companyId)
      .maybeSingle()

    if (companyError || !company) return NextResponse.json({ error: 'Company not found.' }, { status: 404 })

    const ipHash = hashIP(requestIp(request))
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count, error: rateError } = await supabase
      .from('company_leads')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', oneHourAgo)

    if (rateError) {
      console.error('Lead rate-limit check failed:', rateError.code)
      return NextResponse.json({ error: 'The inquiry service is temporarily unavailable.' }, { status: 503 })
    }
    if ((count || 0) >= 5) return NextResponse.json({ error: 'Too many inquiries were submitted. Please try again later.' }, { status: 429 })

    const referralUrl = request.headers.get('referer')?.slice(0, 2048) || null
    const { data: lead, error: leadError } = await supabase
      .from('company_leads')
      .insert({
        company_id: company.id,
        contact_name: contactName,
        contact_email: input.email,
        contact_phone: input.phone || null,
        player_age: input.player_age ?? input.child_age ?? null,
        player_level: input.player_level || null,
        goals: input.goals || [],
        message: input.message,
        consent_confirmed: true,
        referral_url: referralUrl,
        ip_hash: ipHash,
        user_agent: request.headers.get('user-agent')?.slice(0, 500) || null,
      })
      .select('id')
      .single()

    if (leadError || !lead) {
      console.error('Lead insert failed:', leadError?.code)
      return NextResponse.json({ error: 'The inquiry could not be submitted.' }, { status: 500 })
    }

    if (company.email) {
      await sendLeadNotificationEmail({
        advisorName: company.name,
        advisorEmail: company.email,
        parentName: contactName,
        parentEmail: input.email,
        parentPhone: input.phone || undefined,
        eliteProspectsLink: input.elite_prospects_link || undefined,
        message: input.message,
        leadId: lead.id,
      })
    }
    await sendLeadConfirmationEmail(input.email, contactName, company.name)

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/leads:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
