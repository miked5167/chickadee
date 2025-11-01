import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create or update public profile
      const { error: profileError } = await supabase
        .from('users_public')
        .upsert(
          {
            id: data.user.id,
            display_name:
              data.user.user_metadata?.full_name ||
              data.user.email?.split('@')[0] ||
              'User',
            avatar_url: data.user.user_metadata?.avatar_url || null,
            auth_provider: data.user.app_metadata?.provider || 'email',
          },
          {
            onConflict: 'id',
          }
        )

      if (profileError) {
        console.error('Error creating/updating public profile:', profileError)
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/`)
}
