import { createClient } from './server'
import type { User } from '@supabase/supabase-js'

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

export type AdminAuthorization =
  | {
      status: 'authorized'
      supabase: ServerSupabaseClient
      user: User
    }
  | {
      status: 'unauthenticated'
    }
  | {
      status: 'forbidden'
    }

/**
 * Get the current user from the session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Get the current session
 * Returns null if not authenticated
 */
export async function getSession() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

/**
 * Check if the user is authenticated
 */
export async function isAuthenticated() {
  const user = await getCurrentUser()
  return !!user
}

/**
 * Authorize the current request using the M3 public.is_admin() contract.
 *
 * The request-scoped client is deliberately created once and is returned only
 * after both session authentication and administrator authorization succeed.
 * Callers must complete this check before constructing a service-role client.
 */
export async function getAdminAuthorization(): Promise<AdminAuthorization> {
  let supabase: ServerSupabaseClient

  try {
    supabase = await createClient()
  } catch {
    return { status: 'unauthenticated' }
  }

  try {
    const {
      data: { user },
      error: authenticationError,
    } = await supabase.auth.getUser()

    if (authenticationError || !user) {
      return { status: 'unauthenticated' }
    }

    const { data: authorized, error: authorizationError } = await supabase.rpc('is_admin')

    if (authorizationError || authorized !== true) {
      return { status: 'forbidden' }
    }

    return { status: 'authorized', supabase, user }
  } catch {
    return { status: 'forbidden' }
  }
}

/**
 * Boolean layout guard backed exclusively by public.is_admin().
 */
export async function isAdmin(): Promise<boolean> {
  const authorization = await getAdminAuthorization()
  return authorization.status === 'authorized'
}

/**
 * Check if the current user has claimed a specific advisor listing
 */
export async function hasClaimedAdvisor(advisorId: string) {
  const user = await getCurrentUser()
  if (!user) return false

  const supabase = await createClient()
  const { data } = await supabase
    .from('advisors')
    .select('id')
    .eq('id', advisorId)
    .eq('claimed_by_user_id', user.id)
    .single()

  return !!data
}

/**
 * Get the advisor listing claimed by the current user
 */
export async function getClaimedAdvisor() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('advisors')
    .select('*')
    .eq('claimed_by_user_id', user.id)
    .eq('is_claimed', true)
    .single()

  return data
}

/**
 * Get or create public user profile
 */
export async function getOrCreatePublicProfile() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()

  // Try to get existing profile
  const { data: existingProfile } = await supabase
    .from('users_public')
    .select('*')
    .eq('id', user.id)
    .single()

  if (existingProfile) {
    return existingProfile
  }

  // Create new profile if it doesn't exist
  const { data: newProfile } = await supabase
    .from('users_public')
    .insert({
      id: user.id,
      display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      avatar_url: user.user_metadata?.avatar_url || null,
      auth_provider: user.app_metadata?.provider || 'email',
    })
    .select()
    .single()

  return newProfile
}
