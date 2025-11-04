import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thehockeydirectory.com'

  try {
    const supabase = await createClient()

    // Fetch all published advisors
    const { data: advisors } = await supabase
      .from('advisors')
      .select('slug, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false })

    // Fetch all published blog posts
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })

    // Fetch blog categories
    const { data: categories } = await supabase
      .from('blog_categories')
      .select('slug, updated_at')
      .order('name')

    // Fetch blog tags
    const { data: tags } = await supabase
      .from('blog_tags')
      .select('slug, updated_at')
      .order('name')

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/listings`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}/terms`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/privacy`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/cookie-policy`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
    ]

    // Advisor listing pages
    const advisorPages: MetadataRoute.Sitemap = (advisors || []).map((advisor) => ({
      url: `${baseUrl}/listings/${advisor.slug}`,
      lastModified: new Date(advisor.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Blog post pages
    const blogPostPages: MetadataRoute.Sitemap = (blogPosts || []).map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    // Blog category pages
    const categoryPages: MetadataRoute.Sitemap = (categories || []).map((category) => ({
      url: `${baseUrl}/blog/category/${category.slug}`,
      lastModified: new Date(category.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))

    // Blog tag pages
    const tagPages: MetadataRoute.Sitemap = (tags || []).map((tag) => ({
      url: `${baseUrl}/blog/tag/${tag.slug}`,
      lastModified: new Date(tag.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    }))

    return [
      ...staticPages,
      ...advisorPages,
      ...blogPostPages,
      ...categoryPages,
      ...tagPages,
    ]
  } catch (error) {
    console.error('Error generating sitemap:', error)

    // Return at least static pages if database fails
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/listings`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
    ]
  }
}
