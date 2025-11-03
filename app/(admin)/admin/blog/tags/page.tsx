'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Edit2, Trash2, X } from 'lucide-react'

interface Tag {
  id: string
  name: string
  slug: string
  post_count: number
  created_at: string
}

export default function TagsAdminPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  })
  const [saving, setSaving] = useState(false)

  // Fetch tags
  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/blog/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data.tags || [])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate slug from name
  useEffect(() => {
    if (!editingTag && formData.name) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, slug: generatedSlug }))
    }
  }, [formData.name, editingTag])

  const handleCreate = () => {
    setEditingTag(null)
    setFormData({
      name: '',
      slug: '',
    })
    setShowForm(true)
  }

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      slug: tag.slug,
    })
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingTag(null)
    setFormData({
      name: '',
      slug: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingTag
        ? `/api/admin/blog/tags/${editingTag.id}`
        : '/api/admin/blog/tags'

      const method = editingTag ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save tag')
      }

      await fetchTags()
      handleCancel()
    } catch (error) {
      console.error('Error saving tag:', error)
      alert(error instanceof Error ? error.message : 'Failed to save tag')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (tag: Tag) => {
    if (tag.post_count > 0) {
      alert('Cannot delete a tag with associated posts.')
      return
    }

    if (!confirm(`Are you sure you want to delete "${tag.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/blog/tags/${tag.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete tag')
      }

      await fetchTags()
    } catch (error) {
      console.error('Error deleting tag:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete tag')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-hockey-blue" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Blog Tags</h1>
          <p className="text-gray-600">
            Manage blog post tags to help readers find related content.
          </p>
        </div>
        {!showForm && (
          <Button onClick={handleCreate} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            New Tag
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {editingTag ? 'Edit Tag' : 'Create Tag'}
            </h2>
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Hockey Skills"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="hockey-skills"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingTag ? (
                  'Update Tag'
                ) : (
                  'Create Tag'
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Tags Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tag Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tags.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No tags yet. Create your first tag!
                  </td>
                </tr>
              ) : (
                tags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        #{tag.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tag.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tag.post_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tag.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(tag)}
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(tag)}
                        disabled={tag.post_count > 0}
                        className={tag.post_count > 0 ? 'opacity-50 cursor-not-allowed' : ''}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
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
