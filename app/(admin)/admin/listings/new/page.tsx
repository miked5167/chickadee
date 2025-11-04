'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AdvisorForm } from '@/components/admin/AdvisorForm'
import { Button } from '@/components/ui/button'

export default function NewAdvisorPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create advisor')
      }

      const result = await response.json()

      // Show success message and redirect
      router.push(`/admin/listings?success=created&id=${result.advisor.id}`)
    } catch (err) {
      console.error('Error creating advisor:', err)
      setError(err instanceof Error ? err.message : 'Failed to create advisor')
      setIsSubmitting(false)
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Add New Advisor</h1>
          <p className="text-gray-600 mt-2">
            Create a new advisor listing. Fill in all required fields and as much optional information as possible.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error creating advisor</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <AdvisorForm
            onSubmit={handleSubmit}
            onCancel={() => router.push('/admin/listings')}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  )
}
