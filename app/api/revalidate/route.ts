import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

/**
 * On-demand revalidation API route
 *
 * This endpoint allows authorized clients to trigger cache revalidation
 * for specific paths after data mutations (profile updates, reviews, etc.)
 *
 * Usage:
 * POST /api/revalidate
 * Headers: { Authorization: Bearer <REVALIDATION_SECRET> }
 * Body: {
 *   paths: string[],           // Paths to revalidate
 *   advisorSlug?: string       // If revalidating advisor page, provide slug
 * }
 */

interface RevalidateRequest {
  paths?: string[]
  advisorSlug?: string
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authorization
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token || token !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body: RevalidateRequest = await request.json()
    const { paths = [], advisorSlug } = body

    // 3. Build revalidation paths
    const pathsToRevalidate: string[] = []

    // If advisorSlug provided, always revalidate that advisor's page
    if (advisorSlug) {
      pathsToRevalidate.push(`/listings/${advisorSlug}`)
    }

    // Add any additional paths from the request
    pathsToRevalidate.push(...paths)

    // Default paths to always revalidate (common pages affected by most mutations)
    const defaultPaths = ['/', '/listings']
    pathsToRevalidate.push(...defaultPaths)

    // Remove duplicates
    const uniquePaths = [...new Set(pathsToRevalidate)]

    // 4. Revalidate all paths
    const results = await Promise.allSettled(
      uniquePaths.map(async (path) => {
        try {
          revalidatePath(path)
          return { path, success: true }
        } catch (error) {
          console.error(`Failed to revalidate ${path}:`, error)
          return { path, success: false, error: String(error) }
        }
      })
    )

    // 5. Prepare response
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      message: `Revalidated ${successful} path(s)`,
      paths: uniquePaths,
      results: results.map(r =>
        r.status === 'fulfilled' ? r.value : { error: r.reason }
      ),
      stats: { successful, failed, total: uniquePaths.length }
    })

  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}
