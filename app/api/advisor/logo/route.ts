import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import cloudinary, { LOGO_UPLOAD_OPTIONS, extractPublicId, deleteImage } from '@/lib/cloudinary/config'

/**
 * Upload or update advisor logo
 * POST /api/advisor/logo
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
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
      .select('id, logo_url')
      .eq('claimed_by_user_id', user.id)
      .single()

    if (advisorError || !advisor) {
      return NextResponse.json(
        { error: 'No claimed advisor found for this user' },
        { status: 404 }
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

    // Validate file size (max 2MB for logos)
    const maxSize = 2 * 1024 * 1024 // 2MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 2MB.' },
        { status: 400 }
      )
    }

    // Delete old logo from Cloudinary if it exists
    if (advisor.logo_url) {
      const oldPublicId = extractPublicId(advisor.logo_url)
      if (oldPublicId) {
        try {
          await deleteImage(oldPublicId)
        } catch (error) {
          console.error('Error deleting old logo:', error)
          // Don't fail the upload if deletion fails
        }
      }
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary with logo transformations
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: LOGO_UPLOAD_OPTIONS.folder,
          resource_type: 'auto',
          transformation: [
            // Fit logo within 400x400 maintaining aspect ratio, with padding
            {
              width: 400,
              height: 400,
              crop: 'pad',
              background: 'transparent',
              gravity: 'center',
            },
            // Auto-optimize quality
            { quality: 'auto:best' },
            // Auto-format (serves WebP to supported browsers)
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

    // Update advisor record with new logo URL
    const { error: updateError } = await supabase
      .from('advisors')
      .update({
        logo_url: uploadResult.secure_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', advisor.id)

    if (updateError) {
      console.error('Error updating advisor logo:', updateError)
      // Try to delete the uploaded image since we couldn't update the DB
      try {
        await deleteImage(uploadResult.public_id)
      } catch (deleteError) {
        console.error('Error cleaning up uploaded image:', deleteError)
      }
      return NextResponse.json(
        { error: 'Failed to update advisor logo' },
        { status: 500 }
      )
    }

    // Return the URL and metadata
    return NextResponse.json(
      {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        message: 'Logo uploaded successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    )
  }
}

/**
 * Delete advisor logo
 * DELETE /api/advisor/logo
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
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
      .select('id, logo_url')
      .eq('claimed_by_user_id', user.id)
      .single()

    if (advisorError || !advisor) {
      return NextResponse.json(
        { error: 'No claimed advisor found for this user' },
        { status: 404 }
      )
    }

    if (!advisor.logo_url) {
      return NextResponse.json(
        { error: 'No logo to delete' },
        { status: 400 }
      )
    }

    // Extract public ID from Cloudinary URL
    const publicId = extractPublicId(advisor.logo_url)
    if (publicId) {
      try {
        await deleteImage(publicId)
      } catch (error) {
        console.error('Error deleting logo from Cloudinary:', error)
        // Continue to update DB even if Cloudinary deletion fails
      }
    }

    // Remove logo URL from advisor record
    const { error: updateError } = await supabase
      .from('advisors')
      .update({
        logo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', advisor.id)

    if (updateError) {
      console.error('Error removing advisor logo:', updateError)
      return NextResponse.json(
        { error: 'Failed to remove logo' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Logo deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Logo deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete logo' },
      { status: 500 }
    )
  }
}
