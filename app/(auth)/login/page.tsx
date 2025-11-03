import { SignInButton } from '@/components/auth/SignInButton'
import Link from 'next/link'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string }
}) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-puck-black mb-2">
          Welcome Back
        </h1>
        <p className="text-neutral-gray">
          Sign in to access your account
        </p>
      </div>

      <SignInButton redirectTo={searchParams.redirectTo} />

      <p className="mt-6 text-center text-sm text-neutral-gray">
        By signing in, you agree to our{' '}
        <Link href="/terms" className="text-primary hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
      </p>
    </div>
  )
}
