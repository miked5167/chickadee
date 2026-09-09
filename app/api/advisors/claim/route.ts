import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const noStoreHeaders = { 'Cache-Control': 'no-store' }

const claimSchema = z.object({
  company_id: z.string().uuid(),
  business_email: z.string().trim().email().max(255),
  business_phone: z.string().trim().max(30).optional().nullable(),
  relationship: z.string().trim().min(20).max(500),
  verification_details: z.string().trim().min(50).max(1500),
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

  const { data: claim, error: claimError } = await supabase
    .from('listing_claims')
    .insert({
      company_id,
      claimant_user_id: user.id,
      claim_status: 'pending',
      verification_method: 'manual',
      verification_data: {
        relationship,
        verification_details,
        submitted_account_email: user.email ?? null,
      },
      business_email,
      business_phone: business_phone || null,
    })
    .select('id, claim_status, submitted_at')
    .single()

  if (claimError?.code === '23505') {
    return NextResponse.json(
      { error: 'An active claim already exists for this listing.' },
      { status: 409, headers: noStoreHeaders },
    )
  }

  if (claimError || !claim) {
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
