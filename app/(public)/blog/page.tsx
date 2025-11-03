'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { BlogHero } from '@/components/blog/BlogHero'
import { BlogCard } from '@/components/blog/BlogCard'
import { BlogSidebar } from '@/components/blog/BlogSidebar'
import { Button } from '@/components/ui/button'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featured_image_url: string | null
  featured_image_alt: string | null
  published_at: string
  read_time_minutes: number | null
  view_count: number
  blog_categories: {
    id: string
    name: string
    slug: string
    icon: string | null
    color: string | null
  } | null
  users_public: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
  tags?: Array<{
    id: string
    name: string
    slug: string
  }>
}

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
  post_count: number
}

interface Tag {
  id: string
  name: string
  slug: string
  post_count: number
}

export default function BlogPage() {
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [popularTags, setPopularTags] = useState<Tag[]>([])
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasMore: false,
    hasPrevious: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBlogData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch main blog posts
        const params = new URLSearchParams(searchParams.toString())
        const response = await fetch(`/api/blog/posts?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch blog posts')
        }

        const data = await response.json()
        setPosts(data.posts || [])
        setPagination(data.pagination || {})

        // Fetch featured post (if not filtering)
        if (!searchParams.get('category') && !searchParams.get('tag') && !searchParams.get('search')) {
          const featuredResponse = await fetch('/api/blog/posts?featured=true&limit=1')
          if (featuredResponse.ok) {
            const featuredData = await featuredResponse.json()
            if (featuredData.posts && featuredData.posts.length > 0) {
              setFeaturedPost(featuredData.posts[0])
            }
          }
        } else {
          setFeaturedPost(null)
        }

        // Fetch categories
        const categoriesResponse = await fetch('/api/blog/categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData.categories || [])
        }

        // Fetch popular tags
        const tagsResponse = await fetch('/api/blog/tags?popular=true&limit=12')
        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json()
          setPopularTags(tagsData.tags || [])
        }

        // Fetch recent posts for sidebar
        const recentResponse = await fetch('/api/blog/posts?limit=5&sort=recent')
        if (recentResponse.ok) {
          const recentData = await recentResponse.json()
          setRecentPosts(recentData.posts || [])
        }
      } catch (err) {
        console.error('Error fetching blog data:', err)
        setError('Failed to load blog posts. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchBlogData()
  }, [searchParams])

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    window.location.href = `/blog?${params.toString()}`
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hockey-blue mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading blog posts...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-hockey-blue to-blue-800 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Hockey Insights & Advice
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Expert guidance for navigating the competitive hockey landscape
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Posts Column */}
          <div>
            {/* Featured Post Hero */}
            {featuredPost && (
              <div className="mb-12">
                <BlogHero post={featuredPost} />
              </div>
            )}

            {/* Results Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {searchParams.get('category') || searchParams.get('tag') || searchParams.get('search')
                  ? 'Filtered Posts'
                  : 'Latest Posts'}
              </h2>
              <p className="text-gray-600">
                {pagination.total > 0 ? (
                  <>
                    Showing <span className="font-semibold">{posts.length}</span> of{' '}
                    <span className="font-semibold">{pagination.total}</span> articles
                  </>
                ) : (
                  'No posts found'
                )}
              </p>
            </div>

            {/* Empty State */}
            {posts.length === 0 && !loading && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No posts found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search or filters
                </p>
                <Button asChild>
                  <a href="/blog">View All Posts</a>
                </Button>
              </div>
            )}

            {/* Posts Grid */}
            {posts.length > 0 && (
              <>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {posts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrevious}
                      className="gap-2"
                    >
                      <FaChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first page, last page, current page, and pages around current
                          return (
                            page === 1 ||
                            page === pagination.totalPages ||
                            Math.abs(page - pagination.page) <= 1
                          )
                        })
                        .map((page, index, array) => {
                          // Add ellipsis
                          if (index > 0 && page - array[index - 1] > 1) {
                            return [
                              <span key={`ellipsis-${page}`} className="px-2 text-gray-500">
                                ...
                              </span>,
                              <Button
                                key={page}
                                variant={page === pagination.page ? 'default' : 'outline'}
                                onClick={() => handlePageChange(page)}
                                className="min-w-[40px]"
                              >
                                {page}
                              </Button>
                            ]
                          }

                          return (
                            <Button
                              key={page}
                              variant={page === pagination.page ? 'default' : 'outline'}
                              onClick={() => handlePageChange(page)}
                              className="min-w-[40px]"
                            >
                              {page}
                            </Button>
                          )
                        })}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasMore}
                      className="gap-2"
                    >
                      Next
                      <FaChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-4 h-fit">
            <BlogSidebar
              categories={categories}
              popularTags={popularTags}
              recentPosts={recentPosts}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
