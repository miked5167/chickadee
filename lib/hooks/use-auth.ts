'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(configured)
  // Public previews can render without authentication credentials. Keep them
  // anonymous; never create a dummy session or bypass server authorization.
  const supabase = configured ? createClient() : null

  useEffect(() => {
    if (!supabase) return
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signIn = async (provider: 'google', redirectTo?: string) => {
    if (!supabase) return { error: new Error('Sign-in is unavailable in this public preview.') }
    const callbackUrl = new URL(`${window.location.origin}/api/auth/callback`)
    if (redirectTo) {
      callbackUrl.searchParams.set('next', redirectTo)
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString(),
      },
    })
    return { error }
  }

  const signOut = async () => {
    if (!supabase) return { error: new Error('Sign-in is unavailable in this public preview.') }
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  }
}
