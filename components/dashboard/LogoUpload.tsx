'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, X, Check, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface LogoUploadProps {
  currentLogoUrl?: string | null
  onUploadSuccess?: (url: string) => void
  onDeleteSuccess?: () => void
}

export default function LogoUpload({
  currentLogoUrl,
  onUploadSuccess,
  onDeleteSuccess,
}: LogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP are allowed.')
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size too large. Maximum size is 2MB.')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to API
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/advisor/logo', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload logo')
      }

      setSuccess('Logo uploaded successfully!')
      setPreviewUrl(data.url)
      onUploadSuccess?.(data.url)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error uploading logo:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload logo')
      setPreviewUrl(currentLogoUrl || null)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your logo?')) {
      return
    }

    setDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/advisor/logo', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete logo')
      }

      setSuccess('Logo deleted successfully!')
      setPreviewUrl(null)
      onDeleteSuccess?.()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error deleting logo:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete logo')
    } finally {
      setDeleting(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo</CardTitle>
        <CardDescription>
          Upload a logo for your advisor listing. Recommended size: 400x400px (max 2MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        <div className="flex justify-center">
          <div className="relative w-[200px] h-[200px] border-2 border-dashed border-[#d1d5db] rounded-lg flex items-center justify-center bg-[#f9fafb] overflow-hidden">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Logo preview"
                fill
                className="object-contain p-2"
              />
            ) : (
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No logo uploaded</p>
              </div>
            )}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-800">
            <Check className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-800">
            <X className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={handleUploadClick}
            disabled={uploading || deleting}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </>
            )}
          </Button>

          {previewUrl && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={uploading || deleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Remove Logo
                </>
              )}
            </Button>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Help Text */}
        <p className="text-xs text-gray-500">
          Accepted formats: JPEG, PNG, WebP • Maximum size: 2MB
        </p>
      </CardContent>
    </Card>
  )
}
