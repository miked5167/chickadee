import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function BlogCardSkeleton() {
  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      {/* Featured image skeleton */}
      <div className="w-full h-48 bg-gray-200 animate-pulse" />

      <CardHeader className="space-y-2">
        {/* Category badge skeleton */}
        <div className="h-5 bg-gray-200 animate-pulse rounded-full w-20" />

        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 animate-pulse rounded w-full" />
          <div className="h-6 bg-gray-200 animate-pulse rounded w-3/4" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Excerpt skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 animate-pulse rounded w-full" />
          <div className="h-4 bg-gray-200 animate-pulse rounded w-full" />
          <div className="h-4 bg-gray-200 animate-pulse rounded w-2/3" />
        </div>

        {/* Meta info skeleton */}
        <div className="flex items-center gap-4 pt-2">
          <div className="h-3 bg-gray-200 animate-pulse rounded w-24" />
          <div className="h-3 bg-gray-200 animate-pulse rounded w-20" />
        </div>
      </CardContent>
    </Card>
  )
}
