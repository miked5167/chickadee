'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { FaSearch, FaTimes } from 'react-icons/fa'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface BlogSidebarProps {
  categories: Array<{
    id: string
    name: string
    slug: string
    icon: string | null
    color: string | null
    post_count: number
  }>
  popularTags: Array<{
    id: string
    name: string
    slug: string
    post_count: number
  }>
  recentPosts?: Array<{
    id: string
    title: string
    slug: string
    featured_image_url: string | null
    featured_image_alt: string | null
    published_at: string
  }>
}

export function BlogSidebar({ categories, popularTags, recentPosts }: BlogSidebarProps) {
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const activeCategory = searchParams.get('category')
  const activeTag = searchParams.get('tag')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchInput.trim()) {
      params.set('search', searchInput.trim())
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    window.location.href = `/blog?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search..."
                value={searchInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
                className="pl-9"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            <Button type="submit" size="sm">
              Go
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="space-y-1">
            <Link
              href="/blog"
              className={`block px-3 py-2 rounded-lg transition-colors ${
                !activeCategory
                  ? 'bg-hockey-blue text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>All Posts</span>
              </div>
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/blog?category=${category.slug}`}
                className={`block px-3 py-2 rounded-lg transition-colors ${
                  activeCategory === category.slug
                    ? 'bg-hockey-blue text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {category.icon && <span>{category.icon}</span>}
                    {category.name}
                  </span>
                  <span className="text-sm opacity-75">
                    {category.post_count}
                  </span>
                </div>
              </Link>
            ))}
          </nav>
        </CardContent>
      </Card>

      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Popular Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog?tag=${tag.slug}`}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                    activeTag === tag.slug
                      ? 'bg-hockey-blue text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  #{tag.name}
                  <span className="text-xs opacity-75">({tag.post_count})</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Posts */}
      {recentPosts && recentPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block group"
                >
                  <h4 className="font-medium text-gray-900 group-hover:text-hockey-blue transition-colors line-clamp-2 mb-1">
                    {post.title}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {new Date(post.published_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Newsletter CTA (Optional) */}
      <Card className="bg-gradient-to-br from-hockey-blue to-blue-800 text-white">
        <CardContent className="pt-6">
          <h3 className="text-lg font-bold mb-2">Stay Updated</h3>
          <p className="text-sm mb-4 opacity-90">
            Get the latest hockey insights and advisor tips delivered to your inbox.
          </p>
          <Button variant="secondary" className="w-full" asChild>
            <Link href="#newsletter">Subscribe</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
