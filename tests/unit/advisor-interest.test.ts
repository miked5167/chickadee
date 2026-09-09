import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  hashIP: vi.fn(() => 'a'.repeat(64)),
}))

vi.mock('@/lib/supabase/server', () => ({ createAdminClient: mocks.createAdminClient }))
vi.mock('@/lib/utils/security', () => ({ hashIP: mocks.hashIP }))

import { POST } from '@/app/api/advisor-interest/route'

const validSubmission = {
  contact_name: 'Morgan Lee',
  business_name: 'North Rink Advisory',
  email: 'morgan@example.com',
  website_url: 'https://example.com',
  interests: ['profile_plus', 'enhanced_analytics'],
  message: 'Clear conversion reporting would help us understand which profile details matter.',
  consent_confirmed: true,
  company_fax: '',
}

function request(body: unknown) {
  return new Request('https://thehockeydirectory.com/api/advisor-interest', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.0.2.10' },
    body: JSON.stringify(body),
  }) as NextRequest
}

function client({ count = 0, rateError = null, insertError = null }: { count?: number; rateError?: { code: string } | null; insertError?: { code: string } | null } = {}) {
  const rateChain = {
    select: vi.fn(),
    eq: vi.fn(),
    gte: vi.fn(async () => ({ count, error: rateError })),
  }
  rateChain.select.mockReturnValue(rateChain)
  rateChain.eq.mockReturnValue(rateChain)
  const insert = vi.fn(async () => ({ error: insertError }))
  const from = vi.fn()
    .mockReturnValueOnce(rateChain)
    .mockReturnValueOnce({ insert })
  return { from, insert }
}

describe('advisor-interest endpoint', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects invalid, non-consensual, and bot submissions before database access', async () => {
    const response = await POST(request({ ...validSubmission, consent_confirmed: false }))
    expect(response.status).toBe(400)
    expect(mocks.createAdminClient).not.toHaveBeenCalled()

    const botResponse = await POST(request({ ...validSubmission, company_fax: 'spam' }))
    expect(botResponse.status).toBe(400)
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('stores a private, rate-limited interest submission without creating access or a purchase', async () => {
    const database = client()
    mocks.createAdminClient.mockReturnValue(database)

    const response = await POST(request(validSubmission))
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({ success: true })
    expect(mocks.hashIP).toHaveBeenCalledWith('192.0.2.10')
    expect(database.insert).toHaveBeenCalledWith(expect.objectContaining({
      contact_name: 'Morgan Lee',
      interests: ['profile_plus', 'enhanced_analytics'],
      consent_confirmed: true,
      ip_hash: 'a'.repeat(64),
    }))
  })

  it('stops repeated submissions before inserting another row', async () => {
    const database = client({ count: 3 })
    mocks.createAdminClient.mockReturnValue(database)

    const response = await POST(request(validSubmission))
    expect(response.status).toBe(429)
    expect(database.insert).not.toHaveBeenCalled()
  })
})
