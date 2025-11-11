'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Loader2, Save, Eye } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdvisorFormData } from '@/types/advisor'
import {
  BasicInformationSection,
  ContactInformationSection,
  SocialMediaSection,
  LocationSection,
  BusinessDetailsSection,
  AvailabilityPricingSection,
  ServicesExpertiseSection,
  TeamMembersSection,
  AdminControlsSection
} from '@/components/profile'

export default function EditAdvisorPage() {
  const router = useRouter()
  const params = useParams()
  const advisorId = params.id as string

  const [formData, setFormData] = useState<Partial<AdvisorFormData>>({})
  const [originalData, setOriginalData] = useState<Partial<AdvisorFormData>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState('basic')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Fetch advisor data
  useEffect(() => {
    if (!advisorId) return

    const fetchAdvisor = async () => {
      try {
        const response = await fetch(`/api/admin/listings/${advisorId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch advisor')
        }

        const data = await response.json()
        setFormData(data.advisor)
        setOriginalData(data.advisor)
      } catch (err) {
        console.error('Error fetching advisor:', err)
        setError(err instanceof Error ? err.message : 'Failed to load advisor')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAdvisor()
  }, [advisorId])

  // Track unsaved changes
  useEffect(() => {
    if (Object.keys(originalData).length === 0) return
    const changed = JSON.stringify(formData) !== JSON.stringify(originalData)
    setHasUnsavedChanges(changed)
  }, [formData, originalData])

  // Handle field changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {}

    // Only require name - all other fields optional for admin
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Company/Advisor name is required (minimum 2 characters)'
    }

    // Optional validations - only check format if field has content
    if (formData.description && formData.description.trim().length > 0 && formData.description.trim().length < 50) {
      newErrors.description = 'Description must be at least 50 characters (or leave empty)'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    }
  }

  // Handle save
  const handleSave = async () => {
    setSuccessMessage(null)
    setError(null)

    const validation = validateForm()
    if (!validation.isValid) {
      setError('Please fix the errors before saving')
      // Find the first tab with an error and switch to it
      const errorFields = Object.keys(validation.errors)
      if (errorFields.length > 0) {
        // Map fields to tabs
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
          services_offered: 'expertise',
          specializations: 'expertise',
          age_groups_served: 'expertise',
          credentials: 'expertise'
        }

        const firstErrorField = errorFields[0]
        const targetTab = fieldToTab[firstErrorField] || 'basic'
        setActiveTab(targetTab)
      }
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/admin/listings/${advisorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update advisor')
      }

      const updatedData = await response.json()
      setFormData(updatedData.advisor)
      setOriginalData(updatedData.advisor)
      setSuccessMessage('Advisor profile updated successfully!')
      setHasUnsavedChanges(false)

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      console.error('Error updating advisor:', err)
      setError(err instanceof Error ? err.message : 'Failed to update advisor')
    } finally {
      setIsSaving(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading advisor details...</p>
        </div>
      </div>
    )
  }

  // Error state (failed to load advisor)
  if (error && Object.keys(formData).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/admin/listings">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Listings
            </Button>
          </Link>
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-lg text-center">
            <p className="font-medium text-lg mb-2">Error loading advisor</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/listings">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Listings
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Advisor Profile</h1>
              <p className="text-gray-600 mt-1">
                {formData.name || 'Untitled Advisor'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {formData.slug && (
                <Link href={`/listings/${formData.slug}`} target="_blank">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Public Profile
                  </Button>
                </Link>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                size="lg"
              >
                {isSaving ? (
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

        {/* Status Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <p className="font-medium">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
            {Object.keys(errors).length > 0 && (
              <ul className="mt-2 text-sm list-disc list-inside">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>
                    <strong>{field}:</strong> {message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {hasUnsavedChanges && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg">
            <p className="text-sm">You have unsaved changes. Click "Save Changes" to update the profile.</p>
          </div>
        )}

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="expertise">Expertise</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          {/* Tab 1: Basic Information */}
          <TabsContent value="basic" className="space-y-6">
            <BasicInformationSection
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
              mode="admin"
            />
          </TabsContent>

          {/* Tab 2: Contact Information */}
          <TabsContent value="contact" className="space-y-6">
            <ContactInformationSection
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
              mode="admin"
            />
          </TabsContent>

          {/* Tab 3: Location */}
          <TabsContent value="location" className="space-y-6">
            <LocationSection
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
              mode="admin"
            />
          </TabsContent>

          {/* Tab 4: Business Details */}
          <TabsContent value="business" className="space-y-6">
            <BusinessDetailsSection
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
              mode="admin"
            />
          </TabsContent>

          {/* Tab 5: Availability & Pricing */}
          <TabsContent value="availability" className="space-y-6">
            <AvailabilityPricingSection
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
              mode="admin"
            />
          </TabsContent>

          {/* Tab 6: Services & Expertise */}
          <TabsContent value="expertise" className="space-y-6">
            <ServicesExpertiseSection
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
              mode="admin"
            />
          </TabsContent>

          {/* Tab 7: Team Members */}
          <TabsContent value="team" className="space-y-6">
            <TeamMembersSection
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
              mode="admin"
            />
          </TabsContent>

          {/* Tab 8: Social Media */}
          <TabsContent value="social" className="space-y-6">
            <SocialMediaSection
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
              mode="admin"
            />
          </TabsContent>

          {/* Tab 9: Admin Controls */}
          <TabsContent value="admin" className="space-y-6">
            <AdminControlsSection
              data={formData}
              onChange={handleFieldChange}
              errors={errors}
              mode="admin"
            />
          </TabsContent>
        </Tabs>

        {/* Bottom Save Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            size="lg"
          >
            {isSaving ? (
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
  )
}
