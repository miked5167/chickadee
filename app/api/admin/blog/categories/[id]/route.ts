import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/supabase/auth'

/**
 * PATCH /api/admin/blog/categories/[id]
 * Update a blog category
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
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.icon !== undefined) updateData.icon = body.icon || null
    if (body.color !== undefined) updateData.color = body.color || null

    // Update the category
    const { data: category, error } = await supabase
      .from('blog_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating category:', error)

      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Category name or slug already exists' },
          { status: 409 }
        )
      }

      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error in PATCH /api/admin/blog/categories/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/blog/categories/[id]
 * Delete a blog category
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

    // Check if category has posts
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('category_id', id)
      .limit(1)

    if (postsError) {
      console.error('Error checking posts:', postsError)
      return NextResponse.json({ error: 'Failed to check category usage' }, { status: 500 })
    }

    if (posts && posts.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with associated posts' },
        { status: 409 }
      )
    }

    // Delete the category
    const { error } = await supabase
      .from('blog_categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting category:', error)
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/blog/categories/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
