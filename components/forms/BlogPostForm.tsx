'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { SEOScoreIndicator } from '@/components/editor/SEOScoreIndicator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2, Upload, X, Check, AlertCircle, Clock } from 'lucide-react'
import { useAutoSave, AutoSaveStatus } from '@/lib/hooks/use-auto-save'

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
    tags?: Tag[]
  }
}

export function BlogPostForm({ postId, initialData }: BlogPostFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const featuredImageInputRef = useRef<HTMLInputElement>(null)

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
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialData?.tags?.map(tag => tag.id) || []
  )

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

  // Auto-save data object
  const autoSaveData = useMemo(() => ({
    title,
    slug,
    excerpt,
    content,
    featured_image_url: featuredImageUrl || null,
    featured_image_alt: featuredImageAlt || null,
    category_id: categoryId || null,
    meta_title: metaTitle || title,
    meta_description: metaDescription || excerpt,
    status: 'draft' as const,
    is_featured: isFeatured,
    tag_ids: selectedTagIds,
  }), [title, slug, excerpt, content, featuredImageUrl, featuredImageAlt, categoryId, metaTitle, metaDescription, isFeatured, selectedTagIds])

  // Auto-save hook
  const autoSave = useAutoSave({
    data: autoSaveData,
    onSave: async (data) => {
      // Only auto-save if we have at least a title
      if (!data.title) return

      const url = postId ? `/api/admin/blog/posts/${postId}` : '/api/admin/blog/posts'
      const method = postId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to auto-save')
      }

      const result = await response.json()

      // If this is a new post, update the postId for subsequent saves
      if (!postId && result.post?.id) {
        // Update URL to edit mode without refreshing
        window.history.replaceState({}, '', `/admin/blog/${result.post.id}/edit`)
      }
    },
    delay: 3000, // 3 seconds
    enabled: !!title, // Only enable auto-save when there's a title
  })

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

  const handleFeaturedImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File size too large. Maximum size is 10MB.')
      return
    }

    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload image')
      }

      const data = await response.json()
      setFeaturedImageUrl(data.url)
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setUploadingImage(false)
      // Reset the input
      if (featuredImageInputRef.current) {
        featuredImageInputRef.current.value = ''
      }
    }
  }

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
        tag_ids: selectedTagIds,
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

  const getAutoSaveIndicator = () => {
    const { status, lastSaved, error } = autoSave

    const statusConfig = {
      idle: { icon: null, text: '', color: '' },
      saving: {
        icon: <Clock className="w-4 h-4 animate-pulse" />,
        text: 'Saving...',
        color: 'text-gray-500'
      },
      saved: {
        icon: <Check className="w-4 h-4" />,
        text: lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : 'Saved',
        color: 'text-green-600'
      },
      error: {
        icon: <AlertCircle className="w-4 h-4" />,
        text: error || 'Auto-save failed',
        color: 'text-red-600'
      },
    }

    const config = statusConfig[status]

    if (status === 'idle') return null

    return (
      <div className={`flex items-center gap-2 text-sm ${config.color}`}>
        {config.icon}
        <span>{config.text}</span>
      </div>
    )
  }

  return (
    <form className="space-y-6">
      {/* Auto-save Status Indicator */}
      {title && (
        <div className="flex justify-end">
          {getAutoSaveIndicator()}
        </div>
      )}

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

          {/* SEO Score Indicator */}
          {title && content && (
            <SEOScoreIndicator
              title={title}
              excerpt={excerpt}
              content={content}
              metaTitle={metaTitle}
              metaDescription={metaDescription}
              slug={slug}
              featuredImageUrl={featuredImageUrl}
              featuredImageAlt={featuredImageAlt}
            />
          )}
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

          {/* Tags */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tags</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTagIds.includes(tag.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTagIds([...selectedTagIds, tag.id])
                      } else {
                        setSelectedTagIds(selectedTagIds.filter(id => id !== tag.id))
                      }
                    }}
                    className="w-4 h-4 text-hockey-blue border-gray-300 rounded focus:ring-hockey-blue"
                  />
                  <span className="text-sm">{tag.name}</span>
                </label>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No tags available. Create tags in the admin panel.
                </p>
              )}
            </div>
          </Card>

          {/* Featured Image */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Featured Image</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => featuredImageInputRef.current?.click()}
                  disabled={uploadingImage}
                  variant="outline"
                  className="flex-1"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </Button>
                {featuredImageUrl && (
                  <Button
                    type="button"
                    onClick={() => setFeaturedImageUrl('')}
                    variant="outline"
                    size="icon"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div>
                <Label htmlFor="featuredImageUrl">Or enter URL</Label>
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

              {/* Hidden file input */}
              <input
                ref={featuredImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFeaturedImageUpload}
                className="hidden"
              />
            </div>
          </Card>
        </div>
      </div>
    </form>
  )
}
