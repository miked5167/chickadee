/**
 * Distance calculation utilities using the Haversine formula
 * for calculating distances between geographic coordinates
 */

/**
 * Earth's radius in miles
 */
const EARTH_RADIUS_MILES = 3959

/**
 * Earth's radius in kilometers
 */
const EARTH_RADIUS_KM = 6371

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate the distance between two points using the Haversine formula
 * Returns distance in miles
 *
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in miles
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  // Handle invalid coordinates
  if (!isValidCoordinate(lat1, lng1) || !isValidCoordinate(lat2, lng2)) {
    return 0
  }

  // Convert latitude and longitude to radians
  const φ1 = toRadians(lat1)
  const φ2 = toRadians(lat2)
  const Δφ = toRadians(lat2 - lat1)
  const Δλ = toRadians(lng2 - lng1)

  // Haversine formula
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  // Distance in miles
  return EARTH_RADIUS_MILES * c
}

/**
 * Calculate distance in kilometers
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  if (!isValidCoordinate(lat1, lng1) || !isValidCoordinate(lat2, lng2)) {
    return 0
  }

  const φ1 = toRadians(lat1)
  const φ2 = toRadians(lat2)
  const Δφ = toRadians(lat2 - lat1)
  const Δλ = toRadians(lng2 - lng1)

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_KM * c
}

/**
 * Validate that coordinates are within valid ranges
 * Latitude: -90 to 90
 * Longitude: -180 to 180
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

/**
 * Format distance for display
 * @param miles - Distance in miles
 * @param maxDistance - Maximum distance to display (show "X+" for larger distances)
 * @returns Formatted distance string (e.g., "5.2 miles", "< 1 mile", "100+ miles")
 */
export function formatDistance(miles: number, maxDistance?: number): string {
  if (miles < 0.1) {
    return '< 0.1 miles'
  }

  if (miles < 1) {
    return '< 1 mile'
  }

  if (maxDistance && miles > maxDistance) {
    return `${maxDistance}+ miles`
  }

  // Round to 1 decimal place
  const rounded = Math.round(miles * 10) / 10

  return `${rounded} ${rounded === 1 ? 'mile' : 'miles'}`
}

/**
 * Format distance in short form (for cards/compact displays)
 * @param miles - Distance in miles
 * @returns Formatted distance string (e.g., "5.2 mi", "< 1 mi", "100+ mi")
 */
export function formatDistanceShort(miles: number, maxDistance?: number): string {
  if (miles < 0.1) {
    return '< 0.1 mi'
  }

  if (miles < 1) {
    return '< 1 mi'
  }

  if (maxDistance && miles > maxDistance) {
    return `${maxDistance}+ mi`
  }

  const rounded = Math.round(miles * 10) / 10
  return `${rounded} mi`
}

/**
 * Build a PostGIS distance query for use in Supabase
 * This generates the SQL needed for distance-based queries
 *
 * @param userLat - User's latitude
 * @param userLng - User's longitude
 * @param radiusMiles - Search radius in miles
 * @returns Object with distance calculation and filter clauses
 */
export function buildPostGISDistanceQuery(
  userLat: number,
  userLng: number,
  radiusMiles: number
) {
  // Convert miles to meters for PostGIS (uses meters)
  const radiusMeters = radiusMiles * 1609.34

  return {
    // Distance calculation (in miles)
    distanceSelect: `
      ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography
      ) / 1609.34 AS distance_miles
    `,
    // Filter for advisors within radius
    radiusFilter: `
      ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography,
        ${radiusMeters}
      )
    `,
    // Point for the user's location
    userPoint: `ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography`,
  }
}

/**
 * Convert miles to meters
 */
export function milesToMeters(miles: number): number {
  return miles * 1609.34
}

/**
 * Convert meters to miles
 */
export function metersToMiles(meters: number): number {
  return meters / 1609.34
}

/**
 * Preset distance radius options for filters
 */
export const DISTANCE_RADIUS_OPTIONS = [
  { value: 10, label: '10 miles' },
  { value: 25, label: '25 miles' },
  { value: 50, label: '50 miles' },
  { value: 100, label: '100 miles' },
  { value: 999, label: 'Any distance' },
] as const

/**
 * Default distance radius
 */
export const DEFAULT_RADIUS_MILES = 50
