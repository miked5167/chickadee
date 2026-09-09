import { afterEach, describe, expect, it } from 'vitest'
import { publicPreviewFeedUrl, publicPreviewProfileUrl } from '@/lib/preview/advisor-feed'

const originalVercelEnvironment = process.env.VERCEL_ENV
const originalPreviewSource = process.env.DIRECTORY_PREVIEW_SOURCE_URL

afterEach(() => {
  if (originalVercelEnvironment === undefined) delete process.env.VERCEL_ENV
  else process.env.VERCEL_ENV = originalVercelEnvironment

  if (originalPreviewSource === undefined) delete process.env.DIRECTORY_PREVIEW_SOURCE_URL
  else process.env.DIRECTORY_PREVIEW_SOURCE_URL = originalPreviewSource
})

describe('public directory preview feed', () => {
  it('uses production public data for a Vercel preview deployment', () => {
    process.env.VERCEL_ENV = 'preview'
    delete process.env.DIRECTORY_PREVIEW_SOURCE_URL

    expect(publicPreviewFeedUrl(new URLSearchParams({ limit: '1' })))
      .toBe('https://thehockeydirectory.com/api/advisors?limit=1')
    expect(publicPreviewProfileUrl('2112-hockey-agency'))
      .toBe('https://thehockeydirectory.com/listings/2112-hockey-agency')
  })

  it('does not proxy production application requests', () => {
    process.env.VERCEL_ENV = 'production'
    delete process.env.DIRECTORY_PREVIEW_SOURCE_URL

    expect(publicPreviewFeedUrl(new URLSearchParams())).toBeNull()
    expect(publicPreviewProfileUrl('2112-hockey-agency')).toBeNull()
  })
})
