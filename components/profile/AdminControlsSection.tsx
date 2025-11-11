'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { SUBSCRIPTION_TIERS, BILLING_STATUS_OPTIONS } from '@/lib/constants/profile-fields'
import { ProfileSectionProps } from '@/types/advisor'
import { Shield, Star, Eye, CreditCard, Calendar, FileText, Clock } from 'lucide-react'

export function AdminControlsSection({ data, onChange, errors }: ProfileSectionProps) {
  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'Invalid date'
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Controls Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Status Controls</CardTitle>
          <CardDescription>
            Manage the visibility and status of this advisor profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Published Status */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3 flex-1">
              <Eye className="w-5 h-5 text-blue-600" />
              <div>
                <Label htmlFor="is_published" className="text-base font-semibold">
                  Published
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  When enabled, this profile is visible on the public directory
                </p>
              </div>
            </div>
            <Switch
              id="is_published"
              checked={data.is_published || false}
              onCheckedChange={(checked) => onChange('is_published', checked)}
            />
          </div>

          {/* Featured Status */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3 flex-1">
              <Star className="w-5 h-5 text-amber-600" />
              <div>
                <Label htmlFor="is_featured" className="text-base font-semibold">
                  Featured
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Featured profiles appear at the top of search results
                </p>
              </div>
            </div>
            <Switch
              id="is_featured"
              checked={data.is_featured || false}
              onCheckedChange={(checked) => onChange('is_featured', checked)}
            />
          </div>

          {/* Verified Status */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3 flex-1">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <Label htmlFor="is_verified" className="text-base font-semibold">
                  Verified
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Shows a verification badge on the profile
                </p>
              </div>
            </div>
            <Switch
              id="is_verified"
              checked={data.is_verified || false}
              onCheckedChange={(checked) => onChange('is_verified', checked)}
            />
          </div>

          {/* Current Status Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Current Status:</p>
            <div className="flex flex-wrap gap-2">
              {data.is_published ? (
                <Badge variant="default" className="bg-green-600 text-white">Published</Badge>
              ) : (
                <Badge variant="default" className="bg-red-600 text-white">Unpublished</Badge>
              )}
              {data.is_featured && <Badge variant="default" className="bg-amber-600 text-white">Featured</Badge>}
              {data.is_verified && <Badge variant="default" className="bg-blue-600 text-white">Verified</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription & Billing Card */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription & Billing</CardTitle>
          <CardDescription>
            Manage subscription tier and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subscription Tier */}
          <div className="space-y-2">
            <Label htmlFor="subscription_tier" className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Subscription Tier
            </Label>
            <Select
              value={data.subscription_tier || 'free'}
              onValueChange={(value) => onChange('subscription_tier', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subscription tier" />
              </SelectTrigger>
              <SelectContent>
                {SUBSCRIPTION_TIERS.map((tier) => (
                  <SelectItem key={tier.value} value={tier.value}>
                    {tier.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Controls feature access and profile placement
            </p>
          </div>

          {/* Billing Status */}
          <div className="space-y-2">
            <Label htmlFor="billing_status" className="text-base font-semibold">
              Billing Status
            </Label>
            <Select
              value={data.billing_status || 'active'}
              onValueChange={(value) => onChange('billing_status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select billing status" />
              </SelectTrigger>
              <SelectContent>
                {BILLING_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subscription Dates - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subscription_start_date" className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Subscription Start Date
              </Label>
              <Input
                id="subscription_start_date"
                type="date"
                value={data.subscription_start_date || ''}
                onChange={(e) => onChange('subscription_start_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription_end_date" className="text-base font-semibold">
                Subscription End Date
              </Label>
              <Input
                id="subscription_end_date"
                type="date"
                value={data.subscription_end_date || ''}
                onChange={(e) => onChange('subscription_end_date', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Internal Notes Card */}
      <Card>
        <CardHeader>
          <CardTitle>Internal Notes</CardTitle>
          <CardDescription>
            Admin-only notes. Not visible to the advisor or public.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="internal_notes" className="text-base font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </Label>
            <Textarea
              id="internal_notes"
              value={data.internal_notes || ''}
              onChange={(e) => onChange('internal_notes', e.target.value)}
              placeholder="Add any internal notes about this advisor, their account, communications, etc..."
              rows={6}
              maxLength={2000}
            />
            <p className="text-sm text-gray-500">
              {(data.internal_notes?.length || 0)} / 2000 characters
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-900">
              <strong>Note:</strong> These notes are only visible to administrators and are not shared with the advisor or displayed publicly.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail Card */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            Profile creation and modification history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Created Date */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Created
              </Label>
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <p className="text-sm text-gray-900">
                  {formatDate(data.created_at)}
                </p>
                {data.created_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(data.created_at).toLocaleTimeString('en-US')}
                  </p>
                )}
              </div>
            </div>

            {/* Last Updated */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Last Updated
              </Label>
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <p className="text-sm text-gray-900">
                  {formatDate(data.updated_at)}
                </p>
                {data.updated_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(data.updated_at).toLocaleTimeString('en-US')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Profile ID & Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Profile ID</Label>
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <p className="text-xs font-mono text-gray-700">{data.id || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Slug</Label>
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <p className="text-xs font-mono text-gray-700">{data.slug || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* View Counts (if available) */}
          {(data.profile_views !== undefined || data.contact_clicks !== undefined) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Profile Views</Label>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <p className="text-2xl font-bold text-blue-600">
                    {data.profile_views?.toLocaleString() || 0}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Contact Clicks</Label>
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <p className="text-2xl font-bold text-green-600">
                    {data.contact_clicks?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
