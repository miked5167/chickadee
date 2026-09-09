import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const requestedNext = searchParams.get('next') ?? '/'
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL || origin
      return NextResponse.redirect(new URL(next, configuredOrigin))
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
