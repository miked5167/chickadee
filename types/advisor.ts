/**
 * Advisor Profile Types
 *
 * Comprehensive type definitions for advisor profiles.
 * Used across both admin and advisor interfaces.
 */

export interface TeamMember {
  id?: string
  photo_url?: string | null
  name: string
  title: string
  bio: string
  email?: string | null
  phone?: string | null
  display_order?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface AdvisorProfile {
  // Core identification
  id: string
  slug: string

  // Basic Information
  name: string
  description?: string | null
  logo_url?: string | null
  years_in_business?: string | null

  // Contact Information
  email: string
  phone?: string | null
  website_url?: string | null

  // Social Media
  instagram_url?: string | null
  facebook_url?: string | null
  twitter_url?: string | null
  linkedin_url?: string | null
  tiktok_url?: string | null
  youtube_url?: string | null

  // Location
  address?: string | null
  city: string
  state: string
  zip_code?: string | null
  country: string
  service_area?: string | null
  latitude?: number | null
  longitude?: number | null
  location?: any // PostGIS geography point

  // Services & Expertise
  services_offered?: string[] | null
  specializations?: string[] | null
  specialties?: string[] | null // Deprecated: Use specializations
  age_groups_served?: string[] | null
  credentials?: string[] | null

  // Business Details
  consultation_format?: string | null
  engagement_types?: string | null
  payment_methods?: string | null
  response_time?: string | null
  languages?: string | null
  player_levels?: string | null

  // Availability & Pricing
  accepting_clients?: 'accepting' | 'waitlist' | 'not_accepting'
  price_range?: string | null
  certification_info?: string | null

  // Structured Pricing Fields
  typical_engagement_range?: string | null
  pricing_structure?: string[] | null
  starting_price?: number | null
  consultation_fee_type?: string | null
  consultation_fee_amount?: number | null
  pricing_details?: string | null

  // Business Hours
  business_hours?: Record<string, string> | null

  // Team Members (legacy JSONB field - deprecated)
  team_members?: TeamMember[] | null
  team_member_count?: number
  clients_served?: number | null

  // Reviews & Ratings
  average_rating?: number | null
  review_count?: number

  // Status & Features (Admin)
  is_featured?: boolean
  is_claimed?: boolean
  claimed_by_user_id?: string | null
  is_published?: boolean
  is_verified?: boolean

  // Subscription Management (Admin)
  subscription_tier?: string | null
  subscription_start_date?: string | null
  subscription_end_date?: string | null
  monthly_view_limit?: number | null
  monthly_lead_limit?: number | null

  // Data Quality
  data_quality_score?: number
  last_verified_date?: string | null
  needs_review?: boolean

  // Metadata
  submitted_by_email?: string | null
  created_at?: string
  updated_at?: string

  // Search
  search_vector?: any // tsvector
}

// Form-specific types for editing
export interface AdvisorFormData {
  // Basic Info
  name: string
  description: string
  logo_url: string | null
  years_in_business: string

  // Contact
  email: string
  phone: string
  website_url: string

  // Social Media
  instagram_url: string
  facebook_url: string
  twitter_url: string
  linkedin_url: string
  tiktok_url: string
  youtube_url: string

  // Location
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  service_area: string

  // Services & Expertise
  services_offered: string[]
  specializations: string[]
  age_groups_served: string[]
  credentials: string[]

  // Business Details
  consultation_format: string
  engagement_types: string
  payment_methods: string
  response_time: string
  languages: string
  player_levels: string

  // Availability & Pricing
  accepting_clients: 'accepting' | 'waitlist' | 'not_accepting'
  price_range: string
  certification_info: string
}

// Props for shared profile section components
export interface ProfileSectionProps {
  data: Partial<AdvisorFormData>
  onChange: (field: string, value: any) => void
  errors?: Record<string, string>
  mode?: 'admin' | 'advisor'
}

// Validation error type
export interface ValidationErrors {
  [field: string]: string
}

// Tab configuration
export interface TabConfig {
  id: string
  label: string
  icon: string
  requiredFields: string[]
}

// Profile completion calculation
export interface ProfileCompletionResult {
  percentage: number
  missingFields: {
    field: string
    label: string
    tabId: string
  }[]
}
