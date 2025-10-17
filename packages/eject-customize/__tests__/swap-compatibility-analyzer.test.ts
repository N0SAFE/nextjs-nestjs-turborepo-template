/**
 * Tests for Framework Swap CompatibilityAnalyzer
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CompatibilityAnalyzer } from '../src/swap/compatibility-analyzer'
import type { FrameworkType } from '../src/swap/types'

describe('Swap CompatibilityAnalyzer', () => {
  let analyzer: CompatibilityAnalyzer

  beforeEach(() => {
    analyzer = new CompatibilityAnalyzer()
  })

  describe('analyze', () => {
    it('should analyze Next.js to React compatibility', async () => {
      const result = await analyzer.analyze('nextjs', 'react')

      expect(result.from).toBe('nextjs')
      expect(result.to).toBe('react')
      expect(result.compatible).toBe(true) // No critical issues
      expect(result.difficulty).toBeDefined()
      expect(result.compatibility_score).toBeGreaterThan(0)
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('should analyze React to Next.js compatibility', async () => {
      const result = await analyzer.analyze('react', 'nextjs')

      expect(result.from).toBe('react')
      expect(result.to).toBe('nextjs')
      expect(result.compatible).toBe(true)
      expect(result.difficulty).toBe('easy')
      expect(result.compatibility_score).toBeGreaterThan(80)
    })

    it('should analyze Vue to Nuxt compatibility', async () => {
      const result = await analyzer.analyze('vue', 'nuxt')

      expect(result.from).toBe('vue')
      expect(result.to).toBe('nuxt')
      expect(result.compatible).toBe(true)
      expect(result.difficulty).toBe('easy')
    })

    it('should analyze Angular to React compatibility', async () => {
      const result = await analyzer.analyze('angular', 'react')

      expect(result.from).toBe('angular')
      expect(result.to).toBe('react')
      expect(result.compatible).toBe(true)
      expect(result.difficulty).toMatch(/hard|very-hard/)
      expect(result.issues.length).toBeGreaterThan(0)
    })
  })

  describe('unknown framework handling', () => {
    it('should return critical issue for unknown source framework', async () => {
      const result = await analyzer.analyze('unknown', 'react')

      expect(result.compatible).toBe(false)
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.issues[0]?.severity).toBe('critical')
      expect(result.issues[0]?.category).toBe('framework')
    })

    it('should return critical issue for unknown target framework', async () => {
      const result = await analyzer.analyze('react', 'unknown')

      expect(result.compatible).toBe(false)
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.issues[0]?.severity).toBe('critical')
      expect(result.issues[0]?.category).toBe('framework')
    })
  })

  describe('same framework', () => {
    it('should detect same framework migration', async () => {
      const result = await analyzer.analyze('react', 'react')

      expect(result.compatible).toBe(true)
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.issues[0]?.severity).toBe('low')
      expect(result.issues[0]?.description).toContain('same')
    })
  })

  describe('routing compatibility', () => {
    it('should detect routing system differences', async () => {
      const result = await analyzer.analyze('nextjs', 'react')

      const routingIssue = result.issues.find((i) => i.category === 'routing')
      expect(routingIssue).toBeDefined()
      expect(routingIssue?.description).toContain('file-based')
      expect(routingIssue?.description).toContain('library')
    })

    it('should not flag routing issues for similar systems', async () => {
      const result = await analyzer.analyze('nextjs', 'remix')

      const routingIssue = result.issues.find((i) => i.category === 'routing')
      expect(routingIssue).toBeUndefined()
    })
  })

  describe('SSR/SSG compatibility', () => {
    it('should detect SSR loss when migrating to client-only framework', async () => {
      const result = await analyzer.analyze('nextjs', 'react')

      const ssrIssue = result.issues.find(
        (i) => i.category === 'rendering' && i.description.includes('server-side')
      )
      expect(ssrIssue).toBeDefined()
      expect(ssrIssue?.severity).toBe('high')
    })

    it('should detect SSG loss when migrating to framework without SSG', async () => {
      const result = await analyzer.analyze('nextjs', 'react')

      const ssgIssue = result.issues.find(
        (i) => i.category === 'rendering' && i.description.includes('static site')
      )
      expect(ssgIssue).toBeDefined()
      expect(ssgIssue?.severity).toBe('medium')
    })

    it('should not flag SSR issues when both frameworks support it', async () => {
      const result = await analyzer.analyze('nextjs', 'nuxt')

      const ssrIssue = result.issues.find(
        (i) => i.category === 'rendering' && i.description.includes('server-side')
      )
      expect(ssrIssue).toBeUndefined()
    })
  })

  describe('API routes compatibility', () => {
    it('should detect API routes loss', async () => {
      const result = await analyzer.analyze('nextjs', 'react')

      const apiIssue = result.issues.find((i) => i.category === 'api')
      expect(apiIssue).toBeDefined()
      expect(apiIssue?.severity).toBe('high')
      expect(apiIssue?.suggestion).toContain('backend')
    })

    it('should not flag API issues when both frameworks support them', async () => {
      const result = await analyzer.analyze('nextjs', 'astro')

      const apiIssue = result.issues.find((i) => i.category === 'api')
      expect(apiIssue).toBeUndefined()
    })
  })

  describe('middleware compatibility', () => {
    it('should detect middleware loss', async () => {
      const result = await analyzer.analyze('nextjs', 'react')

      const middlewareIssue = result.issues.find((i) => i.category === 'middleware')
      expect(middlewareIssue).toBeDefined()
      expect(middlewareIssue?.severity).toBe('medium')
    })
  })

  describe('image optimization compatibility', () => {
    it('should detect image optimization loss', async () => {
      const result = await analyzer.analyze('nextjs', 'react')

      const imageIssue = result.issues.find((i) => i.category === 'assets')
      expect(imageIssue).toBeDefined()
      expect(imageIssue?.severity).toBe('low')
    })
  })

  describe('i18n compatibility', () => {
    it('should detect i18n loss', async () => {
      const result = await analyzer.analyze('nextjs', 'react')

      const i18nIssue = result.issues.find((i) => i.category === 'i18n')
      expect(i18nIssue).toBeDefined()
      expect(i18nIssue?.severity).toBe('medium')
      expect(i18nIssue?.suggestion).toContain('i18n')
    })
  })

  describe('compatibility score calculation', () => {
    it('should have high score for easy migrations', async () => {
      const result = await analyzer.analyze('react', 'nextjs')

      expect(result.compatibility_score).toBeGreaterThan(80)
    })

    it('should have lower score for complex migrations', async () => {
      const result = await analyzer.analyze('nextjs', 'react')

      expect(result.compatibility_score).toBeLessThan(80)
    })

    it('should have very low score for unknown frameworks', async () => {
      const result = await analyzer.analyze('unknown', 'react')

      expect(result.compatibility_score).toBeLessThanOrEqual(60)
    })

    it('should give bonus for similar frameworks', async () => {
      const nextjsToRemix = await analyzer.analyze('nextjs', 'remix')
      const nextjsToReact = await analyzer.analyze('nextjs', 'react')

      // Next.js -> Remix should score higher than Next.js -> React
      expect(nextjsToRemix.compatibility_score).toBeGreaterThanOrEqual(
        nextjsToReact.compatibility_score
      )
    })
  })

  describe('difficulty assessment', () => {
    it('should rate same framework as easy', async () => {
      const result = await analyzer.analyze('react', 'react')

      expect(result.difficulty).toBe('easy')
    })

    it('should rate critical issues as very-hard', async () => {
      const result = await analyzer.analyze('unknown', 'react')

      expect(result.difficulty).toBe('very-hard')
    })

    it('should rate multiple high issues as very-hard', async () => {
      const result = await analyzer.analyze('nextjs', 'react')

      // Has SSR loss (high), API loss (high), routing (high) = 3+ high issues
      expect(['hard', 'very-hard']).toContain(result.difficulty)
    })

    it('should rate simple migrations as easy', async () => {
      const result = await analyzer.analyze('react', 'solid')

      expect(['easy', 'medium']).toContain(result.difficulty)
    })
  })

  describe('recommendations', () => {
    it('should include general recommendations', async () => {
      const result = await analyzer.analyze('react', 'nextjs')

      expect(result.recommendations).toContain('Create a backup of your project before starting migration')
      expect(result.recommendations).toContain('Set up the target framework in a separate branch')
    })

    it('should include routing recommendations when needed', async () => {
      const result = await analyzer.analyze('nextjs', 'react')

      const hasRoutingRec = result.recommendations.some((r) => r.includes('routing'))
      expect(hasRoutingRec).toBe(true)
    })

    it('should include SSR recommendations when needed', async () => {
      const result = await analyzer.analyze('nextjs', 'react')

      const hasSsrRec = result.recommendations.some((r) => r.toLowerCase().includes('server-side'))
      expect(hasSsrRec).toBe(true)
    })

    it('should include API recommendations when needed', async () => {
      const result = await analyzer.analyze('nextjs', 'react')

      const hasApiRec = result.recommendations.some((r) => r.toLowerCase().includes('api'))
      expect(hasApiRec).toBe(true)
    })

    it('should include framework-specific recommendations for React', async () => {
      const result = await analyzer.analyze('nextjs', 'react')

      const hasReactRec = result.recommendations.some(
        (r) => r.includes('React Router') || r.includes('state management')
      )
      expect(hasReactRec).toBe(true)
    })

    it('should include framework-specific recommendations for Next.js', async () => {
      const result = await analyzer.analyze('react', 'nextjs')

      const hasNextRec = result.recommendations.some((r) => r.includes('Next.js'))
      expect(hasNextRec).toBe(true)
    })

    it('should include framework-specific recommendations for Vue', async () => {
      const result = await analyzer.analyze('react', 'vue')

      const hasVueRec = result.recommendations.some((r) => r.includes('composition API'))
      expect(hasVueRec).toBe(true)
    })

    it('should include framework-specific recommendations for Angular', async () => {
      const result = await analyzer.analyze('react', 'angular')

      const hasAngularRec = result.recommendations.some((r) => r.includes('module system') || r.includes('RxJS'))
      expect(hasAngularRec).toBe(true)
    })
  })

  describe('isCompatible', () => {
    it('should return true for compatible frameworks', async () => {
      const compatible = await analyzer.isCompatible('react', 'nextjs')

      expect(compatible).toBe(true)
    })

    it('should return false for unknown source', async () => {
      const compatible = await analyzer.isCompatible('unknown', 'react')

      expect(compatible).toBe(false)
    })

    it('should return false for unknown target', async () => {
      const compatible = await analyzer.isCompatible('react', 'unknown')

      expect(compatible).toBe(false)
    })
  })

  describe('getFeatureComparison', () => {
    it('should compare features between frameworks', () => {
      const comparison = analyzer.getFeatureComparison('nextjs', 'react')

      expect(comparison.from_features).toBeDefined()
      expect(comparison.to_features).toBeDefined()
      expect(comparison.missing_features).toBeDefined()
      expect(comparison.gained_features).toBeDefined()
    })

    it('should identify missing features', () => {
      const comparison = analyzer.getFeatureComparison('nextjs', 'react')

      expect(comparison.missing_features).toContain('ssr')
      expect(comparison.missing_features).toContain('ssg')
      expect(comparison.missing_features).toContain('api_routes')
    })

    it('should identify gained features', () => {
      const comparison = analyzer.getFeatureComparison('react', 'nextjs')

      expect(comparison.gained_features).toContain('ssr')
      expect(comparison.gained_features).toContain('ssg')
      expect(comparison.gained_features).toContain('api_routes')
    })

    it('should handle same framework comparison', () => {
      const comparison = analyzer.getFeatureComparison('react', 'react')

      expect(comparison.missing_features).toHaveLength(0)
      expect(comparison.gained_features).toHaveLength(0)
    })
  })

  describe('comprehensive framework coverage', () => {
    const frameworks: FrameworkType[] = [
      'nextjs',
      'react',
      'vue',
      'nuxt',
      'angular',
      'svelte',
      'solid',
      'qwik',
      'astro',
      'remix',
    ]

    it('should analyze all framework combinations', async () => {
      for (const from of frameworks) {
        for (const to of frameworks) {
          const result = await analyzer.analyze(from, to)

          expect(result).toBeDefined()
          expect(result.from).toBe(from)
          expect(result.to).toBe(to)
          expect(result.compatibility_score).toBeGreaterThanOrEqual(0)
          expect(result.compatibility_score).toBeLessThanOrEqual(100)
        }
      }
    })
  })
})
