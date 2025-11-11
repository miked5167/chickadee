'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import LogoUpload from '@/components/dashboard/LogoUpload'
import {
  Loader2,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Eye,
  X,
  Upload,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown
} from 'lucide-react'

interface AdvisorProfile {
  id: string
  slug: string
  name: string
  logo_url: string | null
  description: string | null
  email: string
  phone: string | null
  website_url: string | null
  address: string | null
  city: string
  state: string
  zip_code: string | null
  country: string | null
  services_offered: string[] | null
  credentials: string[] | null
  years_in_business: number | string | null
  specializations: string[] | null
  age_groups_served: string[] | null
  consultation_format: string | null
  engagement_types: string | null
  payment_methods: string | null
  response_time: string | null
  player_levels: string | null
  languages: string | null
  accepting_clients: string
  service_area: string | null
  price_range: string | null
  instagram_url: string | null
  facebook_url: string | null
  twitter_url: string | null
  linkedin_url: string | null
  tiktok_url: string | null
  youtube_url: string | null
  team_members: TeamMember[] | null
}

interface TeamMember {
  id?: string
  photo_url?: string | null
  name: string
  title: string
  bio: string
  email?: string | null
  phone?: string | null
  display_order?: number
}

const PROVINCES_AND_STATES = [
  { value: '', label: 'Select...', disabled: true },
  { value: '---CANADA---', label: 'CANADA', disabled: true, isHeader: true },
  { value: 'Alberta', label: 'Alberta' },
  { value: 'British Columbia', label: 'British Columbia' },
  { value: 'Manitoba', label: 'Manitoba' },
  { value: 'New Brunswick', label: 'New Brunswick' },
  { value: 'Newfoundland and Labrador', label: 'Newfoundland and Labrador' },
  { value: 'Northwest Territories', label: 'Northwest Territories' },
  { value: 'Nova Scotia', label: 'Nova Scotia' },
  { value: 'Nunavut', label: 'Nunavut' },
  { value: 'Ontario', label: 'Ontario' },
  { value: 'Prince Edward Island', label: 'Prince Edward Island' },
  { value: 'Quebec', label: 'Quebec' },
  { value: 'Saskatchewan', label: 'Saskatchewan' },
  { value: 'Yukon', label: 'Yukon' },
  { value: '---USA---', label: 'UNITED STATES', disabled: true, isHeader: true },
  { value: 'Alabama', label: 'Alabama' },
  { value: 'Alaska', label: 'Alaska' },
  { value: 'Arizona', label: 'Arizona' },
  { value: 'Arkansas', label: 'Arkansas' },
  { value: 'California', label: 'California' },
  { value: 'Colorado', label: 'Colorado' },
  { value: 'Connecticut', label: 'Connecticut' },
  { value: 'Delaware', label: 'Delaware' },
  { value: 'Florida', label: 'Florida' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Hawaii', label: 'Hawaii' },
  { value: 'Idaho', label: 'Idaho' },
  { value: 'Illinois', label: 'Illinois' },
  { value: 'Indiana', label: 'Indiana' },
  { value: 'Iowa', label: 'Iowa' },
  { value: 'Kansas', label: 'Kansas' },
  { value: 'Kentucky', label: 'Kentucky' },
  { value: 'Louisiana', label: 'Louisiana' },
  { value: 'Maine', label: 'Maine' },
  { value: 'Maryland', label: 'Maryland' },
  { value: 'Massachusetts', label: 'Massachusetts' },
  { value: 'Michigan', label: 'Michigan' },
  { value: 'Minnesota', label: 'Minnesota' },
  { value: 'Mississippi', label: 'Mississippi' },
  { value: 'Missouri', label: 'Missouri' },
  { value: 'Montana', label: 'Montana' },
  { value: 'Nebraska', label: 'Nebraska' },
  { value: 'Nevada', label: 'Nevada' },
  { value: 'New Hampshire', label: 'New Hampshire' },
  { value: 'New Jersey', label: 'New Jersey' },
  { value: 'New Mexico', label: 'New Mexico' },
  { value: 'New York', label: 'New York' },
  { value: 'North Carolina', label: 'North Carolina' },
  { value: 'North Dakota', label: 'North Dakota' },
  { value: 'Ohio', label: 'Ohio' },
  { value: 'Oklahoma', label: 'Oklahoma' },
  { value: 'Oregon', label: 'Oregon' },
  { value: 'Pennsylvania', label: 'Pennsylvania' },
  { value: 'Rhode Island', label: 'Rhode Island' },
  { value: 'South Carolina', label: 'South Carolina' },
  { value: 'South Dakota', label: 'South Dakota' },
  { value: 'Tennessee', label: 'Tennessee' },
  { value: 'Texas', label: 'Texas' },
  { value: 'Utah', label: 'Utah' },
  { value: 'Vermont', label: 'Vermont' },
  { value: 'Virginia', label: 'Virginia' },
  { value: 'Washington', label: 'Washington' },
  { value: 'West Virginia', label: 'West Virginia' },
  { value: 'Wisconsin', label: 'Wisconsin' },
  { value: 'Wyoming', label: 'Wyoming' }
]

const YEARS_OF_EXPERIENCE_OPTIONS = [
  { value: '', label: 'Select...', disabled: true },
  { value: 'Less than 1 year', label: 'Less than 1 year' },
  { value: '1-2 years', label: '1-2 years' },
  { value: '3-5 years', label: '3-5 years' },
  { value: '5-10 years', label: '5-10 years' },
  { value: '10-15 years', label: '10-15 years' },
  { value: '15-20 years', label: '15-20 years' },
  { value: '20+ years', label: '20+ years' }
]

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'limited', label: 'Limited Availability' },
  { value: 'not_accepting', label: 'Not Accepting New Clients' }
]

const CONSULTATION_FORMAT_OPTIONS = [
  'In-Person',
  'Virtual',
  'Phone'
]

const ENGAGEMENT_TYPE_OPTIONS = [
  'One-time',
  'Season-long',
  'Retainer',
  'Hourly',
  'Package-based'
]

const PAYMENT_METHOD_OPTIONS = [
  'Credit Card',
  'Debit',
  'E-transfer',
  'Wire Transfer',
  'Check',
  'Cash'
]

const RESPONSE_TIME_OPTIONS = [
  'Within 24 hours',
  '1-2 days',
  '2-3 days',
  '3-5 days'
]

const ACCEPTING_CLIENTS_OPTIONS = [
  { value: 'accepting', label: 'Accepting New Clients' },
  { value: 'waitlist', label: 'Waitlist Only' },
  { value: 'not_accepting', label: 'Not Accepting New Clients' }
]

const SERVICES_OFFERED_OPTIONS = [
  'Player Assessment & Evaluation',
  'Skills Analysis & Video Review',
  'Talent Identification',
  'Team Selection Advisory',
  'Prep School Placement',
  'Club/Organization Selection',
  'Showcase & Tournament Recommendations',
  'College Placement & Recruiting',
  'NCAA Recruiting Guidance',
  'USports (Canadian University) Guidance',
  'Academic Planning for Student-Athletes',
  'College Visit Planning',
  'Junior Hockey Pathway Planning',
  'Major Junior Advisory (CHL)',
  'Professional Career Planning',
  'Draft Preparation & Strategy',
  'Contract Review & Negotiation',
  'Agent Selection Guidance',
  'Career Transition Planning',
  'Long-Term Development Planning',
  'Training Program Design & Coordination',
  'Off-Ice Development Planning',
  'Mental Performance & Mindset Coaching',
  'International Player Support',
  'Visa & Immigration Assistance',
  'Goaltender-Specific Advisory',
  'Female Player Pathway Planning',
  'Equipment Selection & Guidance',
  'Family Advisory & Support'
]

const SPECIALIZATION_OPTIONS = {
  'COMPETITION LEVELS': [
    'AAA Hockey Development',
    'Elite Skills Training',
    'Prep School Hockey',
    'Junior Hockey (USHL/BCHL/NAHL)',
    'Major Junior (CHL)',
    'Professional Hockey'
  ],
  'COLLEGE & UNIVERSITY': [
    'NCAA Division I Recruiting',
    'NCAA Division II/III Recruiting',
    'USports (Canadian University)',
    'College Academic Planning'
  ],
  'POSITION-SPECIFIC': [
    'Goaltender Development',
    'Defenseman Development',
    'Forward Development'
  ],
  'PLAYER TYPES': [
    'Female Hockey Pathways',
    'International Players',
    'Late Bloomers & Development Players',
    'Dual Citizen Athletes'
  ],
  'GEOGRAPHIC': [
    'Canadian Hockey Systems',
    'U.S. Hockey Systems',
    'European Hockey Pathways'
  ],
  'SERVICE TYPES': [
    'Contract Negotiation',
    'Video Analysis & Scouting',
    'Mental Performance',
    'Off-Ice Development'
  ]
}

const AGE_GROUPS_OPTIONS = [
  'Youth (8U-12U / Mite through Peewee)',
  'Bantam (13-14 years / U14)',
  'Midget (15-17 years / U16-U18)',
  'Junior (16-20 years)',
  'College / University (18-23 years)',
  'Professional (18+ years)'
]

const CREDENTIALS_OPTIONS = {
  'COACHING CERTIFICATIONS': [
    'Hockey Canada Certified (Level 1)',
    'Hockey Canada Certified (Level 2)',
    'Hockey Canada Certified (Level 3)',
    'Hockey Canada Certified (Level 4)',
    'Hockey Canada Certified (Level 5)',
    'USA Hockey Certified (Level 1-4)',
    'USA Hockey Certified (Level 5)',
    'NCCP Certified'
  ],
  'PLAYING EXPERIENCE': [
    'Former Junior A Player',
    'Former Major Junior (CHL) Player',
    'Former NCAA Division I Player',
    'Former NCAA Division II/III Player',
    'Former USports Player',
    'Former Professional Player (NHL/AHL/ECHL)',
    'Former European Professional Player'
  ],
  'EDUCATION': [
    'Bachelor\'s Degree',
    'Master\'s Degree',
    'PhD / Doctorate',
    'Sport-Related Degree',
    'Education Degree'
  ],
  'OTHER CERTIFICATIONS': [
    'Certified Agent (NHLPA)',
    'Sports Psychologist',
    'Strength & Conditioning Specialist',
    'Athletic Therapist / Trainer',
    'Video Analysis Certified'
  ]
}

// Tab configuration
interface TabConfig {
  id: string
  label: string
  icon: string
  requiredFields: string[]
}

const TABS: TabConfig[] = [
  {
    id: 'basic-info',
    label: 'Basic Info',
    icon: '📝',
    requiredFields: ['name', 'years_in_business', 'email']
  },
  {
    id: 'location',
    label: 'Location',
    icon: '📍',
    requiredFields: ['city', 'state', 'service_area']
  },
  {
    id: 'services',
    label: 'Services',
    icon: '🎯',
    requiredFields: ['services_offered', 'age_groups_served']
  },
  {
    id: 'team',
    label: 'Team',
    icon: '👥',
    requiredFields: []
  },
  {
    id: 'business',
    label: 'Business',
    icon: '💼',
    requiredFields: ['consultation_format', 'engagement_types', 'payment_methods', 'response_time', 'accepting_clients']
  },
  {
    id: 'social',
    label: 'Social',
    icon: '📱',
    requiredFields: []
  },
  {
    id: 'pricing',
    label: 'Pricing',
    icon: '💰',
    requiredFields: []
  }
]

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [profile, setProfile] = useState<AdvisorProfile | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [autoSaving, setAutoSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const [specializationRanking, setSpecializationRanking] = useState<string[]>([])
  const [customCredentials, setCustomCredentials] = useState<string>('')
  const [activeTab, setActiveTab] = useState<string>('basic-info')

  useEffect(() => {
    fetchProfile()
  }, [])

  // Handle URL hash for tab navigation
  useEffect(() => {
    const hash = window.location.hash.slice(1) // Remove the #
    if (hash && TABS.some(tab => tab.id === hash)) {
      setActiveTab(hash)
    }
  }, [])

  // Update URL hash when tab changes
  useEffect(() => {
    if (activeTab) {
      window.history.replaceState(null, '', `#${activeTab}`)
    }
  }, [activeTab])

  // Separate credentials on profile load
  useEffect(() => {
    if (!profile || !profile.credentials) return

    // Get all predefined credential options
    const allPredefinedCredentials = Object.values(CREDENTIALS_OPTIONS).flat()

    // Separate into checkbox and custom
    const checkboxCreds: string[] = []
    const customCreds: string[] = []

    profile.credentials.forEach(cred => {
      if (allPredefinedCredentials.includes(cred)) {
        checkboxCreds.push(cred)
      } else {
        customCreds.push(cred)
      }
    })

    // Update state
    setProfile({ ...profile, credentials: checkboxCreds.length > 0 ? checkboxCreds : null })
    setCustomCredentials(customCreds.join(', '))
  }, [profile?.id]) // Only run when profile ID changes (initial load)

  // Auto-save effect
  useEffect(() => {
    if (!hasUnsavedChanges || !profile || autoSaving || saving) return

    const timer = setTimeout(async () => {
      await handleAutoSave()
    }, 30000) // 30 seconds

    return () => clearTimeout(timer)
  }, [hasUnsavedChanges, profile, autoSaving, saving])

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
      setSlug(data.advisor.slug)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAutoSave = async () => {
    if (!profile || saving) return

    // Don't auto-save if there are validation errors on the current tab
    // This prevents auto-save from failing when required fields aren't filled
    if (!validateCurrentTab()) {
      console.log('Skipping auto-save: validation errors on current tab')
      return
    }

    setAutoSaving(true)

    try {
      // Merge custom credentials with checkbox credentials
      const checkboxCredentials = profile.credentials || []
      const customCredentialsList = customCredentials
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)

      // Combine and deduplicate
      const allCredentials = [...new Set([...checkboxCredentials, ...customCredentialsList])]

      // Create updated profile with merged credentials
      const profileToSave = {
        ...profile,
        credentials: allCredentials.length > 0 ? allCredentials : null
      }

      const response = await fetch('/api/advisor/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileToSave),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to auto-save')
      }

      const data = await response.json()
      setProfile(data.advisor)
      setHasUnsavedChanges(false)
      setLastSaved(new Date())
    } catch (err) {
      console.error('Auto-save error:', err)
      // Silent failure for auto-save, don't show error to user
    } finally {
      setAutoSaving(false)
    }
  }

  const validateForm = (): boolean => {
    if (!profile) return false

    const errors: {[key: string]: string} = {}

    // Validate Services Offered (minimum 3)
    const services = (profile.services_offered || [])
    if (services.length < 3) {
      errors.services_offered = 'Please select at least 3 services'
    }

    // Validate Age Groups (minimum 1)
    const ageGroups = (profile.age_groups_served || [])
    if (ageGroups.length < 1) {
      errors.age_groups_served = 'Please select at least one age group'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Separate save function that can be called from multiple places
  const saveProfile = async (): Promise<boolean> => {
    if (!profile) return false

    setSaving(true)
    setError(null)

    try {
      // Merge custom credentials with checkbox credentials
      const checkboxCredentials = profile.credentials || []
      const customCredentialsList = customCredentials
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)

      // Combine and deduplicate
      const allCredentials = [...new Set([...checkboxCredentials, ...customCredentialsList])]

      // Create updated profile with merged credentials
      const profileToSave = {
        ...profile,
        credentials: allCredentials.length > 0 ? allCredentials : null
      }

      const response = await fetch('/api/advisor/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileToSave),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      const data = await response.json()
      setProfile(data.advisor)
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

    // Validate form
    if (!validateForm()) {
      setError('Please fix the validation errors below')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => setError(null), 5000)
      return
    }

    await saveProfile()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateField = (field: keyof AdvisorProfile, value: any) => {
    if (!profile) return
    setProfile({ ...profile, [field]: value })
    setHasUnsavedChanges(true)
  }

  const updateArrayField = (field: keyof AdvisorProfile, value: string) => {
    if (!profile) return
    const array = value.split(',').map(item => item.trim()).filter(Boolean)
    setProfile({ ...profile, [field]: array.length > 0 ? array : null })
    setHasUnsavedChanges(true)
  }

  const toggleCheckboxValue = (field: keyof AdvisorProfile, value: string) => {
    if (!profile) return
    const currentValue = profile[field] as string | null
    const currentArray = currentValue ? currentValue.split(', ') : []

    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]

    setProfile({
      ...profile,
      [field]: newArray.length > 0 ? newArray.join(', ') : null
    })
    setHasUnsavedChanges(true)
  }

  const isCheckboxChecked = (field: keyof AdvisorProfile, value: string): boolean => {
    if (!profile) return false
    const currentValue = profile[field] as string | null
    if (!currentValue) return false
    return currentValue.split(', ').includes(value)
  }

  const toggleArrayCheckbox = (field: keyof AdvisorProfile, value: string, maxSelections?: number) => {
    if (!profile) return

    const currentArray = (profile[field] as string[] | null) || []
    let newArray: string[]

    if (currentArray.includes(value)) {
      newArray = currentArray.filter(item => item !== value)
    } else {
      if (maxSelections && currentArray.length >= maxSelections) {
        return // Don't allow more selections
      }
      newArray = [...currentArray, value]
    }

    setProfile({
      ...profile,
      [field]: newArray.length > 0 ? newArray : null
    })
    setHasUnsavedChanges(true)

    // Clear validation error for this field if it exists
    if (validationErrors[field as string]) {
      const newErrors = { ...validationErrors }
      delete newErrors[field as string]
      setValidationErrors(newErrors)
    }
  }

  const isArrayCheckboxChecked = (field: keyof AdvisorProfile, value: string): boolean => {
    if (!profile) return false
    const currentArray = (profile[field] as string[] | null) || []
    return currentArray.includes(value)
  }

  const addTeamMember = () => {
    if (!profile) return
    const currentMembers = profile.team_members || []
    if (currentMembers.length >= 10) {
      setError('Maximum 10 team members allowed')
      setTimeout(() => setError(null), 3000)
      return
    }

    const newMember: TeamMember = {
      id: `temp-${Date.now()}`,
      name: '',
      title: '',
      bio: '',
      display_order: currentMembers.length
    }

    setProfile({
      ...profile,
      team_members: [...currentMembers, newMember]
    })
    setHasUnsavedChanges(true)
  }

  const updateTeamMember = (index: number, field: keyof TeamMember, value: any) => {
    if (!profile || !profile.team_members) return

    const updatedMembers = [...profile.team_members]
    updatedMembers[index] = {
      ...updatedMembers[index],
      [field]: value
    }

    setProfile({
      ...profile,
      team_members: updatedMembers
    })
    setHasUnsavedChanges(true)
  }

  const removeTeamMember = (index: number) => {
    if (!profile || !profile.team_members) return
    if (!confirm('Are you sure you want to remove this team member?')) return

    const updatedMembers = profile.team_members.filter((_, i) => i !== index)
    setProfile({
      ...profile,
      team_members: updatedMembers.length > 0 ? updatedMembers : null
    })
    setHasUnsavedChanges(true)
  }

  const uploadTeamMemberPhoto = async (index: number, file: File) => {
    if (!profile || !profile.team_members) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'team-member')

      const response = await fetch('/api/advisor/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload photo')
      }

      updateTeamMember(index, 'photo_url', data.url)
    } catch (err) {
      console.error('Error uploading team member photo:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload photo')
      setTimeout(() => setError(null), 5000)
    }
  }

  // Check if a tab is completed
  const isTabCompleted = (tabId: string): boolean => {
    if (!profile) return false

    const tab = TABS.find(t => t.id === tabId)
    if (!tab) return false

    // Check all required fields for this tab
    return tab.requiredFields.every(field => {
      const value = profile[field as keyof AdvisorProfile]

      // Handle array fields
      if (Array.isArray(value)) {
        return value.length > 0
      }

      // Handle string fields
      return value !== null && value !== undefined && value !== ''
    })
  }

  // Calculate tab completion status
  const getTabStatus = (tabId: string): 'completed' | 'incomplete' | 'not-started' => {
    if (!profile) return 'not-started'

    const tab = TABS.find(t => t.id === tabId)
    if (!tab || tab.requiredFields.length === 0) {
      // Tabs without required fields are always considered complete
      return 'completed'
    }

    const filledFields = tab.requiredFields.filter(field => {
      const value = profile[field as keyof AdvisorProfile]
      if (Array.isArray(value)) return value.length > 0
      return value !== null && value !== undefined && value !== ''
    })

    if (filledFields.length === 0) return 'not-started'
    if (filledFields.length === tab.requiredFields.length) return 'completed'
    return 'incomplete'
  }

  // Switch to a tab
  const switchTab = async (tabId: string) => {
    // Check for unsaved changes
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Do you want to save before switching tabs?'
      )
      if (confirmed) {
        await saveProfile()
      }
    }

    setActiveTab(tabId)
    // Scroll to top of content area
    window.scrollTo({ top: 200, behavior: 'smooth' })
  }

  // Navigate to next tab
  const goToNextTab = async () => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab)
    if (currentIndex < TABS.length - 1) {
      // Validate current tab before moving
      if (!validateCurrentTab()) {
        setError('Please fix the validation errors before continuing')
        setTimeout(() => setError(null), 5000)
        return
      }

      // Save current changes
      const saved = await saveProfile()
      if (!saved) {
        // If save failed, don't navigate
        return
      }

      setActiveTab(TABS[currentIndex + 1].id)
      window.scrollTo({ top: 200, behavior: 'smooth' })
    }
  }

  // Navigate to previous tab
  const goToPreviousTab = () => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab)
    if (currentIndex > 0) {
      setActiveTab(TABS[currentIndex - 1].id)
      window.scrollTo({ top: 200, behavior: 'smooth' })
    }
  }

  // Validate current tab
  const validateCurrentTab = (): boolean => {
    if (!profile) return false

    const currentTabIndex = TABS.findIndex(t => t.id === activeTab)
    if (currentTabIndex === -1) return true

    const tab = TABS[currentTabIndex]
    const errors: {[key: string]: string} = {}

    // Services tab specific validation
    if (tab.id === 'services') {
      const services = (profile.services_offered || [])
      if (services.length < 3) {
        errors.services_offered = 'Please select at least 3 services'
      }

      const ageGroups = (profile.age_groups_served || [])
      if (ageGroups.length < 1) {
        errors.age_groups_served = 'Please select at least one age group'
      }
    }

    // Check all other required fields
    tab.requiredFields.forEach(field => {
      const value = profile[field as keyof AdvisorProfile]
      if (Array.isArray(value)) {
        if (value.length === 0) {
          errors[field] = `${field.replace(/_/g, ' ')} is required`
        }
      } else if (!value || value === '') {
        errors[field] = `${field.replace(/_/g, ' ')} is required`
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
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

  const getCharCountColor = (current: number, max: number) => {
    const percentage = (current / max) * 100
    if (percentage >= 96) return 'text-red-600'
    if (percentage >= 81) return 'text-amber-500'
    return 'text-gray-500'
  }

  const calculateProfileCompletion = () => {
    if (!profile) return { percentage: 0, missing: [] }

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
      { field: 'price_range', label: 'Price range' },
    ]

    const allFields = [...requiredFields, ...optionalHighValueFields]
    let filledCount = 0
    const missing: string[] = []

    requiredFields.forEach(({ field, label }) => {
      const value = profile[field as keyof AdvisorProfile]
      if (value && (typeof value !== 'string' || value.trim() !== '')) {
        filledCount++
      } else {
        missing.push(label)
      }
    })

    optionalHighValueFields.forEach(({ field, label }) => {
      const value = profile[field as keyof AdvisorProfile]
      if (field === 'team_members') {
        if (value && Array.isArray(value) && value.length > 0) {
          filledCount++
        } else {
          missing.push(label)
        }
      } else if (field === 'instagram_url') {
        // Check if ANY social media link is filled
        if (profile.instagram_url || profile.facebook_url || profile.twitter_url ||
            profile.linkedin_url || profile.tiktok_url || profile.youtube_url) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 max-w-4xl">
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

      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edit Your Profile</h1>
          <p className="text-gray-600 mt-1">Update your listing information</p>
        </div>

        {/* Profile Completion Indicator */}
        {profile && (() => {
          const completion = calculateProfileCompletion()
          return (
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
          )
        })()}

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

        {/* Tabbed Interface */}
        <div className="flex gap-6 mb-8">
          {/* Tab Bar - Desktop */}
          <div className="hidden md:block w-[220px] flex-shrink-0">
            <div className="sticky top-24">
              <nav className="space-y-1" role="tablist">
                {TABS.map((tab) => {
                  const status = getTabStatus(tab.id)
                  const isActive = activeTab === tab.id

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`${tab.id}-panel`}
                      onClick={() => switchTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                        isActive
                          ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-700 font-semibold'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {/* Status Icon */}
                      <span className="flex-shrink-0">
                        {status === 'completed' && (
                          <span className="text-green-600 text-lg">✓</span>
                        )}
                        {status === 'incomplete' && (
                          <span className="text-amber-500 text-lg">⚠</span>
                        )}
                        {status === 'not-started' && (
                          <span className="text-gray-400 text-lg">○</span>
                        )}
                      </span>

                      {/* Tab Icon */}
                      <span className="text-xl flex-shrink-0">{tab.icon}</span>

                      {/* Tab Label */}
                      <span className="flex-1 text-sm">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Mobile Tab Dropdown */}
          <div className="md:hidden w-full mb-6">
            <label htmlFor="tab-selector" className="block text-sm font-medium text-gray-700 mb-2">
              Select Section:
            </label>
            <select
              id="tab-selector"
              value={activeTab}
              onChange={(e) => switchTab(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {TABS.map((tab) => {
                const status = getTabStatus(tab.id)
                const statusIcon = status === 'completed' ? '✓' : status === 'incomplete' ? '⚠' : '○'
                return (
                  <option key={tab.id} value={tab.id}>
                    {statusIcon} {tab.icon} {tab.label}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <form onSubmit={handleSubmit}>
              {/* TAB 1: Basic Information */}
              {activeTab === 'basic-info' && (
                <div role="tabpanel" id="basic-info-panel" aria-labelledby="basic-info-tab">
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
                  Years of Experience <span className="text-red-600">*</span>
                </label>
                <select
                  value={profile.years_in_business || ''}
                  onChange={(e) => updateField('years_in_business', e.target.value || null)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {YEARS_OF_EXPERIENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} disabled={option.disabled}>
                      {option.label}
                    </option>
                  ))}
                </select>
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
                  Phone (optional)
                </label>
                <Input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value || null)}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL (optional)
                </label>
                <Input
                  type="url"
                  value={profile.website_url || ''}
                  onChange={(e) => updateField('website_url', e.target.value || null)}
                  placeholder="https://yourwebsite.com"
                />
                <p className="text-sm text-gray-500 mt-1">This is your main business website. Update if needed.</p>
              </div>
            </CardContent>
          </Card>

                  {/* Tab Navigation Buttons */}
                  <div className="flex justify-between mt-6">
                    <div></div>
                    <Button type="button" onClick={goToNextTab}>
                      Save & Continue →
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 2: Location & Service Area */}
              {activeTab === 'location' && (
                <div role="tabpanel" id="location-panel" aria-labelledby="location-tab">
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Location</CardTitle>
                    </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Pre-filled from your listing. Update if needed.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address (optional)
                </label>
                <Input
                  type="text"
                  value={profile.address || ''}
                  onChange={(e) => updateField('address', e.target.value || null)}
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
                    Province / State <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={profile.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PROVINCES_AND_STATES.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                        className={option.isHeader ? 'font-bold text-gray-600 bg-gray-100' : ''}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal / Zip Code
                  </label>
                  <Input
                    type="text"
                    value={profile.zip_code || ''}
                    onChange={(e) => updateField('zip_code', e.target.value || null)}
                    placeholder="A1A 1A1 or 12345"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 -mt-2">Optional: Canadian postal code (A1A 1A1) or US zip code (12345)</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Area <span className="text-red-600">*</span>
                </label>
                <Input
                  type="text"
                  value={profile.service_area || ''}
                  onChange={(e) => updateField('service_area', e.target.value || null)}
                  placeholder="e.g., Eastern Canada, Greater Toronto Area"
                  maxLength={100}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Where do you serve clients? (max 100 characters)</p>
              </div>
            </CardContent>
          </Card>

                  {/* Tab Navigation Buttons */}
                  <div className="flex justify-between mt-6">
                    <Button type="button" variant="outline" onClick={goToPreviousTab}>
                      ← Previous
                    </Button>
                    <Button type="button" onClick={goToNextTab}>
                      Save & Continue →
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 3: Services & Expertise */}
              {activeTab === 'services' && (
                <div role="tabpanel" id="services-panel" aria-labelledby="services-tab">
                  <Card className="mb-6">
            <CardHeader>
              <CardTitle>Services & Expertise</CardTitle>
              <CardDescription>
                Select the services you offer, your specializations, age groups you work with, and your professional credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

              {/* Services Offered - Checkbox Grid */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services Offered <span className="text-red-600">*</span>
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Select all services you provide (minimum 3 required)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                  {SERVICES_OFFERED_OPTIONS.map((service) => (
                    <label
                      key={service}
                      className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isArrayCheckboxChecked('services_offered', service)}
                        onChange={() => toggleArrayCheckbox('services_offered', service)}
                        className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700">{service}</span>
                    </label>
                  ))}
                </div>

                {validationErrors.services_offered && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 mt-2">
                    <span>⚠️</span>
                    <span>{validationErrors.services_offered}</span>
                  </div>
                )}

                <p className={`text-sm mt-2 ${(profile.services_offered || []).length >= 3 ? 'text-green-600' : 'text-gray-500'}`}>
                  {(profile.services_offered || []).length} selected {(profile.services_offered || []).length >= 3 && '✓'}
                </p>
              </div>

              {/* Specializations - Grouped Checkboxes with Ranking */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specializations
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Select up to 10 specializations. Your top 4 will be featured prominently on your profile.
                </p>

                <div className="space-y-6">
                  {Object.entries(SPECIALIZATION_OPTIONS).map(([groupName, options]) => (
                    <div key={groupName}>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                        {groupName}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-2">
                        {options.map((specialization) => {
                          const isChecked = isArrayCheckboxChecked('specializations', specialization)
                          const currentCount = (profile.specializations || []).length
                          const isDisabled = !isChecked && currentCount >= 10

                          return (
                            <label
                              key={specialization}
                              className={`flex items-start gap-2 p-2 rounded transition-colors ${
                                isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleArrayCheckbox('specializations', specialization, 10)}
                                disabled={isDisabled}
                                className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0 disabled:opacity-50"
                              />
                              <span className="text-sm text-gray-700">{specialization}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <p className={`text-sm mt-3 ${(profile.specializations || []).length >= 10 ? 'text-amber-600' : 'text-gray-500'}`}>
                  {(profile.specializations || []).length} / 10 selected
                  {(profile.specializations || []).length >= 10 && ' (maximum reached)'}
                </p>

                {/* Top 4 Ranking Interface */}
                {profile.specializations && profile.specializations.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">
                      Top 4 Featured Specializations
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Drag to reorder or use the arrows. These will appear as badges on your profile.
                    </p>

                    <div className="space-y-2">
                      {profile.specializations.slice(0, 4).map((specialization, index) => (
                        <div
                          key={specialization}
                          className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded shadow-sm"
                        >
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (index > 0) {
                                  const newOrder = [...(profile.specializations || [])]
                                  const temp = newOrder[index]
                                  newOrder[index] = newOrder[index - 1]
                                  newOrder[index - 1] = temp
                                  setProfile({ ...profile, specializations: newOrder })
                                  setHasUnsavedChanges(true)
                                }
                              }}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (index < Math.min(3, (profile.specializations?.length || 0) - 1)) {
                                  const newOrder = [...(profile.specializations || [])]
                                  const temp = newOrder[index]
                                  newOrder[index] = newOrder[index + 1]
                                  newOrder[index + 1] = temp
                                  setProfile({ ...profile, specializations: newOrder })
                                  setHasUnsavedChanges(true)
                                }
                              }}
                              disabled={index >= Math.min(3, (profile.specializations?.length || 0) - 1)}
                              className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            <span className="text-sm text-gray-800">{specialization}</span>
                          </div>
                        </div>
                      ))}

                      {profile.specializations.length < 4 && (
                        <p className="text-xs text-gray-500 italic mt-2">
                          Select {4 - profile.specializations.length} more specialization{4 - profile.specializations.length !== 1 ? 's' : ''} to fill your top 4
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Age Groups Served - Checkbox List */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Groups Served <span className="text-red-600">*</span>
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Select all age groups you work with (minimum 1 required)
                </p>

                <div className="space-y-2">
                  {AGE_GROUPS_OPTIONS.map((ageGroup) => (
                    <label
                      key={ageGroup}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-3 rounded transition-colors border border-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={isArrayCheckboxChecked('age_groups_served', ageGroup)}
                        onChange={() => toggleArrayCheckbox('age_groups_served', ageGroup)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700 font-medium">{ageGroup}</span>
                    </label>
                  ))}
                </div>

                {validationErrors.age_groups_served && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 mt-2">
                    <span>⚠️</span>
                    <span>{validationErrors.age_groups_served}</span>
                  </div>
                )}

                <p className={`text-sm mt-2 ${(profile.age_groups_served || []).length >= 1 ? 'text-green-600' : 'text-gray-500'}`}>
                  {(profile.age_groups_served || []).length} selected {(profile.age_groups_served || []).length >= 1 && '✓'}
                </p>
              </div>

              {/* Credentials - Grouped Checkboxes with Custom Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Credentials
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Select all applicable credentials. Add any additional credentials in the custom field below.
                </p>

                <div className="space-y-6">
                  {Object.entries(CREDENTIALS_OPTIONS).map(([groupName, options]) => (
                    <div key={groupName}>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                        {groupName}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-2">
                        {options.map((credential) => (
                          <label
                            key={credential}
                            className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isArrayCheckboxChecked('credentials', credential)}
                              onChange={() => toggleArrayCheckbox('credentials', credential)}
                              className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                            />
                            <span className="text-sm text-gray-700">{credential}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-gray-500 mt-3">
                  {(profile.credentials || []).length} selected
                </p>

                {/* Custom Credentials Field */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Credentials
                  </label>
                  <p className="text-sm text-gray-600 mb-2">
                    Add any other credentials not listed above (comma separated)
                  </p>
                  <Textarea
                    value={customCredentials}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setCustomCredentials(e.target.value)
                        setHasUnsavedChanges(true)
                      }
                    }}
                    placeholder="e.g., Former NHL Player, 20 Years College Coaching Experience, Published Author"
                    className="min-h-[80px]"
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">
                      These will be added to your profile in addition to selected credentials
                    </p>
                    <p className={`text-sm ${getCharCountColor(customCredentials.length, 500)}`}>
                      {customCredentials.length} / 500
                    </p>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

                  {/* Tab Navigation Buttons */}
                  <div className="flex justify-between mt-6">
                    <Button type="button" variant="outline" onClick={goToPreviousTab}>
                      ← Previous
                    </Button>
                    <Button type="button" onClick={goToNextTab}>
                      Save & Continue →
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 5: Business Details */}
              {activeTab === 'business' && (
                <div role="tabpanel" id="business-panel" aria-labelledby="business-tab">
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Business Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Consultation Format */}
                      <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Consultation Format
                </label>
                <div className="space-y-2">
                  {CONSULTATION_FORMAT_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCheckboxChecked('consultation_format', option)}
                        onChange={() => toggleCheckboxValue('consultation_format', option)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Engagement Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Engagement Types
                </label>
                <div className="space-y-2">
                  {ENGAGEMENT_TYPE_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCheckboxChecked('engagement_types', option)}
                        onChange={() => toggleCheckboxValue('engagement_types', option)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Methods
                </label>
                <div className="space-y-2">
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCheckboxChecked('payment_methods', option)}
                        onChange={() => toggleCheckboxValue('payment_methods', option)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Response Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Time
                </label>
                <select
                  value={profile.response_time || ''}
                  onChange={(e) => updateField('response_time', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select response time...</option>
                  {RESPONSE_TIME_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Player Levels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Player Levels Served
                </label>
                <Input
                  type="text"
                  value={profile.player_levels || ''}
                  onChange={(e) => updateField('player_levels', e.target.value || null)}
                  placeholder="e.g., Bantam through Junior A"
                />
                <p className="text-sm text-gray-500 mt-1">Describe the player levels you work with</p>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages Spoken
                </label>
                <Input
                  type="text"
                  value={profile.languages || ''}
                  onChange={(e) => updateField('languages', e.target.value || null)}
                  placeholder="e.g., English, French"
                />
                <p className="text-sm text-gray-500 mt-1">Separate multiple languages with commas</p>
              </div>

              {/* Accepting Clients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Client Acceptance Status
                </label>
                <div className="space-y-2">
                  {ACCEPTING_CLIENTS_OPTIONS.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="accepting_clients"
                        value={option.value}
                        checked={profile.accepting_clients === option.value}
                        onChange={(e) => updateField('accepting_clients', e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

                  {/* Tab Navigation Buttons */}
                  <div className="flex justify-between mt-6">
                    <Button type="button" variant="outline" onClick={goToPreviousTab}>
                      ← Previous
                    </Button>
                    <Button type="button" onClick={goToNextTab}>
                      Save & Continue →
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 4: Team Members */}
              {activeTab === 'team' && (
                <div role="tabpanel" id="team-panel" aria-labelledby="team-tab">
                  <Card className="mb-6">
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Showcase your team of advisors and staff. Add headshots and bios to build trust with families.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile.team_members && profile.team_members.length > 0 ? (
                profile.team_members.map((member, index) => (
                  <div
                    key={member.id || index}
                    className="border border-gray-200 rounded-lg p-6 bg-white space-y-4"
                  >
                    {/* Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Photo
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="relative w-[150px] h-[150px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                          {member.photo_url ? (
                            <img
                              src={member.photo_url}
                              alt={member.name || 'Team member'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center">
                              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-500">No photo</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const input = document.createElement('input')
                              input.type = 'file'
                              input.accept = 'image/jpeg,image/png,image/webp'
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0]
                                if (file) {
                                  // Validate file
                                  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                                    setError('Invalid file type. Only JPEG, PNG, and WebP are allowed.')
                                    setTimeout(() => setError(null), 3000)
                                    return
                                  }
                                  if (file.size > 5 * 1024 * 1024) {
                                    setError('File size too large. Maximum size is 5MB.')
                                    setTimeout(() => setError(null), 3000)
                                    return
                                  }
                                  uploadTeamMemberPhoto(index, file)
                                }
                              }
                              input.click()
                            }}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Photo
                          </Button>
                          {member.photo_url && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateTeamMember(index, 'photo_url', null)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove Photo
                            </Button>
                          )}
                          <p className="text-xs text-gray-500">
                            150x150px min, square<br />
                            Max 5MB, JPG/PNG/WebP
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name <span className="text-red-600">*</span>
                      </label>
                      <Input
                        type="text"
                        value={member.name}
                        onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                        placeholder="John Smith"
                        maxLength={100}
                        required
                      />
                    </div>

                    {/* Title/Role */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title / Role <span className="text-red-600">*</span>
                      </label>
                      <Input
                        type="text"
                        value={member.title}
                        onChange={(e) => updateTeamMember(index, 'title', e.target.value)}
                        placeholder="Senior Advisor"
                        maxLength={100}
                        required
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio <span className="text-red-600">*</span>
                      </label>
                      <Textarea
                        value={member.bio}
                        onChange={(e) => {
                          if (e.target.value.length <= 500) {
                            updateTeamMember(index, 'bio', e.target.value)
                          }
                        }}
                        placeholder="Brief bio highlighting experience and expertise..."
                        maxLength={500}
                        rows={5}
                        required
                      />
                      <div className="flex justify-end mt-1">
                        <p className={`text-sm ${getCharCountColor(member.bio?.length || 0, 500)}`}>
                          {member.bio?.length || 0} / 500 characters
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email (optional)
                      </label>
                      <Input
                        type="email"
                        value={member.email || ''}
                        onChange={(e) => updateTeamMember(index, 'email', e.target.value || null)}
                        placeholder="john@example.com"
                      />
                      <p className="text-xs text-gray-500 mt-1">Will be displayed on your public profile</p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone (optional)
                      </label>
                      <Input
                        type="tel"
                        value={member.phone || ''}
                        onChange={(e) => updateTeamMember(index, 'phone', e.target.value || null)}
                        placeholder="(555) 123-4567"
                      />
                      <p className="text-xs text-gray-500 mt-1">Will be displayed on your public profile</p>
                    </div>

                    {/* Remove Button */}
                    <div className="pt-4 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeTeamMember(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove Team Member
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4">No team members added yet.</p>
                </div>
              )}

              {/* Add Team Member Button */}
              <div className="pt-2">
                {profile.team_members && profile.team_members.length >= 10 ? (
                  <p className="text-sm text-gray-500 text-center">Maximum 10 team members</p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTeamMember}
                    className="w-full"
                  >
                    + Add Another Team Member
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

                  {/* Tab Navigation Buttons */}
                  <div className="flex justify-between mt-6">
                    <Button type="button" variant="outline" onClick={goToPreviousTab}>
                      ← Previous
                    </Button>
                    <Button type="button" onClick={goToNextTab}>
                      Save & Continue →
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 7: Availability & Pricing */}
              {activeTab === 'pricing' && (
                <div role="tabpanel" id="pricing-panel" aria-labelledby="pricing-tab">
                  <Card className="mb-6">
            <CardHeader>
              <CardTitle>Availability & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Client acceptance status and pricing information are managed in the Business tab.
              </p>
            </CardContent>
          </Card>

                  {/* Tab Navigation Buttons - Last Tab */}
                  <div className="flex justify-between mt-6">
                    <Button type="button" variant="outline" onClick={goToPreviousTab}>
                      ← Previous
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save & Finish
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 6: Social Media */}
              {activeTab === 'social' && (
                <div role="tabpanel" id="social-panel" aria-labelledby="social-tab">
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Social Media & Online Presence</CardTitle>
                      <CardDescription>
                        Add your social media profiles. These will appear as clickable icons on your public profile.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Instagram
                        </label>
                        <Input
                          type="url"
                          value={profile.instagram_url || ''}
                          onChange={(e) => updateField('instagram_url', e.target.value || null)}
                          placeholder="https://instagram.com/yourhandle"
                        />
                        <p className="text-sm text-gray-500 mt-1">Leave blank if not applicable</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Facebook
                        </label>
                        <Input
                          type="url"
                          value={profile.facebook_url || ''}
                          onChange={(e) => updateField('facebook_url', e.target.value || null)}
                          placeholder="https://facebook.com/yourpage"
                        />
                        <p className="text-sm text-gray-500 mt-1">Leave blank if not applicable</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Twitter / X
                        </label>
                        <Input
                          type="url"
                          value={profile.twitter_url || ''}
                          onChange={(e) => updateField('twitter_url', e.target.value || null)}
                          placeholder="https://twitter.com/yourhandle"
                        />
                        <p className="text-sm text-gray-500 mt-1">Leave blank if not applicable</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          LinkedIn
                        </label>
                        <Input
                          type="url"
                          value={profile.linkedin_url || ''}
                          onChange={(e) => updateField('linkedin_url', e.target.value || null)}
                          placeholder="https://linkedin.com/in/yourprofile"
                        />
                        <p className="text-sm text-gray-500 mt-1">Leave blank if not applicable</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          TikTok
                        </label>
                        <Input
                          type="url"
                          value={profile.tiktok_url || ''}
                          onChange={(e) => updateField('tiktok_url', e.target.value || null)}
                          placeholder="https://tiktok.com/@yourhandle"
                        />
                        <p className="text-sm text-gray-500 mt-1">Leave blank if not applicable</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          YouTube
                        </label>
                        <Input
                          type="url"
                          value={profile.youtube_url || ''}
                          onChange={(e) => updateField('youtube_url', e.target.value || null)}
                          placeholder="https://youtube.com/@yourchannel"
                        />
                        <p className="text-sm text-gray-500 mt-1">Leave blank if not applicable</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tab Navigation Buttons */}
                  <div className="flex justify-between mt-6">
                    <Button type="button" variant="outline" onClick={goToPreviousTab}>
                      ← Previous
                    </Button>
                    <Button type="button" onClick={goToNextTab}>
                      Save & Continue →
                    </Button>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
