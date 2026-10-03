import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { readTagCatalog } from '@/lib/tags/catalog'
import { validateTagSelection } from '@/lib/tags/validation'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

async function ownedListing() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, company: null, user: null }
  const { data: company } = await supabase.from('companies').select('id, slug').eq('verified_owner_id', user.id).maybeSingle()
  return { supabase, company, user }
}

export async function GET() {
  const { supabase, company, user } = await ownedListing()
  if (!company) return NextResponse.json({ error: user ? 'No connected listing found.' : 'Sign in required.' }, { status: user ? 404 : 401, headers })
  try {
    const catalog = await readTagCatalog()
    const { data, error } = await supabase.from('company_tags').select('tag_id').eq('company_id', company.id)
    if (error) throw error
    let ids = (data || []).map((row) => row.tag_id as string)
    if (!ids.length) {
      const { data: claims } = await supabase.from('listing_claims').select('id').eq('company_id', company.id).eq('claimant_user_id', user!.id).eq('claim_status', 'approved').order('submitted_at', { ascending: false }).limit(1)
      if (claims?.length) {
        const { data: proposed } = await supabase.from('claim_tags').select('tag_id').eq('claim_id', claims[0].id)
        ids = (proposed || []).map((row) => row.tag_id as string)
      }
    }
    return NextResponse.json({ catalog, company_id: company.id, tag_ids: ids }, { headers })
  } catch { return NextResponse.json({ error: 'Directory tags are temporarily unavailable. Your profile information is preserved.' }, { status: 503, headers }) }
}

export async function PUT(request: NextRequest) {
  const { supabase, company, user } = await ownedListing()
  if (!company) return NextResponse.json({ error: user ? 'No connected listing found.' : 'Sign in required.' }, { status: user ? 404 : 401, headers })
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400, headers }) }
  let catalog
  try { catalog = await readTagCatalog() } catch { return NextResponse.json({ error: 'The approved tag catalog is unavailable.' }, { status: 503, headers }) }
  let ids: string[]
  try { ids = validateTagSelection((body as { tag_ids: string[] })?.tag_ids, catalog.tags) }
  catch (failure) { return NextResponse.json({ error: failure instanceof Error ? failure.message : 'Choose valid tags.' }, { status: 400, headers }) }
  const { data, error } = await supabase.rpc('replace_company_tags', { p_company_id: company.id, p_tag_ids: ids })
  if (error) return NextResponse.json({ error: error.code === '42501' ? 'Listing access denied.' : 'Directory tags could not be saved.' }, { status: error.code === '42501' ? 403 : 503, headers })
  revalidatePath('/'); revalidatePath('/listings'); revalidatePath(`/listings/${company.slug}`)
  return NextResponse.json({ tag_ids: data }, { headers })
}
