'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, AlertCircle } from 'lucide-react'

interface ReviewReplyDialogProps {
  open: boolean
  onClose: (shouldRefresh: boolean) => void
  reviewId: string
  reviewTitle: string | null
  existingReply: string | null
}

export default function ReviewReplyDialog({
  open,
  onClose,
  reviewId,
  reviewTitle,
  existingReply,
}: ReviewReplyDialogProps) {
  const [reply, setReply] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setReply(existingReply || '')
      setError(null)
    }
  }, [open, existingReply])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reply.trim()) {
      setError('Reply text is required')
      return
    }

    if (reply.trim().length > 1000) {
      setError('Reply must be 1000 characters or less')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/advisor/reviews/${reviewId}/reply`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reply: reply.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save reply')
      }

      onClose(true) // Close and refresh
    } catch (err) {
      console.error('Error saving reply:', err)
      setError(err instanceof Error ? err.message : 'Failed to save reply')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this reply?')) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/advisor/reviews/${reviewId}/reply`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete reply')
      }

      onClose(true) // Close and refresh
    } catch (err) {
      console.error('Error deleting reply:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete reply')
      setDeleting(false)
    }
  }

  const charactersLeft = 1000 - reply.length
  const isOverLimit = charactersLeft < 0

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose(false)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {existingReply ? 'Edit Your Reply' : 'Reply to Review'}
          </DialogTitle>
          <DialogDescription>
            {reviewTitle
              ? `Replying to: "${reviewTitle}"`
              : 'Write a professional response to this review'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reply Textarea */}
          <div className="space-y-2">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Thank you for your review! We appreciate your feedback..."
              rows={8}
              className={isOverLimit ? 'border-red-500' : ''}
            />
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">
                Be professional, courteous, and address any concerns raised.
              </span>
              <span className={isOverLimit ? 'text-red-600 font-medium' : 'text-gray-500'}>
                {charactersLeft} characters left
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-800">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <DialogFooter>
            <div className="flex justify-between w-full">
              {/* Delete button (only show if editing existing reply) */}
              {existingReply && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={saving || deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Reply'
                  )}
                </Button>
              )}

              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onClose(false)}
                  disabled={saving || deleting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || deleting || isOverLimit}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Reply'
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
