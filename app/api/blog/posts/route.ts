import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/blog/posts
 * Fetch blog posts with filtering, search, and pagination
 *
 * Query Parameters:
 * - category: string (category slug)
 * - tag: string (tag slug)
 * - search: string (full-text search)
 * - featured: boolean (filter featured posts)
 * - page: number (default: 1)
 * - limit: number (default: 12, max: 50)
 * - sort: "recent" | "popular" | "oldest" (default: "recent")
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const categorySlug = searchParams.get('category')
    const tagSlug = searchParams.get('tag')
    const searchText = searchParams.get('search')
    const featuredOnly = searchParams.get('featured') === 'true'
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const limit = Math.min(
      searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 12,
      50
    )
    const sort = (searchParams.get('sort') || 'recent') as string

    const supabase = await createClient()

    // Start building query
    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        blog_categories (
          id,
          name,
          slug,
          icon,
          color
        )
      `, { count: 'exact' })
      .eq('status', 'published')
      .not('published_at', 'is', null)

    // Filter by category
    if (categorySlug) {
      const { data: category } = await supabase
        .from('blog_categories')
        .select('id')
        .eq('slug', categorySlug)
        .single()

      if (category) {
        query = query.eq('category_id', category.id)
      }
    }

    // Filter by tag
    if (tagSlug) {
      const { data: tag } = await supabase
        .from('blog_tags')
        .select('id')
        .eq('slug', tagSlug)
        .single()

      if (tag) {
        const { data: postIds } = await supabase
          .from('blog_post_tags')
          .select('post_id')
          .eq('tag_id', tag.id)

        if (postIds && postIds.length > 0) {
          query = query.in('id', postIds.map(pt => pt.post_id))
        }
      }
    }

    // Filter featured posts
    if (featuredOnly) {
      query = query.eq('is_featured', true)
    }

    // Full-text search
    if (searchText && searchText.trim().length > 0) {
      query = query.or(`title.ilike.%${searchText}%,excerpt.ilike.%${searchText}%`)
    }

    // Sorting
    switch (sort) {
      case 'popular':
        query = query.order('view_count', { ascending: false })
        break
      case 'oldest':
        query = query.order('published_at', { ascending: true })
        break
      case 'recent':
      default:
        query = query.order('published_at', { ascending: false })
        break
    }

    // Execute query
    const { data: posts, error, count } = await query

    if (error) {
      console.error('Blog posts query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch blog posts' },
        { status: 500 }
      )
    }

    // Pagination
    const totalResults = count || 0
    const totalPages = Math.ceil(totalResults / limit)
    const offset = (page - 1) * limit
    const paginatedPosts = posts?.slice(offset, offset + limit) || []

    // Fetch tags and author info for each post
    const postsWithTagsAndAuthors = await Promise.all(
      paginatedPosts.map(async (post) => {
        // Fetch tags
        const { data: postTags } = await supabase
          .from('blog_post_tags')
          .select(`
            blog_tags (
              id,
              name,
              slug
            )
          `)
          .eq('post_id', post.id)

        // Fetch author from users_public
        let authorData = null
        if (post.author_id) {
          const { data: author } = await supabase
            .from('users_public')
            .select('id, display_name, avatar_url')
            .eq('user_id', post.author_id)
            .single()

          authorData = author
        }

        return {
          ...post,
          tags: postTags?.map(pt => pt.blog_tags) || [],
          users_public: authorData
        }
      })
    )

    // Response
    return NextResponse.json({
      posts: postsWithTagsAndAuthors,
      pagination: {
        page,
        limit,
        total: totalResults,
        totalPages,
        hasMore: page < totalPages,
        hasPrevious: page > 1,
      },
      filters: {
        category: categorySlug,
        tag: tagSlug,
        search: searchText,
        featured: featuredOnly,
        sort,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
