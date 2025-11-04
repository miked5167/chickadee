import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function AdvisorCardSkeleton() {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-4">
          {/* Logo skeleton */}
          <div className="w-16 h-16 bg-gray-200 animate-pulse rounded-lg flex-shrink-0" />

          <div className="flex-1 space-y-2">
            {/* Name skeleton */}
            <div className="h-6 bg-gray-200 animate-pulse rounded w-3/4" />
            {/* Location skeleton */}
            <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Rating skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 bg-gray-200 animate-pulse rounded w-24" />
          <div className="h-4 bg-gray-200 animate-pulse rounded w-16" />
        </div>

        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 animate-pulse rounded w-full" />
          <div className="h-3 bg-gray-200 animate-pulse rounded w-full" />
          <div className="h-3 bg-gray-200 animate-pulse rounded w-3/4" />
        </div>

        {/* Badges skeleton */}
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 animate-pulse rounded-full w-20" />
          <div className="h-6 bg-gray-200 animate-pulse rounded-full w-24" />
          <div className="h-6 bg-gray-200 animate-pulse rounded-full w-16" />
        </div>
      </CardContent>
    </Card>
  )
}
