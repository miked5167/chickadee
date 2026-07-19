import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const serverMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => serverMocks)

import * as analyticsExport from '@/app/api/admin/analytics/export/route'
import * as analytics from '@/app/api/admin/analytics/route'
import * as blogAnalytics from '@/app/api/admin/blog/analytics/route'
import * as blogCategory from '@/app/api/admin/blog/categories/[id]/route'
import * as blogCategories from '@/app/api/admin/blog/categories/route'
import * as blogPost from '@/app/api/admin/blog/posts/[id]/route'
import * as blogPosts from '@/app/api/admin/blog/posts/route'
import * as blogTag from '@/app/api/admin/blog/tags/[id]/route'
import * as blogTags from '@/app/api/admin/blog/tags/route'
import * as claim from '@/app/api/admin/claims/[id]/route'
import * as claims from '@/app/api/admin/claims/route'
import * as csvImport from '@/app/api/admin/csv/import/route'
import * as csvValidate from '@/app/api/admin/csv/validate/route'
import * as dashboard from '@/app/api/admin/dashboard/route'
import * as leads from '@/app/api/admin/leads/route'
import * as listing from '@/app/api/admin/listings/[id]/route'
import * as listings from '@/app/api/admin/listings/route'
import * as review from '@/app/api/admin/reviews/[id]/route'
import * as reviews from '@/app/api/admin/reviews/route'

type Handler = () => Promise<Response>

const routeModules: Array<{ path: string; handlers: Handler[] }> = [
  { path: 'analytics/export', handlers: [analyticsExport.GET] },
  { path: 'analytics', handlers: [analytics.GET] },
  { path: 'blog/analytics', handlers: [blogAnalytics.GET] },
  { path: 'blog/categories/[id]', handlers: [blogCategory.PATCH, blogCategory.DELETE] },
  { path: 'blog/categories', handlers: [blogCategories.GET, blogCategories.POST] },
  { path: 'blog/posts/[id]', handlers: [blogPost.GET, blogPost.PATCH, blogPost.DELETE] },
  { path: 'blog/posts', handlers: [blogPosts.GET, blogPosts.POST] },
  { path: 'blog/tags/[id]', handlers: [blogTag.PATCH, blogTag.DELETE] },
  { path: 'blog/tags', handlers: [blogTags.GET, blogTags.POST] },
  { path: 'claims/[id]', handlers: [claim.PATCH] },
  { path: 'claims', handlers: [claims.GET] },
  { path: 'csv/import', handlers: [csvImport.POST] },
  { path: 'csv/validate', handlers: [csvValidate.POST] },
  { path: 'dashboard', handlers: [dashboard.GET] },
  { path: 'leads', handlers: [leads.GET] },
  { path: 'listings/[id]', handlers: [listing.GET, listing.PATCH, listing.DELETE] },
  { path: 'listings', handlers: [listings.GET, listings.POST] },
  { path: 'reviews/[id]', handlers: [review.PATCH, review.DELETE] },
  { path: 'reviews', handlers: [reviews.GET] },
]

const handlers = routeModules.flatMap((route) => route.handlers)
const activeUser = { id: '00000000-0000-0000-0000-000000000001' }

function sessionClient(user: typeof activeUser | null, administrator: boolean, authenticationError: unknown = null) {
  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user }, error: authenticationError })),
    },
    rpc: vi.fn(async () => ({ data: administrator, error: null })),
  }
}

async function expectEveryHandler(status: number, body: { error: string }) {
  for (const handler of handlers) {
    const response = await handler()
    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual(body)
  }
}

describe('administrator API route cutover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('covers all 19 modules and 30 exported administrator handlers', () => {
    expect(routeModules).toHaveLength(19)
    expect(handlers).toHaveLength(30)
  })

  it('fails every anonymous request closed before the administrator predicate', async () => {
    const client = sessionClient(null, false)
    serverMocks.createClient.mockResolvedValue(client)

    await expectEveryHandler(401, { error: 'Authentication required.' })

    expect(client.rpc).not.toHaveBeenCalled()
    expect(serverMocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('fails every missing or invalid session closed', async () => {
    const client = sessionClient(null, false, { message: 'invalid session' })
    serverMocks.createClient.mockResolvedValue(client)

    await expectEveryHandler(401, { error: 'Authentication required.' })

    expect(client.rpc).not.toHaveBeenCalled()
    expect(serverMocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('forbids every authenticated non-administrator request', async () => {
    const client = sessionClient(activeUser, false)
    serverMocks.createClient.mockResolvedValue(client)

    await expectEveryHandler(403, { error: 'Access denied.' })

    expect(client.rpc).toHaveBeenCalledTimes(handlers.length)
    expect(serverMocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('forbids every inactive-administrator request identically to a non-administrator', async () => {
    const client = sessionClient({ id: '00000000-0000-0000-0000-000000000002' }, false)
    serverMocks.createClient.mockResolvedValue(client)

    await expectEveryHandler(403, { error: 'Access denied.' })

    expect(client.rpc).toHaveBeenCalledTimes(handlers.length)
    expect(serverMocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('authorizes active administrators but keeps unsafe workflows unavailable', async () => {
    const client = sessionClient(activeUser, true)
    serverMocks.createClient.mockResolvedValue(client)

    await expectEveryHandler(503, { error: 'Administrator workflow unavailable.' })

    expect(client.rpc).toHaveBeenCalledTimes(handlers.length)
    expect(serverMocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('contains no route-local database access or privileged-client construction', () => {
    for (const route of routeModules) {
      const source = readFileSync(
        path.join(process.cwd(), 'app', 'api', 'admin', route.path, 'route.ts'),
        'utf8',
      )

      expect(source).toContain('disabledAdminWorkflowResponse')
      expect(source).not.toMatch(/create(?:Admin)?Client/)
      expect(source).not.toMatch(/\.from\s*\(/)
      expect(source).not.toMatch(/\.rpc\s*\(/)
      expect(source).not.toMatch(/auth\.getUser/)
    }
  })
})
