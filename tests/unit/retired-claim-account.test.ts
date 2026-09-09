import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { POST as setupPassword } from '@/app/api/advisors/setup-password/route'
import { GET as verifyEmailGet, POST as verifyEmailPost } from '@/app/api/advisors/verify-email/route'

describe('retired legacy claim-account endpoints', () => {
  it('returns a no-store 410 for every legacy account-setup request', async () => {
    for (const handler of [setupPassword, verifyEmailGet, verifyEmailPost]) {
      const response = await handler()
      expect(response.status).toBe(410)
      expect(response.headers.get('cache-control')).toBe('no-store')
      await expect(response.json()).resolves.toMatchObject({
        error: expect.stringContaining('no longer supported'),
      })
    }
  })

  it('contains no privileged client, auth-user creation, or ownership mutation', () => {
    for (const route of ['setup-password', 'verify-email']) {
      const source = readFileSync(
        path.join(process.cwd(), 'app', 'api', 'advisors', route, 'route.ts'),
        'utf8',
      )

      expect(source).not.toMatch(/createAdminClient|auth\.admin|createUser/)
      expect(source).not.toMatch(/verified_owner_id|claimed_by_user_id|auto.?approv/i)
      expect(source).not.toMatch(/\.from\s*\(/)
    }
  })
})
