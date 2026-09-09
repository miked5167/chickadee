import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { SignInButton } from '@/components/auth/SignInButton'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to manage a verified Hockey Directory listing or submit a review.',
  robots: { index: false, follow: false },
}

function safeReturnPath(value?: string) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : undefined
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; returnTo?: string; notice?: string; error?: string }>
}) {
  const params = await searchParams
  const redirectTo = safeReturnPath(params.redirectTo || params.returnTo)
  const retiredLink = params.notice === 'legacy-claim-link-retired'
  const authenticationFailed = params.error === 'authentication-failed'

  return (
    <div className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-xl">
      <div className="rink-grid bg-arena-navy px-7 py-8 text-white">
        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-goal-gold">Secure account access</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold uppercase tracking-tight">Sign in to The Hockey Directory</h1>
        <p className="mt-4 leading-7 text-frost">Manage a verified company listing, review an advisor, or return to the page you were viewing.</p>
      </div>

      <div className="p-7">
        {retiredLink && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            That older claim link has been retired. Sign in here, return to the company profile, and submit a new claim.
          </div>
        )}
        {authenticationFailed && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
            Sign-in could not be completed. Please try again.
          </div>
        )}

        <SignInButton redirectTo={redirectTo} />

        <div className="mt-6 flex gap-3 rounded-lg bg-blue-50 p-4 text-sm leading-6 text-blue-950">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          Signing in does not grant listing ownership or administrator access. Claims still require the directory’s separate approval process.
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-slate-600">
          By signing in, you agree to our <Link href="/terms" className="font-semibold text-hockey-blue underline">Terms of Service</Link> and acknowledge our <Link href="/privacy" className="font-semibold text-hockey-blue underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
