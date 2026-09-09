import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import * as upload from '@/app/api/upload/route'
import * as blogPosts from '@/app/api/blog/posts/route'
import * as blogCategories from '@/app/api/blog/categories/route'
import * as blogTags from '@/app/api/blog/tags/route'
import * as blogRss from '@/app/api/blog/rss/route'
import * as subscriptionCron from '@/app/api/cron/expire-subscriptions/route'

const retiredHandlers = [
  upload.POST,
  upload.DELETE,
  blogPosts.GET,
  blogCategories.GET,
  blogTags.GET,
  blogRss.GET,
  subscriptionCron.GET,
  subscriptionCron.POST,
]

describe('retired legacy endpoints', () => {
  it('returns a permanent retired response without caching private upload requests', async () => {
    for (const handler of retiredHandlers) {
      const response = await handler()
      expect(response.status).toBe(410)
    }

    const uploadResponse = await upload.POST()
    expect(uploadResponse.headers.get('cache-control')).toBe('no-store')
  })

  it('contains no upload credential, media mutation, or obsolete user-profile access', () => {
    const uploadSource = readFileSync(path.join(process.cwd(), 'app', 'api', 'upload', 'route.ts'), 'utf8')
    const authSource = readFileSync(path.join(process.cwd(), 'lib', 'supabase', 'auth.ts'), 'utf8')
    const cronSource = readFileSync(path.join(process.cwd(), 'app', 'api', 'cron', 'expire-subscriptions', 'route.ts'), 'utf8')
    const vercelConfig = readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8')

    expect(uploadSource).not.toMatch(/cloudinary|uploader|CLOUDINARY_API_SECRET|createClient/)
    expect(authSource).not.toMatch(/users_public|getOrCreatePublicProfile/)
    expect(cronSource).not.toMatch(/createClient|\.from\s*\(|\.update\s*\(|is_published|subscription_end_date/)
    expect(vercelConfig).not.toMatch(/expire-subscriptions|"crons"/)
  })
})
