'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  ArrowLeft,
  Plus
} from 'lucide-react'
import { formatDistanceToNow, isPast, differenceInDays } from 'date-fns'

interface Advisor {
  id: string
  name: string
  slug: string
  city: string
  state: string
  is_claimed: boolean
  is_published: boolean
  is_verified: boolean
  is_featured: boolean
  data_quality_score: number
  average_rating: number
  review_count: number
  created_at: string
  subscription_tier: string | null
  subscription_end_date: string | null
}

export default function ManageListingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [claimedFilter, setClaimedFilter] = useState<'all' | 'true' | 'false'>('all')
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'true' | 'false'>('all')
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'true' | 'false'>('all')
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'expiring' | 'expired'>('all')
  const [qualityFilter, setQualityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [provinceFilter, setProvinceFilter] = useState<string>('all')
  const [ratingFilter, setRatingFilter] = useState<'all' | 'with_reviews' | 'no_reviews' | 'high_rated' | 'low_rated'>('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedAdvisors, setSelectedAdvisors] = useState<Set<string>>(new Set())
  const [updating, setUpdating] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null)

  // Check for success message and filters from new/edit pages
  useEffect(() => {
    const success = searchParams.get('success')
    const filter = searchParams.get('filter')

    if (success === 'created') {
      setSuccessMessage('Advisor created successfully!')
      setTimeout(() => setSuccessMessage(null), 5000)
    } else if (success === 'updated') {
      setSuccessMessage('Advisor updated successfully!')
      setTimeout(() => setSuccessMessage(null), 5000)
    }

    if (filter === 'expiring' || filter === 'expired') {
      setSubscriptionFilter(filter)
    }
  }, [searchParams])

  useEffect(() => {
    fetchAdvisors()
  }, [searchTerm, claimedFilter, publishedFilter, featuredFilter, subscriptionFilter, qualityFilter, provinceFilter, ratingFilter, page])

  const fetchAdvisors = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        search: searchTerm,
        claimed: claimedFilter,
        published: publishedFilter,
        featured: featuredFilter,
        subscription: subscriptionFilter,
        page: page.toString(),
        limit: '50'
      })

      const response = await fetch(`/api/admin/listings?${params}`)

      if (response.status === 401) {
        router.push('/login?returnTo=/admin/listings')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch advisors')
      }

      const data = await response.json()

      // Apply client-side filters
      let filteredAdvisors = data.advisors

      // Quality filter
      if (qualityFilter !== 'all') {
        filteredAdvisors = filteredAdvisors.filter((advisor: Advisor) => {
          if (qualityFilter === 'high') return advisor.data_quality_score >= 80
          if (qualityFilter === 'medium') return advisor.data_quality_score >= 60 && advisor.data_quality_score < 80
          if (qualityFilter === 'low') return advisor.data_quality_score < 60
          return true
        })
      }

      // Province filter
      if (provinceFilter !== 'all') {
        filteredAdvisors = filteredAdvisors.filter((advisor: Advisor) =>
          advisor.state === provinceFilter
        )
      }

      // Rating filter
      if (ratingFilter !== 'all') {
        filteredAdvisors = filteredAdvisors.filter((advisor: Advisor) => {
          if (ratingFilter === 'with_reviews') return advisor.review_count > 0
          if (ratingFilter === 'no_reviews') return advisor.review_count === 0
          if (ratingFilter === 'high_rated') return advisor.review_count > 0 && advisor.average_rating >= 4.0
          if (ratingFilter === 'low_rated') return advisor.review_count > 0 && advisor.average_rating < 4.0
          return true
        })
      }

      setAdvisors(filteredAdvisors)
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Error fetching advisors:', err)
      setError('Failed to load advisors. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelection = (advisorId: string) => {
    const newSelected = new Set(selectedAdvisors)
    if (newSelected.has(advisorId)) {
      newSelected.delete(advisorId)
    } else {
      newSelected.add(advisorId)
    }
    setSelectedAdvisors(newSelected)
  }

  const toggleAll = () => {
    if (selectedAdvisors.size === advisors.length) {
      setSelectedAdvisors(new Set())
    } else {
      setSelectedAdvisors(new Set(advisors.map(a => a.id)))
    }
  }

  const bulkUpdate = async (field: string, value: boolean) => {
    if (selectedAdvisors.size === 0) {
      alert('Please select at least one advisor')
      return
    }

    if (!confirm(`Are you sure you want to ${value ? 'enable' : 'disable'} ${field} for ${selectedAdvisors.size} advisor(s)?`)) {
      return
    }

    setUpdating(true)

    try {
      await Promise.all(
        Array.from(selectedAdvisors).map(advisorId =>
          fetch(`/api/admin/listings/${advisorId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value }),
          })
        )
      )

      // Refresh the list
      await fetchAdvisors()
      setSelectedAdvisors(new Set())
    } catch (err) {
      console.error('Error bulk updating:', err)
      alert('Failed to update advisors')
    } finally {
      setUpdating(false)
    }
  }

  const deleteAdvisor = async (advisorId: string, advisorName: string) => {
    if (!confirm(`Are you sure you want to delete "${advisorName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/listings/${advisorId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete advisor')
      }

      // Refresh the list
      await fetchAdvisors()
    } catch (err) {
      console.error('Error deleting advisor:', err)
      alert('Failed to delete advisor')
    }
  }

  const toggleStatus = async (advisorId: string, field: 'is_featured' | 'is_verified', currentValue: boolean) => {
    setTogglingStatus(`${advisorId}-${field}`)

    try {
      const response = await fetch(`/api/admin/listings/${advisorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !currentValue }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update ${field}`)
      }

      // Update the local state
      setAdvisors(advisors.map(a =>
        a.id === advisorId ? { ...a, [field]: !currentValue } : a
      ))
    } catch (err) {
      console.error(`Error updating ${field}:`, err)
      alert(`Failed to update ${field}`)
    } finally {
      setTogglingStatus(null)
    }
  }

  if (loading && advisors.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading advisors...</span>
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
              <h1 className="text-3xl font-bold">Manage Listings</h1>
              <p className="text-gray-600 mt-1">View and manage all advisor listings</p>
            </div>
            <Link href="/admin/listings/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Advisor
              </Button>
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {successMessage}
          </div>
        )}

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search by name, city, or province..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Claimed Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Claimed
                  </label>
                  <select
                    value={claimedFilter}
                    onChange={(e) => setClaimedFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="true">Claimed</option>
                    <option value="false">Unclaimed</option>
                  </select>
                </div>

                {/* Published Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Published
                  </label>
                  <select
                    value={publishedFilter}
                    onChange={(e) => setPublishedFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="true">Published</option>
                    <option value="false">Unpublished</option>
                  </select>
                </div>

                {/* Featured Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Featured
                  </label>
                  <select
                    value={featuredFilter}
                    onChange={(e) => setFeaturedFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="true">Featured</option>
                    <option value="false">Not Featured</option>
                  </select>
                </div>

                {/* Subscription Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subscription
                  </label>
                  <select
                    value={subscriptionFilter}
                    onChange={(e) => setSubscriptionFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="expiring">Expiring Soon</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="text-sm"
                >
                  {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                </Button>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                  {/* Quality Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Quality
                    </label>
                    <select
                      value={qualityFilter}
                      onChange={(e) => setQualityFilter(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Quality Levels</option>
                      <option value="high">High Quality (80%+)</option>
                      <option value="medium">Medium Quality (60-79%)</option>
                      <option value="low">Low Quality (&lt;60%)</option>
                    </select>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rating
                    </label>
                    <select
                      value={ratingFilter}
                      onChange={(e) => setRatingFilter(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Ratings</option>
                      <option value="with_reviews">With Reviews</option>
                      <option value="no_reviews">No Reviews</option>
                      <option value="high_rated">High Rated (4.0+)</option>
                      <option value="low_rated">Low Rated (&lt;4.0)</option>
                    </select>
                  </div>

                  {/* Province Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Province
                    </label>
                    <select
                      value={provinceFilter}
                      onChange={(e) => setProvinceFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Provinces</option>
                      <option value="ON">Ontario</option>
                      <option value="QC">Quebec</option>
                      <option value="BC">British Columbia</option>
                      <option value="AB">Alberta</option>
                      <option value="MB">Manitoba</option>
                      <option value="SK">Saskatchewan</option>
                      <option value="NS">Nova Scotia</option>
                      <option value="NB">New Brunswick</option>
                      <option value="PE">Prince Edward Island</option>
                      <option value="NL">Newfoundland and Labrador</option>
                    </select>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQualityFilter('all')
                        setRatingFilter('all')
                        setProvinceFilter('all')
                        setClaimedFilter('all')
                        setPublishedFilter('all')
                        setFeaturedFilter('all')
                        setSubscriptionFilter('all')
                        setSearchTerm('')
                      }}
                      className="w-full"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedAdvisors.size > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-900">
                    {selectedAdvisors.size} advisor(s) selected
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedAdvisors(new Set())}
                  >
                    Clear Selection
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkUpdate('is_published', true)}
                    disabled={updating}
                    className="border-green-300 hover:bg-green-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkUpdate('is_published', false)}
                    disabled={updating}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <XCircle className="w-4 h-4 mr-2 text-gray-600" />
                    Unpublish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkUpdate('is_featured', true)}
                    disabled={updating}
                    className="border-purple-300 hover:bg-purple-50"
                  >
                    <Star className="w-4 h-4 mr-2 text-purple-600 fill-current" />
                    Make Featured
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkUpdate('is_featured', false)}
                    disabled={updating}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <Star className="w-4 h-4 mr-2 text-gray-600" />
                    Remove Featured
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkUpdate('is_verified', true)}
                    disabled={updating}
                    className="border-blue-300 hover:bg-blue-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkUpdate('is_verified', false)}
                    disabled={updating}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <XCircle className="w-4 h-4 mr-2 text-gray-600" />
                    Remove Verification
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Advisors ({total})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2 w-8 sticky left-0 bg-gray-50 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                      <input
                        type="checkbox"
                        checked={selectedAdvisors.size === advisors.length && advisors.length > 0}
                        onChange={toggleAll}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="text-left p-2 font-medium sticky left-8 bg-gray-50 z-10 min-w-[150px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">Name</th>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-center p-2 font-medium hidden xl:table-cell">Feat.</th>
                    <th className="text-center p-2 font-medium hidden xl:table-cell">Ver.</th>
                    <th className="text-left p-2 font-medium hidden 2xl:table-cell">Subscription</th>
                    <th className="text-left p-2 font-medium hidden 2xl:table-cell">Rating</th>
                    <th className="text-left p-2 font-medium hidden 2xl:table-cell">Quality</th>
                    <th className="text-right p-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {advisors.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-500">
                        No advisors found
                      </td>
                    </tr>
                  ) : (
                    advisors.map((advisor) => (
                      <tr key={advisor.id} className="border-b hover:bg-gray-50/50 group">
                        <td className="p-2 sticky left-0 bg-white z-10 group-hover:bg-gray-50/50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                          <input
                            type="checkbox"
                            checked={selectedAdvisors.has(advisor.id)}
                            onChange={() => toggleSelection(advisor.id)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="p-2 sticky left-8 bg-white z-10 group-hover:bg-gray-50/50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                          <div className="font-medium text-sm">{advisor.name}</div>
                          <div className="text-xs text-gray-500">{advisor.city}, {advisor.state}</div>
                        </td>
                        <td className="p-2">
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded inline-block whitespace-nowrap ${advisor.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {advisor.is_published ? 'Pub' : 'Unpub'}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded inline-block whitespace-nowrap ${advisor.is_claimed ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                              {advisor.is_claimed ? 'Claim' : 'Unclaim'}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 hidden xl:table-cell">
                          <div className="flex justify-center">
                            <button
                              onClick={() => toggleStatus(advisor.id, 'is_featured', advisor.is_featured)}
                              disabled={togglingStatus === `${advisor.id}-is_featured`}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                                advisor.is_featured ? 'bg-purple-600' : 'bg-gray-200'
                              } ${togglingStatus === `${advisor.id}-is_featured` ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={advisor.is_featured ? 'Remove featured status' : 'Make featured'}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                  advisor.is_featured ? 'translate-x-5' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                        <td className="p-2 hidden xl:table-cell">
                          <div className="flex justify-center">
                            <button
                              onClick={() => toggleStatus(advisor.id, 'is_verified', advisor.is_verified)}
                              disabled={togglingStatus === `${advisor.id}-is_verified`}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                advisor.is_verified ? 'bg-blue-600' : 'bg-gray-200'
                              } ${togglingStatus === `${advisor.id}-is_verified` ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={advisor.is_verified ? 'Remove verified status' : 'Mark as verified'}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                  advisor.is_verified ? 'translate-x-5' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                        <td className="p-2 hidden 2xl:table-cell">
                          {advisor.subscription_end_date ? (
                            <div className="whitespace-nowrap">
                              <div className="text-[10px] text-gray-600 mb-1">
                                {advisor.subscription_tier?.toUpperCase() || 'N/A'}
                              </div>
                              {isPast(new Date(advisor.subscription_end_date)) ? (
                                <Badge className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0.5">
                                  Expired
                                </Badge>
                              ) : differenceInDays(new Date(advisor.subscription_end_date), new Date()) <= 30 ? (
                                <Badge className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5">
                                  Expiring
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5">
                                  Active
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                        </td>
                        <td className="p-2 hidden 2xl:table-cell">
                          {advisor.review_count > 0 ? (
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-medium">{advisor.average_rating.toFixed(1)}</span>
                              <span className="text-[10px] text-gray-500">({advisor.review_count})</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                        </td>
                        <td className="p-2 hidden 2xl:table-cell">
                          <div className={`text-xs font-medium ${
                            advisor.data_quality_score >= 80 ? 'text-green-600' :
                            advisor.data_quality_score >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {advisor.data_quality_score}%
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex justify-end gap-1">
                            <Link href={`/listings/${advisor.slug}`} target="_blank">
                              <Button variant="outline" size="sm" title="View listing" className="h-7 w-7 p-0">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                            <Link href={`/admin/listings/${advisor.id}/edit`}>
                              <Button variant="outline" size="sm" title="Edit advisor" className="h-7 w-7 p-0">
                                <Edit className="w-3.5 h-3.5 text-blue-600" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteAdvisor(advisor.id, advisor.name)}
                              title="Delete advisor"
                              className="h-7 w-7 p-0"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 50 && (
              <div className="p-6 border-t flex items-center justify-between">
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
