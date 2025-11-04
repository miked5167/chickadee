'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Loader2,
  ArrowLeft,
  FileText,
  Eye,
  TrendingUp,
  Hash,
  Folder
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface BlogPost {
  id: string
  title: string
  slug: string
  view_count: number
  created_at: string
  status: string
}

interface Category {
  id: string
  name: string
  slug: string
  post_count: number
}

interface Tag {
  id: string
  name: string
  slug: string
  post_count: number
}

interface Analytics {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  totalViews: number
  viewsLast30Days: number
  postsLast30Days: number
  topPosts: BlogPost[]
  categories: Category[]
  topTags: Tag[]
}

export default function BlogAnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/blog/analytics')

      if (response.status === 401) {
        router.push('/login?returnTo=/admin/blog/analytics')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Failed to load analytics. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Analytics Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={fetchAnalytics}>Try Again</Button>
                <Link href="/admin/dashboard">
                  <Button variant="outline">Back to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Blog Analytics</h1>
              <p className="text-gray-600 mt-1">Performance metrics and insights</p>
            </div>
            <Link href="/admin/blog">
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                Manage Posts
              </Button>
            </Link>
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Total Posts"
              value={analytics.totalPosts}
              icon={FileText}
              description={`${analytics.publishedPosts} published, ${analytics.draftPosts} drafts`}
            />
            <MetricCard
              title="Total Views"
              value={analytics.totalViews}
              icon={Eye}
              description={`${analytics.viewsLast30Days} in last 30 days`}
            />
            <MetricCard
              title="Recent Posts"
              value={analytics.postsLast30Days}
              icon={TrendingUp}
              description="Published in last 30 days"
            />
          </div>
        </div>

        {/* Top Performing Posts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top Performing Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topPosts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No published posts yet
              </p>
            ) : (
              <div className="space-y-4">
                {analytics.topPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <Link href={`/blog/${post.slug}`} target="_blank" className="font-medium text-gray-900 hover:text-blue-600">
                        {post.title}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        Published {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Eye className="w-4 h-4" />
                      <span className="font-medium">{post.view_count.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category and Tag Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Category Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.categories.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No categories yet
                </p>
              ) : (
                <div className="space-y-3">
                  {analytics.categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <Link
                        href={`/blog/category/${category.slug}`}
                        target="_blank"
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {category.name}
                      </Link>
                      <span className="text-sm font-medium text-gray-600">
                        {category.post_count} {category.post_count === 1 ? 'post' : 'posts'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="w-5 h-5" />
                Top Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topTags.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No tags yet
                </p>
              ) : (
                <div className="space-y-3">
                  {analytics.topTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <Link
                        href={`/blog/tag/${tag.slug}`}
                        target="_blank"
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        #{tag.name}
                      </Link>
                      <span className="text-sm font-medium text-gray-600">
                        {tag.post_count} {tag.post_count === 1 ? 'post' : 'posts'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
