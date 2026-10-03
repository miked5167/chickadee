import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { readTagCatalog } from '@/lib/tags/catalog'
import { tagSelectionSchema, validateTagSelection } from '@/lib/tags/validation'

export const dynamic = 'force-dynamic'

const noStoreHeaders = { 'Cache-Control': 'no-store' }

const claimSchema = z.object({
  company_id: z.string().uuid(),
  business_email: z.string().trim().email().max(255),
  business_phone: z.string().trim().max(20).optional().nullable(),
  relationship: z.string().trim().min(20).max(500),
  verification_details: z.string().trim().min(50).max(1500),
  tag_ids: tagSelectionSchema,
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authenticationError } = await supabase.auth.getUser()

  if (authenticationError || !user) {
    return NextResponse.json(
      { error: 'Sign in before claiming a listing.' },
      { status: 401, headers: noStoreHeaders },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.' },
      { status: 400, headers: noStoreHeaders },
    )
  }

  const parsed = claimSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Claim information is invalid.' },
      { status: 400, headers: noStoreHeaders },
    )
  }

  const { company_id, business_email, business_phone, relationship, verification_details } = parsed.data
  let catalog
  try { catalog = await readTagCatalog() } catch {
    return NextResponse.json({ error: 'Approved tags are temporarily unavailable.' }, { status: 503, headers: noStoreHeaders })
  }
  let tagIds: string[]
  try { tagIds = validateTagSelection(parsed.data.tag_ids, catalog.tags) } catch (failure) {
    return NextResponse.json({ error: failure instanceof Error ? failure.message : 'Choose valid tags.' }, { status: 400, headers: noStoreHeaders })
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, verified_owner_id')
    .eq('id', company_id)
    .maybeSingle()

  if (companyError || !company) {
    return NextResponse.json(
      { error: 'Company listing was not found.' },
      { status: 404, headers: noStoreHeaders },
    )
  }

  if (company.verified_owner_id) {
    return NextResponse.json(
      { error: 'This listing is already claimed.' },
      { status: 409, headers: noStoreHeaders },
    )
  }

  const { data: existingClaim, error: existingClaimError } = await supabase
    .from('listing_claims')
    .select('id, claim_status')
    .eq('company_id', company_id)
    .eq('claimant_user_id', user.id)
    .in('claim_status', ['pending', 'under_review'])
    .maybeSingle()

  if (existingClaimError) {
    return NextResponse.json(
      { error: 'Claim status could not be checked.' },
      { status: 500, headers: noStoreHeaders },
    )
  }

  if (existingClaim) {
    return NextResponse.json(
      { error: 'You already have an active claim for this listing.' },
      { status: 409, headers: noStoreHeaders },
    )
  }

  // One database transaction records the pending claim and its private tags.
  const { data: claim, error: claimError } = await supabase.rpc('submit_directory_claim', {
      p_company_id: company_id,
      p_business_email: business_email,
      p_business_phone: business_phone || null,
      p_verification_data: {
        relationship,
        verification_details,
        submitted_account_email: user.email ?? null,
      },
      p_tag_ids: tagIds,
    })

  if (claimError?.code === '23505' || claimError?.code === '23P01') {
    return NextResponse.json(
      { error: 'An active claim already exists for this listing.' },
      { status: 409, headers: noStoreHeaders },
    )
  }

  if (claimError || !claim) {
    if (claimError?.code === '22023' || claimError?.code === '42501') return NextResponse.json({ error: 'The listing or tag selection is no longer available. Refresh and try again.' }, { status: claimError.code === '42501' ? 403 : 400, headers: noStoreHeaders })
    console.error('Failed to submit listing claim:', claimError)
    return NextResponse.json(
      { error: 'The claim could not be submitted.' },
      { status: 500, headers: noStoreHeaders },
    )
  }

  return NextResponse.json(
    { claimId: claim.id, status: claim.claim_status, submittedAt: claim.submitted_at },
    { status: 201, headers: noStoreHeaders },
  )
}
