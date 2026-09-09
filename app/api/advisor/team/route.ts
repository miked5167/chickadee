import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const teamMemberSchema = z.object({
  name: z.string().trim().min(2).max(50),
  title: z.string().trim().max(100).optional().nullable(),
  bio: z.string().trim().max(3000).optional().nullable(),
  email: z.string().trim().email().max(255).optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(20).optional().nullable(),
  display_order: z.coerce.number().int().min(0).max(1000).default(0),
  is_active: z.boolean().default(true),
})

type AdvisorRow = {
  id: string
  name: string
  title: string | null
  bio: string | null
  profile_image_url: string | null
  contact_email: string | null
  contact_phone: string | null
  display_order: number | null
  active: boolean | null
  created_at: string | null
  updated_at: string | null
}

function present(member: AdvisorRow) {
  return {
    id: member.id,
    name: member.name,
    title: member.title,
    bio: member.bio,
    photo_url: member.profile_image_url,
    email: member.contact_email,
    phone: member.contact_phone,
    display_order: member.display_order ?? 0,
    is_active: member.active ?? true,
    created_at: member.created_at,
    updated_at: member.updated_at,
  }
}

async function ownedCompany() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, status: 401 as const, company: null }

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('verified_owner_id', user.id)
    .single()

  return { supabase, status: company ? 200 as const : 404 as const, company }
}

export async function GET() {
  const { supabase, status, company } = await ownedCompany()
  if (!company) return NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'No verified-owner listing found.' }, { status })

  const { data, error } = await supabase
    .from('advisors')
    .select('id, name, title, bio, profile_image_url, contact_email, contact_phone, display_order, active, created_at, updated_at')
    .eq('company_id', company.id)
    .order('display_order')
    .order('created_at')

  if (error) return NextResponse.json({ error: 'Team members could not be loaded.' }, { status: 500 })
  const teamMembers = ((data ?? []) as AdvisorRow[]).map(present)
  return NextResponse.json({ teamMembers, count: teamMembers.length })
}

export async function POST(request: NextRequest) {
  const { supabase, status, company } = await ownedCompany()
  if (!company) return NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'No verified-owner listing found.' }, { status })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request body is invalid.' }, { status: 400 }) }
  const parsed = teamMemberSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Please check the team member details.' }, { status: 400 })

  const member = parsed.data
  const { data, error } = await supabase.from('advisors').insert({
    company_id: company.id,
    name: member.name,
    title: member.title || null,
    bio: member.bio || null,
    contact_email: member.email || null,
    contact_phone: member.phone || null,
    display_order: member.display_order,
    active: member.is_active,
  }).select('id, name, title, bio, profile_image_url, contact_email, contact_phone, display_order, active, created_at, updated_at').single()

  if (error || !data) return NextResponse.json({ error: 'Team member could not be created.' }, { status: 500 })
  return NextResponse.json({ teamMember: present(data as AdvisorRow), message: 'Team member added.' }, { status: 201 })
}
