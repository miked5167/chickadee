import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import cloudinary, { TEAM_PHOTO_UPLOAD_OPTIONS, extractPublicId, deleteImage } from '@/lib/cloudinary/config'

/**
 * Upload or update team member photo
 * POST /api/advisor/team/[id]/photo
 */
export async function POST(
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
    const { data: teamMember, error: checkError } = await supabase
      .from('advisor_team_members')
      .select('id, advisor_id, photo_url')
      .eq('id', teamMemberId)
      .single()

    if (checkError || !teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    if (teamMember.advisor_id !== advisor.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this team member' },
        { status: 403 }
      )
    }

    // Get the file from the request
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 2MB.' },
        { status: 400 }
      )
    }

    // Delete old photo from Cloudinary if it exists
    if (teamMember.photo_url) {
      const oldPublicId = extractPublicId(teamMember.photo_url)
      if (oldPublicId) {
        try {
          await deleteImage(oldPublicId)
        } catch (error) {
          console.error('Error deleting old photo:', error)
        }
      }
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary with team photo transformations
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: TEAM_PHOTO_UPLOAD_OPTIONS.folder,
          resource_type: 'auto',
          transformation: [
            // Crop to 300x300 square, focusing on face
            {
              width: 300,
              height: 300,
              crop: 'fill',
              gravity: 'face',
            },
            // Auto-optimize quality
            { quality: 'auto:good' },
            // Auto-format
            { fetch_format: 'auto' },
            // Remove metadata
            { flags: 'strip_profile' },
            // Sharpen for clarity
            { effect: 'sharpen:80' },
          ],
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )

      uploadStream.end(buffer)
    })

    // Update team member record with new photo URL
    const { error: updateError } = await supabase
      .from('advisor_team_members')
      .update({
        photo_url: uploadResult.secure_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', teamMemberId)

    if (updateError) {
      console.error('Error updating team member photo:', updateError)
      // Try to delete the uploaded image since we couldn't update the DB
      try {
        await deleteImage(uploadResult.public_id)
      } catch (deleteError) {
        console.error('Error cleaning up uploaded image:', deleteError)
      }
      return NextResponse.json(
        { error: 'Failed to update team member photo' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        message: 'Photo uploaded successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Team photo upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    )
  }
}

/**
 * Delete team member photo
 * DELETE /api/advisor/team/[id]/photo
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

    // Check that team member belongs to this advisor
    const { data: teamMember, error: checkError } = await supabase
      .from('advisor_team_members')
      .select('id, advisor_id, photo_url')
      .eq('id', teamMemberId)
      .single()

    if (checkError || !teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    if (teamMember.advisor_id !== advisor.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this team member' },
        { status: 403 }
      )
    }

    if (!teamMember.photo_url) {
      return NextResponse.json(
        { error: 'No photo to delete' },
        { status: 400 }
      )
    }

    // Extract public ID from Cloudinary URL
    const publicId = extractPublicId(teamMember.photo_url)
    if (publicId) {
      try {
        await deleteImage(publicId)
      } catch (error) {
        console.error('Error deleting photo from Cloudinary:', error)
      }
    }

    // Remove photo URL from team member record
    const { error: updateError } = await supabase
      .from('advisor_team_members')
      .update({
        photo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', teamMemberId)

    if (updateError) {
      console.error('Error removing team member photo:', updateError)
      return NextResponse.json(
        { error: 'Failed to remove photo' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Photo deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Photo deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    )
  }
}
