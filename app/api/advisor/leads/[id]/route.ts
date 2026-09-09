import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const updateSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'closed', 'spam']).optional(),
  owner_notes: z.string().trim().max(2000).nullable().optional(),
}).refine((value) => value.status !== undefined || value.owner_notes !== undefined, { message: 'No update was provided.' })

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: 'Inquiry not found.' }, { status: 404 })
    const parsed = updateSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
    const { data: company } = await supabase.from('companies').select('id').eq('verified_owner_id', user.id).maybeSingle()
    if (!company) return NextResponse.json({ error: 'No connected company listing was found.' }, { status: 404 })

    const { data: lead, error } = await supabase
      .from('company_leads')
      .update(parsed.data)
      .eq('id', id)
      .eq('company_id', company.id)
      .select('*')
      .maybeSingle()

    if (error) {
      console.error('Owner lead update failed:', error.code)
      return NextResponse.json({ error: 'The inquiry could not be updated.' }, { status: 500 })
    }
    if (!lead) return NextResponse.json({ error: 'Inquiry not found.' }, { status: 404 })
    return NextResponse.json({ success: true, lead })
  } catch (error) {
    console.error('Error in PATCH /api/advisor/leads/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
