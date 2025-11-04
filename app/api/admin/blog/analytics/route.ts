import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // TODO: Add proper admin role check
    // For now, allowing any authenticated user (development mode)

    // Get total posts count
    const { count: totalPosts } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })

    // Get published posts count
    const { count: publishedPosts } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    // Get draft posts count
    const { count: draftPosts } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft')

    // Get total views
    const { data: viewsData } = await supabase
      .from('blog_posts')
      .select('view_count')

    const totalViews = viewsData?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0

    // Get views in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentViewsData } = await supabase
      .from('blog_post_views')
      .select('view_count')
      .gte('created_at', thirtyDaysAgo.toISOString())

    const viewsLast30Days = recentViewsData?.reduce((sum, row) => sum + (row.view_count || 0), 0) || 0

    // Get top performing posts
    const { data: topPosts } = await supabase
      .from('blog_posts')
      .select('id, title, slug, view_count, created_at, status')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(10)

    // Get category performance
    const { data: categoryData } = await supabase
      .from('blog_categories')
      .select('id, name, slug, post_count')
      .order('post_count', { ascending: false })

    // Get tag performance
    const { data: tagData } = await supabase
      .from('blog_tags')
      .select('id, name, slug, post_count')
      .order('post_count', { ascending: false })
      .limit(20)

    // Get recent posts (last 30 days)
    const { count: postsLast30Days } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    const analytics = {
      totalPosts: totalPosts || 0,
      publishedPosts: publishedPosts || 0,
      draftPosts: draftPosts || 0,
      totalViews,
      viewsLast30Days,
      postsLast30Days: postsLast30Days || 0,
      topPosts: topPosts || [],
      categories: categoryData || [],
      topTags: tagData || [],
    }

    return NextResponse.json(
      { analytics },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/admin/blog/analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
