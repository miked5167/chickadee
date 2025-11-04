'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface TeamMember {
  id: string
  name: string
  title: string | null
  bio: string | null
  photo_url: string | null
  linkedin_url: string | null
  email: string | null
  phone: string | null
  display_order: number
  is_active: boolean
}

interface TeamMemberDialogProps {
  open: boolean
  onClose: (shouldRefresh: boolean) => void
  member: TeamMember | null
}

export default function TeamMemberDialog({
  open,
  onClose,
  member,
}: TeamMemberDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    bio: '',
    email: '',
    phone: '',
    linkedin_url: '',
    display_order: 0,
    is_active: true,
  })
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form when dialog opens/closes or member changes
  useEffect(() => {
    if (open) {
      if (member) {
        // Editing existing member
        setFormData({
          name: member.name,
          title: member.title || '',
          bio: member.bio || '',
          email: member.email || '',
          phone: member.phone || '',
          linkedin_url: member.linkedin_url || '',
          display_order: member.display_order,
          is_active: member.is_active,
        })
        setPhotoUrl(member.photo_url)
      } else {
        // Adding new member
        setFormData({
          name: '',
          title: '',
          bio: '',
          email: '',
          phone: '',
          linkedin_url: '',
          display_order: 0,
          is_active: true,
        })
        setPhotoUrl(null)
      }
      setError(null)
    }
  }, [open, member])

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !member) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP are allowed.')
      return
    }

    // Validate file size
    if (file.size > 2 * 1024 * 1024) {
      setError('File size too large. Maximum size is 2MB.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to API
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await fetch(`/api/advisor/team/${member.id}/photo`, {
        method: 'POST',
        body: formDataUpload,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload photo')
      }

      setPhotoUrl(data.url)
    } catch (err) {
      console.error('Error uploading photo:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload photo')
      setPhotoUrl(member?.photo_url || null)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeletePhoto = async () => {
    if (!member || !photoUrl) return

    if (!confirm('Are you sure you want to delete this photo?')) {
      return
    }

    setUploading(true)
    setError(null)

    try {
      const response = await fetch(`/api/advisor/team/${member.id}/photo`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete photo')
      }

      setPhotoUrl(null)
    } catch (err) {
      console.error('Error deleting photo:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete photo')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const url = member
        ? `/api/advisor/team/${member.id}`
        : '/api/advisor/team'

      const response = await fetch(url, {
        method: member ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save team member')
      }

      onClose(true) // Close and refresh
    } catch (err) {
      console.error('Error saving team member:', err)
      setError(err instanceof Error ? err.message : 'Failed to save team member')
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {member ? 'Edit Team Member' : 'Add Team Member'}
          </DialogTitle>
          <DialogDescription>
            {member
              ? 'Update team member information'
              : 'Add a new member to your team'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload - Only show for existing members */}
          {member && (
            <div className="space-y-3">
              <Label>Photo</Label>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex-shrink-0">
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                      <ImageIcon className="w-8 h-8 text-blue-600" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {photoUrl ? 'Replace' : 'Upload'}
                      </>
                    )}
                  </Button>
                  {photoUrl && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleDeletePhoto}
                      disabled={uploading}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-600">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Senior Hockey Advisor"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Brief background and expertise..."
              rows={4}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>

          {/* LinkedIn */}
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <Input
              id="linkedin"
              type="url"
              value={formData.linkedin_url}
              onChange={(e) =>
                setFormData({ ...formData, linkedin_url: e.target.value })
              }
              placeholder="https://linkedin.com/in/johndoe"
            />
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              min="0"
              value={formData.display_order}
              onChange={(e) =>
                setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
              }
            />
            <p className="text-xs text-gray-500">
              Lower numbers appear first. Use this to control the order team members appear.
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              id="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Active (shown on public listing)
            </Label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
              disabled={saving || uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploading}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
