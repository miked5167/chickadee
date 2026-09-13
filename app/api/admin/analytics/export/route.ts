import { analyticsResponse } from '@/lib/analytics/admin-response'

export const GET = (request: Request) => analyticsResponse(request, true)
