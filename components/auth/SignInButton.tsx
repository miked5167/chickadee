'use client'

import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '@/lib/hooks/use-auth'
import { useState } from 'react'

export function SignInButton() {
  const { signIn } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    const { error } = await signIn('google')
    if (error) {
      console.error('Error signing in:', error.message)
      alert('Failed to sign in. Please try again.')
      setIsLoading(false)
    }
    // Note: If successful, user will be redirected to Google OAuth
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="flex items-center justify-center gap-3 w-full px-4 py-3 text-sm font-medium text-puck-black bg-white border border-neutral-gray/30 rounded-lg hover:bg-ice-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <FcGoogle className="h-5 w-5" />
      {isLoading ? 'Signing in...' : 'Continue with Google'}
    </button>
  )
}
