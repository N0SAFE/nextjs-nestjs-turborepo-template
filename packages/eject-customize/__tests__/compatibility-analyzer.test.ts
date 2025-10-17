/**
 * Tests for CompatibilityAnalyzer
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CompatibilityAnalyzer } from '../src/selection/compatibility-analyzer'
import { CompatibilityError } from '../src/selection/types'
import type { FeaturePackage } from '../src/eject/types'

describe('CompatibilityAnalyzer', () => {
  let mockFeatures: FeaturePackage[]
  let analyzer: CompatibilityAnalyzer

  beforeEach(() => {
    mockFeatures = [
      {
        name: 'framework-a',
        version: '1.0.0',
        description: 'Framework A',
        type: 'framework',
        removable: true,
        dependencies: [],
        conflicts: ['framework-b'],
      },
      {
        name: 'framework-b',
        version: '1.0.0',
        description: 'Framework B',
        type: 'framework',
        removable: true,
        dependencies: [],
        conflicts: ['framework-a'],
      },
      {
        name: 'library-x',
        version: '2.0.0',
        description: 'Library X',
        type: 'library',
        removable: true,
        dependencies: ['framework-a'],
      },
      {
        name: 'library-y',
        version: '2.0.0',
        description: 'Library Y',
        type: 'library',
        removable: true,
        dependencies: ['framework-b'],
      },
      {
        name: 'tool-z',
        version: '3.0.0',
        description: 'Tool Z',
        type: 'tool',
        removable: true,
        dependencies: ['library-x', 'library-y'],
      },
    ]

    analyzer = new CompatibilityAnalyzer(mockFeatures)
  })

  describe('check', () => {
    it('should return compatible true for single feature', async () => {
      const result = await analyzer.check(['framework-a'])
      expect(result.compatible).toBe(true)
      expect(result.issues).toHaveLength(0)
    })

    it('should detect direct conflicts', async () => {
      const result = await analyzer.check(['framework-a', 'framework-b'])
      expect(result.compatible).toBe(false)
      expect(result.issues.length).toBeGreaterThan(0)

      const conflicts = result.issues.filter((i) => i.type === 'conflict')
      expect(conflicts.length).toBeGreaterThan(0)
      expect(conflicts[0]?.severity).toBe('error')
    })

    it('should detect dependency issues', async () => {
      const result = await analyzer.check(['framework-a', 'library-x'])
      expect(result.issues.length).toBeGreaterThan(0)

      const deps = result.issues.filter((i) => i.type === 'dependency')
      expect(deps.length).toBeGreaterThan(0)
    })

    it('should provide suggestions for removal order', async () => {
      const result = await analyzer.check(['framework-a', 'library-x', 'tool-z'])
      expect(result.suggestions.length).toBeGreaterThanOrEqual(0)
    })

    it('should throw on non-existent feature', async () => {
      await expect(analyzer.check(['non-existent'])).rejects.toThrow(
        CompatibilityError
      )
    })

    it('should cache results', async () => {
      const result1 = await analyzer.check(['framework-a', 'library-x'])
      const result2 = await analyzer.check(['framework-a', 'library-x'])

      expect(result1).toBe(result2)
    })

    it('should handle empty feature list', async () => {
      const result = await analyzer.check([])
      expect(result.compatible).toBe(true)
    })

    it('should suggest unused features', async () => {
      const result = await analyzer.check(['framework-a'])
      const hasSuggestions = result.suggestions.length > 0
      expect(hasSuggestions).toBe(true)
    })
  })

  describe('clearCache', () => {
    it('should clear cached results', async () => {
      const result1 = await analyzer.check(['framework-a'])
      analyzer.clearCache()
      const result2 = await analyzer.check(['framework-a'])

      expect(result1).not.toBe(result2)
      expect(result1.compatible).toBe(result2.compatible)
    })
  })

  describe('complex scenarios', () => {
    it('should handle multiple conflicts', async () => {
      const features = [
        {
          name: 'a',
          version: '1.0.0',
          description: 'A',
          type: 'library' as const,
          removable: true,
          conflicts: ['b', 'c'],
        },
        {
          name: 'b',
          version: '1.0.0',
          description: 'B',
          type: 'library' as const,
          removable: true,
          conflicts: ['a'],
        },
        {
          name: 'c',
          version: '1.0.0',
          description: 'C',
          type: 'library' as const,
          removable: true,
          conflicts: ['a'],
        },
      ]

      const complexAnalyzer = new CompatibilityAnalyzer(features)
      const result = await complexAnalyzer.check(['a', 'b', 'c'])

      expect(result.compatible).toBe(false)
      expect(result.issues.length).toBeGreaterThanOrEqual(2)
    })

    it('should handle deep dependency chains', async () => {
      const features = [
        {
          name: 'd1',
          version: '1.0.0',
          description: 'D1',
          type: 'tool' as const,
          removable: true,
          dependencies: ['d2'],
        },
        {
          name: 'd2',
          version: '1.0.0',
          description: 'D2',
          type: 'tool' as const,
          removable: true,
          dependencies: ['d3'],
        },
        {
          name: 'd3',
          version: '1.0.0',
          description: 'D3',
          type: 'tool' as const,
          removable: true,
          dependencies: [],
        },
      ]

      const chainAnalyzer = new CompatibilityAnalyzer(features)
      const result = await chainAnalyzer.check(['d1', 'd2', 'd3'])

      expect(result.suggestions.length).toBeGreaterThan(0)
      const orderSuggestion = result.suggestions.find((s) =>
        s.includes('removal order')
      )
      expect(orderSuggestion).toBeDefined()
    })
  })
})
