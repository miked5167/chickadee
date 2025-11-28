import { createClient } from './server'

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
 * Check if the current user is an admin
 * Checks against admin_users table in the database
 * Falls back to environment variable for development
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  // Development fallback: Check environment variable
  // Set ADMIN_USER_EMAILS in .env.local for development (comma-separated)
  // Example: ADMIN_USER_EMAILS=admin@example.com,dev@example.com
  if (process.env.NODE_ENV === 'development' && process.env.ADMIN_USER_EMAILS) {
    const adminEmails = process.env.ADMIN_USER_EMAILS.split(',').map(email => email.trim())
    if (adminEmails.includes(user.email || '')) {
      console.log('[DEV] User authenticated as admin via ADMIN_USER_EMAILS')
      return true
    }
  }

  // Production check: Query admin_users table
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (error) {
      // If table doesn't exist or RLS blocks access, user is not admin
      if (error.code === 'PGRST116') {
        // No rows returned - user is not an admin
        return false
      }
      console.error('Error checking admin status:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Unexpected error in isAdmin():', error)
    return false
  }
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
