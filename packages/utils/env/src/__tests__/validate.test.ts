import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  validateApiEnv,
  validateApiEnvSafe,
  apiEnvIsValid,
  validateApiEnvPath,
  validateWebEnv,
  validateWebEnvSafe,
  webEnvIsValid,
  validateWebEnvPath,
  validateDocEnv,
  validateDocEnvSafe,
  docEnvIsValid,
  validateAllEnv,
  validateAllEnvSafe,
  allEnvIsValid,
} from '../validate'

describe('API Environment Validation', () => {
  const validApiEnv = {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NODE_ENV: 'development' as const,
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    API_PORT: 3001,
    AUTH_SECRET: 'test-secret-key-at-least-32-chars-long',
  }

  describe('validateApiEnv', () => {
    it('should validate correct API environment', () => {
      const result = validateApiEnv(validApiEnv)
      expect(result).toMatchObject({
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        API_PORT: 3001,
        AUTH_SECRET: 'test-secret-key-at-least-32-chars-long',
      })
    })

    it('should throw on missing required fields', () => {
      const { DATABASE_URL, ...incomplete } = validApiEnv
      expect(() => validateApiEnv(incomplete)).toThrow()
    })

    it('should throw on invalid DATABASE_URL', () => {
      const invalid = { ...validApiEnv, DATABASE_URL: '' }
      expect(() => validateApiEnv(invalid)).toThrow()
    })

    it('should throw on invalid API_PORT', () => {
      const invalid = { ...validApiEnv, API_PORT: 999999 }
      expect(() => validateApiEnv(invalid)).toThrow()
    })

    it('should apply default API_PORT', () => {
      const { API_PORT, ...withoutPort } = validApiEnv
      const result = validateApiEnv(withoutPort)
      expect(result.API_PORT).toBe(3001)
    })

    it('should coerce string port to number', () => {
      const withStringPort = { ...validApiEnv, API_PORT: '3002' as any }
      const result = validateApiEnv(withStringPort)
      expect(result.API_PORT).toBe(3002)
      expect(typeof result.API_PORT).toBe('number')
    })

    it('should accept optional DEV_AUTH_KEY', () => {
      const withDevKey = { ...validApiEnv, DEV_AUTH_KEY: 'dev-key-123' }
      const result = validateApiEnv(withDevKey)
      expect(result.DEV_AUTH_KEY).toBe('dev-key-123')
    })

    it('should handle missing DEV_AUTH_KEY', () => {
      const result = validateApiEnv(validApiEnv)
      expect(result.DEV_AUTH_KEY).toBeUndefined()
    })
  })

  describe('validateApiEnvSafe', () => {
    it('should return success for valid environment', () => {
      const result = validateApiEnvSafe(validApiEnv)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db')
      }
    })

    it('should return error for invalid environment', () => {
      const { DATABASE_URL, ...incomplete } = validApiEnv
      const result = validateApiEnvSafe(incomplete)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })

    it('should not throw on invalid input', () => {
      expect(() => validateApiEnvSafe({})).not.toThrow()
    })
  })

  describe('apiEnvIsValid', () => {
    it('should return true for valid environment', () => {
      expect(apiEnvIsValid(validApiEnv)).toBe(true)
    })

    it('should return false for invalid environment', () => {
      expect(apiEnvIsValid({})).toBe(false)
    })

    it('should return false for missing required fields', () => {
      const { AUTH_SECRET, ...incomplete } = validApiEnv
      expect(apiEnvIsValid(incomplete)).toBe(false)
    })
  })

  describe('validateApiEnvPath', () => {
    it('should validate specific field - DATABASE_URL', () => {
      const result = validateApiEnvPath('postgresql://localhost:5432/db', 'DATABASE_URL')
      expect(result).toBe('postgresql://localhost:5432/db')
    })

    it('should validate specific field - API_PORT', () => {
      const result = validateApiEnvPath(3002, 'API_PORT')
      expect(result).toBe(3002)
    })

    it('should throw on invalid field value', () => {
      expect(() => validateApiEnvPath('', 'DATABASE_URL')).toThrow()
    })

    it('should coerce string to number for API_PORT', () => {
      const result = validateApiEnvPath('3003' as any, 'API_PORT')
      expect(result).toBe(3003)
    })
  })
})

describe('Web Environment Validation', () => {
  const validWebEnv = {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NODE_ENV: 'development' as const,
    API_URL: 'http://localhost:3001',
    NEXT_PUBLIC_SHOW_AUTH_LOGS: false,
    NEXT_PUBLIC_DEBUG: '',
    REACT_SCAN: false,
    MILLION_LINT: false,
  }

  describe('validateWebEnv', () => {
    it('should validate correct Web environment', () => {
      const result = validateWebEnv(validWebEnv)
      expect(result).toMatchObject({
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        API_URL: 'http://localhost:3001',
        NODE_ENV: 'development',
      })
    })

    it('should apply default values', () => {
      const minimal = {
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        API_URL: 'http://localhost:3001',
      }
      const result = validateWebEnv(minimal)
      expect(result.NODE_ENV).toBe('development')
      expect(result.NEXT_PUBLIC_SHOW_AUTH_LOGS).toBe(false)
      expect(result.REACT_SCAN).toBe(false)
      expect(result.MILLION_LINT).toBe(false)
      expect(result.NEXT_PUBLIC_DEBUG).toEqual({ patterns: [], enableAll: false })
    })

    it('should parse debug scopes', () => {
      const withDebug = { ...validWebEnv, NEXT_PUBLIC_DEBUG: 'middleware/*,api/users' }
      const result = validateWebEnv(withDebug)
      expect(result.NEXT_PUBLIC_DEBUG).toEqual({
        patterns: ['middleware/*', 'api/users'],
        enableAll: false,
      })
    })

    it('should handle NEXT_PUBLIC_DOC_URL', () => {
      const withDocs = { ...validWebEnv, NEXT_PUBLIC_DOC_URL: 'http://localhost:3020/' }
      const result = validateWebEnv(withDocs)
      expect(result.NEXT_PUBLIC_DOC_URL).toBe('http://localhost:3020')
    })

    it('should coerce boolean strings', () => {
      const withBoolStrings = {
        ...validWebEnv,
        REACT_SCAN: 'true' as any,
        MILLION_LINT: 'false' as any, // Note: coerce.boolean treats any non-empty string as true
        NEXT_PUBLIC_SHOW_AUTH_LOGS: '1' as any,
      }
      const result = validateWebEnv(withBoolStrings)
      expect(result.REACT_SCAN).toBe(true)
      expect(result.MILLION_LINT).toBe(true) // Zod coerce.boolean: non-empty string = true
      expect(result.NEXT_PUBLIC_SHOW_AUTH_LOGS).toBe(true)
    })

    it('should coerce actual boolean values', () => {
      const withActualBools = {
        ...validWebEnv,
        REACT_SCAN: true,
        MILLION_LINT: false,
        NEXT_PUBLIC_SHOW_AUTH_LOGS: true,
      }
      const result = validateWebEnv(withActualBools)
      expect(result.REACT_SCAN).toBe(true)
      expect(result.MILLION_LINT).toBe(false)
      expect(result.NEXT_PUBLIC_SHOW_AUTH_LOGS).toBe(true)
    })

    it('should coerce number 0 and 1 to boolean', () => {
      const withNumbers = {
        ...validWebEnv,
        REACT_SCAN: 1 as any,
        MILLION_LINT: 0 as any,
      }
      const result = validateWebEnv(withNumbers)
      expect(result.REACT_SCAN).toBe(true)
      expect(result.MILLION_LINT).toBe(false)
    })

    it('should handle React Scan config', () => {
      const withReactScan = {
        ...validWebEnv,
        REACT_SCAN_GIT_COMMIT_HASH: 'abc123',
        REACT_SCAN_GIT_BRANCH: 'main',
        REACT_SCAN_TOKEN: 'token-xyz',
      }
      const result = validateWebEnv(withReactScan)
      expect(result.REACT_SCAN_GIT_COMMIT_HASH).toBe('abc123')
      expect(result.REACT_SCAN_GIT_BRANCH).toBe('main')
      expect(result.REACT_SCAN_TOKEN).toBe('token-xyz')
    })

    it('should coerce DOC_PORT to number', () => {
      const withDocPort = { ...validWebEnv, NEXT_PUBLIC_DOC_PORT: '3020' as any }
      const result = validateWebEnv(withDocPort)
      expect(result.NEXT_PUBLIC_DOC_PORT).toBe(3020)
    })
  })

  describe('validateWebEnvSafe', () => {
    it('should return success for valid environment', () => {
      const result = validateWebEnvSafe(validWebEnv)
      expect(result.success).toBe(true)
    })

    it('should return error for invalid environment', () => {
      const result = validateWebEnvSafe({})
      expect(result.success).toBe(false)
    })
  })

  describe('webEnvIsValid', () => {
    it('should return true for valid environment', () => {
      expect(webEnvIsValid(validWebEnv)).toBe(true)
    })

    it('should return false for invalid environment', () => {
      expect(webEnvIsValid({})).toBe(false)
    })
  })

  describe('validateWebEnvPath', () => {
    it('should validate specific field - API_URL', () => {
      const result = validateWebEnvPath('http://api.example.com', 'API_URL')
      expect(result).toBe('http://api.example.com')
    })

    it('should validate specific field - REACT_SCAN', () => {
      const result = validateWebEnvPath(true, 'REACT_SCAN')
      expect(result).toBe(true)
    })

    it('should throw on invalid field value', () => {
      expect(() => validateWebEnvPath('not-a-url', 'API_URL')).toThrow()
    })
  })
})

describe('Doc Environment Validation', () => {
  const validDocEnv = {
    NODE_ENV: 'development' as const,
  }

  describe('validateDocEnv', () => {
    it('should validate correct Doc environment', () => {
      const result = validateDocEnv(validDocEnv)
      expect(result.NODE_ENV).toBe('development')
    })

    it('should apply default NODE_ENV', () => {
      const result = validateDocEnv({})
      expect(result.NODE_ENV).toBe('development')
    })

    it('should accept production NODE_ENV', () => {
      const prodEnv = { NODE_ENV: 'production' as const }
      const result = validateDocEnv(prodEnv)
      expect(result.NODE_ENV).toBe('production')
    })

    it('should accept test NODE_ENV', () => {
      const testEnv = { NODE_ENV: 'test' as const }
      const result = validateDocEnv(testEnv)
      expect(result.NODE_ENV).toBe('test')
    })

    it('should reject invalid NODE_ENV', () => {
      const invalid = { NODE_ENV: 'invalid' as any }
      expect(() => validateDocEnv(invalid)).toThrow()
    })
  })

  describe('validateDocEnvSafe', () => {
    it('should return success for valid environment', () => {
      const result = validateDocEnvSafe(validDocEnv)
      expect(result.success).toBe(true)
    })

    it('should return success for empty object (uses defaults)', () => {
      const result = validateDocEnvSafe({})
      expect(result.success).toBe(true)
    })
  })

  describe('docEnvIsValid', () => {
    it('should return true for valid environment', () => {
      expect(docEnvIsValid(validDocEnv)).toBe(true)
    })

    it('should return true for empty object (uses defaults)', () => {
      expect(docEnvIsValid({})).toBe(true)
    })
  })
})

describe('All Apps Environment Validation', () => {
  const validAllEnv = {
    api: {
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NODE_ENV: 'development' as const,
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      API_PORT: 3001,
      AUTH_SECRET: 'test-secret-key-at-least-32-chars-long',
    },
    web: {
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NODE_ENV: 'development' as const,
      API_URL: 'http://localhost:3001',
      NEXT_PUBLIC_SHOW_AUTH_LOGS: false,
      NEXT_PUBLIC_DEBUG: '',
      REACT_SCAN: false,
      MILLION_LINT: false,
    },
    doc: {
      NODE_ENV: 'development' as const,
    },
  }

  describe('validateAllEnv', () => {
    it('should validate all apps environments', () => {
      const result = validateAllEnv(validAllEnv)
      expect(result.api.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db')
      expect(result.web.API_URL).toBe('http://localhost:3001')
      expect(result.doc.NODE_ENV).toBe('development')
    })

    it('should throw on invalid api environment', () => {
      const invalid = { ...validAllEnv, api: {} }
      expect(() => validateAllEnv(invalid)).toThrow()
    })

    it('should throw on invalid web environment', () => {
      const invalid = { ...validAllEnv, web: {} }
      expect(() => validateAllEnv(invalid)).toThrow()
    })

    it('should accept minimal doc environment', () => {
      const minimal = { ...validAllEnv, doc: {} }
      const result = validateAllEnv(minimal)
      expect(result.doc.NODE_ENV).toBe('development')
    })
  })

  describe('validateAllEnvSafe', () => {
    it('should return success for valid environments', () => {
      const result = validateAllEnvSafe(validAllEnv)
      expect(result.success).toBe(true)
    })

    it('should return error for invalid environments', () => {
      const invalid = { api: {}, web: {}, doc: {} }
      const result = validateAllEnvSafe(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('allEnvIsValid', () => {
    it('should return true for valid environments', () => {
      expect(allEnvIsValid(validAllEnv)).toBe(true)
    })

    it('should return false for invalid environments', () => {
      const invalid = { api: {}, web: {}, doc: {} }
      expect(allEnvIsValid(invalid)).toBe(false)
    })
  })
})

describe('Edge Cases and Error Handling', () => {
  describe('Port validation', () => {
    it('should reject port below minimum', () => {
      const env = {
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        NODE_ENV: 'development' as const,
        DATABASE_URL: 'postgresql://localhost:5432/db',
        API_PORT: 0,
        AUTH_SECRET: 'test-secret',
      }
      expect(() => validateApiEnv(env)).toThrow()
    })

    it('should reject port above maximum', () => {
      const env = {
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        NODE_ENV: 'development' as const,
        DATABASE_URL: 'postgresql://localhost:5432/db',
        API_PORT: 70000,
        AUTH_SECRET: 'test-secret',
      }
      expect(() => validateApiEnv(env)).toThrow()
    })

    it('should accept minimum valid port', () => {
      const env = {
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        NODE_ENV: 'development' as const,
        DATABASE_URL: 'postgresql://localhost:5432/db',
        API_PORT: 1,
        AUTH_SECRET: 'test-secret',
      }
      const result = validateApiEnv(env)
      expect(result.API_PORT).toBe(1)
    })

    it('should accept maximum valid port', () => {
      const env = {
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        NODE_ENV: 'development' as const,
        DATABASE_URL: 'postgresql://localhost:5432/db',
        API_PORT: 65535,
        AUTH_SECRET: 'test-secret',
      }
      const result = validateApiEnv(env)
      expect(result.API_PORT).toBe(65535)
    })
  })

  describe('URL validation', () => {
    it('should reject malformed URLs', () => {
      const env = {
        NEXT_PUBLIC_APP_URL: 'not-a-url',
        API_URL: 'http://localhost:3001',
      }
      expect(() => validateWebEnv(env)).toThrow()
    })

    it('should accept valid HTTPS URLs', () => {
      const env = {
        NEXT_PUBLIC_APP_URL: 'https://example.com',
        API_URL: 'https://api.example.com',
      }
      const result = validateWebEnv(env)
      expect(result.NEXT_PUBLIC_APP_URL).toBe('https://example.com')
      expect(result.API_URL).toBe('https://api.example.com')
    })

    it('should trim trailing slashes from URLs', () => {
      const env = {
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000/',
        API_URL: 'http://localhost:3001/',
      }
      const result = validateWebEnv(env)
      expect(result.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000')
      expect(result.API_URL).toBe('http://localhost:3001')
    })
  })

  describe('NODE_ENV validation', () => {
    it('should accept all valid NODE_ENV values', () => {
      const envs = ['development', 'production', 'test'] as const
      envs.forEach((nodeEnv) => {
        const env = { NODE_ENV: nodeEnv }
        const result = validateDocEnv(env)
        expect(result.NODE_ENV).toBe(nodeEnv)
      })
    })

    it('should reject invalid NODE_ENV values', () => {
      const env = { NODE_ENV: 'staging' as any }
      expect(() => validateDocEnv(env)).toThrow()
    })
  })
})
