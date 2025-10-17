/**
 * Tests for FeatureSelector
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FeatureSelector } from '../src/selection/feature-selector'
import { SelectorError } from '../src/selection/types'
import type { FeaturePackage } from '../src/eject/types'

describe('FeatureSelector', () => {
  let mockFeatures: FeaturePackage[]
  let selector: FeatureSelector

  beforeEach(() => {
    mockFeatures = [
      {
        name: 'framework-react',
        version: '18.0.0',
        description: 'React Framework',
        type: 'framework',
        removable: true,
        dependencies: [],
        conflicts: ['framework-vue'],
      },
      {
        name: 'framework-vue',
        version: '3.0.0',
        description: 'Vue Framework',
        type: 'framework',
        removable: true,
        dependencies: [],
        conflicts: ['framework-react'],
      },
      {
        name: 'routing-lib',
        version: '1.0.0',
        description: 'Routing Library',
        type: 'library',
        removable: true,
        dependencies: ['framework-react'],
      },
      {
        name: 'state-management',
        version: '2.0.0',
        description: 'State Management',
        type: 'library',
        removable: true,
        dependencies: ['framework-react'],
      },
      {
        name: 'build-webpack',
        version: '5.0.0',
        description: 'Webpack Build',
        type: 'tool',
        removable: true,
        dependencies: [],
      },
      {
        name: 'config-prettier',
        version: '3.0.0',
        description: 'Prettier Config',
        type: 'config',
        removable: false,
      },
    ]

    selector = new FeatureSelector(mockFeatures)
  })

  describe('analyzeSelection', () => {
    it('should analyze single feature selection', async () => {
      const result = await selector.analyzeSelection(['routing-lib'])

      expect(result.features).toContain('routing-lib')
      expect(result.selectedCount).toBe(1)
      expect(result.totalAvailable).toBe(6)
    })

    it('should detect compatibility issues', async () => {
      const result = await selector.analyzeSelection([
        'framework-react',
        'framework-vue',
      ])

      expect(result.compatibility.compatible).toBe(false)
    })

    it('should analyze impact', async () => {
      const result = await selector.analyzeSelection(['framework-react'])

      expect(result.impacts).toBeDefined()
      expect(result.impacts.features).toContain('framework-react')
    })

    it('should throw on non-existent feature', async () => {
      await expect(
        selector.analyzeSelection(['non-existent'])
      ).rejects.toThrow(SelectorError)
    })

    it('should handle multiple features', async () => {
      const result = await selector.analyzeSelection([
        'routing-lib',
        'state-management',
      ])

      expect(result.selectedCount).toBe(2)
      expect(result.features.length).toBe(2)
    })
  })

  describe('getFeaturesGrouped', () => {
    it('should group features by type', () => {
      const grouped = selector.getFeaturesGrouped()

      expect(grouped.has('framework')).toBe(true)
      expect(grouped.has('library')).toBe(true)
      expect(grouped.has('tool')).toBe(true)
      expect(grouped.has('config')).toBe(true)
    })

    it('should have correct counts per group', () => {
      const grouped = selector.getFeaturesGrouped()

      expect(grouped.get('framework')).toHaveLength(2)
      expect(grouped.get('library')).toHaveLength(2)
      expect(grouped.get('tool')).toHaveLength(1)
      expect(grouped.get('config')).toHaveLength(1)
    })
  })

  describe('getRemovableFeatures', () => {
    it('should return only removable features', () => {
      const removable = selector.getRemovableFeatures()

      expect(removable.length).toBe(5)
      expect(removable.every((f) => f.removable)).toBe(true)
    })

    it('should exclude non-removable features', () => {
      const removable = selector.getRemovableFeatures()

      expect(removable.find((f) => f.name === 'config-prettier')).toBeUndefined()
    })
  })

  describe('getSuggestedFeatures', () => {
    it('should suggest dependent features', () => {
      const suggestions = selector.getSuggestedFeatures(['framework-react'])

      expect(suggestions).toContain('routing-lib')
      expect(suggestions).toContain('state-management')
    })

    it('should not suggest already selected', () => {
      const suggestions = selector.getSuggestedFeatures(['framework-react'])

      expect(suggestions).not.toContain('framework-react')
    })

    it('should handle empty selection', () => {
      const suggestions = selector.getSuggestedFeatures([])

      expect(suggestions.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('formatSelectionSummary', () => {
    it('should format selection summary', async () => {
      const result = await selector.analyzeSelection(['framework-react'])
      const summary = selector.formatSelectionSummary(result)

      expect(summary).toContain('FEATURE SELECTION SUMMARY')
      expect(summary).toContain('framework-react')
    })

    it('should include compatibility status', async () => {
      const result = await selector.analyzeSelection(['framework-react'])
      const summary = selector.formatSelectionSummary(result)

      expect(summary).toContain('Compatibility')
    })

    it('should include impact analysis', async () => {
      const result = await selector.analyzeSelection(['framework-react'])
      const summary = selector.formatSelectionSummary(result)

      expect(summary).toContain('Impact Analysis')
      expect(summary).toContain('Risk Level')
    })

    it('should include recommendations', async () => {
      const result = await selector.analyzeSelection(['framework-react'])
      const summary = selector.formatSelectionSummary(result)

      expect(summary).toContain('Recommendations')
    })
  })

  describe('formatFeaturesDisplay', () => {
    it('should format features for display', () => {
      const display = selector.formatFeaturesDisplay(mockFeatures)

      expect(display).toContain('framework-react')
      expect(display).toContain('routing-lib')
    })

    it('should highlight specified features', () => {
      const display = selector.formatFeaturesDisplay(mockFeatures, [
        'framework-react',
      ])

      expect(display).toContain('➤')
    })

    it('should show removability status', () => {
      const display = selector.formatFeaturesDisplay(mockFeatures)

      expect(display).toContain('✓')
      expect(display).toContain('✗')
    })

    it('should show type information', () => {
      const display = selector.formatFeaturesDisplay(mockFeatures)

      expect(display).toContain('framework')
      expect(display).toContain('library')
    })

    it('should show dependencies', () => {
      const display = selector.formatFeaturesDisplay(mockFeatures)

      expect(display).toContain('Depends')
    })
  })

  describe('validateSelection', () => {
    it('should validate valid selection', () => {
      const result = selector.validateSelection(['framework-react'])

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty selection', () => {
      const result = selector.validateSelection([])

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject non-existent feature', () => {
      const result = selector.validateSelection(['non-existent'])

      expect(result.valid).toBe(false)
    })

    it('should reject non-removable feature', () => {
      const result = selector.validateSelection(['config-prettier'])

      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('not removable'))
      ).toBe(true)
    })

    it('should handle multiple errors', () => {
      const result = selector.validateSelection([
        'non-existent',
        'config-prettier',
      ])

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('filterFeatures', () => {
    it('should filter by type', () => {
      const filtered = selector.filterFeatures({ type: 'library' })

      expect(filtered.every((f) => f.type === 'library')).toBe(true)
    })

    it('should filter by removability', () => {
      const filtered = selector.filterFeatures({ removable: true })

      expect(filtered.every((f) => f.removable === true)).toBe(true)
    })

    it('should filter by multiple criteria', () => {
      const filtered = selector.filterFeatures({
        type: 'library',
        removable: true,
      })

      expect(filtered.every((f) => f.type === 'library')).toBe(true)
      expect(filtered.every((f) => f.removable === true)).toBe(true)
    })

    it('should return all when no criteria', () => {
      const filtered = selector.filterFeatures({})

      expect(filtered.length).toBe(6)
    })
  })

  describe('getFeature', () => {
    it('should get feature by name', () => {
      const feature = selector.getFeature('framework-react')

      expect(feature).toBeDefined()
      expect(feature?.name).toBe('framework-react')
    })

    it('should return undefined for non-existent', () => {
      const feature = selector.getFeature('non-existent')

      expect(feature).toBeUndefined()
    })
  })

  describe('getAllFeatures', () => {
    it('should return all features', () => {
      const all = selector.getAllFeatures()

      expect(all.length).toBe(6)
    })

    it('should include all feature types', () => {
      const all = selector.getAllFeatures()

      expect(all.some((f) => f.type === 'framework')).toBe(true)
      expect(all.some((f) => f.type === 'library')).toBe(true)
    })
  })

  describe('complex scenarios', () => {
    it('should handle framework-dependent libraries', async () => {
      const result = await selector.analyzeSelection([
        'routing-lib',
        'state-management',
      ])

      expect(result.compatibility).toBeDefined()
      expect(result.selectedCount).toBe(2)
    })

    it('should suggest removing related features', () => {
      const suggestions = selector.getSuggestedFeatures([
        'routing-lib',
        'state-management',
      ])

      // Should return an array of suggestions
      expect(Array.isArray(suggestions)).toBe(true)
      expect(suggestions.length).toBeGreaterThanOrEqual(0)
    })
  })
})
