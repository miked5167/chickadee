import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/supabase/auth'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check admin access
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all blog posts
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        category:blog_categories(id, name, slug, color)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching blog posts:', error)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error in GET /api/admin/blog/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check admin access
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()

    // Prepare post data
    const postData = {
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt,
      content: body.content,
      featured_image_url: body.featured_image_url || null,
      featured_image_alt: body.featured_image_alt || null,
      author_id: user.id,
      category_id: body.category_id || null,
      meta_title: body.meta_title || body.title,
      meta_description: body.meta_description || body.excerpt,
      status: body.status || 'draft',
      is_featured: body.is_featured || false,
    }

    // Insert the blog post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert([postData])
      .select()
      .single()

    if (error) {
      console.error('Error creating blog post:', error)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/blog/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
