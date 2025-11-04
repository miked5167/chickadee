'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

function SetupPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const claimId = searchParams.get('claimId')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [autoApproved, setAutoApproved] = useState(false)

  // Password strength indicators
  const hasMinLength = password.length >= 12
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const passwordsMatch = password === confirmPassword && password.length > 0

  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber
  const canSubmit = isPasswordValid && passwordsMatch && !loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!claimId) {
      setError('Missing claim ID. Please start from the verification email.')
      return
    }

    if (!canSubmit) {
      setError('Please meet all password requirements')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/advisors/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimId,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account')
      }

      setSuccess(true)
      setAutoApproved(data.autoApproved || false)

      // Redirect after 2 seconds
      setTimeout(() => {
        if (data.autoApproved) {
          router.push('/login?message=Account approved! You can now access your dashboard.')
        } else {
          router.push('/login?message=Account created! Your claim is under review.')
        }
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
      setLoading(false)
    }
  }

  if (!claimId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Invalid Link</CardTitle>
            <CardDescription className="text-center">
              This password setup link is invalid or expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-green-600">
              {autoApproved ? 'Claim Approved!' : 'Account Created!'}
            </CardTitle>
            <CardDescription className="text-center">
              {autoApproved
                ? 'Your claim has been automatically approved.'
                : 'Your account has been successfully created.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-600" />
              <div className="text-center space-y-2">
                {autoApproved ? (
                  <>
                    <p className="text-sm text-gray-700 font-medium">
                      🎉 Your verification score was excellent!
                    </p>
                    <p className="text-sm text-gray-700">
                      You can now access your advisor dashboard immediately.
                    </p>
                    <p className="text-sm text-gray-600">
                      Login to start managing your listing, viewing leads, and responding to reviews.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-700">
                      Your listing claim is now under review by our admin team.
                    </p>
                    <p className="text-sm text-gray-600">
                      You'll receive an email once your claim is approved (usually within 24-48 hours).
                    </p>
                  </>
                )}
                <p className="text-sm text-gray-600 mt-4">
                  Redirecting you to login...
                </p>
              </div>
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Set Up Your Password</CardTitle>
          <CardDescription>
            Create a secure password to access your advisor dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</p>
              <RequirementItem met={hasMinLength} text="At least 12 characters" />
              <RequirementItem met={hasUpperCase} text="One uppercase letter" />
              <RequirementItem met={hasLowerCase} text="One lowercase letter" />
              <RequirementItem met={hasNumber} text="One number" />
              <RequirementItem met={hasSpecial} text="One special character (optional)" optional />
              {confirmPassword && (
                <RequirementItem met={passwordsMatch} text="Passwords match" />
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            {/* Help Text */}
            <p className="text-xs text-center text-gray-600">
              After creating your account, your claim will be reviewed by our admin team.
              You'll receive an email notification once approved.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function RequirementItem({ met, text, optional = false }: { met: boolean; text: string; optional?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      )}
      <span className={met ? 'text-green-700' : optional ? 'text-gray-500' : 'text-gray-600'}>
        {text}
      </span>
    </div>
  )
}

export default function SetupPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <SetupPasswordContent />
    </Suspense>
  )
}
