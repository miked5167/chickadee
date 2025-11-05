'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChevronLeft,
  Mail,
  Phone,
  User,
  Calendar,
  MessageSquare,
  Download,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// Mock leads data
const mockLeads = [
  {
    id: '1',
    parent_name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    child_age: 14,
    message: 'Hi, my son is a forward looking to improve his skating and stickhandling. He plays AA hockey and wants to get to AAA level. We are interested in your development program and would like to schedule an evaluation.',
    status: 'new',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    parent_name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '(555) 234-5678',
    child_age: 16,
    message: 'Looking for college recruitment guidance for my daughter who is a goalie. She is currently playing for her high school varsity team and AAA club team. We want to explore NCAA D1 opportunities.',
    status: 'contacted',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    parent_name: 'Mike Davis',
    email: 'mike.davis@email.com',
    phone: '(555) 345-6789',
    child_age: 15,
    message: 'My son needs help with his defensive game. He is a strong skater but needs to work on positioning and reading plays. Can you provide 1-on-1 coaching?',
    status: 'contacted',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    parent_name: 'Emily Wilson',
    email: 'emily.wilson@email.com',
    phone: '(555) 456-7890',
    child_age: 13,
    message: 'We are looking for summer hockey camps that focus on skill development. My daughter is new to competitive hockey and wants to improve her overall game.',
    status: 'converted',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    parent_name: 'Robert Chen',
    email: 'robert.chen@email.com',
    phone: '',
    child_age: 17,
    message: 'Interested in your college advisory services. My son is a senior and we need help with the recruiting process and understanding scholarship opportunities.',
    status: 'contacted',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '6',
    parent_name: 'Amanda Brown',
    email: 'amanda.brown@email.com',
    phone: '(555) 567-8901',
    child_age: 12,
    message: 'My son wants to try goalie training. He has been playing forward but is interested in switching positions. Do you offer introductory goalie sessions?',
    status: 'converted',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '7',
    parent_name: 'Chris Martinez',
    email: 'chris.m@email.com',
    phone: '(555) 678-9012',
    child_age: 15,
    message: 'Looking for off-ice training to complement on-ice practice. Specifically interested in strength and conditioning programs for hockey players.',
    status: 'closed',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '8',
    parent_name: 'Jennifer Lee',
    email: 'jennifer.lee@email.com',
    phone: '(555) 789-0123',
    child_age: 14,
    message: 'We are relocating to the area and need help finding the right hockey program for our daughter. She currently plays AAA and we want to ensure continuity in her development.',
    status: 'new',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
]

type LeadStatus = 'all' | 'new' | 'contacted' | 'converted' | 'closed'

export default function DemoLeadsPage() {
  const [filter, setFilter] = useState<LeadStatus>('all')
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set())
  const [showDemoNotice, setShowDemoNotice] = useState(true)

  const filteredLeads = filter === 'all'
    ? mockLeads
    : mockLeads.filter(lead => lead.status === filter)

  const toggleExpanded = (leadId: string) => {
    const newExpanded = new Set(expandedLeads)
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId)
    } else {
      newExpanded.add(leadId)
    }
    setExpandedLeads(newExpanded)
  }

  const handleStatusChange = (leadId: string, newStatus: string) => {
    // In the real app, this would make an API call
    alert(`In the real dashboard, this would update lead ${leadId} to status: ${newStatus}`)
  }

  const handleExportCSV = () => {
    alert('In the real dashboard, this would export all leads to a CSV file')
  }

  const getStatusCount = (status: LeadStatus) => {
    if (status === 'all') return mockLeads.length
    return mockLeads.filter(lead => lead.status === status).length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Demo Notice Banner */}
        {showDemoNotice && (
          <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Demo Dashboard - Leads Management</h3>
              <p className="text-sm text-blue-800">
                This demonstrates how advisors manage incoming leads. All data is mock/demo data.
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

        {/* Back Button */}
        <div className="mb-6">
          <Link href="/demo/dashboard">
            <Button variant="ghost" className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Lead Management</h1>
              <p className="text-gray-600">View and manage inquiries from potential clients</p>
            </div>
            <Button onClick={handleExportCSV} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className="gap-2"
          >
            All Leads
            <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-white/20">
              {getStatusCount('all')}
            </span>
          </Button>
          <Button
            variant={filter === 'new' ? 'default' : 'outline'}
            onClick={() => setFilter('new')}
            className="gap-2"
          >
            New
            <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              {getStatusCount('new')}
            </span>
          </Button>
          <Button
            variant={filter === 'contacted' ? 'default' : 'outline'}
            onClick={() => setFilter('contacted')}
            className="gap-2"
          >
            Contacted
            <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
              {getStatusCount('contacted')}
            </span>
          </Button>
          <Button
            variant={filter === 'converted' ? 'default' : 'outline'}
            onClick={() => setFilter('converted')}
            className="gap-2"
          >
            Converted
            <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              {getStatusCount('converted')}
            </span>
          </Button>
          <Button
            variant={filter === 'closed' ? 'default' : 'outline'}
            onClick={() => setFilter('closed')}
            className="gap-2"
          >
            Closed
            <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
              {getStatusCount('closed')}
            </span>
          </Button>
        </div>

        {/* Leads List */}
        <div className="space-y-4">
          {filteredLeads.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No leads found</h3>
                <p className="text-gray-600">
                  {filter === 'all'
                    ? 'You haven\'t received any leads yet.'
                    : `You don't have any ${filter} leads.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{lead.parent_name}</CardTitle>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                          lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                          lead.status === 'converted' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                        </div>
                        {lead.child_age && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            Child's age: {lead.child_age}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(lead.id)}
                      className="flex-shrink-0"
                    >
                      {expandedLeads.has(lead.id) ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                        {lead.email}
                      </a>
                    </div>
                    {lead.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                          {lead.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Message Preview/Full */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </div>
                    <div className={`text-gray-700 bg-gray-50 p-3 rounded-lg ${
                      expandedLeads.has(lead.id) ? '' : 'line-clamp-2'
                    }`}>
                      {lead.message}
                    </div>
                  </div>

                  {/* Status Action Buttons */}
                  {expandedLeads.has(lead.id) && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      <span className="text-sm font-medium text-gray-700 mr-2">Update Status:</span>
                      <Button
                        size="sm"
                        variant={lead.status === 'new' ? 'default' : 'outline'}
                        onClick={() => handleStatusChange(lead.id, 'new')}
                      >
                        New
                      </Button>
                      <Button
                        size="sm"
                        variant={lead.status === 'contacted' ? 'default' : 'outline'}
                        onClick={() => handleStatusChange(lead.id, 'contacted')}
                      >
                        Contacted
                      </Button>
                      <Button
                        size="sm"
                        variant={lead.status === 'converted' ? 'default' : 'outline'}
                        onClick={() => handleStatusChange(lead.id, 'converted')}
                      >
                        Converted
                      </Button>
                      <Button
                        size="sm"
                        variant={lead.status === 'closed' ? 'default' : 'outline'}
                        onClick={() => handleStatusChange(lead.id, 'closed')}
                      >
                        Closed
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
