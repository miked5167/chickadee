import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { extractPublicId, deleteImage } from '@/lib/cloudinary/config'

const idSchema = z.string().uuid()
const updateSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  title: z.string().trim().max(100).nullable().optional(),
  bio: z.string().trim().max(3000).nullable().optional(),
  email: z.string().trim().email().max(255).nullable().optional().or(z.literal('')),
  phone: z.string().trim().max(20).nullable().optional(),
  display_order: z.coerce.number().int().min(0).max(1000).optional(),
  is_active: z.boolean().optional(),
}).strict()

async function authorizeMember(id: string) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, status: 401 as const, member: null }

  const { data: member } = await supabase
    .from('advisors')
    .select('id, company_id, profile_image_url')
    .eq('id', id)
    .single()

  if (!member) return { supabase, status: 404 as const, member: null }
  const { data: company } = await supabase.from('companies').select('id').eq('id', member.company_id).eq('verified_owner_id', user.id).single()
  return { supabase, status: company ? 200 as const : 403 as const, member: company ? member : null }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!idSchema.safeParse(id).success) return NextResponse.json({ error: 'Team member identifier is invalid.' }, { status: 400 })
  const { supabase, status, member } = await authorizeMember(id)
  if (!member) return NextResponse.json({ error: status === 401 ? 'Unauthorized' : status === 404 ? 'Team member not found.' : 'Forbidden' }, { status })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request body is invalid.' }, { status: 400 }) }
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Please check the team member details.' }, { status: 400 })

  const input = parsed.data
  const update = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.title !== undefined ? { title: input.title || null } : {}),
    ...(input.bio !== undefined ? { bio: input.bio || null } : {}),
    ...(input.email !== undefined ? { contact_email: input.email || null } : {}),
    ...(input.phone !== undefined ? { contact_phone: input.phone || null } : {}),
    ...(input.display_order !== undefined ? { display_order: input.display_order } : {}),
    ...(input.is_active !== undefined ? { active: input.is_active } : {}),
  }

  const { data, error } = await supabase.from('advisors').update(update).eq('id', member.id)
    .select('id, name, title, bio, profile_image_url, contact_email, contact_phone, display_order, active, created_at, updated_at').single()
  if (error || !data) return NextResponse.json({ error: 'Team member could not be updated.' }, { status: 500 })

  return NextResponse.json({
    teamMember: {
      id: data.id,
      name: data.name,
      title: data.title,
      bio: data.bio,
      photo_url: data.profile_image_url,
      email: data.contact_email,
      phone: data.contact_phone,
      display_order: data.display_order ?? 0,
      is_active: data.active ?? true,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
    message: 'Team member updated.',
  })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!idSchema.safeParse(id).success) return NextResponse.json({ error: 'Team member identifier is invalid.' }, { status: 400 })
  const { supabase, status, member } = await authorizeMember(id)
  if (!member) return NextResponse.json({ error: status === 401 ? 'Unauthorized' : status === 404 ? 'Team member not found.' : 'Forbidden' }, { status })

  const { error } = await supabase.from('advisors').delete().eq('id', member.id)
  if (error) return NextResponse.json({ error: 'Team member could not be deleted.' }, { status: 500 })

  if (member.profile_image_url) {
    const publicId = extractPublicId(member.profile_image_url)
    if (publicId) {
      try { await deleteImage(publicId) } catch (cleanupError) { console.error('Team photo cleanup failed:', cleanupError) }
    }
  }

  return NextResponse.json({ success: true, message: 'Team member deleted.' })
}
