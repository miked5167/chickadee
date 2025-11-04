'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Loader2,
  ArrowLeft,
  Eye,
  MousePointerClick,
  Mail,
  Phone,
  Globe,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Star
} from 'lucide-react'
import { formatDistanceToNow, format, subDays } from 'date-fns'

interface AnalyticsData {
  // Click tracking
  totalClicks: number
  websiteClicks: number
  emailClicks: number
  phoneClicks: number
  clicksLast30Days: number
  clicksByDay: { date: string; count: number }[]

  // View tracking
  totalViews: number
  viewsLast30Days: number
  viewsByDay: { date: string; count: number }[]
  topAdvisorsByViews: { id: string; name: string; views: number }[]

  // Lead metrics
  totalLeads: number
  leadsLast30Days: number
  leadsByDay: { date: string; count: number }[]
  leadsByStatus: { status: string; count: number }[]
  topAdvisorsByLeads: { id: string; name: string; leads: number }[]
  conversionRate: number

  // Review metrics
  totalReviews: number
  reviewsLast30Days: number
  reviewsByDay: { date: string; count: number }[]
  averageRating: number
  ratingDistribution: { rating: number; count: number }[]
  topAdvisorsByRating: { id: string; name: string; rating: number; reviewCount: number }[]
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/analytics?days=${dateRange}`)

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const result = await response.json()
      setData(result.data)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = async () => {
    setExporting(true)
    try {
      const response = await fetch(`/api/admin/analytics/export?days=${dateRange}`)

      if (!response.ok) {
        throw new Error('Failed to export analytics')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error exporting analytics:', err)
      alert('Failed to export analytics')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Link href="/admin/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <p className="font-medium">Error loading analytics</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Platform Analytics</h1>
              <p className="text-gray-600 mt-1">Comprehensive insights into platform performance</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Date Range Selector */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as '7' | '30' | '90')}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>

              {/* Export Button */}
              <Button
                onClick={exportToCSV}
                disabled={exporting}
                variant="outline"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Click Tracking Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Click Tracking</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Total Clicks"
              value={data.totalClicks.toLocaleString()}
              icon={MousePointerClick}
              trend={data.clicksLast30Days > 0 ? 'up' : 'neutral'}
              trendText={`${data.clicksLast30Days} in last ${dateRange} days`}
            />
            <MetricCard
              title="Website Clicks"
              value={data.websiteClicks.toLocaleString()}
              icon={Globe}
              iconColor="text-blue-600"
            />
            <MetricCard
              title="Email Clicks"
              value={data.emailClicks.toLocaleString()}
              icon={Mail}
              iconColor="text-purple-600"
            />
            <MetricCard
              title="Phone Clicks"
              value={data.phoneClicks.toLocaleString()}
              icon={Phone}
              iconColor="text-green-600"
            />
          </div>

          {/* Click Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Click Trends (Last {dateRange} Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-1">
                {data.clicksByDay.map((day, index) => {
                  const maxClicks = Math.max(...data.clicksByDay.map(d => d.count))
                  const height = maxClicks > 0 ? (day.count / maxClicks) * 100 : 0

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-all cursor-pointer"
                        style={{ height: `${height}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                        title={`${format(new Date(day.date), 'MMM d')}: ${day.count} clicks`}
                      />
                      {index % Math.floor(data.clicksByDay.length / 7) === 0 && (
                        <span className="text-xs text-gray-500 mt-2">
                          {format(new Date(day.date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Tracking Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">View Tracking</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <MetricCard
              title="Total Profile Views"
              value={data.totalViews.toLocaleString()}
              icon={Eye}
              trend={data.viewsLast30Days > 0 ? 'up' : 'neutral'}
              trendText={`${data.viewsLast30Days} in last ${dateRange} days`}
            />
            <MetricCard
              title="Avg Views Per Day"
              value={Math.round(data.viewsLast30Days / parseInt(dateRange)).toLocaleString()}
              icon={TrendingUp}
              iconColor="text-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* View Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>View Trends (Last {dateRange} Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-1">
                  {data.viewsByDay.map((day, index) => {
                    const maxViews = Math.max(...data.viewsByDay.map(d => d.count))
                    const height = maxViews > 0 ? (day.count / maxViews) * 100 : 0

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-purple-500 hover:bg-purple-600 rounded-t transition-all cursor-pointer"
                          style={{ height: `${height}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                          title={`${format(new Date(day.date), 'MMM d')}: ${day.count} views`}
                        />
                        {index % Math.floor(data.viewsByDay.length / 7) === 0 && (
                          <span className="text-xs text-gray-500 mt-2">
                            {format(new Date(day.date), 'MMM d')}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Advisors by Views */}
            <Card>
              <CardHeader>
                <CardTitle>Top Advisors by Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topAdvisorsByViews.slice(0, 10).map((advisor, index) => (
                    <div key={advisor.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                        <Link
                          href={`/admin/listings/${advisor.id}/edit`}
                          className="text-sm text-blue-600 hover:underline truncate"
                        >
                          {advisor.name}
                        </Link>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {advisor.views.toLocaleString()} views
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lead Metrics Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Lead Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Total Leads"
              value={data.totalLeads.toLocaleString()}
              icon={Users}
              trend={data.leadsLast30Days > 0 ? 'up' : 'neutral'}
              trendText={`${data.leadsLast30Days} in last ${dateRange} days`}
            />
            <MetricCard
              title="Conversion Rate"
              value={`${data.conversionRate.toFixed(1)}%`}
              icon={TrendingUp}
              iconColor="text-green-600"
              description="Views to leads"
            />
            <MetricCard
              title="New Leads"
              value={data.leadsByStatus.find(s => s.status === 'new')?.count || 0}
              icon={Mail}
              iconColor="text-yellow-600"
            />
            <MetricCard
              title="Converted"
              value={data.leadsByStatus.find(s => s.status === 'converted')?.count || 0}
              icon={Star}
              iconColor="text-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lead Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Trends (Last {dateRange} Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-1">
                  {data.leadsByDay.map((day, index) => {
                    const maxLeads = Math.max(...data.leadsByDay.map(d => d.count))
                    const height = maxLeads > 0 ? (day.count / maxLeads) * 100 : 0

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-green-500 hover:bg-green-600 rounded-t transition-all cursor-pointer"
                          style={{ height: `${height}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                          title={`${format(new Date(day.date), 'MMM d')}: ${day.count} leads`}
                        />
                        {index % Math.floor(data.leadsByDay.length / 7) === 0 && (
                          <span className="text-xs text-gray-500 mt-2">
                            {format(new Date(day.date), 'MMM d')}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Advisors by Leads */}
            <Card>
              <CardHeader>
                <CardTitle>Top Advisors by Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topAdvisorsByLeads.slice(0, 10).map((advisor, index) => (
                    <div key={advisor.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                        <Link
                          href={`/admin/listings/${advisor.id}/edit`}
                          className="text-sm text-blue-600 hover:underline truncate"
                        >
                          {advisor.name}
                        </Link>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {advisor.leads.toLocaleString()} leads
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Review Metrics Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Review Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <MetricCard
              title="Total Reviews"
              value={data.totalReviews.toLocaleString()}
              icon={Star}
              trend={data.reviewsLast30Days > 0 ? 'up' : 'neutral'}
              trendText={`${data.reviewsLast30Days} in last ${dateRange} days`}
            />
            <MetricCard
              title="Average Rating"
              value={data.averageRating.toFixed(1)}
              icon={Star}
              iconColor="text-yellow-600"
              description="Platform-wide"
            />
            <MetricCard
              title="Reviews Per Day"
              value={(data.reviewsLast30Days / parseInt(dateRange)).toFixed(1)}
              icon={TrendingUp}
              iconColor="text-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Review Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Review Trends (Last {dateRange} Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-1">
                  {data.reviewsByDay.map((day, index) => {
                    const maxReviews = Math.max(...data.reviewsByDay.map(d => d.count))
                    const height = maxReviews > 0 ? (day.count / maxReviews) * 100 : 0

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-yellow-500 hover:bg-yellow-600 rounded-t transition-all cursor-pointer"
                          style={{ height: `${height}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                          title={`${format(new Date(day.date), 'MMM d')}: ${day.count} reviews`}
                        />
                        {index % Math.floor(data.reviewsByDay.length / 7) === 0 && (
                          <span className="text-xs text-gray-500 mt-2">
                            {format(new Date(day.date), 'MMM d')}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Advisors by Rating */}
            <Card>
              <CardHeader>
                <CardTitle>Top Rated Advisors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topAdvisorsByRating.slice(0, 10).map((advisor, index) => (
                    <div key={advisor.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                        <Link
                          href={`/admin/listings/${advisor.id}/edit`}
                          className="text-sm text-blue-600 hover:underline truncate"
                        >
                          {advisor.name}
                        </Link>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          ⭐ {advisor.rating.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {advisor.reviewCount} reviews
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rating Distribution */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const data_rating = data.ratingDistribution.find(r => r.rating === rating)
                  const count = data_rating?.count || 0
                  const percentage = data.totalReviews > 0 ? (count / data.totalReviews) * 100 : 0

                  return (
                    <div key={rating} className="flex items-center gap-4">
                      <span className="text-sm font-medium w-16">⭐ {rating}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-yellow-500 h-full rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-20 text-right">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
