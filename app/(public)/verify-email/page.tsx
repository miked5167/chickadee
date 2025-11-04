'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [error, setError] = useState<string | null>(null)
  const [claimId, setClaimId] = useState<string | null>(null)
  const [advisorName, setAdvisorName] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('No verification token provided')
      return
    }

    verifyEmail()
  }, [token])

  const verifyEmail = async () => {
    try {
      const response = await fetch('/api/advisors/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      setStatus('success')
      setClaimId(data.claimId)
      setAdvisorName(data.advisorName)

      // Redirect to password setup after 2 seconds
      setTimeout(() => {
        router.push(`/setup-password?claimId=${data.claimId}`)
      }, 2000)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Verification failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'verifying' && 'Verifying Your Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription className="text-center">
            {status === 'verifying' && 'Please wait while we verify your email address...'}
            {status === 'success' && 'Your email has been successfully verified.'}
            {status === 'error' && 'We encountered a problem verifying your email.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            {status === 'verifying' && (
              <>
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                <p className="text-sm text-gray-600">Verifying your email address...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="w-16 h-16 text-green-600" />
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-700">
                    Great! Your email has been verified.
                  </p>
                  {advisorName && (
                    <p className="text-sm font-medium text-gray-900">
                      Claiming: {advisorName}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    Redirecting you to set up your password...
                  </p>
                </div>
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="w-16 h-16 text-red-600" />
                <div className="text-center space-y-2">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                  <p className="text-sm text-gray-600">
                    The verification link may have expired or is invalid.
                  </p>
                </div>
                <div className="flex gap-3 mt-4">
                  <Link href="/listings">
                    <Button variant="outline">Browse Listings</Button>
                  </Link>
                  <Link href="/">
                    <Button>Go Home</Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
