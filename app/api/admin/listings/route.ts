import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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

    // Get request body
    const body = await request.json()

    // Required fields
    const { name, city, state } = body

    if (!name || !city || !state) {
      return NextResponse.json(
        { error: 'Name, city, and state are required' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Math.random().toString(36).substring(2, 7)

    // Build insert object
    const insertData: any = {
      name,
      slug,
      city,
      state,
      country: body.country || 'Canada',
      is_published: body.is_published || false,
      is_featured: body.is_featured || false,
      is_verified: body.is_verified || false,
    }

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

    // Optional fields (database column names)
    const optionalFields = [
      'description', 'email', 'phone', 'website_url', 'logo_url',
      'address', 'zip_code', 'latitude', 'longitude',
      'services_offered', 'specialties', 'years_in_business',
      'price_range', 'certification_info',
      'linkedin_url', 'instagram_url', 'twitter_url', 'facebook_url', 'youtube_url',
      'subscription_tier', 'subscription_start_date', 'subscription_end_date',
      'team_members', 'business_hours'
    ]

    // Process fields with mapping
    for (const [formField, dbField] of Object.entries(fieldMapping)) {
      if (body[formField] !== undefined && body[formField] !== null && body[formField] !== '') {
        insertData[dbField] = body[formField]
      }
    }

    // Process fields that don't need mapping
    for (const field of optionalFields) {
      if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
        insertData[field] = body[field]
      }
    }

    // Convert empty strings to null for timestamp fields
    const timestampFields = ['subscription_start_date', 'subscription_end_date']
    for (const field of timestampFields) {
      if (insertData[field] === '') {
        insertData[field] = null
      }
    }

    // Remove fields that don't exist in the database
    delete insertData.age_groups_served
    delete insertData.availability_status
    delete insertData.title

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
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    // Insert the advisor
    const { data: newAdvisor, error: insertError } = await adminClient
      .from('advisors')
      .insert([insertData])
      .select()
      .single()

    if (insertError) {
      console.error('Error creating advisor:', insertError)
      return NextResponse.json(
        { error: 'Failed to create advisor' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, advisor: newAdvisor },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/admin/listings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // TODO: Add proper admin role check
    // For now, allowing any authenticated user (development mode)

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const claimed = searchParams.get('claimed') || 'all'
    const published = searchParams.get('published') || 'all'
    const subscription = searchParams.get('subscription') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Calculate offset
    const offset = (page - 1) * limit

    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    // Build query
    let query = adminClient
      .from('advisors')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`)
    }

    // Apply claimed filter
    if (claimed !== 'all') {
      query = query.eq('is_claimed', claimed === 'true')
    }

    // Apply published filter
    if (published !== 'all') {
      query = query.eq('is_published', published === 'true')
    }

    // Apply subscription filter
    if (subscription === 'expiring') {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      query = query
        .not('subscription_end_date', 'is', null)
        .lte('subscription_end_date', thirtyDaysFromNow.toISOString())
        .gte('subscription_end_date', new Date().toISOString())
    } else if (subscription === 'expired') {
      query = query
        .not('subscription_end_date', 'is', null)
        .lt('subscription_end_date', new Date().toISOString())
    }

    // Apply pagination
    const { data: advisors, error: advisorsError, count } = await query.range(offset, offset + limit - 1)

    if (advisorsError) {
      console.error('Error fetching advisors:', advisorsError)
      return NextResponse.json(
        { error: 'Failed to fetch advisors' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        advisors: advisors || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/admin/listings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
