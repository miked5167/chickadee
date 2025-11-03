import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get advisor record for this user
    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('*')
      .eq('is_claimed', true)
      .single()

    if (advisorError || !advisor) {
      return NextResponse.json(
        { error: 'No claimed listing found for this user' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { advisor },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/advisor/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get advisor record for this user
    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('id')
      .eq('is_claimed', true)
      .single()

    if (advisorError || !advisor) {
      return NextResponse.json(
        { error: 'No claimed listing found for this user' },
        { status: 404 }
      )
    }

    // Get request body
    const body = await request.json()
    const {
      name,
      title,
      bio,
      email,
      phone,
      website_url,
      street_address,
      city,
      province,
      postal_code,
      services_offered,
      credentials,
      experience_years,
      specializations,
      age_groups_served,
      availability_status,
      consultation_fee,
    } = body

    // Build update object with only provided fields
    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (title !== undefined) updateData.title = title
    if (bio !== undefined) updateData.bio = bio
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (website_url !== undefined) updateData.website_url = website_url
    if (street_address !== undefined) updateData.street_address = street_address
    if (city !== undefined) updateData.city = city
    if (province !== undefined) updateData.province = province
    if (postal_code !== undefined) updateData.postal_code = postal_code
    if (services_offered !== undefined) updateData.services_offered = services_offered
    if (credentials !== undefined) updateData.credentials = credentials
    if (experience_years !== undefined) updateData.experience_years = experience_years
    if (specializations !== undefined) updateData.specializations = specializations
    if (age_groups_served !== undefined) updateData.age_groups_served = age_groups_served
    if (availability_status !== undefined) updateData.availability_status = availability_status
    if (consultation_fee !== undefined) updateData.consultation_fee = consultation_fee

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    // Validate required fields
    if (updateData.email && !updateData.email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (updateData.experience_years !== undefined && updateData.experience_years < 0) {
      return NextResponse.json(
        { error: 'Experience years must be a positive number' },
        { status: 400 }
      )
    }

    // Update the advisor profile
    const { data: updatedAdvisor, error: updateError } = await supabase
      .from('advisors')
      .update(updateData)
      .eq('id', advisor.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating advisor profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, advisor: updatedAdvisor },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PATCH /api/advisor/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
