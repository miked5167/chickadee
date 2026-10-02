import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function AdvisorCardSkeleton() {
  return (
    <Card aria-label="Loading listing" className="gap-0 overflow-hidden border-frost bg-white py-0">
      <div className="h-1 bg-ice-blue" />
      <CardHeader className="px-5 pb-4 pt-5">
        <div className="flex items-start gap-4">
          {/* Logo skeleton */}
          <div className="h-16 w-16 flex-shrink-0 animate-pulse rounded-lg bg-ice-blue sm:h-20 sm:w-20" />

          <div className="flex-1 space-y-2">
            {/* Name skeleton */}
            <div className="h-6 bg-gray-200 animate-pulse rounded w-3/4" />
            {/* Location skeleton */}
            <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 pb-5">
        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 animate-pulse rounded w-full" />
          <div className="h-3 bg-gray-200 animate-pulse rounded w-full" />
        </div>

        {/* Badges skeleton */}
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 animate-pulse rounded-full w-20" />
          <div className="h-6 bg-gray-200 animate-pulse rounded-full w-24" />
          <div className="h-6 bg-gray-200 animate-pulse rounded-full w-16" />
        </div>
        <div className="flex gap-2 pt-2"><div className="h-12 flex-1 animate-pulse rounded-lg bg-ice-blue" /><div className="h-12 w-20 animate-pulse rounded-lg bg-ice-blue" /></div>
      </CardContent>
    </Card>
  )
}
