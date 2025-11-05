'use client'

import { useState } from 'react'
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
  TrendingUp,
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// Mock data
const mockAdvisor = {
  id: '123',
  name: 'Elite Hockey Development',
  slug: '369-sports-entertainment',
  average_rating: 4.8,
  review_count: 23
}

const mockStats = {
  profileViews: 234,
  totalClicks: 89,
  leadsLast30Days: 12,
  totalLeads: 45,
  averageRating: 4.8,
  reviewCount: 23
}

const mockRecentActivity = [
  {
    type: 'lead' as const,
    id: '1',
    description: 'New lead from John Smith',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    status: 'new'
  },
  {
    type: 'review' as const,
    id: '2',
    description: 'New 5-star review',
    date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    reviewer: 'Sarah Johnson'
  },
  {
    type: 'lead' as const,
    id: '3',
    description: 'New lead from Mike Davis',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    status: 'contacted'
  },
  {
    type: 'lead' as const,
    id: '4',
    description: 'New lead from Emily Wilson',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    status: 'contacted'
  },
  {
    type: 'review' as const,
    id: '5',
    description: 'New 4-star review',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    reviewer: 'Robert Chen'
  },
  {
    type: 'lead' as const,
    id: '6',
    description: 'New lead from Amanda Brown',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    status: 'converted'
  },
  {
    type: 'lead' as const,
    id: '7',
    description: 'New lead from Chris Martinez',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    status: 'contacted'
  },
  {
    type: 'review' as const,
    id: '8',
    description: 'New 5-star review',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    reviewer: 'Jennifer Lee'
  },
  {
    type: 'lead' as const,
    id: '9',
    description: 'New lead from David Thompson',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    status: 'closed'
  },
  {
    type: 'lead' as const,
    id: '10',
    description: 'New lead from Jessica White',
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    status: 'converted'
  }
]

export default function DemoAdvisorDashboard() {
  const [showDemoNotice, setShowDemoNotice] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Demo Notice Banner */}
        {showDemoNotice && (
          <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Demo Dashboard</h3>
              <p className="text-sm text-blue-800">
                This is a demonstration of the Advisor Dashboard with mock data.
                The actual dashboard requires authentication and a claimed listing.
              </p>
            </div>
            <button
              onClick={() => setShowDemoNotice(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {mockAdvisor.name}!</h1>
          <p className="text-gray-600">Here's how your listing is performing</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link href={`/listings/${mockAdvisor.slug}`} target="_blank">
            <Button variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Public Profile
            </Button>
          </Link>
          <Link href="/demo/dashboard/edit">
            <Button variant="outline" className="w-full">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
          <Link href="/demo/dashboard/leads">
            <Button variant="outline" className="w-full">
              <Mail className="w-4 h-4 mr-2" />
              View Leads
            </Button>
          </Link>
          <Link href="/demo/dashboard/reviews">
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
            value={mockStats.profileViews}
            icon={Eye}
            description="Last 30 days"
          />
          <MetricCard
            title="Total Clicks"
            value={mockStats.totalClicks}
            icon={MousePointerClick}
            description="All-time website, email, phone clicks"
          />
          <MetricCard
            title="New Leads"
            value={mockStats.leadsLast30Days}
            icon={Mail}
            description={`${mockStats.totalLeads} total leads`}
          />
          <MetricCard
            title="Average Rating"
            value={mockStats.averageRating.toFixed(1)}
            icon={Star}
            description={`${mockStats.reviewCount} ${mockStats.reviewCount === 1 ? 'review' : 'reviews'}`}
          />
          <MetricCard
            title="Total Reviews"
            value={mockStats.reviewCount}
            icon={MessageSquare}
            description="All-time reviews"
          />
          <MetricCard
            title="Engagement"
            value={mockStats.profileViews + mockStats.totalClicks}
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
            <div className="space-y-4">
              {mockRecentActivity.map((activity) => (
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
