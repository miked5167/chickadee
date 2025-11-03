import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/supabase/auth'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()

    // Check admin access
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the blog post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        category:blog_categories(id, name, slug, color)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching blog post:', error)
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Fetch associated tags
    const { data: postTags } = await supabase
      .from('blog_post_tags')
      .select('tag_id, tag:blog_tags(id, name, slug)')
      .eq('post_id', params.id)

    const tags = postTags?.map(pt => pt.tag) || []

    return NextResponse.json({ ...post, tags })
  } catch (error) {
    console.error('Error in GET /api/admin/blog/posts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()

    // Check admin access
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Prepare update data
    const updateData = {
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt,
      content: body.content,
      featured_image_url: body.featured_image_url || null,
      featured_image_alt: body.featured_image_alt || null,
      category_id: body.category_id || null,
      meta_title: body.meta_title || body.title,
      meta_description: body.meta_description || body.excerpt,
      status: body.status,
      is_featured: body.is_featured,
      updated_at: new Date().toISOString(),
    }

    // Update the blog post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating blog post:', error)
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
    }

    // Handle tags if provided
    if (body.tag_ids !== undefined) {
      // Delete existing tag associations
      await supabase
        .from('blog_post_tags')
        .delete()
        .eq('post_id', params.id)

      // Insert new tag associations
      if (Array.isArray(body.tag_ids) && body.tag_ids.length > 0) {
        const tagAssociations = body.tag_ids.map((tagId: string) => ({
          post_id: params.id,
          tag_id: tagId,
        }))

        const { error: tagError } = await supabase
          .from('blog_post_tags')
          .insert(tagAssociations)

        if (tagError) {
          console.error('Error updating tags:', tagError)
          // Don't fail the whole request, just log the error
        }
      }
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error in PATCH /api/admin/blog/posts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()

    // Check admin access
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete the blog post
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting blog post:', error)
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/blog/posts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
