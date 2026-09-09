import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional()
const textList = z.array(z.string().trim().min(1).max(100)).max(30).default([])

const companyProfileSchema = z.object({
  company: z.object({
    name: z.string().trim().min(2).max(255),
    description: optionalText(4000),
    website_url: optionalText(2048),
    phone: optionalText(50),
    email: z.string().trim().email().max(320).nullable().optional(),
    address: optionalText(255),
    city: optionalText(100),
    state_province: optionalText(100),
    country: z.enum(['CA', 'US']).nullable().optional(),
    facebook_url: optionalText(2048),
    instagram_url: optionalText(2048),
    twitter_url: optionalText(2048),
    logo_url: optionalText(2048),
  }),
  profile: z.object({
    tagline: z.string().trim().min(10).max(160).nullable().optional(),
    services: textList,
    specialties: textList,
    pathways: textList,
    player_levels: textList,
    age_groups: textList,
    service_areas: textList,
    languages: textList,
    offers_remote: z.boolean().default(false),
    accepting_clients: z.boolean().nullable().default(null),
    pricing_models: textList,
    price_min: z.number().int().min(0).max(1_000_000).nullable().default(null),
    price_max: z.number().int().min(0).max(1_000_000).nullable().default(null),
    price_currency: z.enum(['CAD', 'USD']).nullable().default(null),
    response_time: optionalText(50),
    founded_year: z.number().int().min(1900).max(2100).nullable().default(null),
    business_hours: z.record(z.string(), z.string().max(100)).default({}),
    faq: z.array(z.object({ question: z.string().trim().min(3).max(200), answer: z.string().trim().min(3).max(1000) })).max(12).default([]),
  }).refine((profile) => profile.price_min === null || profile.price_max === null || profile.price_max >= profile.price_min, {
    message: 'Maximum price must be greater than or equal to minimum price.',
    path: ['price_max'],
  }),
})

async function getOwnedCompany() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { supabase, status: 401 as const, company: null }

  const { data: company, error } = await supabase
    .from('companies')
    .select(`
      id, slug, name, description, website_url, phone, email, address, city,
      state_province, country, facebook_url, instagram_url, twitter_url,
      logo_url, verified, verified_owner_id
    `)
    .eq('verified_owner_id', user.id)
    .maybeSingle()

  if (error || !company) return { supabase, status: 404 as const, company: null }
  return { supabase, status: 200 as const, company }
}

export async function GET() {
  try {
    const owned = await getOwnedCompany()
    if (!owned.company) return NextResponse.json({ error: owned.status === 401 ? 'Sign in required.' : 'No connected company listing was found for this account.' }, { status: owned.status })

    const [{ data: profile, error: profileError }, { data: team, error: teamError }] = await Promise.all([
      owned.supabase.from('company_profiles').select('*').eq('company_id', owned.company.id).maybeSingle(),
      owned.supabase.from('advisors').select('*').eq('company_id', owned.company.id).order('display_order').order('created_at'),
    ])

    if (profileError || teamError) {
      console.error('Failed to read owned profile:', profileError?.code || teamError?.code)
      return NextResponse.json({ error: 'The profile could not be loaded.' }, { status: 500 })
    }

    return NextResponse.json({ company: owned.company, profile: profile || null, team: team || [] }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Error in GET /api/advisor/profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const owned = await getOwnedCompany()
    if (!owned.company) return NextResponse.json({ error: owned.status === 401 ? 'Sign in required.' : 'No connected company listing was found for this account.' }, { status: owned.status })

    const parsed = companyProfileSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid profile information.' }, { status: 400 })

    const { company, profile } = parsed.data
    const { data: updatedCompany, error: companyError } = await owned.supabase
      .from('companies')
      .update(company)
      .eq('id', owned.company.id)
      .eq('verified_owner_id', owned.company.verified_owner_id)
      .select(`
        id, slug, name, description, website_url, phone, email, address, city,
        state_province, country, facebook_url, instagram_url, twitter_url,
        logo_url, verified, verified_owner_id
      `)
      .single()

    if (companyError || !updatedCompany) {
      console.error('Failed to update owned company:', companyError?.code)
      return NextResponse.json({ error: 'The company details could not be saved.' }, { status: 500 })
    }

    const { data: updatedProfile, error: profileError } = await owned.supabase
      .from('company_profiles')
      .upsert({ company_id: owned.company.id, ...profile }, { onConflict: 'company_id' })
      .select('*')
      .single()

    if (profileError || !updatedProfile) {
      console.error('Failed to update owned company profile:', profileError?.code)
      return NextResponse.json({ error: 'The company was saved, but the detailed profile could not be saved. Please try again.' }, { status: 500 })
    }

    revalidatePath('/')
    revalidatePath('/listings')
    revalidatePath(`/listings/${updatedCompany.slug}`)

    return NextResponse.json({ success: true, company: updatedCompany, profile: updatedProfile })
  } catch (error) {
    console.error('Error in PATCH /api/advisor/profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
