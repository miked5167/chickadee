import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Local review only: the report and all research drafts remain outside production.
export async function GET() {
  if (process.env.NODE_ENV !== 'development') return new Response('Not found', { status: 404 })
  try {
    const html = await readFile(join(process.cwd(), 'data/enrichment/company-overview-review-20260913.html'), 'utf8')
    return new Response(html, { headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
    } })
  } catch {
    return new Response('The local overview report has not been generated yet.', { status: 404 })
  }
}
