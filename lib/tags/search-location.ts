import { isValidCoordinate } from '@/lib/utils/distance'

type PointValue =
  | { type?: string; coordinates?: [number, number] }
  | string
  | null

export function readPoint(value: PointValue): { lat: number; lng: number } | null {
  if (value && typeof value === 'object' && Array.isArray(value.coordinates)) {
    const [lng, lat] = value.coordinates
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
  }

  if (typeof value === 'string') {
    const match = value.match(/POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)/i)
    if (match) return { lng: Number(match[1]), lat: Number(match[2]) }

    // Supabase's geography(Point,4326) column returns PostGIS hex EWKB.
    // Only accept a complete 2D point (optional explicit WGS84 SRID).
    // Format reference: https://postgis.net/docs/ST_AsEWKB.html
    const hex = value.replace(/^\\x/, '')
    if (/^(?:[0-9a-f]{42}|[0-9a-f]{50})$/i.test(hex)) {
      const bytes = Uint8Array.from(hex.match(/.{2}/g)!, (pair) => parseInt(pair, 16))
      const view = new DataView(bytes.buffer)
      if (bytes[0] !== 0 && bytes[0] !== 1) return null
      const littleEndian = bytes[0] === 1
      const type = view.getUint32(1, littleEndian)
      const withSrid = type === 0x20000001
      if (type !== 1 && !withSrid) return null
      const offset = withSrid ? 9 : 5
      if (bytes.length !== offset + 16 || (withSrid && view.getUint32(5, littleEndian) !== 4326)) return null
      const lng = view.getFloat64(offset, littleEndian)
      const lat = view.getFloat64(offset + 8, littleEndian)
      if (isValidCoordinate(lat, lng)) return { lat, lng }
    }
  }

  return null
}

// Helper function to detect if search text is a state/province name and convert to abbreviation
export function getStateAbbreviation(searchText: string): string | null {
  const normalized = searchText.toLowerCase().trim()

  const usStates: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY',
  }

  const canadianProvinces: Record<string, string> = {
    'alberta': 'AB', 'british columbia': 'BC', 'manitoba': 'MB',
    'new brunswick': 'NB', 'newfoundland and labrador': 'NL', 'newfoundland': 'NL',
    'northwest territories': 'NT', 'nova scotia': 'NS', 'nunavut': 'NU',
    'ontario': 'ON', 'prince edward island': 'PE', 'pei': 'PE',
    'quebec': 'QC', 'québec': 'QC',
    'saskatchewan': 'SK', 'yukon': 'YT',
  }

  if (usStates[normalized]) return usStates[normalized]
  if (canadianProvinces[normalized]) return canadianProvinces[normalized]
  return null
}


