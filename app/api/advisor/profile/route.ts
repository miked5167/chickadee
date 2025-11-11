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
      .eq('claimed_by_user_id', user.id)
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
      .eq('claimed_by_user_id', user.id)
      .single()

    if (advisorError || !advisor) {
      return NextResponse.json(
        { error: 'No claimed listing found for this user' },
        { status: 404 }
      )
    }

    // Get request body
    const body = await request.json()

    // Build update object
    const updateData: any = {}

    // List of allowed fields for advisors (cannot modify admin-only fields)
    const allowedFields = [
      // Basic Information
      'name',
      'description',
      'years_in_business',

      // Contact Information
      'email',
      'phone',
      'website_url',

      // Location
      'address',
      'city',
      'state',
      'zip_code',
      'country',
      'service_area',

      // Business Details
      'consultation_format',
      'engagement_types',
      'payment_methods',
      'response_time',
      'player_levels',
      'languages',

      // Availability & Pricing
      'accepting_clients',
      'price_range', // Legacy field - keep for reference
      'pricing_notes', // Legacy field - keep for reference
      'typical_engagement_range',
      'pricing_structure',
      'starting_price',
      'consultation_fee_type',
      'consultation_fee_amount',
      'pricing_details',

      // Services & Expertise
      'services_offered',
      'specializations',
      'age_groups_served',
      'credentials',

      // Team Members
      'team_members',

      // Social Media
      'instagram_url',
      'facebook_url',
      'twitter_url',
      'linkedin_url',
      'tiktok_url',
      'youtube_url',

      // Other
      'logo_url',
      'business_hours'
    ]

    // Process fields
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Validate team_members if provided
    if (body.team_members !== undefined) {
      if (body.team_members !== null && !Array.isArray(body.team_members)) {
        return NextResponse.json(
          { error: 'team_members must be an array or null' },
          { status: 400 }
        )
      }
      if (body.team_members && body.team_members.length > 10) {
        return NextResponse.json(
          { error: 'Maximum 10 team members allowed' },
          { status: 400 }
        )
      }
      // Filter out incomplete team members (allow saving partial data)
      if (body.team_members) {
        // Only keep team members that have all required fields
        body.team_members = body.team_members.filter((member: any) => {
          return member.name && member.title && member.bio
        })

        // Validate bio length for complete team members
        for (const member of body.team_members) {
          if (member.bio && member.bio.length > 500) {
            return NextResponse.json(
              { error: 'Team member bio must not exceed 500 characters' },
              { status: 400 }
            )
          }
        }
      }
    }

    // Validate services_offered (minimum 3)
    if (body.services_offered !== undefined) {
      if (body.services_offered !== null && !Array.isArray(body.services_offered)) {
        return NextResponse.json(
          { error: 'services_offered must be an array or null' },
          { status: 400 }
        )
      }
      if (body.services_offered && body.services_offered.length < 3) {
        return NextResponse.json(
          { error: 'Minimum 3 services required' },
          { status: 400 }
        )
      }
    }

    // Validate age_groups_served (minimum 1)
    if (body.age_groups_served !== undefined) {
      if (body.age_groups_served !== null && !Array.isArray(body.age_groups_served)) {
        return NextResponse.json(
          { error: 'age_groups_served must be an array or null' },
          { status: 400 }
        )
      }
      if (body.age_groups_served && body.age_groups_served.length < 1) {
        return NextResponse.json(
          { error: 'Minimum 1 age group required' },
          { status: 400 }
        )
      }
    }

    // Validate specializations (minimum 1)
    if (body.specializations !== undefined) {
      if (body.specializations !== null && !Array.isArray(body.specializations)) {
        return NextResponse.json(
          { error: 'specializations must be an array or null' },
          { status: 400 }
        )
      }
      if (body.specializations && body.specializations.length < 1) {
        return NextResponse.json(
          { error: 'Minimum 1 specialization required' },
          { status: 400 }
        )
      }
    }

    // Validate description length
    if (body.description !== undefined && body.description !== null) {
      if (body.description.length < 50) {
        return NextResponse.json(
          { error: 'Description must be at least 50 characters' },
          { status: 400 }
        )
      }
      if (body.description.length > 2000) {
        return NextResponse.json(
          { error: 'Description must not exceed 2000 characters' },
          { status: 400 }
        )
      }
    }

    // Validate email format
    if (body.email !== undefined && body.email !== null) {
      if (!body.email.includes('@')) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // Validate accepting_clients enum
    if (body.accepting_clients !== undefined && body.accepting_clients !== null) {
      const validStatuses = ['accepting', 'waitlist', 'not_accepting']
      if (!validStatuses.includes(body.accepting_clients)) {
        return NextResponse.json(
          { error: 'Invalid accepting_clients value. Must be: accepting, waitlist, or not_accepting' },
          { status: 400 }
        )
      }
    }

    // Validate pricing fields
    if (body.typical_engagement_range !== undefined && body.typical_engagement_range !== null) {
      const validRanges = ['under-1000', '1000-2500', '2500-5000', '5000-10000', '10000-25000', '25000-plus', 'varies']
      if (!validRanges.includes(body.typical_engagement_range)) {
        return NextResponse.json(
          { error: 'Invalid typical_engagement_range. Must be one of: ' + validRanges.join(', ') },
          { status: 400 }
        )
      }
    }

    if (body.pricing_structure !== undefined) {
      if (body.pricing_structure !== null && !Array.isArray(body.pricing_structure)) {
        return NextResponse.json(
          { error: 'pricing_structure must be an array or null' },
          { status: 400 }
        )
      }
      if (body.pricing_structure) {
        const validStructures = ['one-time', 'season-long', 'package-based', 'flat-fee', 'hourly', 'retainer', 'free-consultation', 'payment-plans', 'sliding-scale']
        for (const structure of body.pricing_structure) {
          if (!validStructures.includes(structure)) {
            return NextResponse.json(
              { error: `Invalid pricing structure: ${structure}. Must be one of: ` + validStructures.join(', ') },
              { status: 400 }
            )
          }
        }
      }
    }

    if (body.starting_price !== undefined && body.starting_price !== null) {
      if (typeof body.starting_price !== 'number') {
        return NextResponse.json(
          { error: 'starting_price must be a number (in cents)' },
          { status: 400 }
        )
      }
      if (body.starting_price < 10000 || body.starting_price > 10000000) {
        return NextResponse.json(
          { error: 'starting_price must be between $100 (10000 cents) and $100,000 (10000000 cents)' },
          { status: 400 }
        )
      }
    }

    if (body.consultation_fee_type !== undefined && body.consultation_fee_type !== null) {
      const validTypes = ['free', 'paid', 'paid-applied']
      if (!validTypes.includes(body.consultation_fee_type)) {
        return NextResponse.json(
          { error: 'Invalid consultation_fee_type. Must be: free, paid, or paid-applied' },
          { status: 400 }
        )
      }

      // If type is paid or paid-applied, amount is required
      if ((body.consultation_fee_type === 'paid' || body.consultation_fee_type === 'paid-applied')) {
        if (body.consultation_fee_amount === undefined || body.consultation_fee_amount === null) {
          return NextResponse.json(
            { error: 'consultation_fee_amount is required when consultation_fee_type is paid or paid-applied' },
            { status: 400 }
          )
        }
      }

      // If type is free, amount must be null
      if (body.consultation_fee_type === 'free' && body.consultation_fee_amount !== null && body.consultation_fee_amount !== undefined) {
        return NextResponse.json(
          { error: 'consultation_fee_amount must be null when consultation_fee_type is free' },
          { status: 400 }
        )
      }
    }

    if (body.consultation_fee_amount !== undefined && body.consultation_fee_amount !== null) {
      if (typeof body.consultation_fee_amount !== 'number') {
        return NextResponse.json(
          { error: 'consultation_fee_amount must be a number (in cents)' },
          { status: 400 }
        )
      }
      if (body.consultation_fee_amount < 0 || body.consultation_fee_amount > 1000000) {
        return NextResponse.json(
          { error: 'consultation_fee_amount must be between $0 and $10,000 (1000000 cents)' },
          { status: 400 }
        )
      }
    }

    if (body.pricing_details !== undefined && body.pricing_details !== null) {
      if (typeof body.pricing_details !== 'string') {
        return NextResponse.json(
          { error: 'pricing_details must be a string' },
          { status: 400 }
        )
      }
      if (body.pricing_details.length > 500) {
        return NextResponse.json(
          { error: 'pricing_details must not exceed 500 characters' },
          { status: 400 }
        )
      }
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

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
        { error: `Failed to update profile: ${updateError.message || updateError.code || 'Unknown error'}` },
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
