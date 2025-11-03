import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/supabase/auth'

/**
 * GET /api/admin/blog/categories
 * Fetch all blog categories for admin management
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Check admin access
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: categories, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error in GET /api/admin/blog/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/blog/categories
 * Create a new blog category
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

    // Prepare category data
    const categoryData = {
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      icon: body.icon || null,
      color: body.color || '#003f87',
    }

    // Insert the category
    const { data: category, error } = await supabase
      .from('blog_categories')
      .insert([categoryData])
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)

      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Category name or slug already exists' },
          { status: 409 }
        )
      }

      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/blog/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
