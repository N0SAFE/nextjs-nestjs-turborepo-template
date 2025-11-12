import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { trimTrailingSlash, guardedUrl, parseDebugScopes } from '../utils'

describe('trimTrailingSlash', () => {
  it('should remove trailing slash from URL', () => {
    expect(trimTrailingSlash('http://example.com/')).toBe('http://example.com')
  })

  it('should not modify URL without trailing slash', () => {
    expect(trimTrailingSlash('http://example.com')).toBe('http://example.com')
  })

  it('should handle multiple trailing slashes', () => {
    expect(trimTrailingSlash('http://example.com//')).toBe('http://example.com/')
  })

  it('should handle empty string', () => {
    expect(trimTrailingSlash('')).toBe('')
  })

  it('should handle single slash', () => {
    expect(trimTrailingSlash('/')).toBe('')
  })
})

describe('guardedUrl', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  describe('in development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should accept valid URLs', () => {
      const schema = guardedUrl('TEST_URL', 'http://fallback.com')
      expect(schema.parse('http://example.com')).toBe('http://example.com')
    })

    it('should reject empty values (URL validator fails first)', () => {
      const schema = guardedUrl('TEST_URL', 'http://fallback.com')
      // The .url() validator rejects empty strings before superRefine can provide fallback
      expect(() => schema.parse('')).toThrow()
    })

    it('should trim trailing slashes', () => {
      const schema = guardedUrl('TEST_URL', 'http://fallback.com')
      expect(schema.parse('http://example.com/')).toBe('http://example.com')
    })

    it('should trim trailing slashes from provided URLs', () => {
      const schema = guardedUrl('TEST_URL', 'http://fallback.com/')
      // Trailing slash trimming happens on the provided value after validation
      expect(schema.parse('http://provided.com/')).toBe('http://provided.com')
    })

    it('should reject invalid URLs', () => {
      const schema = guardedUrl('TEST_URL', 'http://fallback.com')
      expect(() => schema.parse('not-a-url')).toThrow()
    })
  })

  describe('in production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
    })

    it('should accept valid URLs', () => {
      const schema = guardedUrl('TEST_URL', 'http://fallback.com')
      expect(schema.parse('http://example.com')).toBe('http://example.com')
    })

    it('should reject empty values in production', () => {
      const schema = guardedUrl('TEST_URL', 'http://fallback.com')
      expect(() => schema.parse('')).toThrow(/required in production/)
    })

    it('should trim trailing slashes in production', () => {
      const schema = guardedUrl('TEST_URL', 'http://fallback.com')
      expect(schema.parse('http://example.com/')).toBe('http://example.com')
    })
  })

  describe('in test mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test'
    })

    it('should reject empty values like development', () => {
      const schema = guardedUrl('TEST_URL', 'http://fallback.com')
      // URL validator rejects empty strings before env mode check
      expect(() => schema.parse('')).toThrow()
    })
  })
})

describe('parseDebugScopes', () => {
  it('should return empty patterns for empty string', () => {
    expect(parseDebugScopes('')).toEqual({
      patterns: [],
      enableAll: false,
    })
  })

  it('should return empty patterns for whitespace only', () => {
    expect(parseDebugScopes('   ')).toEqual({
      patterns: [],
      enableAll: false,
    })
  })

  it('should parse single scope', () => {
    expect(parseDebugScopes('middleware/auth')).toEqual({
      patterns: ['middleware/auth'],
      enableAll: false,
    })
  })

  it('should parse multiple scopes', () => {
    expect(parseDebugScopes('middleware/auth,api/users,db/query')).toEqual({
      patterns: ['middleware/auth', 'api/users', 'db/query'],
      enableAll: false,
    })
  })

  it('should handle wildcard patterns', () => {
    expect(parseDebugScopes('middleware/*')).toEqual({
      patterns: ['middleware/*'],
      enableAll: false,
    })
  })

  it('should handle nested wildcard patterns', () => {
    expect(parseDebugScopes('middleware/**')).toEqual({
      patterns: ['middleware/**'],
      enableAll: false,
    })
  })

  it('should handle patterns with special characters', () => {
    // Brace patterns are not expanded - they're treated as literals
    expect(parseDebugScopes('middleware/{auth,router,cors}/*')).toEqual({
      patterns: ['middleware/{auth', 'router', 'cors}/*'],
      enableAll: false,
    })
  })

  it('should detect enable-all wildcard', () => {
    expect(parseDebugScopes('*')).toEqual({
      patterns: ['*'],
      enableAll: true,
    })
  })

  it('should detect enable-all in mixed patterns', () => {
    expect(parseDebugScopes('middleware/auth,*,api/users')).toEqual({
      patterns: ['middleware/auth', '*', 'api/users'],
      enableAll: true,
    })
  })

  it('should trim whitespace from scopes', () => {
    expect(parseDebugScopes(' middleware/auth , api/users , db/query ')).toEqual({
      patterns: ['middleware/auth', 'api/users', 'db/query'],
      enableAll: false,
    })
  })

  it('should filter out empty scopes', () => {
    expect(parseDebugScopes('middleware/auth,,api/users')).toEqual({
      patterns: ['middleware/auth', 'api/users'],
      enableAll: false,
    })
  })

  it('should handle complex mixed patterns', () => {
    expect(parseDebugScopes('middleware/*,auth/test,api/{users,posts}/**')).toEqual({
      patterns: ['middleware/*', 'auth/test', 'api/{users', 'posts}/**'],
      enableAll: false,
    })
  })
})
