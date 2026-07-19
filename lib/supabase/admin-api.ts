import { NextResponse } from 'next/server'
import { getAdminAuthorization } from './auth'

const responseHeaders = {
  'Cache-Control': 'no-store',
}

export type AuthorizedAdminRequest = Extract<
  Awaited<ReturnType<typeof getAdminAuthorization>>,
  { status: 'authorized' }
>

export type AdminRequestAuthorization =
  | {
      ok: true
      authorization: AuthorizedAdminRequest
    }
  | {
      ok: false
      response: NextResponse
    }

/**
 * Standard administrator API guard. It intentionally reveals neither whether
 * an administrator record exists nor any authenticated-user information.
 */
export async function authorizeAdminRequest(): Promise<AdminRequestAuthorization> {
  const authorization = await getAdminAuthorization()

  if (authorization.status === 'unauthenticated') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401, headers: responseHeaders },
      ),
    }
  }

  if (authorization.status === 'forbidden') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Access denied.' },
        { status: 403, headers: responseHeaders },
      ),
    }
  }

  return { ok: true, authorization }
}

/**
 * Cutover checkpoint for administrator workflows whose database/application
 * contracts are not safe to enable yet. Authorization always happens first.
 */
export async function disabledAdminWorkflowResponse(): Promise<NextResponse> {
  const authorization = await authorizeAdminRequest()
  if (!authorization.ok) return authorization.response

  return NextResponse.json(
    { error: 'Administrator workflow unavailable.' },
    { status: 503, headers: responseHeaders },
  )
}
