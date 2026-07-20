import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const serverMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => serverMocks)

import { POST } from '@/app/api/reviews/route'
import { GET } from '@/app/api/companies/[id]/reviews/route'
import { GET as retiredLegacyGET } from '@/app/api/advisors/[id]/reviews/route'
import * as ownerReply from '@/app/api/advisor/reviews/[id]/reply/route'
import { reviewSubmissionSchema } from '@/lib/reviews/validation'

const companyId = '30000000-0000-4000-8000-000000000001'
const userId = '30000000-0000-4000-8000-000000000002'
const reviewText = 'This is a first-hand review with enough detail to pass validation safely.'

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function submission(overrides: Record<string, unknown> = {}) {
  return {
    company_id: companyId,
    rating: 5,
    title: 'Helpful guidance',
    review_text: reviewText,
    experience_confirmed: true,
    ...overrides,
  }
}

function postClient({
  user = { id: userId },
  authenticationError = null,
  company = { id: companyId },
  companyError = null,
  review = { id: '30000000-0000-4000-8000-000000000003' },
  reviewError = null,
} = {}) {
  const companyQuery: Record<string, ReturnType<typeof vi.fn>> = {}
  companyQuery.select = vi.fn(() => companyQuery)
  companyQuery.eq = vi.fn(() => companyQuery)
  companyQuery.maybeSingle = vi.fn(async () => ({ data: company, error: companyError }))

  const reviewQuery: Record<string, ReturnType<typeof vi.fn>> = {}
  reviewQuery.insert = vi.fn(() => reviewQuery)
  reviewQuery.select = vi.fn(() => reviewQuery)
  reviewQuery.single = vi.fn(async () => ({ data: review, error: reviewError }))

  return {
    client: {
      auth: { getUser: vi.fn(async () => ({ data: { user }, error: authenticationError })) },
      from: vi.fn((table: string) => table === 'companies' ? companyQuery : reviewQuery),
    },
    companyQuery,
    reviewQuery,
  }
}

describe('M4 company reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates the canonical company review contract', () => {
    expect(reviewSubmissionSchema.safeParse(submission()).success).toBe(true)
    expect(reviewSubmissionSchema.safeParse(submission({ rating: 6 })).success).toBe(false)
    expect(reviewSubmissionSchema.safeParse(submission({ review_text: 'too short' })).success).toBe(false)
    expect(reviewSubmissionSchema.safeParse(submission({ experience_confirmed: false })).success).toBe(false)
  })

  it('requires authentication before any database access', async () => {
    const { client } = postClient({ user: null })
    serverMocks.createClient.mockResolvedValue(client)

    const response = await POST(postRequest(submission()))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Authentication required.' })
    expect(client.from).not.toHaveBeenCalled()
    expect(serverMocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('inserts a company-targeted review using only the authenticated user identity', async () => {
    const { client, reviewQuery } = postClient()
    serverMocks.createClient.mockResolvedValue(client)

    const response = await POST(postRequest(submission({ reviewer_user_id: 'attacker-controlled' })))

    expect(response.status).toBe(201)
    expect(reviewQuery.insert).toHaveBeenCalledTimes(1)
    expect(reviewQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
      company_id: companyId,
      reviewer_user_id: userId,
      rating: 5,
      review_text: reviewText,
    }))
    expect(reviewQuery.insert.mock.calls[0][0]).not.toHaveProperty('moderation_status')
    expect(serverMocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('maps the database uniqueness guarantee to a stable conflict response', async () => {
    const { client } = postClient({ review: null, reviewError: { code: '23505' } })
    serverMocks.createClient.mockResolvedValue(client)

    const response = await POST(postRequest(submission()))

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: 'You have already reviewed this company.' })
  })

  it('reads reviews through the canonical company route and public projection', async () => {
    const reviews = [{
      id: '30000000-0000-4000-8000-000000000003',
      company_id: companyId,
      rating: 5,
      title: 'Helpful guidance',
      review_text: reviewText,
      experience_confirmed_at: '2026-07-19T12:00:00.000Z',
      created_at: '2026-07-19T12:00:00.000Z',
      updated_at: '2026-07-19T12:00:00.000Z',
    }]
    const query: Record<string, ReturnType<typeof vi.fn>> = {}
    query.select = vi.fn(() => query)
    query.eq = vi.fn(() => query)
    query.order = vi.fn(() => query)
    query.range = vi.fn(async () => ({ data: reviews, count: 1, error: null }))
    const client = { from: vi.fn(() => query) }
    serverMocks.createClient.mockResolvedValue(client)

    const response = await GET(
      new NextRequest(`http://localhost/api/companies/${companyId}/reviews?sort=highest`),
      { params: Promise.resolve({ id: companyId }) },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ reviews, total: 1, page: 1 })
    expect(query.select).toHaveBeenCalledWith(
      'id, company_id, rating, title, review_text, experience_confirmed_at, created_at, updated_at',
      { count: 'exact' },
    )
    expect(query.eq).toHaveBeenCalledWith('company_id', companyId)
    expect(serverMocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('keeps the release surfaces company-named and free of privileged clients', () => {
    const files = [
      'app/api/reviews/route.ts',
      'app/api/companies/[id]/reviews/route.ts',
      'app/(public)/listings/[slug]/reviews/new/page.tsx',
      'components/forms/ReviewForm.tsx',
      'components/listing/ReviewsList.tsx',
    ]

    for (const file of files) {
      const source = readFileSync(path.join(process.cwd(), file), 'utf8')
      expect(source).not.toMatch(/createAdminClient|advisor_id|reviewer_id|users_public|is_verified/)
    }
  })

  it('retires ambiguous legacy reads and keeps owner reply mutations disabled', async () => {
    const legacyResponse = await retiredLegacyGET()
    expect(legacyResponse.status).toBe(410)
    await expect(legacyResponse.json()).resolves.toMatchObject({
      replacement: '/api/companies/[id]/reviews',
    })

    for (const handler of [ownerReply.PATCH, ownerReply.DELETE]) {
      const response = await handler()
      expect(response.status).toBe(503)
      await expect(response.json()).resolves.toEqual({ error: 'Company review reply workflow unavailable.' })
    }

    expect(serverMocks.createClient).not.toHaveBeenCalled()
    expect(serverMocks.createAdminClient).not.toHaveBeenCalled()
  })
})
