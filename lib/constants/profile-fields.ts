/**
 * Advisor Profile Form Constants
 *
 * Centralized constants for all advisor profile fields.
 * Used by both admin and advisor interfaces to ensure consistency.
 */

// Location Options
export const PROVINCES_AND_STATES = [
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

// Years of Experience Options
export const YEARS_OF_EXPERIENCE_OPTIONS = [
  { value: 'Less than 1 year', label: 'Less than 1 year' },
  { value: '1-2 years', label: '1-2 years' },
  { value: '3-5 years', label: '3-5 years' },
  { value: '5-10 years', label: '5-10 years' },
  { value: '10-15 years', label: '10-15 years' },
  { value: '15-20 years', label: '15-20 years' },
  { value: '20+ years', label: '20+ years' }
]

// Consultation Format Options
export const CONSULTATION_FORMAT_OPTIONS = [
  'In-Person',
  'Virtual',
  'Phone'
]

// Engagement Type Options
export const ENGAGEMENT_TYPE_OPTIONS = [
  'One-time',
  'Season-long',
  'Retainer',
  'Hourly',
  'Package-based'
]

// Payment Method Options
export const PAYMENT_METHOD_OPTIONS = [
  'Credit Card',
  'Debit',
  'E-transfer',
  'Wire Transfer',
  'Check',
  'Cash'
]

// Response Time Options
export const RESPONSE_TIME_OPTIONS = [
  'Within 24 hours',
  '1-2 days',
  '2-3 days',
  '3-5 days'
]

// Client Acceptance Status Options
export const ACCEPTING_CLIENTS_OPTIONS = [
  { value: 'accepting', label: 'Accepting New Clients' },
  { value: 'waitlist', label: 'Waitlist Only' },
  { value: 'not_accepting', label: 'Not Accepting New Clients' }
]

// Services Offered Options (21 total)
export const SERVICES_OFFERED_OPTIONS = [
  'Player Assessment & Evaluation',
  'Skills Analysis & Video Review',
  'Prep School Placement',
  'Showcase & Tournament Recommendations',
  'College Placement & Recruiting',
  'NCAA Recruiting Guidance',
  'USports (Canadian University) Guidance',
  'Academic Planning for Student-Athletes',
  'Junior Hockey Pathway Planning',
  'Major Junior Advisory (CHL)',
  'Professional Career Planning',
  'Draft Preparation & Strategy',
  'Contract Review & Negotiation',
  'Training Program Design & Coordination',
  'Off-Ice Development Planning',
  'Mental Performance & Mindset Coaching',
  'International Player Support',
  'Visa & Immigration Assistance',
  'Goaltender-Specific Advisory',
  'Female Player Pathway Planning',
  'Family Advisory & Support'
]

// Specialization Options (organized by category)
export const SPECIALIZATION_OPTIONS = {
  'COMPETITION LEVELS': [
    'AAA Hockey',
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
  ]
}

// Flatten specializations for easier iteration
export const ALL_SPECIALIZATIONS = Object.values(SPECIALIZATION_OPTIONS).flat()

// Age Groups Options
export const AGE_GROUPS_OPTIONS = [
  'Bantam (13-14 years / U14)',
  'Midget (15-17 years / U16-U18)',
  'Junior (16-20 years)',
  'College / University (18-23 years)',
  'Professional (18+ years)'
]

// Credentials Options (organized by category)
export const CREDENTIALS_OPTIONS = {
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
    "Bachelor's Degree",
    "Master's Degree",
    'PhD / Doctorate',
    'Sport-Related Degree',
    'Education Degree'
  ],
  'OTHER CERTIFICATIONS': [
    'Certified Agent (NHLPA)',
    'Sports Psychologist',
    'Strength & Conditioning Specialist'
  ]
}

// Flatten credentials for easier iteration
export const ALL_CREDENTIALS = Object.values(CREDENTIALS_OPTIONS).flat()

// Admin-only options
export const SUBSCRIPTION_TIERS = [
  { value: 'free', label: 'Free' },
  { value: 'basic', label: 'Basic' },
  { value: 'premium', label: 'Premium' },
  { value: 'enterprise', label: 'Enterprise' }
]

export const BILLING_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'past_due', label: 'Past Due' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'trial', label: 'Trial' }
]

// Pricing Options
export const TYPICAL_ENGAGEMENT_RANGES = [
  { value: 'under-1000', label: 'Under $1,000', numericValue: 500 },
  { value: '1000-2500', label: '$1,000 - $2,500', numericValue: 1750 },
  { value: '2500-5000', label: '$2,500 - $5,000', numericValue: 3750 },
  { value: '5000-10000', label: '$5,000 - $10,000', numericValue: 7500 },
  { value: '10000-25000', label: '$10,000 - $25,000', numericValue: 17500 },
  { value: '25000-plus', label: '$25,000+', numericValue: 25000 },
  { value: 'varies', label: 'Varies (Custom Quotes Only)', numericValue: null }
]

export const PRICING_STRUCTURE_OPTIONS = [
  { value: 'one-time', label: 'One-Time Engagement' },
  { value: 'season-long', label: 'Season-Long Program' },
  { value: 'package-based', label: 'Package-Based Services' },
  { value: 'flat-fee', label: 'Flat Fee Packages' },
  { value: 'hourly', label: 'Hourly Rates' },
  { value: 'retainer', label: 'Monthly Retainer' },
  { value: 'free-consultation', label: 'Free Initial Consultation' },
  { value: 'payment-plans', label: 'Payment Plans Available' },
  { value: 'sliding-scale', label: 'Sliding Scale / Financial Aid Available' }
]

export const CONSULTATION_FEE_TYPES = [
  { value: null, label: 'Not specified' },
  { value: 'free', label: 'Free initial consultation' },
  { value: 'paid', label: 'Paid consultation' },
  { value: 'paid-applied', label: 'Paid consultation (applied to engagement if hired)' }
]

// Helper function to get display label from value
export function getEngagementRangeLabel(value: string | null): string {
  if (!value) return 'Contact for pricing'
  const option = TYPICAL_ENGAGEMENT_RANGES.find(opt => opt.value === value)
  return option ? option.label : 'Contact for pricing'
}

// Helper function to get numeric value for sorting
export function getEngagementRangeNumericValue(value: string | null): number | null {
  if (!value) return null
  const option = TYPICAL_ENGAGEMENT_RANGES.find(opt => opt.value === value)
  return option ? option.numericValue : null
}

// Helper function to get pricing structure label from value
export function getPricingStructureLabel(value: string): string {
  const option = PRICING_STRUCTURE_OPTIONS.find(opt => opt.value === value)
  return option ? option.label : value
}

// Helper function to get consultation fee type label
export function getConsultationFeeTypeLabel(value: string | null): string {
  const option = CONSULTATION_FEE_TYPES.find(opt => opt.value === value)
  return option ? option.label : 'Not specified'
}

// Helper function to format price in cents to dollars
export function formatPrice(cents: number | null): string {
  if (cents === null || cents === undefined) return ''
  const dollars = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(dollars)
}

// Validation rules
export const FIELD_LIMITS = {
  MIN_SERVICES: 3,
  MIN_SPECIALIZATIONS: 1,
  TOP_SPECIALIZATIONS: 4,
  MIN_AGE_GROUPS: 1,
  MAX_TEAM_MEMBERS: 10,
  MAX_BIO_LENGTH: 2000,
  MIN_BIO_LENGTH: 50,
  MAX_NAME_LENGTH: 100,
  MIN_NAME_LENGTH: 2,
  MAX_SERVICE_AREA_LENGTH: 100,
  MAX_TEAM_MEMBER_BIO_LENGTH: 500,
  MAX_PRICING_DETAILS_LENGTH: 500,
  MIN_STARTING_PRICE: 10000, // $100 in cents
  MAX_STARTING_PRICE: 10000000, // $100,000 in cents
  MAX_CONSULTATION_FEE: 1000000 // $10,000 in cents
}
