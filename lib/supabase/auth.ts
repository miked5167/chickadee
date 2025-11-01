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
 * TODO: Implement proper admin role checking
 */
export async function isAdmin() {
  const user = await getCurrentUser()
  if (!user) return false

  // TODO: Check user metadata or a separate admin table
  // For now, we'll use email-based checking
  // Replace with your admin email
  const adminEmails = ['admin@thehockeydirectory.com']
  return adminEmails.includes(user.email || '')
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
