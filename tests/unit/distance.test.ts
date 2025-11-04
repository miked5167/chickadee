import { describe, it, expect } from 'vitest'
import {
  calculateDistance,
  calculateDistanceKm,
  isValidCoordinate,
  formatDistance,
  formatDistanceShort,
  milesToMeters,
  metersToMiles,
} from '@/lib/utils/distance'

describe('Distance Utilities', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // New York to Los Angeles (approx 2,450 miles)
      const nyLat = 40.7128
      const nyLng = -74.006
      const laLat = 34.0522
      const laLng = -118.2437

      const distance = calculateDistance(nyLat, nyLng, laLat, laLng)

      // Allow 1% margin of error
      expect(distance).toBeGreaterThan(2400)
      expect(distance).toBeLessThan(2500)
    })

    it('should return 0 for same location', () => {
      const distance = calculateDistance(40.7128, -74.006, 40.7128, -74.006)
      expect(distance).toBe(0)
    })

    it('should calculate short distances accurately', () => {
      // Two points about 1 mile apart in New York
      const distance = calculateDistance(40.7128, -74.006, 40.7228, -74.006)

      // Should be roughly 1 mile (allowing for curvature)
      expect(distance).toBeGreaterThan(0.5)
      expect(distance).toBeLessThan(1.5)
    })

    it('should return 0 for invalid coordinates', () => {
      expect(calculateDistance(91, 0, 0, 0)).toBe(0) // Invalid lat1
      expect(calculateDistance(0, 181, 0, 0)).toBe(0) // Invalid lng1
      expect(calculateDistance(0, 0, -91, 0)).toBe(0) // Invalid lat2
      expect(calculateDistance(0, 0, 0, -181)).toBe(0) // Invalid lng2
      expect(calculateDistance(NaN, 0, 0, 0)).toBe(0) // NaN
    })

    it('should handle edge cases', () => {
      // Equator to North Pole (should be ~6,215 miles)
      const distance = calculateDistance(0, 0, 90, 0)
      expect(distance).toBeGreaterThan(6000)
      expect(distance).toBeLessThan(6400)
    })
  })

  describe('calculateDistanceKm', () => {
    it('should calculate distance in kilometers', () => {
      // New York to Los Angeles (approx 3,940 km)
      const nyLat = 40.7128
      const nyLng = -74.006
      const laLat = 34.0522
      const laLng = -118.2437

      const distance = calculateDistanceKm(nyLat, nyLng, laLat, laLng)

      expect(distance).toBeGreaterThan(3800)
      expect(distance).toBeLessThan(4100)
    })

    it('should return 0 for invalid coordinates', () => {
      expect(calculateDistanceKm(91, 0, 0, 0)).toBe(0)
    })
  })

  describe('isValidCoordinate', () => {
    it('should validate correct coordinates', () => {
      expect(isValidCoordinate(40.7128, -74.006)).toBe(true)
      expect(isValidCoordinate(0, 0)).toBe(true)
      expect(isValidCoordinate(90, 180)).toBe(true)
      expect(isValidCoordinate(-90, -180)).toBe(true)
    })

    it('should reject invalid latitudes', () => {
      expect(isValidCoordinate(91, 0)).toBe(false)
      expect(isValidCoordinate(-91, 0)).toBe(false)
    })

    it('should reject invalid longitudes', () => {
      expect(isValidCoordinate(0, 181)).toBe(false)
      expect(isValidCoordinate(0, -181)).toBe(false)
    })

    it('should reject NaN values', () => {
      expect(isValidCoordinate(NaN, 0)).toBe(false)
      expect(isValidCoordinate(0, NaN)).toBe(false)
    })

    it('should reject non-number values', () => {
      expect(isValidCoordinate('40.7128' as any, -74.006)).toBe(false)
      expect(isValidCoordinate(40.7128, null as any)).toBe(false)
      expect(isValidCoordinate(undefined as any, 0)).toBe(false)
    })
  })

  describe('formatDistance', () => {
    it('should format very short distances', () => {
      expect(formatDistance(0.05)).toBe('< 0.1 miles')
      expect(formatDistance(0.09)).toBe('< 0.1 miles')
    })

    it('should format distances under 1 mile', () => {
      expect(formatDistance(0.5)).toBe('< 1 mile')
      expect(formatDistance(0.99)).toBe('< 1 mile')
    })

    it('should format 1 mile as singular', () => {
      expect(formatDistance(1.0)).toBe('1 mile')
    })

    it('should format distances with 1 decimal place', () => {
      expect(formatDistance(5.234)).toBe('5.2 miles')
      expect(formatDistance(10.678)).toBe('10.7 miles')
      expect(formatDistance(25.5)).toBe('25.5 miles')
    })

    it('should handle max distance parameter', () => {
      expect(formatDistance(150, 100)).toBe('100+ miles')
      expect(formatDistance(99, 100)).toBe('99 miles')
    })

    it('should round correctly', () => {
      expect(formatDistance(5.24)).toBe('5.2 miles')
      expect(formatDistance(5.25)).toBe('5.3 miles')
    })
  })

  describe('formatDistanceShort', () => {
    it('should format short form correctly', () => {
      expect(formatDistanceShort(0.05)).toBe('< 0.1 mi')
      expect(formatDistanceShort(0.5)).toBe('< 1 mi')
      expect(formatDistanceShort(5.234)).toBe('5.2 mi')
      expect(formatDistanceShort(150, 100)).toBe('100+ mi')
    })
  })

  describe('milesToMeters and metersToMiles', () => {
    it('should convert miles to meters', () => {
      expect(milesToMeters(1)).toBeCloseTo(1609.34, 1)
      expect(milesToMeters(10)).toBeCloseTo(16093.4, 1)
    })

    it('should convert meters to miles', () => {
      expect(metersToMiles(1609.34)).toBeCloseTo(1, 2)
      expect(metersToMiles(16093.4)).toBeCloseTo(10, 2)
    })

    it('should be inverse operations', () => {
      const miles = 42.195
      const meters = milesToMeters(miles)
      const backToMiles = metersToMiles(meters)
      expect(backToMiles).toBeCloseTo(miles, 5)
    })

    it('should handle zero', () => {
      expect(milesToMeters(0)).toBe(0)
      expect(metersToMiles(0)).toBe(0)
    })

    it('should handle negative values', () => {
      expect(milesToMeters(-5)).toBeLessThan(0)
      expect(metersToMiles(-5000)).toBeLessThan(0)
    })
  })
})
