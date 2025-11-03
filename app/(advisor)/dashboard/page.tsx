'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Eye,
  MousePointerClick,
  Mail,
  Star,
  Edit,
  MessageSquare,
  Loader2,
  TrendingUp,
  ExternalLink
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface DashboardStats {
  profileViews: number
  totalClicks: number
  leadsLast30Days: number
  totalLeads: number
  averageRating: number
  reviewCount: number
}

interface AdvisorInfo {
  id: string
  name: string
  slug: string
  average_rating: number
  review_count: number
}

interface Activity {
  type: 'lead' | 'review'
  id: string
  description: string
  date: string
  status?: string
  reviewer?: string
}

export default function AdvisorDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [advisor, setAdvisor] = useState<AdvisorInfo | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/advisor/dashboard')

      if (response.status === 401) {
        router.push('/login?returnTo=/dashboard')
        return
      }

      if (response.status === 404) {
        setError('No claimed listing found. Please claim a listing first.')
        setLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const data = await response.json()
      setAdvisor(data.advisor)
      setStats(data.stats)
      setRecentActivity(data.recentActivity)
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
                <MessageSquare className="w-16 h-16 mx-auto" />
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

  if (!advisor || !stats) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {advisor.name}!</h1>
          <p className="text-gray-600">Here's how your listing is performing</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link href={`/listings/${advisor.slug}`} target="_blank">
            <Button variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Public Profile
            </Button>
          </Link>
          <Link href="/dashboard/edit">
            <Button variant="outline" className="w-full">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
          <Link href="/dashboard/leads">
            <Button variant="outline" className="w-full">
              <Mail className="w-4 h-4 mr-2" />
              View Leads
            </Button>
          </Link>
          <Link href="/dashboard/reviews">
            <Button variant="outline" className="w-full">
              <Star className="w-4 h-4 mr-2" />
              View Reviews
            </Button>
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Profile Views"
            value={stats.profileViews}
            icon={Eye}
            description="Last 30 days"
          />
          <MetricCard
            title="Total Clicks"
            value={stats.totalClicks}
            icon={MousePointerClick}
            description="All-time website, email, phone clicks"
          />
          <MetricCard
            title="New Leads"
            value={stats.leadsLast30Days}
            icon={Mail}
            description={`${stats.totalLeads} total leads`}
          />
          <MetricCard
            title="Average Rating"
            value={stats.averageRating.toFixed(1)}
            icon={Star}
            description={`${stats.reviewCount} ${stats.reviewCount === 1 ? 'review' : 'reviews'}`}
          />
          <MetricCard
            title="Total Reviews"
            value={stats.reviewCount}
            icon={MessageSquare}
            description="All-time reviews"
          />
          <MetricCard
            title="Engagement"
            value={stats.profileViews + stats.totalClicks}
            icon={TrendingUp}
            description="Combined interactions"
          />
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No recent activity. New leads and reviews will appear here.
              </p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={`${activity.type}-${activity.id}`}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'lead'
                        ? 'bg-blue-100'
                        : 'bg-yellow-100'
                    }`}>
                      {activity.type === 'lead' ? (
                        <Mail className={`w-5 h-5 ${
                          activity.type === 'lead'
                            ? 'text-blue-600'
                            : 'text-yellow-600'
                        }`} />
                      ) : (
                        <Star className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.description}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                        {activity.reviewer && ` • by ${activity.reviewer}`}
                      </p>
                    </div>
                    {activity.status && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        activity.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        activity.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                        activity.status === 'converted' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
