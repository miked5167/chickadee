import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '@/lib/hooks/use-auth'

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }))
vi.mock('@/lib/supabase/client', () => ({ createClient: mocks.createClient }))
afterEach(() => { cleanup(); vi.unstubAllEnvs(); vi.clearAllMocks() })

describe('public-preview authentication', () => {
  it('renders anonymously without credentials and refuses sign-in actions', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(mocks.createClient).not.toHaveBeenCalled()
    expect((await result.current.signIn('google')).error).toBeInstanceOf(Error)
    expect((await result.current.signOut()).error).toBeInstanceOf(Error)
  })

  it('continues to load actual sessions when configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key')
    const unsubscribe = vi.fn()
    const user = { id: 'existing-user' }
    mocks.createClient.mockReturnValue({ auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user } } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe } } }),
    } })
    const { result, unmount } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toEqual(user)
    expect(result.current.isAuthenticated).toBe(true)
    unmount()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})
