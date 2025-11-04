'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import LogoUpload from '@/components/dashboard/LogoUpload'
import {
  Loader2,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface AdvisorProfile {
  id: string
  name: string
  logo_url: string | null
  title: string | null
  bio: string | null
  email: string
  phone: string | null
  website_url: string | null
  street_address: string | null
  city: string
  province: string
  postal_code: string | null
  services_offered: string[] | null
  credentials: string[] | null
  experience_years: number | null
  specializations: string[] | null
  age_groups_served: string[] | null
  availability_status: string
  consultation_fee: number | null
}

const PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Nova Scotia', 'Ontario',
  'Prince Edward Island', 'Quebec', 'Saskatchewan'
]

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'limited', label: 'Limited Availability' },
  { value: 'not_accepting', label: 'Not Accepting New Clients' }
]

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [profile, setProfile] = useState<AdvisorProfile | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/advisor/profile')

      if (response.status === 401) {
        router.push('/login?returnTo=/dashboard/edit')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }

      const data = await response.json()
      setProfile(data.advisor)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/advisor/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      const data = await response.json()
      setProfile(data.advisor)
      setSuccess(true)

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' })

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof AdvisorProfile, value: any) => {
    if (!profile) return
    setProfile({ ...profile, [field]: value })
  }

  const updateArrayField = (field: keyof AdvisorProfile, value: string) => {
    if (!profile) return
    const array = value.split(',').map(item => item.trim()).filter(Boolean)
    setProfile({ ...profile, [field]: array.length > 0 ? array : null })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading profile...</span>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Edit Your Profile</h1>
          <p className="text-gray-600 mt-1">Update your listing information</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Profile updated successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Logo Upload */}
          <div className="mb-6">
            <LogoUpload
              currentLogoUrl={profile.logo_url}
              onUploadSuccess={(url) => {
                setProfile({ ...profile, logo_url: url })
                setSuccess(true)
                setTimeout(() => setSuccess(false), 5000)
              }}
              onDeleteSuccess={() => {
                setProfile({ ...profile, logo_url: null })
                setSuccess(true)
                setTimeout(() => setSuccess(false), 5000)
              }}
            />
          </div>

          {/* Basic Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-600">*</span>
                </label>
                <Input
                  type="text"
                  value={profile.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Title
                </label>
                <Input
                  type="text"
                  value={profile.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., Certified Hockey Advisor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <Textarea
                  value={profile.bio || ''}
                  onChange={(e) => updateField('bio', e.target.value)}
                  rows={6}
                  placeholder="Tell families about your background and approach..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <Input
                  type="number"
                  min="0"
                  value={profile.experience_years || ''}
                  onChange={(e) => updateField('experience_years', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-600">*</span>
                </label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <Input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <Input
                  type="url"
                  value={profile.website_url || ''}
                  onChange={(e) => updateField('website_url', e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <Input
                  type="text"
                  value={profile.street_address || ''}
                  onChange={(e) => updateField('street_address', e.target.value)}
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-600">*</span>
                  </label>
                  <Input
                    type="text"
                    value={profile.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Province <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={profile.province}
                    onChange={(e) => updateField('province', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <Input
                    type="text"
                    value={profile.postal_code || ''}
                    onChange={(e) => updateField('postal_code', e.target.value)}
                    placeholder="A1A 1A1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services & Expertise */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Services & Expertise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services Offered
                </label>
                <Input
                  type="text"
                  value={profile.services_offered?.join(', ') || ''}
                  onChange={(e) => updateArrayField('services_offered', e.target.value)}
                  placeholder="Pathway Planning, Team Selection, College Recruiting (comma separated)"
                />
                <p className="text-sm text-gray-500 mt-1">Separate multiple services with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credentials
                </label>
                <Input
                  type="text"
                  value={profile.credentials?.join(', ') || ''}
                  onChange={(e) => updateArrayField('credentials', e.target.value)}
                  placeholder="NCCP Level 3, Hockey Canada Certified (comma separated)"
                />
                <p className="text-sm text-gray-500 mt-1">Separate multiple credentials with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specializations
                </label>
                <Input
                  type="text"
                  value={profile.specializations?.join(', ') || ''}
                  onChange={(e) => updateArrayField('specializations', e.target.value)}
                  placeholder="AAA Hockey, College Recruitment, Skills Development (comma separated)"
                />
                <p className="text-sm text-gray-500 mt-1">Separate multiple specializations with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Groups Served
                </label>
                <Input
                  type="text"
                  value={profile.age_groups_served?.join(', ') || ''}
                  onChange={(e) => updateArrayField('age_groups_served', e.target.value)}
                  placeholder="U13, U15, U18, Junior (comma separated)"
                />
                <p className="text-sm text-gray-500 mt-1">Separate multiple age groups with commas</p>
              </div>
            </CardContent>
          </Card>

          {/* Availability & Pricing */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Availability & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability Status
                </label>
                <select
                  value={profile.availability_status}
                  onChange={(e) => updateField('availability_status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {AVAILABILITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consultation Fee (CAD)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={profile.consultation_fee || ''}
                  onChange={(e) => updateField('consultation_fee', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="150.00"
                />
                <p className="text-sm text-gray-500 mt-1">Leave blank if you offer free consultations</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Link href="/dashboard">
              <Button type="button" variant="outline" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
