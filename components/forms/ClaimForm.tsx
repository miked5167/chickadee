'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2, CheckCircle } from 'lucide-react'
import { z } from 'zod'

// Validation schema
const claimFormSchema = z.object({
  claimantName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  claimantEmail: z.string().email('Invalid email address'),
  claimantPhone: z.string().optional(),
  verificationInfo: z.string().min(50, 'Please provide at least 50 characters of verification information').max(1000, 'Verification info is too long'),
})

type ClaimFormData = z.infer<typeof claimFormSchema>

interface ClaimFormProps {
  advisorId: string
  advisorName: string
  advisorSlug: string
}

export function ClaimForm({ advisorId, advisorName, advisorSlug }: ClaimFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [claimantName, setClaimantName] = useState('')
  const [claimantEmail, setClaimantEmail] = useState('')
  const [claimantPhone, setClaimantPhone] = useState('')
  const [verificationInfo, setVerificationInfo] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate with Zod
    try {
      const formData: ClaimFormData = {
        claimantName,
        claimantEmail,
        claimantPhone: claimantPhone || undefined,
        verificationInfo,
      }

      claimFormSchema.parse(formData)
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message)
      } else {
        setError('Validation failed. Please check your inputs.')
      }
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/advisors/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advisor_id: advisorId,
          claimant_name: claimantName,
          claimant_email: claimantEmail,
          claimant_phone: claimantPhone || null,
          verification_info: verificationInfo,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit claim')
      }

      setSuccess(true)

      // Redirect back to listing page after 3 seconds
      setTimeout(() => {
        router.push(`/listings/${advisorSlug}`)
        router.refresh()
      }, 3000)
    } catch (err) {
      console.error('Error submitting claim:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit claim. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Check Your Email!</h3>
          <p className="text-gray-600 mb-4">
            We've sent a verification email to <strong>{claimantEmail}</strong>
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
            <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-900">
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the verification link</li>
              <li>Create your account password</li>
              <li>Wait for admin approval (usually 24-48 hours)</li>
              <li>Access your dashboard once approved</li>
            </ol>
          </div>
          <p className="text-sm text-gray-500">
            Verification link expires in 24 hours
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Redirecting you back to the listing...
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-2">Claim This Listing</h2>
      <p className="text-gray-600 mb-6">
        Are you {advisorName} or an authorized representative? Complete this form to claim and manage this listing.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Claimant Name */}
        <div>
          <Label htmlFor="claimantName">Your Full Name *</Label>
          <Input
            id="claimantName"
            type="text"
            value={claimantName}
            onChange={(e) => setClaimantName(e.target.value)}
            placeholder="John Smith"
            required
            disabled={loading}
          />
        </div>

        {/* Claimant Email */}
        <div>
          <Label htmlFor="claimantEmail">Your Email Address *</Label>
          <Input
            id="claimantEmail"
            type="email"
            value={claimantEmail}
            onChange={(e) => setClaimantEmail(e.target.value)}
            placeholder="john@example.com"
            required
            disabled={loading}
          />
          <p className="text-sm text-gray-500 mt-1">
            We'll send claim status updates to this email
          </p>
        </div>

        {/* Claimant Phone */}
        <div>
          <Label htmlFor="claimantPhone">Your Phone Number (Optional)</Label>
          <Input
            id="claimantPhone"
            type="tel"
            value={claimantPhone}
            onChange={(e) => setClaimantPhone(e.target.value)}
            placeholder="(555) 123-4567"
            disabled={loading}
          />
        </div>

        {/* Verification Info */}
        <div>
          <Label htmlFor="verificationInfo">Business Verification Information *</Label>
          <textarea
            id="verificationInfo"
            value={verificationInfo}
            onChange={(e) => setVerificationInfo(e.target.value)}
            placeholder="Please provide information to verify your connection to this business. For example: business registration number, official email address, website ownership, social media accounts, etc. (minimum 50 characters)"
            required
            rows={6}
            disabled={loading}
            maxLength={1000}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-hockey-blue disabled:opacity-50"
          />
          <p className="text-sm text-gray-500 mt-1">
            {verificationInfo.length} / 50 characters minimum ({1000 - verificationInfo.length} remaining)
          </p>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold mb-3 text-blue-900">What happens next?</h4>
          <div className="space-y-3 text-sm text-blue-900">
            <div className="flex gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <div>
                <strong>Verify Your Email</strong>
                <p className="text-blue-800">We'll send you a verification link to confirm your email address</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <div>
                <strong>Create Your Password</strong>
                <p className="text-blue-800">Set up a secure password for your dashboard account</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <div>
                <strong>Admin Review</strong>
                <p className="text-blue-800">Our team will review your claim (usually 24-48 hours)</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-blue-600 font-bold">4.</span>
              <div>
                <strong>Dashboard Access</strong>
                <p className="text-blue-800">Once approved, log in and manage your listing, view leads & analytics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={loading || claimantName.length < 2 || !claimantEmail || verificationInfo.length < 50}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Submitting Claim...
            </>
          ) : (
            'Submit Claim Request'
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          By submitting this claim, you confirm that you are authorized to represent this business.
          False claims may result in permanent ban from The Hockey Directory.
        </p>
      </form>
    </Card>
  )
}
