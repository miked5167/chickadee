'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, Clock, Loader2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Claim {
  id: string
  advisor_id: string
  claimant_name: string
  claimant_email: string
  claimant_phone: string | null
  verification_info: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at: string | null
  admin_notes: string | null
  advisors: {
    id: string
    name: string
    slug: string
    city: string
    state: string
    logo_url: string | null
    is_claimed: boolean
  }
}

interface ClaimReviewProps {
  claim: Claim
  onUpdate: () => void
}

export function ClaimReview({ claim, onUpdate }: ClaimReviewProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState(claim.admin_notes || '')
  const [showDetails, setShowDetails] = useState(false)

  const handleAction = async (action: 'approve' | 'reject') => {
    if (claim.status !== 'pending') {
      setError('This claim has already been reviewed')
      return
    }

    const confirmed = confirm(
      action === 'approve'
        ? `Are you sure you want to approve this claim for ${claim.advisors.name}?`
        : `Are you sure you want to reject this claim for ${claim.advisors.name}?`
    )

    if (!confirmed) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/claims/${claim.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          admin_notes: adminNotes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${action} claim`)
      }

      // Refresh the claims list
      onUpdate()
    } catch (err) {
      console.error(`Error ${action}ing claim:`, err)
      setError(err instanceof Error ? err.message : `Failed to ${action} claim`)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = () => {
    switch (claim.status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      case 'pending':
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  return (
    <Card className="p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {claim.advisors.logo_url && (
              <img
                src={claim.advisors.logo_url}
                alt={`${claim.advisors.name} logo`}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h3 className="text-xl font-semibold">{claim.advisors.name}</h3>
              <p className="text-gray-600">
                {claim.advisors.city}, {claim.advisors.state}
              </p>
              <Link
                href={`/listings/${claim.advisors.slug}`}
                target="_blank"
                className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                View Listing
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Claimant Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-semibold text-gray-700">Claimant Name</p>
            <p className="text-gray-900">{claim.claimant_name}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Email</p>
            <a
              href={`mailto:${claim.claimant_email}`}
              className="text-blue-600 hover:underline"
            >
              {claim.claimant_email}
            </a>
          </div>
          {claim.claimant_phone && (
            <div>
              <p className="text-sm font-semibold text-gray-700">Phone</p>
              <a
                href={`tel:${claim.claimant_phone}`}
                className="text-blue-600 hover:underline"
              >
                {claim.claimant_phone}
              </a>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-700">Submitted</p>
            <p className="text-gray-900">
              {new Date(claim.submitted_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Toggle Details Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide' : 'Show'} Verification Details
        </Button>

        {/* Verification Info (Collapsible) */}
        {showDetails && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Verification Information
            </p>
            <p className="text-gray-900 whitespace-pre-line">{claim.verification_info}</p>
          </div>
        )}

        {/* Admin Notes */}
        {claim.status === 'pending' ? (
          <div>
            <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
            <textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about this review (will be included in rejection email)"
              rows={3}
              disabled={loading}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-hockey-blue disabled:opacity-50"
            />
          </div>
        ) : (
          claim.admin_notes && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2">Admin Notes</p>
              <p className="text-gray-900 whitespace-pre-line">{claim.admin_notes}</p>
              {claim.reviewed_at && (
                <p className="text-sm text-gray-500 mt-2">
                  Reviewed on{' '}
                  {new Date(claim.reviewed_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          )
        )}

        {/* Action Buttons (only for pending claims) */}
        {claim.status === 'pending' && (
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => handleAction('approve')}
              disabled={loading || claim.advisors.is_claimed}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Claim
                </>
              )}
            </Button>
            <Button
              onClick={() => handleAction('reject')}
              disabled={loading}
              variant="destructive"
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Claim
                </>
              )}
            </Button>
          </div>
        )}

        {claim.advisors.is_claimed && claim.status === 'pending' && (
          <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
            ⚠️ This listing has already been claimed. You must reject this claim.
          </p>
        )}
      </div>
    </Card>
  )
}
