import { Metadata } from 'next'
import { BlogHero } from '@/components/blog/BlogHero'
import { BlogCard } from '@/components/blog/BlogCard'
import { BlogSidebar } from '@/components/blog/BlogSidebar'
import { Button } from '@/components/ui/button'
import { FaChevronLeft, FaChevronRight, FaRss } from 'react-icons/fa'
import { getBaseUrl } from '@/lib/utils/base-url'

// A6: server component — posts are fetched server-side so the raw HTML contains
// post titles (SEO). Interactivity (sidebar, pagination) stays in leaf
// components / plain links.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Hockey Insights & Advice',
  description:
    'Expert guidance for navigating the competitive hockey landscape — advisor selection, prep schools, college recruiting, and player development.',
}

interface BlogPageProps {
  searchParams: Promise<{
    category?: string
    tag?: string
    search?: string
    page?: string
  }>
}

async function fetchJson(url: string) {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const sp = await searchParams
  const baseUrl = await getBaseUrl()

  const qs = new URLSearchParams()
  if (sp.category) qs.set('category', sp.category)
  if (sp.tag) qs.set('tag', sp.tag)
  if (sp.search) qs.set('search', sp.search)
  if (sp.page) qs.set('page', sp.page)

  const isFiltering = Boolean(sp.category || sp.tag || sp.search)

  const [postsData, categoriesData, tagsData, recentData, featuredData] = await Promise.all([
    fetchJson(`${baseUrl}/api/blog/posts?${qs.toString()}`),
    fetchJson(`${baseUrl}/api/blog/categories`),
    fetchJson(`${baseUrl}/api/blog/tags?popular=true&limit=12`),
    fetchJson(`${baseUrl}/api/blog/posts?limit=5&sort=recent`),
    isFiltering ? Promise.resolve(null) : fetchJson(`${baseUrl}/api/blog/posts?featured=true&limit=1`),
  ])

  const posts = postsData?.posts || []
  const pagination = postsData?.pagination || {
    page: 1,
    totalPages: 1,
    total: 0,
    hasMore: false,
    hasPrevious: false,
  }
  const categories = categoriesData?.categories || []
  const popularTags = tagsData?.tags || []
  const recentPosts = recentData?.posts || []
  const featuredPost = featuredData?.posts?.[0] || null

  const buildPageHref = (page: number) => {
    const p = new URLSearchParams(qs.toString())
    p.set('page', String(page))
    return `/blog?${p.toString()}`
  }

  const numberedPages = Array.from({ length: pagination.totalPages }, (_, i) => i + 1).filter(
    (page: number) =>
      page === 1 ||
      page === pagination.totalPages ||
      Math.abs(page - pagination.page) <= 1
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-hockey-blue to-blue-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Hockey Insights & Advice
              </h1>
              <p className="text-xl text-blue-100 max-w-3xl">
                Expert guidance for navigating the competitive hockey landscape
              </p>
            </div>
            <div className="flex-shrink-0">
              <a
                href="/api/blog/rss"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-hockey-blue rounded-lg hover:bg-blue-50 transition-colors font-medium"
                title="Subscribe to RSS Feed"
              >
                <FaRss className="w-4 h-4" />
                Subscribe RSS
              </a>
            </div>
          </div>
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
                {isFiltering ? 'Filtered Posts' : 'Latest Posts'}
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
            {posts.length === 0 && (
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
                  {posts.map((post: { id: string } & Record<string, unknown>) => (
                    <BlogCard key={post.id} post={post as any} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    {pagination.hasPrevious ? (
                      <Button asChild variant="outline" className="gap-2">
                        <a href={buildPageHref(pagination.page - 1)}>
                          <FaChevronLeft className="w-4 h-4" />
                          Previous
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" className="gap-2" disabled>
                        <FaChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                    )}

                    <div className="flex items-center gap-2">
                      {numberedPages.map((page: number, index: number, array: number[]) => {
                        const gap = index > 0 && page - array[index - 1] > 1
                        return (
                          <div key={page} className="flex items-center gap-2">
                            {gap && <span className="px-2 text-gray-500">...</span>}
                            <Button
                              asChild={page !== pagination.page}
                              variant={page === pagination.page ? 'default' : 'outline'}
                              className="min-w-[40px]"
                            >
                              {page === pagination.page ? (
                                <span>{page}</span>
                              ) : (
                                <a href={buildPageHref(page)}>{page}</a>
                              )}
                            </Button>
                          </div>
                        )
                      })}
                    </div>

                    {pagination.hasMore ? (
                      <Button asChild variant="outline" className="gap-2">
                        <a href={buildPageHref(pagination.page + 1)}>
                          Next
                          <FaChevronRight className="w-4 h-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" className="gap-2" disabled>
                        Next
                        <FaChevronRight className="w-4 h-4" />
                      </Button>
                    )}
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
