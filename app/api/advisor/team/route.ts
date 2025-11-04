import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Get all team members for the authenticated advisor
 * GET /api/advisor/team
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get claimed advisor for this user
    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('id')
      .eq('claimed_by_user_id', user.id)
      .single()

    if (advisorError || !advisor) {
      return NextResponse.json(
        { error: 'No claimed advisor found for this user' },
        { status: 404 }
      )
    }

    // Get all team members for this advisor
    const { data: teamMembers, error: teamError } = await supabase
      .from('advisor_team_members')
      .select('*')
      .eq('advisor_id', advisor.id)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (teamError) {
      console.error('Error fetching team members:', teamError)
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        teamMembers: teamMembers || [],
        count: teamMembers?.length || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/advisor/team:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Create a new team member
 * POST /api/advisor/team
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get claimed advisor for this user
    const { data: advisor, error: advisorError } = await supabase
      .from('advisors')
      .select('id')
      .eq('claimed_by_user_id', user.id)
      .single()

    if (advisorError || !advisor) {
      return NextResponse.json(
        { error: 'No claimed advisor found for this user' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      name,
      title,
      bio,
      photo_url,
      linkedin_url,
      email,
      phone,
      display_order,
      is_active,
    } = body

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Create team member
    const { data: teamMember, error: createError } = await supabase
      .from('advisor_team_members')
      .insert({
        advisor_id: advisor.id,
        name: name.trim(),
        title: title?.trim() || null,
        bio: bio?.trim() || null,
        photo_url: photo_url || null,
        linkedin_url: linkedin_url?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        display_order: display_order ?? 0,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating team member:', createError)
      return NextResponse.json(
        { error: 'Failed to create team member' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        teamMember,
        message: 'Team member created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/advisor/team:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
