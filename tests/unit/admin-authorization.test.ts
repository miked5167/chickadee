import { beforeEach, describe, expect, it, vi } from 'vitest'

const serverMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => serverMocks)

import { getAdminAuthorization, isAdmin } from '@/lib/supabase/auth'
import { authorizeAdminRequest, disabledAdminWorkflowResponse } from '@/lib/supabase/admin-api'

const activeUser = { id: '00000000-0000-0000-0000-000000000001' }
const inactiveUser = { id: '00000000-0000-0000-0000-000000000002' }
const ordinaryUser = { id: '00000000-0000-0000-0000-000000000003' }

function sessionClient({
  user = activeUser,
  authenticationError = null,
  administrator = true,
  authorizationError = null,
  events,
}: {
  user?: typeof activeUser | null
  authenticationError?: unknown
  administrator?: boolean | null
  authorizationError?: unknown
  events?: string[]
} = {}) {
  return {
    auth: {
      getUser: vi.fn(async () => {
        events?.push('authenticate')
        return { data: { user }, error: authenticationError }
      }),
    },
    rpc: vi.fn(async (name: string) => {
      events?.push(`authorize:${name}`)
      return { data: administrator, error: authorizationError }
    }),
  }
}

async function json(response: Response) {
  return response.json() as Promise<{ error: string }>
}

describe('M3 administrator authorization helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fails a missing anonymous session closed without calling is_admin', async () => {
    const client = sessionClient({ user: null })
    serverMocks.createClient.mockResolvedValue(client)

    await expect(getAdminAuthorization()).resolves.toEqual({ status: 'unauthenticated' })
    expect(client.rpc).not.toHaveBeenCalled()
  })

  it('fails an invalid session closed without calling is_admin', async () => {
    const client = sessionClient({ user: null, authenticationError: { message: 'invalid JWT' } })
    serverMocks.createClient.mockResolvedValue(client)

    await expect(getAdminAuthorization()).resolves.toEqual({ status: 'unauthenticated' })
    expect(client.rpc).not.toHaveBeenCalled()
  })

  it('fails closed when the request client cannot be created', async () => {
    serverMocks.createClient.mockRejectedValue(new Error('missing request configuration'))

    await expect(getAdminAuthorization()).resolves.toEqual({ status: 'unauthenticated' })
  })

  it('forbids an authenticated non-administrator through public.is_admin()', async () => {
    const client = sessionClient({ user: ordinaryUser, administrator: false })
    serverMocks.createClient.mockResolvedValue(client)

    await expect(getAdminAuthorization()).resolves.toEqual({ status: 'forbidden' })
    expect(client.rpc).toHaveBeenCalledWith('is_admin')
  })

  it('forbids an inactive administrator without exposing registry state', async () => {
    const client = sessionClient({ user: inactiveUser, administrator: false })
    serverMocks.createClient.mockResolvedValue(client)

    const result = await authorizeAdminRequest()

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('Expected inactive administrator to be forbidden')
    expect(result.response.status).toBe(403)
    await expect(json(result.response)).resolves.toEqual({ error: 'Access denied.' })
  })

  it('fails an is_admin RPC error closed as forbidden', async () => {
    const client = sessionClient({ administrator: null, authorizationError: { message: 'RPC unavailable' } })
    serverMocks.createClient.mockResolvedValue(client)

    await expect(getAdminAuthorization()).resolves.toEqual({ status: 'forbidden' })
  })

  it('authorizes an active administrator and returns the same request client', async () => {
    const events: string[] = []
    const client = sessionClient({ events })
    serverMocks.createClient.mockResolvedValue(client)

    const result = await getAdminAuthorization()

    expect(result).toMatchObject({ status: 'authorized', user: activeUser, supabase: client })
    expect(events).toEqual(['authenticate', 'authorize:is_admin'])
    expect(serverMocks.createClient).toHaveBeenCalledTimes(1)
  })

  it('backs the server layout boolean exclusively with the M3 predicate', async () => {
    const client = sessionClient()
    serverMocks.createClient.mockResolvedValue(client)

    await expect(isAdmin()).resolves.toBe(true)
    expect(client.rpc).toHaveBeenCalledWith('is_admin')
  })

  it('standardizes anonymous, forbidden, and active-admin API responses', async () => {
    const anonymousClient = sessionClient({ user: null })
    serverMocks.createClient.mockResolvedValueOnce(anonymousClient)
    const anonymous = await disabledAdminWorkflowResponse()
    expect(anonymous.status).toBe(401)
    expect(anonymous.headers.get('cache-control')).toBe('no-store')
    await expect(json(anonymous)).resolves.toEqual({ error: 'Authentication required.' })

    const nonAdminClient = sessionClient({ user: ordinaryUser, administrator: false })
    serverMocks.createClient.mockResolvedValueOnce(nonAdminClient)
    const forbidden = await disabledAdminWorkflowResponse()
    expect(forbidden.status).toBe(403)
    await expect(json(forbidden)).resolves.toEqual({ error: 'Access denied.' })

    const administratorClient = sessionClient()
    serverMocks.createClient.mockResolvedValueOnce(administratorClient)
    const unavailable = await disabledAdminWorkflowResponse()
    expect(unavailable.status).toBe(503)
    await expect(json(unavailable)).resolves.toEqual({ error: 'Administrator workflow unavailable.' })

    expect(serverMocks.createAdminClient).not.toHaveBeenCalled()
  })
})
