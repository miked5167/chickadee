import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/supabase/auth'

/**
 * PATCH /api/admin/blog/tags/[id]
 * Update a blog tag
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Check admin access
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Prepare update data (only include fields that are provided)
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.slug !== undefined) updateData.slug = body.slug

    // Update the tag
    const { data: tag, error } = await supabase
      .from('blog_tags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating tag:', error)

      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Tag name or slug already exists' },
          { status: 409 }
        )
      }

      return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 })
    }

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
    }

    return NextResponse.json(tag)
  } catch (error) {
    console.error('Error in PATCH /api/admin/blog/tags/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/blog/tags/[id]
 * Delete a blog tag
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Check admin access
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if tag has posts
    const { data: postTags, error: postTagsError } = await supabase
      .from('blog_post_tags')
      .select('post_id')
      .eq('tag_id', id)
      .limit(1)

    if (postTagsError) {
      console.error('Error checking post tags:', postTagsError)
      return NextResponse.json({ error: 'Failed to check tag usage' }, { status: 500 })
    }

    if (postTags && postTags.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete tag with associated posts' },
        { status: 409 }
      )
    }

    // Delete the tag
    const { error } = await supabase
      .from('blog_tags')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting tag:', error)
      return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/blog/tags/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
