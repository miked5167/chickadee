import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Blog Posts - Admin',
  description: 'Manage blog posts',
}

interface BlogPost {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published' | 'scheduled'
  is_featured: boolean
  published_at: string | null
  view_count: number
  created_at: string
  category?: {
    name: string
    color: string
  }
}

export default async function AdminBlogPage() {
  const supabase = await createClient()

  // Fetch all blog posts with category information
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select(`
      id,
      title,
      slug,
      status,
      is_featured,
      published_at,
      view_count,
      created_at,
      category:blog_categories(name, color)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching blog posts:', error)
  }

  const blogPosts = (posts || []) as unknown as BlogPost[]

  // Group posts by status
  const draftPosts = blogPosts.filter(p => p.status === 'draft')
  const publishedPosts = blogPosts.filter(p => p.status === 'published')
  const scheduledPosts = blogPosts.filter(p => p.status === 'scheduled')

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Blog Posts</h1>
          <p className="text-gray-600">
            Manage your blog content, create new posts, and edit existing ones.
          </p>
        </div>
        <Link href="/admin/blog/new">
          <Button size="lg">
            Create New Post
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="text-2xl font-bold text-hockey-red">{blogPosts.length}</div>
          <div className="text-sm text-gray-600">Total Posts</div>
        </Card>
        <Card className="p-6">
          <div className="text-2xl font-bold text-green-600">{publishedPosts.length}</div>
          <div className="text-sm text-gray-600">Published</div>
        </Card>
        <Card className="p-6">
          <div className="text-2xl font-bold text-yellow-600">{draftPosts.length}</div>
          <div className="text-sm text-gray-600">Drafts</div>
        </Card>
        <Card className="p-6">
          <div className="text-2xl font-bold text-blue-600">{scheduledPosts.length}</div>
          <div className="text-sm text-gray-600">Scheduled</div>
        </Card>
      </div>

      {/* Posts Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Published
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {blogPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No blog posts yet. Create your first post!
                  </td>
                </tr>
              ) : (
                blogPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-gray-900">
                          {post.title}
                          {post.is_featured && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {post.category && (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: post.category.color }}
                        >
                          {post.category.name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : post.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.view_count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {post.status === 'published' && (
                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-hockey-blue hover:text-hockey-red"
                          target="_blank"
                        >
                          View
                        </Link>
                      )}
                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className="text-hockey-blue hover:text-hockey-red"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
