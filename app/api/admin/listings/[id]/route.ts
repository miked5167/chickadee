import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const advisorId = id

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    // Fetch the advisor by ID
    const { data: advisor, error: fetchError } = await adminClient
      .from('advisors')
      .select('*')
      .eq('id', advisorId)
      .single()

    if (fetchError) {
      console.error('Error fetching advisor:', fetchError)
      return NextResponse.json(
        { error: 'Advisor not found' },
        { status: 404 }
      )
    }

    // Map database fields to form field names for the frontend
    const mappedAdvisor = {
      ...advisor,
      bio: advisor.description,
      street_address: advisor.address,
      postal_code: advisor.zip_code,
      specializations: advisor.specialties,
      credentials: advisor.certification_info,
      experience_years: advisor.years_in_business,
      consultation_fee: advisor.price_range,
    }

    return NextResponse.json(
      { advisor: mappedAdvisor },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/admin/listings/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const advisorId = id

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // TODO: Add proper admin role check
    // For now, allowing any authenticated user (development mode)

    // Get request body
    const body = await request.json()

    // Build update object
    const updateData: any = {}

    // Map form fields to database columns
    const fieldMapping: Record<string, string> = {
      'bio': 'description',
      'street_address': 'address',
      'postal_code': 'zip_code',
      'specializations': 'specialties',
      'credentials': 'certification_info',
      'experience_years': 'years_in_business',
      'consultation_fee': 'price_range',
    }

    // Allow updating these fields (database column names)
    const allowedFields = [
      'name', 'description', 'email', 'phone', 'website_url', 'logo_url',
      'address', 'city', 'state', 'zip_code', 'country',
      'services_offered', 'specialties', 'years_in_business',
      'price_range', 'certification_info',
      'linkedin_url', 'instagram_url', 'twitter_url', 'facebook_url', 'youtube_url',
      'is_published', 'is_featured', 'is_verified',
      'subscription_tier', 'subscription_start_date', 'subscription_end_date',
      'team_members', 'business_hours'
    ]

    // Process fields, mapping form names to database names
    for (const [formField, dbField] of Object.entries(fieldMapping)) {
      if (body[formField] !== undefined) {
        updateData[dbField] = body[formField]
      }
    }

    // Process fields that don't need mapping
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Convert empty strings to null for timestamp fields
    const timestampFields = ['subscription_start_date', 'subscription_end_date']
    for (const field of timestampFields) {
      if (updateData[field] === '') {
        updateData[field] = null
      }
    }

    // Remove fields that don't exist in the database
    delete updateData.age_groups_served
    delete updateData.availability_status
    delete updateData.title

    // Validate team_members if provided
    if (body.team_members) {
      if (!Array.isArray(body.team_members)) {
        return NextResponse.json(
          { error: 'team_members must be an array' },
          { status: 400 }
        )
      }
      if (body.team_members.length > 10) {
        return NextResponse.json(
          { error: 'Maximum 10 team members allowed' },
          { status: 400 }
        )
      }
      // Validate each team member has required fields
      for (const member of body.team_members) {
        if (!member.name || !member.phone || !member.email) {
          return NextResponse.json(
            { error: 'Each team member must have name, phone, and email' },
            { status: 400 }
          )
        }
      }
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    // Log the update data for debugging
    console.log('Update data:', JSON.stringify(updateData, null, 2))

    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    // Update the advisor
    const { data: updatedAdvisor, error: updateError } = await adminClient
      .from('advisors')
      .update(updateData)
      .eq('id', advisorId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating advisor:', updateError)
      console.error('Update data that failed:', JSON.stringify(updateData, null, 2))
      return NextResponse.json(
        { error: 'Failed to update advisor', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, advisor: updatedAdvisor },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PATCH /api/admin/listings/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const advisorId = id

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // TODO: Add proper admin role check
    // For now, allowing any authenticated user (development mode)

    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    // Delete the advisor
    const { error: deleteError } = await adminClient
      .from('advisors')
      .delete()
      .eq('id', advisorId)

    if (deleteError) {
      console.error('Error deleting advisor:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete advisor' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Advisor deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/admin/listings/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
