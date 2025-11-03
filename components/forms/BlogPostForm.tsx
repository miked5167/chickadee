'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

interface Tag {
  id: string
  name: string
  slug: string
}

interface BlogPostFormProps {
  postId?: string
  initialData?: {
    title: string
    slug: string
    excerpt: string
    content: string
    featured_image_url?: string
    featured_image_alt?: string
    category_id?: string
    meta_title?: string
    meta_description?: string
    status: 'draft' | 'published' | 'scheduled'
    is_featured: boolean
  }
}

export function BlogPostForm({ postId, initialData }: BlogPostFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])

  // Form state
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [featuredImageUrl, setFeaturedImageUrl] = useState(initialData?.featured_image_url || '')
  const [featuredImageAlt, setFeaturedImageAlt] = useState(initialData?.featured_image_alt || '')
  const [categoryId, setCategoryId] = useState(initialData?.category_id || '')
  const [metaTitle, setMetaTitle] = useState(initialData?.meta_title || '')
  const [metaDescription, setMetaDescription] = useState(initialData?.meta_description || '')
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>(initialData?.status || 'draft')
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured || false)

  // Auto-generate slug from title
  useEffect(() => {
    if (!postId && title && !slug) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setSlug(generatedSlug)
    }
  }, [title, slug, postId])

  // Fetch categories and tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          fetch('/api/blog/categories'),
          fetch('/api/blog/tags')
        ])

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.categories || [])
        }

        if (tagsRes.ok) {
          const tagsData = await tagsRes.json()
          setTags(tagsData.tags || [])
        }
      } catch (error) {
        console.error('Error fetching categories/tags:', error)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent, saveStatus: 'draft' | 'published') => {
    e.preventDefault()
    setLoading(true)

    try {
      const postData = {
        title,
        slug,
        excerpt,
        content,
        featured_image_url: featuredImageUrl || null,
        featured_image_alt: featuredImageAlt || null,
        category_id: categoryId || null,
        meta_title: metaTitle || title,
        meta_description: metaDescription || excerpt,
        status: saveStatus,
        is_featured: isFeatured,
      }

      const url = postId ? `/api/admin/blog/posts/${postId}` : '/api/admin/blog/posts'
      const method = postId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        throw new Error('Failed to save post')
      }

      const result = await response.json()

      // Redirect to blog admin
      router.push('/admin/blog')
      router.refresh()
    } catch (error) {
      console.error('Error saving post:', error)
      alert('Failed to save post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title"
                  required
                  className="text-2xl font-bold"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="post-slug"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  URL: /blog/{slug || 'post-slug'}
                </p>
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt *</Label>
                <textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief description of the post (150-160 characters)"
                  required
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-hockey-blue"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {excerpt.length} / 160 characters
                </p>
              </div>
            </div>
          </Card>

          {/* Content Editor */}
          <Card className="p-6">
            <Label className="mb-4 block">Content *</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Write your blog post content here..."
            />
          </Card>

          {/* SEO Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Leave blank to use post title"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {(metaTitle || title).length} / 60 characters
                </p>
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Leave blank to use excerpt"
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-hockey-blue"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {(metaDescription || excerpt).length} / 160 characters
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Publish</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-hockey-blue border-gray-300 rounded focus:ring-hockey-blue"
                />
                <Label htmlFor="isFeatured">Featured Post</Label>
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'draft')}
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'published')}
                  className="w-full"
                  disabled={loading || !title || !slug || !excerpt || !content}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Publish
                </Button>
              </div>
            </div>
          </Card>

          {/* Category */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Category</h3>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-hockey-blue"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Card>

          {/* Featured Image */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Featured Image</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="featuredImageUrl">Image URL</Label>
                <Input
                  id="featuredImageUrl"
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {featuredImageUrl && (
                <div className="rounded-lg overflow-hidden border">
                  <img src={featuredImageUrl} alt="Preview" className="w-full" />
                </div>
              )}

              <div>
                <Label htmlFor="featuredImageAlt">Alt Text</Label>
                <Input
                  id="featuredImageAlt"
                  value={featuredImageAlt}
                  onChange={(e) => setFeaturedImageAlt(e.target.value)}
                  placeholder="Describe the image"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  )
}
