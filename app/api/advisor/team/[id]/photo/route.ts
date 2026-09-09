import { NextRequest, NextResponse } from 'next/server'
import type { UploadApiResponse } from 'cloudinary'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import cloudinary, { TEAM_PHOTO_UPLOAD_OPTIONS, extractPublicId, deleteImage } from '@/lib/cloudinary/config'

const idSchema = z.string().uuid()

async function authorizeMember(id: string) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, status: 401 as const, member: null }

  const { data: member } = await supabase.from('advisors').select('id, company_id, profile_image_url').eq('id', id).single()
  if (!member) return { supabase, status: 404 as const, member: null }
  const { data: company } = await supabase.from('companies').select('id').eq('id', member.company_id).eq('verified_owner_id', user.id).single()
  return { supabase, status: company ? 200 as const : 403 as const, member: company ? member : null }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!idSchema.safeParse(id).success) return NextResponse.json({ error: 'Team member identifier is invalid.' }, { status: 400 })
  const { supabase, status, member } = await authorizeMember(id)
  if (!member) return NextResponse.json({ error: status === 401 ? 'Unauthorized' : status === 404 ? 'Team member not found.' : 'Forbidden' }, { status })

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'A photo file is required.' }, { status: 400 })
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return NextResponse.json({ error: 'Use a JPEG, PNG, or WebP image.' }, { status: 400 })
  if (file.size > TEAM_PHOTO_UPLOAD_OPTIONS.max_bytes) return NextResponse.json({ error: 'The maximum image size is 2 MB.' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  let uploadResult: UploadApiResponse
  try {
    uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: TEAM_PHOTO_UPLOAD_OPTIONS.folder,
          resource_type: 'image',
          transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
            { flags: 'strip_profile' },
          ],
        },
        (error, result) => error ? reject(error) : result ? resolve(result) : reject(new Error('Image upload did not return a result.')),
      )
      uploadStream.end(buffer)
    })
  } catch (error) {
    console.error('Team photo upload failed:', error)
    return NextResponse.json({ error: 'Photo upload is not available right now.' }, { status: 503 })
  }

  const { error: updateError } = await supabase.from('advisors').update({ profile_image_url: uploadResult.secure_url }).eq('id', member.id)
  if (updateError) {
    try { await deleteImage(uploadResult.public_id) } catch (cleanupError) { console.error('Uploaded photo cleanup failed:', cleanupError) }
    return NextResponse.json({ error: 'The uploaded photo could not be attached to the team member.' }, { status: 500 })
  }

  if (member.profile_image_url) {
    const oldPublicId = extractPublicId(member.profile_image_url)
    if (oldPublicId) {
      try { await deleteImage(oldPublicId) } catch (cleanupError) { console.error('Old team photo cleanup failed:', cleanupError) }
    }
  }

  return NextResponse.json({ url: uploadResult.secure_url, message: 'Photo uploaded.' })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!idSchema.safeParse(id).success) return NextResponse.json({ error: 'Team member identifier is invalid.' }, { status: 400 })
  const { supabase, status, member } = await authorizeMember(id)
  if (!member) return NextResponse.json({ error: status === 401 ? 'Unauthorized' : status === 404 ? 'Team member not found.' : 'Forbidden' }, { status })
  if (!member.profile_image_url) return NextResponse.json({ error: 'This team member has no photo.' }, { status: 400 })

  const { error } = await supabase.from('advisors').update({ profile_image_url: null }).eq('id', member.id)
  if (error) return NextResponse.json({ error: 'Photo could not be removed.' }, { status: 500 })

  const publicId = extractPublicId(member.profile_image_url)
  if (publicId) {
    try { await deleteImage(publicId) } catch (cleanupError) { console.error('Team photo cleanup failed:', cleanupError) }
  }
  return NextResponse.json({ success: true, message: 'Photo removed.' })
}
