import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Compatibility callback for older OAuth settings. */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin
      return NextResponse.redirect(new URL('/', configuredOrigin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=authentication-failed', requestUrl.origin))
}
