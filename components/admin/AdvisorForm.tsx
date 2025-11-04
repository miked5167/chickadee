'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ImageUpload } from './ImageUpload'
import { Save, X, Loader2, Plus, Trash2 } from 'lucide-react'

export interface TeamMember {
  name: string
  phone: string
  email: string
}

interface AdvisorFormData {
  name: string
  title: string
  bio: string
  email: string
  phone: string
  website_url: string
  logo_url: string
  street_address: string
  city: string
  state: string
  postal_code: string
  country: string
  services_offered: string[]
  credentials: string
  experience_years: number | null
  specializations: string[]
  age_groups_served: string[]
  availability_status: string
  consultation_fee: string
  is_published: boolean
  is_featured: boolean
  is_verified: boolean
  subscription_tier: string
  subscription_start_date: string
  subscription_end_date: string
  team_members: TeamMember[]
}

interface AdvisorFormProps {
  initialData?: Partial<AdvisorFormData>
  advisorId?: string
  mode: 'create' | 'edit'
}

const PROVINCES = [
  // Canadian Provinces
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT',
  // US States
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC'
]

const SERVICE_OPTIONS = [
  'Player Representation', 'Contract Negotiation', 'Career Guidance',
  'Family Advisory', 'Education Planning', 'Financial Planning',
  'Trade Assessment', 'League Transitions', 'Conflict Resolution'
]

const SPECIALIZATION_OPTIONS = [
  'Junior Hockey', 'College Hockey', 'Professional Hockey', 'Youth Development',
  'NCAA Recruitment', 'CHL Representation', 'International Play'
]

const AGE_GROUP_OPTIONS = [
  'Under 10', '10-13', '14-16', '17-20', '20+'
]

const AVAILABILITY_OPTIONS = [
  'Accepting New Clients', 'Waitlist Only', 'Not Accepting'
]

const SUBSCRIPTION_TIERS = [
  'free', 'basic', 'pro', 'elite'
]

export function AdvisorForm({ initialData, advisorId, mode }: AdvisorFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<AdvisorFormData>({
    name: initialData?.name || '',
    title: initialData?.title || '',
    bio: initialData?.bio || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    website_url: initialData?.website_url || '',
    logo_url: initialData?.logo_url || '',
    street_address: initialData?.street_address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    postal_code: initialData?.postal_code || '',
    country: initialData?.country || 'Canada',
    services_offered: initialData?.services_offered || [],
    credentials: initialData?.credentials || '',
    experience_years: initialData?.experience_years || null,
    specializations: initialData?.specializations || [],
    age_groups_served: initialData?.age_groups_served || [],
    availability_status: initialData?.availability_status || 'Accepting New Clients',
    consultation_fee: initialData?.consultation_fee || '',
    is_published: initialData?.is_published || false,
    is_featured: initialData?.is_featured || false,
    is_verified: initialData?.is_verified || false,
    subscription_tier: initialData?.subscription_tier || 'free',
    subscription_start_date: initialData?.subscription_start_date || '',
    subscription_end_date: initialData?.subscription_end_date || '',
    team_members: initialData?.team_members || [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate required fields
    if (!formData.name || !formData.city || !formData.state) {
      setError('Name, city, and state are required')
      setLoading(false)
      return
    }

    try {
      const url = mode === 'create'
        ? '/api/admin/listings'
        : `/api/admin/listings/${advisorId}`

      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save advisor')
      }

      const data = await response.json()

      // Redirect to listings page
      router.push('/admin/listings')
      router.refresh()
    } catch (err) {
      console.error('Submit error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save advisor')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/listings')
  }

  const toggleArrayField = (field: keyof AdvisorFormData, value: string) => {
    const currentArray = (formData[field] as string[]) || []
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]

    setFormData({ ...formData, [field]: newArray })
  }

  const addTeamMember = () => {
    if (formData.team_members.length >= 10) {
      setError('Maximum 10 team members allowed')
      return
    }
    const newMember: TeamMember = { name: '', phone: '', email: '' }
    setFormData({ ...formData, team_members: [...formData.team_members, newMember] })
  }

  const removeTeamMember = (index: number) => {
    const newTeamMembers = formData.team_members.filter((_, i) => i !== index)
    setFormData({ ...formData, team_members: newTeamMembers })
  }

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    const newTeamMembers = [...formData.team_members]
    newTeamMembers[index] = { ...newTeamMembers[index], [field]: value }
    setFormData({ ...formData, team_members: newTeamMembers })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Company/Advisor Name *</Label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="title">Title/Position</Label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Certified Hockey Advisor"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio/Description</Label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about your experience and approach..."
            />
          </div>

          <ImageUpload
            value={formData.logo_url}
            onChange={(url) => setFormData({ ...formData, logo_url: url })}
            folder="advisors/logos"
            label="Company Logo"
            description="Upload a professional logo (recommended: 400x400px, max 2MB)"
          />
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website_url">Website URL</Label>
            <input
              id="website_url"
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="street_address">Street Address</Label>
            <input
              id="street_address"
              type="text"
              value={formData.street_address}
              onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="state">State/Province *</Label>
              <select
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select State/Province</option>
                {PROVINCES.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="postal_code">Postal Code</Label>
              <input
                id="postal_code"
                type="text"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="A1A 1A1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Details */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Services Offered</Label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
              {SERVICE_OPTIONS.map(service => (
                <label key={service} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.services_offered.includes(service)}
                    onChange={() => toggleArrayField('services_offered', service)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{service}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Specializations</Label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
              {SPECIALIZATION_OPTIONS.map(spec => (
                <label key={spec} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.specializations.includes(spec)}
                    onChange={() => toggleArrayField('specializations', spec)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{spec}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Age Groups Served</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {AGE_GROUP_OPTIONS.map(age => (
                <label key={age} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.age_groups_served.includes(age)}
                    onChange={() => toggleArrayField('age_groups_served', age)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{age}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="credentials">Credentials/Certifications</Label>
              <input
                id="credentials"
                type="text"
                value={formData.credentials}
                onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., NHLPA Certified"
              />
            </div>

            <div>
              <Label htmlFor="experience_years">Years of Experience</Label>
              <input
                id="experience_years"
                type="number"
                value={formData.experience_years || ''}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="availability_status">Availability Status</Label>
              <select
                id="availability_status"
                value={formData.availability_status}
                onChange={(e) => setFormData({ ...formData, availability_status: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {AVAILABILITY_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="consultation_fee">Consultation Fee</Label>
              <input
                id="consultation_fee"
                type="text"
                value={formData.consultation_fee}
                onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Free, $500, Contact for pricing"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status & Features */}
      <Card>
        <CardHeader>
          <CardTitle>Status & Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="rounded border-gray-300"
              />
              <div>
                <span className="font-medium">Published</span>
                <p className="text-sm text-gray-600">Make this listing visible on the public site</p>
              </div>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="rounded border-gray-300"
              />
              <div>
                <span className="font-medium">Featured</span>
                <p className="text-sm text-gray-600">Show in featured listings section</p>
              </div>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_verified}
                onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                className="rounded border-gray-300"
              />
              <div>
                <span className="font-medium">Verified</span>
                <p className="text-sm text-gray-600">Mark as verified advisor</p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Team Members ({formData.team_members.length}/10)
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTeamMember}
              disabled={formData.team_members.length >= 10}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Team Member
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.team_members.length === 0 ? (
            <p className="text-sm text-gray-600">
              No team members added. Click "Add Team Member" to add individual advisors to this company.
            </p>
          ) : (
            <div className="space-y-4">
              {formData.team_members.map((member, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Team Member {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTeamMember(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`team_name_${index}`}>Name *</Label>
                      <input
                        id={`team_name_${index}`}
                        type="text"
                        value={member.name}
                        onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Full Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`team_phone_${index}`}>Phone *</Label>
                      <input
                        id={`team_phone_${index}`}
                        type="tel"
                        value={member.phone}
                        onChange={(e) => updateTeamMember(index, 'phone', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+1-555-123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`team_email_${index}`}>Email *</Label>
                      <input
                        id={`team_email_${index}`}
                        type="email"
                        value={member.email}
                        onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Management */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subscription_tier">Subscription Tier</Label>
            <select
              id="subscription_tier"
              value={formData.subscription_tier}
              onChange={(e) => setFormData({ ...formData, subscription_tier: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SUBSCRIPTION_TIERS.map(tier => (
                <option key={tier} value={tier}>
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subscription_start_date">Subscription Start Date</Label>
              <input
                id="subscription_start_date"
                type="date"
                value={formData.subscription_start_date}
                onChange={(e) => setFormData({ ...formData, subscription_start_date: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="subscription_end_date">Subscription End Date</Label>
              <input
                id="subscription_end_date"
                type="date"
                value={formData.subscription_end_date}
                onChange={(e) => setFormData({ ...formData, subscription_end_date: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {formData.subscription_end_date && new Date(formData.subscription_end_date) < new Date() && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
              ⚠️ This subscription has expired
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pb-8 pr-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {mode === 'create' ? 'Create Advisor' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
