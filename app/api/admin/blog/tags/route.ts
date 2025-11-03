import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/supabase/auth'

/**
 * GET /api/admin/blog/tags
 * Fetch all blog tags for admin management
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Check admin access
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: tags, error } = await supabase
      .from('blog_tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching tags:', error)
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }

    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error in GET /api/admin/blog/tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/blog/tags
 * Create a new blog tag
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check admin access
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Prepare tag data
    const tagData = {
      name: body.name,
      slug: body.slug,
    }

    // Insert the tag
    const { data: tag, error } = await supabase
      .from('blog_tags')
      .insert([tagData])
      .select()
      .single()

    if (error) {
      console.error('Error creating tag:', error)

      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Tag name or slug already exists' },
          { status: 409 }
        )
      }

      return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
    }

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/blog/tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
