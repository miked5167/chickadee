'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  ArrowLeft,
  Mail,
  Phone,
  User,
  Calendar,
  MessageSquare,
  Download
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Lead {
  id: string
  parent_name: string
  email: string
  phone: string | null
  child_age: number | null
  message: string
  status: 'new' | 'contacted' | 'converted' | 'closed'
  created_at: string
  advisors: {
    name: string
  }
}

export default function AdminLeadsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'converted' | 'closed'>('all')
  const [expandedLead, setExpandedLead] = useState<string | null>(null)

  useEffect(() => {
    fetchLeads()
  }, [statusFilter, page])

  const fetchLeads = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: '50'
      })

      const response = await fetch(`/api/admin/leads?${params}`)

      if (response.status === 401) {
        router.push('/login?returnTo=/admin/leads')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch leads')
      }

      const data = await response.json()
      setLeads(data.leads)
      setTotal(data.total)
    } catch (err) {
      console.error('Error fetching leads:', err)
      setError('Failed to load leads. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      converted: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    }
    return (
      <Badge className={styles[status as keyof typeof styles] || styles.new}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Advisor', 'Parent Name', 'Email', 'Phone', 'Child Age', 'Message', 'Status'].join(','),
      ...leads.map(lead => [
        new Date(lead.created_at).toLocaleDateString(),
        lead.advisors.name,
        lead.parent_name,
        lead.email,
        lead.phone || '',
        lead.child_age || '',
        `"${lead.message.replace(/"/g, '""')}"`,
        lead.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `all-leads-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading leads...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">All Leads</h1>
              <p className="text-gray-600 mt-1">View all inquiries across all advisors</p>
            </div>
            {leads.length > 0 && (
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export to CSV
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {(['all', 'new', 'contacted', 'converted', 'closed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                statusFilter === status
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {statusFilter === status && total > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {total}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Leads List */}
        {leads.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No leads found</h3>
              <p className="text-gray-600">
                {statusFilter === 'all'
                  ? 'New inquiries will appear here'
                  : `No leads with status "${statusFilter}"`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => (
              <Card key={lead.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{lead.parent_name}</h3>
                          {getStatusBadge(lead.status)}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <a href={`mailto:${lead.email}`} className="hover:text-blue-600">
                              {lead.email}
                            </a>
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              <a href={`tel:${lead.phone}`} className="hover:text-blue-600">
                                {lead.phone}
                              </a>
                            </div>
                          )}
                          {lead.child_age && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>Child: {lead.child_age} years old</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</span>
                          </div>
                          <div className="font-medium text-gray-700">
                            Advisor: {lead.advisors.name}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                      >
                        {expandedLead === lead.id ? 'Hide' : 'View'} Details
                      </Button>
                    </div>

                    {/* Message Preview */}
                    {expandedLead !== lead.id && (
                      <div className="text-gray-700 text-sm line-clamp-2">
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        {lead.message}
                      </div>
                    )}

                    {/* Expanded Details */}
                    {expandedLead === lead.id && (
                      <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-2">Message:</h4>
                        <p className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                          {lead.message}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 50 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, total)} of {total}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page * 50 >= total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
