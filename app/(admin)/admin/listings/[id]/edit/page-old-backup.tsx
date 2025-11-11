'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { AdvisorForm } from '@/components/admin/AdvisorForm'
import { Button } from '@/components/ui/button'

export default function EditAdvisorPage() {
  const router = useRouter()
  const params = useParams()
  const advisorId = params.id as string
  const [advisor, setAdvisor] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch advisor data
  useEffect(() => {
    if (!advisorId) return

    const fetchAdvisor = async () => {
      try {
        const response = await fetch(`/api/admin/listings/${advisorId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch advisor')
        }

        const data = await response.json()
        setAdvisor(data.advisor)
      } catch (err) {
        console.error('Error fetching advisor:', err)
        setError(err instanceof Error ? err.message : 'Failed to load advisor')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAdvisor()
  }, [advisorId])

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/listings/${advisorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update advisor')
      }

      // Show success message and redirect
      router.push(`/admin/listings?success=updated&id=${advisorId}`)
    } catch (err) {
      console.error('Error updating advisor:', err)
      setError(err instanceof Error ? err.message : 'Failed to update advisor')
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading advisor details...</p>
        </div>
      </div>
    )
  }

  // Error state (failed to load advisor)
  if (error && !advisor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/admin/listings">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Listings
            </Button>
          </Link>
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-lg text-center">
            <p className="font-medium text-lg mb-2">Error loading advisor</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/listings">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Listings
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Advisor</h1>
          <p className="text-gray-600 mt-2">
            Update the advisor listing information. Changes will be reflected immediately.
          </p>
        </div>

        {/* Error Message (for submit errors) */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error updating advisor</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <AdvisorForm
            initialData={advisor}
            advisorId={advisorId}
            mode="edit"
          />
        </div>
      </div>
    </div>
  )
}
