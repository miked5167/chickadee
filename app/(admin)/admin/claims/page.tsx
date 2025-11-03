'use client'

import { useState, useEffect } from 'react'
import { ClaimReview } from '@/components/admin/ClaimReview'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

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

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [total, setTotal] = useState(0)

  const fetchClaims = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/claims?status=${statusFilter}&limit=50`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch claims')
      }

      const data = await response.json()
      setClaims(data.claims)
      setTotal(data.total)
    } catch (err) {
      console.error('Error fetching claims:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch claims')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClaims()
  }, [statusFilter])

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Listing Claims Management</h1>
        <p className="text-gray-600">
          Review and approve or reject claims for advisor listings
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            statusFilter === 'pending'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Pending
          {statusFilter === 'pending' && total > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
              {total}
            </span>
          )}
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            statusFilter === 'approved'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            statusFilter === 'rejected'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Rejected
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            statusFilter === 'all'
              ? 'border-gray-600 text-gray-900'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          All Claims
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchClaims}
            className="ml-4"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading claims...</span>
        </div>
      )}

      {/* Claims List */}
      {!loading && !error && (
        <>
          {claims.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-lg">
                No {statusFilter !== 'all' ? statusFilter : ''} claims found
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {claims.map((claim) => (
                <ClaimReview
                  key={claim.id}
                  claim={claim}
                  onUpdate={fetchClaims}
                />
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {claims.length} of {total} {statusFilter !== 'all' ? statusFilter : ''} claim(s)
          </div>
        </>
      )}
    </div>
  )
}
