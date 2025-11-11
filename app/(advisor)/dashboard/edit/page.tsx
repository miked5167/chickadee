'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import LogoUpload from '@/components/dashboard/LogoUpload'
import {
  BasicInformationSection,
  ContactInformationSection,
  SocialMediaSection,
  LocationSection,
  BusinessDetailsSection,
  AvailabilityPricingSection,
  ServicesExpertiseSection,
  TeamMembersSection
} from '@/components/profile'
import type { AdvisorFormData } from '@/types/advisor'
import {
  Loader2,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  ExternalLink
} from 'lucide-react'

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<Partial<AdvisorFormData>>({})
  const [originalData, setOriginalData] = useState<Partial<AdvisorFormData>>({})
  const [slug, setSlug] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [autoSaving, setAutoSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<string>('basic')

  useEffect(() => {
    fetchProfile()
  }, [])

  // Track unsaved changes
  useEffect(() => {
    if (Object.keys(originalData).length === 0) return
    const changed = JSON.stringify(formData) !== JSON.stringify(originalData)
    setHasUnsavedChanges(changed)
  }, [formData, originalData])

  // Auto-save effect (every 30 seconds if unsaved changes)
  useEffect(() => {
    if (!hasUnsavedChanges || autoSaving || saving) return

    const timer = setTimeout(async () => {
      await handleAutoSave()
    }, 30000) // 30 seconds

    return () => clearTimeout(timer)
  }, [hasUnsavedChanges, autoSaving, saving])

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
      setFormData(data.advisor)
      setOriginalData(data.advisor)
      setSlug(data.advisor.slug)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAutoSave = async () => {
    if (!formData || saving) return

    setAutoSaving(true)

    try {
      const response = await fetch('/api/advisor/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to auto-save')
      }

      const data = await response.json()
      setFormData(data.advisor)
      setOriginalData(data.advisor)
      setHasUnsavedChanges(false)
      setLastSaved(new Date())
    } catch (err) {
      console.error('Auto-save error:', err)
      // Silent failure for auto-save
    } finally {
      setAutoSaving(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Only validate business name as truly required
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Business name is required (minimum 2 characters)'
    }

    // Optional validations - only check format/length if field has content
    if (formData.description) {
      const descLength = formData.description.length
      if (descLength > 0 && descLength < 50) {
        newErrors.description = 'Description should be at least 50 characters (or leave empty)'
      }
      if (descLength > 2000) {
        newErrors.description = 'Description must not exceed 2000 characters'
      }
    }

    setErrors(newErrors)

    // Navigate to first tab with errors
    if (Object.keys(newErrors).length > 0) {
      const errorFields = Object.keys(newErrors)
      const fieldToTab: Record<string, string> = {
        name: 'basic',
        description: 'basic',
        years_in_business: 'basic',
        email: 'contact',
        phone: 'contact',
        website_url: 'contact',
        city: 'location',
        state: 'location',
        service_area: 'location',
        consultation_format: 'business',
        engagement_types: 'business',
        payment_methods: 'business',
        response_time: 'business',
        accepting_clients: 'availability',
        price_range: 'availability',
        services_offered: 'expertise',
        specializations: 'expertise',
        age_groups_served: 'expertise',
        credentials: 'expertise',
        team_members: 'team',
        instagram_url: 'social',
        facebook_url: 'social',
        twitter_url: 'social',
        linkedin_url: 'social',
        tiktok_url: 'social',
        youtube_url: 'social'
      }

      const targetTab = fieldToTab[errorFields[0]] || 'basic'
      setActiveTab(targetTab)
    }

    return Object.keys(newErrors).length === 0
  }

  const saveProfile = async (): Promise<boolean> => {
    if (!formData) return false

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/advisor/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      const data = await response.json()
      setFormData(data.advisor)
      setOriginalData(data.advisor)
      setSuccess(true)
      setHasUnsavedChanges(false)
      setLastSaved(new Date())

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)

      return true
    } catch (err) {
      console.error('Error updating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      setError('Please fix the validation errors below')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => setError(null), 5000)
      return
    }

    await saveProfile()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error for this field if it exists
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  const formatLastSaved = () => {
    if (!lastSaved) return null
    const now = new Date()
    const diffMs = now.getTime() - lastSaved.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Last saved just now'
    if (diffMins === 1) return 'Last saved 1 minute ago'
    if (diffMins < 60) return `Last saved ${diffMins} minutes ago`

    return `Last saved at ${lastSaved.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
  }

  const calculateProfileCompletion = () => {
    if (!formData) return { percentage: 0, missing: [] }

    const requiredFields = [
      { field: 'name', label: 'Business name' },
      { field: 'email', label: 'Email' },
      { field: 'city', label: 'City' },
      { field: 'state', label: 'Province/State' },
      { field: 'years_in_business', label: 'Years of experience' },
      { field: 'service_area', label: 'Service area' },
      { field: 'accepting_clients', label: 'Client acceptance status' },
    ]

    const optionalHighValueFields = [
      { field: 'logo_url', label: 'Logo' },
      { field: 'description', label: 'Description' },
      { field: 'phone', label: 'Phone number' },
      { field: 'website_url', label: 'Website URL' },
      { field: 'instagram_url', label: 'Social media links' },
      { field: 'team_members', label: 'Team members' },
      { field: 'typical_engagement_range', label: 'Typical engagement range' },
      { field: 'pricing_structure', label: 'Pricing structure' },
      { field: 'pricing_details', label: 'Pricing details' },
    ]

    const allFields = [...requiredFields, ...optionalHighValueFields]
    let filledCount = 0
    const missing: string[] = []

    requiredFields.forEach(({ field, label }) => {
      const value = formData[field as keyof typeof formData]
      if (value && (typeof value !== 'string' || value.trim() !== '')) {
        filledCount++
      } else {
        missing.push(label)
      }
    })

    optionalHighValueFields.forEach(({ field, label }) => {
      const value = formData[field as keyof typeof formData]
      if (field === 'team_members' || field === 'pricing_structure') {
        // Array fields - check if array has values
        if (value && Array.isArray(value) && value.length > 0) {
          filledCount++
        } else {
          missing.push(label)
        }
      } else if (field === 'instagram_url') {
        // Check if ANY social media link is filled
        if (formData.instagram_url || formData.facebook_url || formData.twitter_url ||
            formData.linkedin_url || formData.tiktok_url || formData.youtube_url) {
          filledCount++
        } else {
          missing.push(label)
        }
      } else if (value && (typeof value !== 'string' || value.trim() !== '')) {
        filledCount++
      } else if (field !== 'instagram_url') { // Don't double-count social media
        missing.push(label)
      }
    })

    const percentage = Math.round((filledCount / allFields.length) * 100)

    return {
      percentage,
      missing: missing.slice(0, 5) // Only show first 5 missing items
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading profile...</span>
      </div>
    )
  }

  if (!formData || !formData.id) {
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

  const completion = calculateProfileCompletion()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between py-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              {/* Auto-save status */}
              <div className="text-sm text-gray-500">
                {autoSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving...
                  </span>
                ) : lastSaved ? (
                  <span>{formatLastSaved()}</span>
                ) : null}
              </div>

              {slug && (
                <Link href={`/listings/${slug}`} target="_blank">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Profile
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </Link>
              )}

              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={() => {
                  const form = document.querySelector('form') as HTMLFormElement
                  form?.requestSubmit()
                }}
              >
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
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edit Your Profile</h1>
          <p className="text-gray-600 mt-1">Update your listing information</p>
        </div>

        {/* Profile Completion Indicator */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Profile Completion:</span>
            <span className="text-sm font-bold text-blue-600">{completion.percentage}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${completion.percentage}%` }}
            />
          </div>
          {completion.missing.length > 0 && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Missing: </span>
              {completion.missing.map((item, idx) => (
                <span key={idx}>
                  <span className="text-red-600">• </span>
                  {item}
                  {idx < completion.missing.length - 1 ? ' ' : ''}
                </span>
              ))}
            </div>
          )}
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

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && !autoSaving && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-amber-800">You have unsaved changes</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Logo Upload */}
          <div className="mb-6">
            <LogoUpload
              currentLogoUrl={formData.logo_url || null}
              onUploadSuccess={(url) => {
                setFormData({ ...formData, logo_url: url })
                setSuccess(true)
                setTimeout(() => setSuccess(false), 5000)
              }}
              onDeleteSuccess={() => {
                setFormData({ ...formData, logo_url: null })
                setSuccess(true)
                setTimeout(() => setSuccess(false), 5000)
              }}
            />
          </div>

          {/* Tabbed Sections */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="expertise">Expertise</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <BasicInformationSection
                data={formData}
                onChange={handleFieldChange}
                errors={errors}
                mode="advisor"
              />
            </TabsContent>

            <TabsContent value="contact">
              <ContactInformationSection
                data={formData}
                onChange={handleFieldChange}
                errors={errors}
                mode="advisor"
              />
            </TabsContent>

            <TabsContent value="location">
              <LocationSection
                data={formData}
                onChange={handleFieldChange}
                errors={errors}
                mode="advisor"
              />
            </TabsContent>

            <TabsContent value="business">
              <BusinessDetailsSection
                data={formData}
                onChange={handleFieldChange}
                errors={errors}
                mode="advisor"
              />
            </TabsContent>

            <TabsContent value="availability">
              <AvailabilityPricingSection
                data={formData}
                onChange={handleFieldChange}
                errors={errors}
                mode="advisor"
              />
            </TabsContent>

            <TabsContent value="expertise">
              <ServicesExpertiseSection
                data={formData}
                onChange={handleFieldChange}
                errors={errors}
                mode="advisor"
              />
            </TabsContent>

            <TabsContent value="team">
              <TeamMembersSection
                data={formData}
                onChange={handleFieldChange}
                errors={errors}
                mode="advisor"
              />
            </TabsContent>

            <TabsContent value="social">
              <SocialMediaSection
                data={formData}
                onChange={handleFieldChange}
                errors={errors}
                mode="advisor"
              />
            </TabsContent>
          </Tabs>

          {/* Bottom Save Button */}
          <div className="mt-8 flex justify-end">
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save All Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
