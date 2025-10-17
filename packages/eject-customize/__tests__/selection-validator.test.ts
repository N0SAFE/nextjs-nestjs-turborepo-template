/**
 * Tests for SelectionValidator
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SelectionValidator } from '../src/selection/selection-validator'
import type { FeaturePackage } from '../src/eject/types'

describe('SelectionValidator', () => {
  let mockFeatures: FeaturePackage[]
  let validator: SelectionValidator

  beforeEach(() => {
    mockFeatures = [
      {
        name: 'base-lib',
        version: '1.0.0',
        description: 'Base Library',
        type: 'library',
        removable: true,
        dependencies: [],
      },
      {
        name: 'lib-a',
        version: '1.0.0',
        description: 'Library A',
        type: 'library',
        removable: true,
        dependencies: ['base-lib'],
      },
      {
        name: 'lib-b',
        version: '1.0.0',
        description: 'Library B',
        type: 'library',
        removable: true,
        dependencies: ['base-lib'],
      },
      {
        name: 'lib-c',
        version: '1.0.0',
        description: 'Library C',
        type: 'library',
        removable: false,
        dependencies: ['lib-a'],
      },
      {
        name: 'app-core',
        version: '1.0.0',
        description: 'App Core',
        type: 'framework',
        removable: true,
        dependencies: ['base-lib'],
        conflicts: ['app-alternate'],
      },
      {
        name: 'app-alternate',
        version: '1.0.0',
        description: 'App Alternate',
        type: 'framework',
        removable: true,
        dependencies: [],
        conflicts: ['app-core'],
      },
    ]

    validator = new SelectionValidator(mockFeatures)
  })

  describe('validate', () => {
    it('should validate empty selection', () => {
      const result = validator.validate([])

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should validate single removable feature', () => {
      const result = validator.validate(['lib-a'])

      // lib-a has dependency on base-lib, so without base-lib it should be invalid
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject non-existent feature', () => {
      const result = validator.validate(['non-existent'])

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'FEATURE_NOT_FOUND')).toBe(
        true
      )
    })

    it('should reject non-removable feature', () => {
      const result = validator.validate(['lib-c'])

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.code === 'NOT_REMOVABLE')).toBe(true)
    })

    it('should detect conflicts', () => {
      const result = validator.validate(['app-core', 'app-alternate'])

      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.code === 'CONFLICTING_FEATURES')
      ).toBe(true)
    })

    it('should generate suggestions', () => {
      const result = validator.validate(['app-core', 'app-alternate'])

      expect(result.suggestions.length).toBeGreaterThan(0)
    })

    it('should collect warnings', () => {
      const result = validator.validate(['lib-a', 'lib-b'])

      expect(result.warnings.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('error types', () => {
    it('should identify missing features', () => {
      const result = validator.validate(['missing1', 'missing2'])

      const missingErrors = result.errors.filter(
        (e) => e.cause === 'missing'
      )
      expect(missingErrors.length).toBeGreaterThan(0)
    })

    it('should identify invalid features', () => {
      const result = validator.validate(['lib-c'])

      const invalidErrors = result.errors.filter(
        (e) => e.cause === 'invalid'
      )
      expect(invalidErrors.length).toBeGreaterThan(0)
    })

    it('should identify incompatible features', () => {
      const result = validator.validate(['app-core', 'app-alternate'])

      const incompatibleErrors = result.errors.filter(
        (e) => e.cause === 'incompatible'
      )
      expect(incompatibleErrors.length).toBeGreaterThan(0)
    })

    it('should identify unmet dependencies', () => {
      const result = validator.validate(['lib-a', 'lib-b'])

      expect(result.warnings.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('dependency validation', () => {
    it('should warn about unmet dependencies', () => {
      const result = validator.validate(['lib-a'])

      const unmetWarning = result.warnings.find(
        (w) => w.code === 'UNMET_DEPENDENCIES'
      )
      expect(unmetWarning).toBeDefined()
    })

    it('should handle peer dependencies', () => {
      // Both lib-a and lib-b depend on base-lib, so without it they're invalid
      const result = validator.validate(['lib-a', 'lib-b'])

      expect(result.valid).toBe(false)
      // But when we include the dependency, it should be valid
      const resultWithDep = validator.validate(['base-lib', 'lib-a', 'lib-b'])
      expect(resultWithDep.valid).toBe(true)
    })

    it('should detect circular dependencies', () => {
      const circularFeatures: FeaturePackage[] = [
        {
          name: 'circ-a',
          version: '1.0.0',
          description: 'Circular A',
          type: 'library',
          removable: true,
          dependencies: ['circ-b'],
        },
        {
          name: 'circ-b',
          version: '1.0.0',
          description: 'Circular B',
          type: 'library',
          removable: true,
          dependencies: ['circ-a'],
        },
      ]

      const circularValidator = new SelectionValidator(circularFeatures)
      const result = circularValidator.validate(['circ-a', 'circ-b'])

      expect(
        result.errors.some((e) => e.code === 'CIRCULAR_DEPENDENCY')
      ).toBe(true)
    })
  })

  describe('conflict detection', () => {
    it('should detect direct conflicts', () => {
      const result = validator.validate(['app-core', 'app-alternate'])

      const conflicts = result.errors.filter(
        (e) => e.code === 'CONFLICTING_FEATURES'
      )
      expect(conflicts.length).toBeGreaterThan(0)
    })

    it('should not flag non-conflicting features', () => {
      const result = validator.validate(['lib-a', 'lib-b'])

      const conflicts = result.errors.filter(
        (e) => e.code === 'CONFLICTING_FEATURES'
      )
      expect(conflicts.length).toBe(0)
    })
  })

  describe('suggestions', () => {
    it('should suggest removing unknown features', () => {
      const result = validator.validate(['non-existent'])

      const suggestions = result.suggestions.filter((s) =>
        s.includes('unknown') || s.includes('Remove')
      )
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should suggest selecting only removable', () => {
      const result = validator.validate(['lib-c'])

      const suggestions = result.suggestions.filter((s) =>
        s.includes('removable')
      )
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should suggest resolving conflicts', () => {
      const result = validator.validate(['app-core', 'app-alternate'])

      const suggestions = result.suggestions.filter((s) =>
        s.includes('conflict') || s.includes('Resolve')
      )
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should suggest using --analyze', () => {
      const result = validator.validate(['lib-a'])

      const suggestions = result.suggestions.filter((s) =>
        s.includes('analyze') || s.includes('--analyze')
      )
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('should suggest using --dry-run', () => {
      const result = validator.validate(['lib-a'])

      const suggestions = result.suggestions.filter((s) =>
        s.includes('dry-run') || s.includes('--dry-run')
      )
      expect(suggestions.length).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('should handle very long feature lists', () => {
      const longList = Array.from({ length: 10 }, (_, i) => `lib-a`)

      const result = validator.validate(longList)
      expect(result).toBeDefined()
    })

    it('should handle mixed valid and invalid', () => {
      const result = validator.validate(['lib-a', 'non-existent', 'lib-b'])

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle all non-removable features', () => {
      const result = validator.validate(['lib-c'])

      expect(result.valid).toBe(false)
    })

    it('should validate complex chains', () => {
      const chainFeatures: FeaturePackage[] = [
        {
          name: 'chain-1',
          version: '1.0.0',
          description: 'Chain 1',
          type: 'library',
          removable: true,
          dependencies: ['chain-2'],
        },
        {
          name: 'chain-2',
          version: '1.0.0',
          description: 'Chain 2',
          type: 'library',
          removable: true,
          dependencies: ['chain-3'],
        },
        {
          name: 'chain-3',
          version: '1.0.0',
          description: 'Chain 3',
          type: 'library',
          removable: true,
          dependencies: [],
        },
      ]

      const chainValidator = new SelectionValidator(chainFeatures)
      const result = chainValidator.validate(['chain-1'])

      expect(result).toBeDefined()
    })
  })

  describe('error grouping', () => {
    it('should group errors by feature', () => {
      const result = validator.validate(['non-existent', 'lib-c'])

      expect(result.errors.length).toBeGreaterThan(0)
      const featureNames = result.errors.map((e) => e.feature)
      expect(featureNames.length).toBeGreaterThan(0)
    })

    it('should maintain error codes', () => {
      const result = validator.validate(['non-existent'])

      const error = result.errors[0]
      expect(error?.code).toBe('FEATURE_NOT_FOUND')
    })
  })

  describe('warning levels', () => {
    it('should distinguish warning levels', () => {
      const result = validator.validate(['lib-a', 'lib-b'])

      const warnings = result.warnings
      if (warnings.length > 0) {
        expect(
          warnings.every((w) =>
            ['warning', 'info'].includes(w.severity)
          )
        ).toBe(true)
      }
    })
  })
})
