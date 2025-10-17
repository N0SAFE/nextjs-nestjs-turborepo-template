import { describe, it, expect, beforeEach } from 'vitest'
import {
  Validator,
  validateFeature,
  validateCustomModule,
} from '../src/utils/validator.js'
import type { Feature, CustomModule } from '../src/types/index.js'

describe('Validation Utils', () => {
  let validator: Validator

  beforeEach(() => {
    validator = new Validator()
  })
  

  describe('Validator Instance', () => {
    it('should create validator instance', () => {
      expect(validator).toBeInstanceOf(Validator)
    })

    it('should have addError method', () => {
      expect(typeof validator.addError).toBe('function')
    })

    it('should have addWarning method', () => {
      expect(typeof validator.addWarning).toBe('function')
    })
  })

  describe('Feature Validation', () => {
    it('should validate complete feature', () => {
      const feature: Feature = {
        id: 'auth',
        name: 'Authentication',
        category: 'core',
        files: ['auth.ts', 'auth.config.ts'],
        dependencies: [],
      }

      const result = validateFeature(feature)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when id is missing', () => {
      const feature = {
        name: 'Authentication',
        category: 'core',
        files: ['auth.ts'],
      } as Feature

      const result = validateFeature(feature)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.field === 'id')).toBe(true)
    })

    it('should fail when name is missing', () => {
      const feature = {
        id: 'auth',
        category: 'core',
        files: ['auth.ts'],
      } as Feature

      const result = validateFeature(feature)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.field === 'name')).toBe(true)
    })

    it('should fail when category is missing', () => {
      const feature = {
        id: 'auth',
        name: 'Authentication',
        files: ['auth.ts'],
      } as Feature

      const result = validateFeature(feature)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.field === 'category')).toBe(true)
    })

    it('should warn when files array is empty', () => {
      const feature: Feature = {
        id: 'auth',
        name: 'Authentication',
        category: 'core',
        files: [],
        dependencies: [],
      }

      const result = validateFeature(feature)

      expect(result.warnings.some(w => w.field === 'files')).toBe(true)
    })

    it('should validate feature with dependencies', () => {
      const feature: Feature = {
        id: 'auth',
        name: 'Authentication',
        category: 'core',
        files: ['auth.ts'],
        dependencies: ['database', 'cache'],
      }

      const result = validateFeature(feature)

      expect(result.valid).toBe(true)
    })

    it('should fail with invalid dependencies', () => {
      const feature = {
        id: 'auth',
        name: 'Authentication',
        category: 'core',
        files: ['auth.ts'],
        dependencies: [123, null],
      } as unknown as Feature

      const result = validateFeature(feature)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.field === 'dependencies')).toBe(true)
    })

    it('should validate feature with optional fields', () => {
      const feature: Feature = {
        id: 'database',
        name: 'Database',
        category: 'core',
        description: 'Database integration',
        files: ['db.ts', 'db.config.ts'],
        dependencies: ['auth'],
      }

      const result = validateFeature(feature)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Custom Module Validation', () => {
    it('should validate complete module', () => {
      const module: CustomModule = {
        id: 'my-module',
        name: 'My Module',
        version: '1.0.0',
        files: {
          'index.ts': {
            path: 'src/index.ts',
            content: 'export default module',
          },
        },
      }

      const result = validateCustomModule(module)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when id is missing', () => {
      const module = {
        name: 'My Module',
        version: '1.0.0',
        files: {
          'index.ts': {
            path: 'src/index.ts',
            content: 'export default module',
          },
        },
      } as CustomModule

      const result = validateCustomModule(module)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.field === 'id')).toBe(true)
    })

    it('should fail when name is missing', () => {
      const module = {
        id: 'my-module',
        version: '1.0.0',
        files: {
          'index.ts': {
            path: 'src/index.ts',
            content: 'export default module',
          },
        },
      } as CustomModule

      const result = validateCustomModule(module)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.field === 'name')).toBe(true)
    })

    it('should fail when version is missing', () => {
      const module = {
        id: 'my-module',
        name: 'My Module',
        files: {
          'index.ts': {
            path: 'src/index.ts',
            content: 'export default module',
          },
        },
      } as CustomModule

      const result = validateCustomModule(module)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.field === 'version')).toBe(true)
    })

    it('should fail when files is empty', () => {
      const module: CustomModule = {
        id: 'my-module',
        name: 'My Module',
        version: '1.0.0',
        files: {},
      }

      const result = validateCustomModule(module)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.field === 'files')).toBe(true)
    })

    it('should fail when file path is missing', () => {
      const module = {
        id: 'my-module',
        name: 'My Module',
        version: '1.0.0',
        files: {
          'index.ts': {
            content: 'export default module',
          },
        },
      } as unknown as CustomModule

      const result = validateCustomModule(module)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.field.includes('path'))).toBe(true)
    })

    it('should warn when file content is empty', () => {
      const module: CustomModule = {
        id: 'my-module',
        name: 'My Module',
        version: '1.0.0',
        files: {
          'index.ts': {
            path: 'src/index.ts',
            content: '',
          },
        },
      }

      const result = validateCustomModule(module)

      expect(result.warnings.some(w => w.field.includes('content'))).toBe(true)
    })

    it('should validate module with multiple files', () => {
      const module: CustomModule = {
        id: 'my-module',
        name: 'My Module',
        version: '1.0.0',
        files: {
          'index.ts': {
            path: 'src/index.ts',
            content: 'export default module',
          },
          'types.ts': {
            path: 'src/types.ts',
            content: 'export interface MyType {}',
          },
          'utils.ts': {
            path: 'src/utils.ts',
            content: 'export function helper() {}',
          },
        },
      }

      const result = validateCustomModule(module)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Dependency Validation', () => {
    it('should validate when all dependencies exist', () => {
      const featureIds = ['auth', 'database', 'cache']
      const features = new Map<string, Feature>([
        [
          'auth',
          {
            id: 'auth',
            name: 'Auth',
            category: 'core',
            files: ['auth.ts'],
            dependencies: ['database'],
          },
        ],
        [
          'database',
          {
            id: 'database',
            name: 'Database',
            category: 'core',
            files: ['db.ts'],
            dependencies: [],
          },
        ],
        [
          'cache',
          {
            id: 'cache',
            name: 'Cache',
            category: 'utility',
            files: ['cache.ts'],
            dependencies: [],
          },
        ],
      ])

      const result = validator.validateDependencies(featureIds, features)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should error when feature is unknown', () => {
      const featureIds = ['auth', 'unknown']
      const features = new Map<string, Feature>([
        [
          'auth',
          {
            id: 'auth',
            name: 'Auth',
            category: 'core',
            files: ['auth.ts'],
            dependencies: [],
          },
        ],
      ])

      const result = validator.validateDependencies(featureIds, features)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.includes('unknown'))).toBe(true)
    })

    it('should warn about unmet dependencies', () => {
      const featureIds = ['auth']
      const features = new Map<string, Feature>([
        [
          'auth',
          {
            id: 'auth',
            name: 'Auth',
            category: 'core',
            files: ['auth.ts'],
            dependencies: ['database', 'cache'],
          },
        ],
      ])

      const result = validator.validateDependencies(featureIds, features)

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some(w => w.message.includes('depends on'))).toBe(true)
    })
  })

  describe('ValidationResult Structure', () => {
    it('should have correct result structure', () => {
      const feature: Feature = {
        id: 'test',
        name: 'Test',
        category: 'core',
        files: ['test.ts'],
      }

      const result = validateFeature(feature)

      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
      expect(typeof result.valid).toBe('boolean')
      expect(Array.isArray(result.errors)).toBe(true)
      expect(Array.isArray(result.warnings)).toBe(true)
    })

    it('should have correct error structure', () => {
      const feature = {
        name: 'Test',
        category: 'core',
      } as Feature

      const result = validateFeature(feature)

      result.errors.forEach(error => {
        expect(error).toHaveProperty('field')
        expect(error).toHaveProperty('message')
        expect(error).toHaveProperty('severity')
        expect(error.severity).toBe('error')
      })
    })

    it('should have correct warning structure', () => {
      const feature: Feature = {
        id: 'test',
        name: 'Test',
        category: 'core',
        files: [],
      }

      const result = validateFeature(feature)

      result.warnings.forEach(warning => {
        expect(warning).toHaveProperty('field')
        expect(warning).toHaveProperty('message')
        expect(warning).toHaveProperty('severity')
        expect(warning.severity).toBe('warning')
      })
    })
  })

  describe('Validator Methods', () => {
    it('addError should register error', () => {
      validator.addError('test-field', 'Test error')
      const result = validator.validateFeature({} as Feature)

      expect(result.errors.some(e => e.field === 'test-field')).toBe(true)
    })

    it('addWarning should register warning', () => {
      validator.addWarning('test-field', 'Test warning')
      const result = validator.validateFeature({} as Feature)

      expect(result.warnings.some(w => w.field === 'test-field')).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle feature with all optional fields', () => {
      const feature: Feature = {
        id: 'complete',
        name: 'Complete Feature',
        category: 'advanced',
        description: 'A complete feature with all fields',
        files: ['main.ts', 'utils.ts', 'types.ts'],
        dependencies: ['auth', 'database'],
      }

      const result = validateFeature(feature)

      expect(result.valid).toBe(true)
    })

    it('should validate minimal feature', () => {
      const feature: Feature = {
        id: 'minimal',
        name: 'Minimal',
        category: 'util',
        files: ['index.ts'],
      }

      const result = validateFeature(feature)

      expect(result.valid).toBe(true)
    })

    it('should validate module with complex paths', () => {
      const module: CustomModule = {
        id: 'complex',
        name: 'Complex Module',
        version: '2.0.1',
        files: {
          'src/index.ts': {
            path: 'src/index.ts',
            content: 'export',
          },
          'src/lib/helper.ts': {
            path: 'src/lib/helper.ts',
            content: 'function helper() {}',
          },
        },
      }

      const result = validateCustomModule(module)

      expect(result.valid).toBe(true)
    })

    it('should handle large dependency chains', () => {
      const featureIds = ['a', 'b', 'c', 'd', 'e']
      const features = new Map<string, Feature>()

      featureIds.forEach((id, index) => {
        features.set(id, {
          id,
          name: `Feature ${id}`,
          category: 'core',
          files: [`${id}.ts`],
          dependencies: index > 0 ? [featureIds[index - 1]] : [],
        })
      })

      const result = validator.validateDependencies(featureIds, features)

      expect(result.valid).toBe(true)
    })
  })
})
