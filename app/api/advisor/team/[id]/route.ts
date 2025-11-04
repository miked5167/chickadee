import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractPublicId, deleteImage } from '@/lib/cloudinary/config'

/**
 * Update a team member
 * PATCH /api/advisor/team/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const teamMemberId = id

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

    // Check that team member belongs to this advisor
    const { data: existingMember, error: checkError } = await supabase
      .from('advisor_team_members')
      .select('id, advisor_id')
      .eq('id', teamMemberId)
      .single()

    if (checkError || !existingMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    if (existingMember.advisor_id !== advisor.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this team member' },
        { status: 403 }
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
    if (name !== undefined && name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      )
    }

    // Build update object with only provided fields
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) updates.name = name.trim()
    if (title !== undefined) updates.title = title?.trim() || null
    if (bio !== undefined) updates.bio = bio?.trim() || null
    if (photo_url !== undefined) updates.photo_url = photo_url || null
    if (linkedin_url !== undefined) updates.linkedin_url = linkedin_url?.trim() || null
    if (email !== undefined) updates.email = email?.trim() || null
    if (phone !== undefined) updates.phone = phone?.trim() || null
    if (display_order !== undefined) updates.display_order = display_order
    if (is_active !== undefined) updates.is_active = is_active

    // Update team member
    const { data: teamMember, error: updateError } = await supabase
      .from('advisor_team_members')
      .update(updates)
      .eq('id', teamMemberId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating team member:', updateError)
      return NextResponse.json(
        { error: 'Failed to update team member' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        teamMember,
        message: 'Team member updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PATCH /api/advisor/team/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Delete a team member
 * DELETE /api/advisor/team/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const teamMemberId = id

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

    // Check that team member belongs to this advisor and get photo URL
    const { data: existingMember, error: checkError } = await supabase
      .from('advisor_team_members')
      .select('id, advisor_id, photo_url')
      .eq('id', teamMemberId)
      .single()

    if (checkError || !existingMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    if (existingMember.advisor_id !== advisor.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this team member' },
        { status: 403 }
      )
    }

    // Delete photo from Cloudinary if exists
    if (existingMember.photo_url) {
      const publicId = extractPublicId(existingMember.photo_url)
      if (publicId) {
        try {
          await deleteImage(publicId)
        } catch (error) {
          console.error('Error deleting team member photo:', error)
          // Don't fail the delete if Cloudinary cleanup fails
        }
      }
    }

    // Delete team member
    const { error: deleteError } = await supabase
      .from('advisor_team_members')
      .delete()
      .eq('id', teamMemberId)

    if (deleteError) {
      console.error('Error deleting team member:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete team member' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Team member deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/advisor/team/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
