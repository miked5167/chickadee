'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  UserCheck,
  Star,
  Mail,
  Eye,
  MousePointerClick,
  FileText,
  AlertCircle,
  Loader2,
  TrendingUp,
  CheckCircle,
  BarChart3
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface DashboardStats {
  totalAdvisors: number
  claimedAdvisors: number
  publishedAdvisors: number
  totalReviews: number
  totalLeads: number
  leadsLast30Days: number
  reviewsLast30Days: number
  profileViewsLast30Days: number
  totalClicks: number
  pendingClaims: number
  averageRating: number
}

interface Activity {
  type: 'lead' | 'review'
  id: string
  description: string
  date: string
  status?: string
  rating?: number
  reviewer?: string
  advisorName?: string
}

interface ExpiringSubscription {
  id: string
  name: string
  subscription_end_date: string
  subscription_tier: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [expiringSubscriptions, setExpiringSubscriptions] = useState<ExpiringSubscription[]>([])
  const [expiredSubscriptions, setExpiredSubscriptions] = useState<ExpiringSubscription[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/dashboard')

      if (response.status === 401) {
        router.push('/login?returnTo=/admin/dashboard')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const data = await response.json()
      setStats(data.stats)
      setRecentActivity(data.recentActivity)
      setExpiringSubscriptions(data.expiringSubscriptions || [])
      setExpiredSubscriptions(data.expiredSubscriptions || [])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-red-600 mb-4">
                <AlertCircle className="w-16 h-16 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Dashboard Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={fetchDashboardData}>Try Again</Button>
                <Link href="/">
                  <Button variant="outline">Go Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-8 p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Platform overview and management</p>
      </div>

      {/* Pending Actions Alert */}
      {stats.pendingClaims > 0 && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">
                    {stats.pendingClaims} Pending Claim{stats.pendingClaims !== 1 ? 's' : ''} Require Attention
                  </h3>
                  <p className="text-sm text-orange-700 mt-1">
                    Review and approve or reject pending listing claims to keep the platform up to date
                  </p>
                </div>
              </div>
              <Link href="/admin/claims">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  Review Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expired Subscriptions Alert */}
      {expiredSubscriptions.length > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900">
                    {expiredSubscriptions.length} Expired Subscription{expiredSubscriptions.length !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    These listings are past their subscription end date and should be unpublished or renewed
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {expiredSubscriptions.slice(0, 5).map(sub => (
                      <Link key={sub.id} href={`/admin/listings/${sub.id}/edit`}>
                        <span className="text-xs bg-white px-2 py-1 rounded border border-red-200 hover:border-red-400 transition-colors">
                          {sub.name}
                        </span>
                      </Link>
                    ))}
                    {expiredSubscriptions.length > 5 && (
                      <span className="text-xs text-red-700">
                        +{expiredSubscriptions.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Link href="/admin/listings?filter=expired">
                <Button className="bg-red-600 hover:bg-red-700">
                  View All
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expiring Soon Alert */}
      {expiringSubscriptions.length > 0 && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-900">
                    {expiringSubscriptions.length} Subscription{expiringSubscriptions.length !== 1 ? 's' : ''} Expiring Soon
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    These subscriptions will expire within 30 days. Consider reaching out to renew.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {expiringSubscriptions.slice(0, 5).map(sub => (
                      <Link key={sub.id} href={`/admin/listings/${sub.id}/edit`}>
                        <span className="text-xs bg-white px-2 py-1 rounded border border-yellow-200 hover:border-yellow-400 transition-colors">
                          {sub.name} ({formatDistanceToNow(new Date(sub.subscription_end_date), { addSuffix: true })})
                        </span>
                      </Link>
                    ))}
                    {expiringSubscriptions.length > 5 && (
                      <span className="text-xs text-yellow-700">
                        +{expiringSubscriptions.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Link href="/admin/listings?filter=expiring">
                <Button className="bg-yellow-600 hover:bg-yellow-700">
                  View All
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link href="/admin/listings" className="group">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-blue-200">
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-medium text-gray-900">Manage Listings</p>
                <p className="text-sm text-gray-500 mt-1">{stats.totalAdvisors} total</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/claims" className="group">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-orange-200">
              <CardContent className="p-6 text-center relative">
                <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <p className="font-medium text-gray-900">Review Claims</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.pendingClaims} pending
                </p>
                {stats.pendingClaims > 0 && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                )}
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/reviews" className="group">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-yellow-200">
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-yellow-200 transition-colors">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <p className="font-medium text-gray-900">Moderate Reviews</p>
                <p className="text-sm text-gray-500 mt-1">{stats.totalReviews} total</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/leads" className="group">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-purple-200">
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <p className="font-medium text-gray-900">View Leads</p>
                <p className="text-sm text-gray-500 mt-1">{stats.totalLeads} total</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/blog/analytics" className="group">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-green-200">
              <CardContent className="p-6 text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-medium text-gray-900">Blog Analytics</p>
                <p className="text-sm text-gray-500 mt-1">View insights</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Advisors</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalAdvisors}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-gray-600">
                      {stats.publishedAdvisors} published
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Claimed Listings</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.claimedAdvisors}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-gray-600">
                      {((stats.claimedAdvisors / stats.totalAdvisors) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Reviews</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalReviews}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Star className="w-4 h-4 text-yellow-600 fill-current" />
                    <p className="text-sm text-gray-600">
                      {stats.reviewsLast30Days} in last 30 days
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Mail className="w-4 h-4 text-purple-600" />
                    <p className="text-sm text-gray-600">
                      {stats.leadsLast30Days} in last 30 days
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Engagement Metrics (Last 30 Days)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-600">Profile Views</p>
                <Eye className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {stats.profileViewsLast30Days.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total views in last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-600">Link Clicks</p>
                <MousePointerClick className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {stats.totalClicks.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">All-time external link clicks</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {stats.averageRating.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">Across all advisors with reviews</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No recent activity</p>
              <p className="text-sm text-gray-400 mt-1">Activity from all advisors will appear here</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentActivity.map((activity) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-center gap-4 p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className={`p-3 rounded-lg flex-shrink-0 ${
                    activity.type === 'lead'
                      ? 'bg-purple-100'
                      : 'bg-yellow-100'
                  }`}>
                    {activity.type === 'lead' ? (
                      <Mail className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Star className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                      {activity.advisorName && (
                        <span className="text-gray-400"> • {activity.advisorName}</span>
                      )}
                    </p>
                  </div>
                  {activity.status && (
                    <span className={`px-3 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                      activity.status === 'new' ? 'bg-blue-100 text-blue-700' :
                      activity.status === 'contacted' ? 'bg-yellow-100 text-yellow-700' :
                      activity.status === 'converted' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {activity.status}
                    </span>
                  )}
                  {activity.rating && (
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-yellow-600 flex-shrink-0">
                      <Star className="w-4 h-4 fill-current" />
                      {activity.rating}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
