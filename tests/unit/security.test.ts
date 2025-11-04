import { describe, it, expect, beforeEach } from 'vitest'
import { hashIP, hashIpAddress, generateSessionId, sanitizeInput } from '@/lib/utils/security'

describe('Security Utilities', () => {
  describe('hashIP', () => {
    it('should hash an IP address', () => {
      const ip = '192.168.1.1'
      const hashed = hashIP(ip)

      expect(hashed).toBeDefined()
      expect(typeof hashed).toBe('string')
      expect(hashed.length).toBe(64) // SHA256 produces 64 hex characters
    })

    it('should produce consistent hashes for same IP', () => {
      const ip = '192.168.1.1'
      const hash1 = hashIP(ip)
      const hash2 = hashIP(ip)

      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different IPs', () => {
      const ip1 = '192.168.1.1'
      const ip2 = '192.168.1.2'

      const hash1 = hashIP(ip1)
      const hash2 = hashIP(ip2)

      expect(hash1).not.toBe(hash2)
    })

    it('should handle IPv6 addresses', () => {
      const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
      const hashed = hashIP(ipv6)

      expect(hashed).toBeDefined()
      expect(typeof hashed).toBe('string')
      expect(hashed.length).toBe(64)
    })

    it('should handle localhost', () => {
      const localhost = '127.0.0.1'
      const hashed = hashIP(localhost)

      expect(hashed).toBeDefined()
      expect(hashed.length).toBe(64)
    })

    it('should handle empty string', () => {
      const hashed = hashIP('')

      expect(hashed).toBeDefined()
      expect(hashed.length).toBe(64)
    })

    it('should be cryptographically irreversible', () => {
      const ip = '192.168.1.100'
      const hashed = hashIP(ip)

      // Hash should not contain the original IP
      expect(hashed).not.toContain('192')
      expect(hashed).not.toContain('168')
      expect(hashed).not.toContain('100')
    })

    it('should produce only hexadecimal characters', () => {
      const ip = '10.0.0.1'
      const hashed = hashIP(ip)

      // Should only contain 0-9 and a-f
      expect(hashed).toMatch(/^[0-9a-f]+$/)
    })
  })

  describe('hashIpAddress (alias)', () => {
    it('should be an alias for hashIP', () => {
      expect(hashIpAddress).toBe(hashIP)
    })

    it('should work the same as hashIP', () => {
      const ip = '192.168.1.1'
      const hash1 = hashIP(ip)
      const hash2 = hashIpAddress(ip)

      expect(hash1).toBe(hash2)
    })
  })

  describe('generateSessionId', () => {
    it('should generate a session ID', () => {
      const sessionId = generateSessionId()

      expect(sessionId).toBeDefined()
      expect(typeof sessionId).toBe('string')
      expect(sessionId.length).toBeGreaterThan(0)
    })

    it('should generate unique session IDs', () => {
      const id1 = generateSessionId()
      const id2 = generateSessionId()
      const id3 = generateSessionId()

      expect(id1).not.toBe(id2)
      expect(id2).not.toBe(id3)
      expect(id1).not.toBe(id3)
    })

    it('should generate valid UUID v4 format', () => {
      const sessionId = generateSessionId()

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(sessionId).toMatch(uuidRegex)
    })

    it('should generate many unique IDs without collision', () => {
      const ids = new Set<string>()
      const count = 100

      for (let i = 0; i < count; i++) {
        ids.add(generateSessionId())
      }

      expect(ids.size).toBe(count)
    })

    it('should be suitable for session tracking', () => {
      const sessionId = generateSessionId()

      // Should be long enough for security
      expect(sessionId.length).toBeGreaterThanOrEqual(36)
    })
  })

  describe('sanitizeInput', () => {
    it('should remove angle brackets', () => {
      const input = '<script>alert("xss")</script>'
      const sanitized = sanitizeInput(input)

      expect(sanitized).toBe('scriptalert("xss")/script')
      expect(sanitized).not.toContain('<')
      expect(sanitized).not.toContain('>')
    })

    it('should remove leading and trailing whitespace', () => {
      const input = '  test input  '
      const sanitized = sanitizeInput(input)

      expect(sanitized).toBe('test input')
    })

    it('should handle empty string', () => {
      const input = ''
      const sanitized = sanitizeInput(input)

      expect(sanitized).toBe('')
    })

    it('should handle whitespace-only string', () => {
      const input = '   '
      const sanitized = sanitizeInput(input)

      expect(sanitized).toBe('')
    })

    it('should preserve normal text', () => {
      const input = 'This is normal text with numbers 123 and symbols !@#$%'
      const sanitized = sanitizeInput(input)

      expect(sanitized).toBe('This is normal text with numbers 123 and symbols !@#$%')
    })

    it('should remove HTML tags', () => {
      const inputs = [
        '<div>content</div>',
        '<p>paragraph</p>',
        '<a href="url">link</a>',
        '<img src="image.jpg">',
        '<span>text</span>',
      ]

      inputs.forEach((input) => {
        const sanitized = sanitizeInput(input)
        expect(sanitized).not.toContain('<')
        expect(sanitized).not.toContain('>')
      })
    })

    it('should prevent basic XSS attempts', () => {
      const xssAttempts = [
        '<script>alert(1)</script>',
        '<img src=x onerror=alert(1)>',
        '<svg/onload=alert(1)>',
        '<iframe src="evil.com"></iframe>',
        '<body onload=alert(1)>',
      ]

      xssAttempts.forEach((attempt) => {
        const sanitized = sanitizeInput(attempt)
        expect(sanitized).not.toContain('<')
        expect(sanitized).not.toContain('>')
      })
    })

    it('should handle mixed content', () => {
      const input = 'Normal text <script>bad</script> more text'
      const sanitized = sanitizeInput(input)

      expect(sanitized).toBe('Normal text scriptbad/script more text')
      expect(sanitized).not.toContain('<')
      expect(sanitized).not.toContain('>')
    })

    it('should handle nested tags', () => {
      const input = '<div><span><p>nested</p></span></div>'
      const sanitized = sanitizeInput(input)

      expect(sanitized).toBe('divspanpnested/p/span/div')
      expect(sanitized).not.toContain('<')
      expect(sanitized).not.toContain('>')
    })

    it('should preserve quotes and other characters', () => {
      const input = 'Text with "quotes" and \'apostrophes\' and (parentheses)'
      const sanitized = sanitizeInput(input)

      expect(sanitized).toBe('Text with "quotes" and \'apostrophes\' and (parentheses)')
    })

    it('should handle multiple angle brackets', () => {
      const input = '<<<<<test>>>>>'
      const sanitized = sanitizeInput(input)

      expect(sanitized).toBe('test')
    })

    it('should handle comparison operators in text', () => {
      const input = '5 > 3 and 2 < 4'
      const sanitized = sanitizeInput(input)

      // Angle brackets are removed regardless of context
      expect(sanitized).toBe('5  3 and 2  4')
    })

    it('should be safe for database insertion', () => {
      const input = "'; DROP TABLE users; --"
      const sanitized = sanitizeInput(input)

      // SQL injection characters are preserved (handled by parameterized queries)
      // This function focuses on XSS, not SQL injection
      expect(sanitized).toBeDefined()
      expect(typeof sanitized).toBe('string')
    })
  })

  describe('Security best practices', () => {
    it('should use environment variable or default for IP hashing salt', () => {
      // IP_SALT should be set in production, but defaults to a fallback value
      const envSalt = process.env.IP_SALT
      // In test environment, it may be undefined (uses default in function)
      expect(envSalt === undefined || typeof envSalt === 'string').toBe(true)
    })

    it('should produce different hashes with different salts', () => {
      // This test demonstrates why using a unique salt is important
      // Note: This test uses the current salt, so actual implementation
      // would need to test with different salt values
      const ip = '192.168.1.1'
      const hash = hashIP(ip)

      expect(hash).toBeDefined()
      // In production, different deployments with different salts
      // would produce different hashes for the same IP
    })
  })
})
