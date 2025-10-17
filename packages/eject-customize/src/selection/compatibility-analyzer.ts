/**
 * Compatibility Analyzer - Check feature combinations for compatibility
 * Part of Phase 4: Feature Selection Enhancements
 */

import type {
  CompatibilityIssue,
  CompatibilityResult,
} from './types'
import { CompatibilityError } from './types'
import type { FeaturePackage } from '../eject/types'

/**
 * Analyzes compatibility of feature combinations
 */
export class CompatibilityAnalyzer {
  private readonly features: Map<string, FeaturePackage>
  private readonly cache: Map<string, CompatibilityResult> = new Map()

  constructor(features: FeaturePackage[]) {
    this.features = new Map(features.map((f) => [f.name, f]))
  }

  /**
   * Check if selected features are compatible
   */
  async check(featureNames: string[]): Promise<CompatibilityResult> {
    // Check cache first
    const cacheKey = this.getCacheKey(featureNames)
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    const issues: CompatibilityIssue[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Validate all features exist
    for (const name of featureNames) {
      if (!this.features.has(name)) {
        throw new CompatibilityError(`Feature not found: ${name}`, name)
      }
    }

    // Check pairwise compatibility
    for (let i = 0; i < featureNames.length; i++) {
      for (let j = i + 1; j < featureNames.length; j++) {
        const feature1 = this.features.get(featureNames[i])!
        const feature2 = this.features.get(featureNames[j])!

        // Check direct conflicts
        if (feature1.conflicts?.includes(feature2.name)) {
          issues.push({
            feature1: feature1.name,
            feature2: feature2.name,
            type: 'conflict',
            severity: 'error',
            description: `${feature1.name} conflicts with ${feature2.name}`,
            recommendation: `Cannot remove both ${feature1.name} and ${feature2.name} together`,
          })
        }

        // Check dependencies
        if (feature1.dependencies?.includes(feature2.name)) {
          warnings.push(
            `${feature1.name} depends on ${feature2.name} - removing both may cause issues`
          )
          issues.push({
            feature1: feature1.name,
            feature2: feature2.name,
            type: 'dependency',
            severity: 'warning',
            description: `${feature1.name} has dependency on ${feature2.name}`,
            recommendation: `Remove ${feature1.name} before ${feature2.name}`,
          })
        }

        if (feature2.dependencies?.includes(feature1.name)) {
          warnings.push(
            `${feature2.name} depends on ${feature1.name} - removing both may cause issues`
          )
          issues.push({
            feature1: feature2.name,
            feature2: feature1.name,
            type: 'dependency',
            severity: 'warning',
            description: `${feature2.name} has dependency on ${feature1.name}`,
            recommendation: `Remove ${feature2.name} before ${feature1.name}`,
          })
        }
      }
    }

    // Check ordering compatibility
    const orderingSuggestion = this.suggestRemovalOrder(featureNames)
    if (orderingSuggestion) {
      suggestions.push(orderingSuggestion)
    }

    // Check for unused features
    const unusedSuggestions = this.suggestUnusedFeatures(featureNames)
    suggestions.push(...unusedSuggestions)

    const result: CompatibilityResult = {
      compatible: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
      warnings,
      suggestions,
    }

    this.cache.set(cacheKey, result)
    return result
  }

  /**
   * Suggest removal order based on dependencies
   */
  private suggestRemovalOrder(featureNames: string[]): string | undefined {
    // Topological sort based on dependencies
    const ordered: string[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (name: string) => {
      if (visited.has(name)) return
      if (visiting.has(name)) return // Cycle, skip

      visiting.add(name)

      const feature = this.features.get(name)
      if (feature?.dependencies) {
        for (const dep of feature.dependencies) {
          if (featureNames.includes(dep)) {
            visit(dep)
          }
        }
      }

      visiting.delete(name)
      visited.add(name)
      ordered.push(name)
    }

    for (const name of featureNames) {
      visit(name)
    }

    if (ordered.length > 1 && ordered.join(',') !== featureNames.join(',')) {
      return `Suggested removal order: ${ordered.join(' → ')}`
    }

    return undefined
  }

  /**
   * Suggest unused features to remove together
   */
  private suggestUnusedFeatures(featureNames: string[]): string[] {
    const suggestions: string[] = []

    // Find features that only depend on the selected features
    for (const [name, feature] of this.features) {
      if (featureNames.includes(name)) continue

      const dependsOnlyOnSelected = feature.dependencies?.every((dep) =>
        featureNames.includes(dep)
      )

      if (dependsOnlyOnSelected && feature.dependencies?.length) {
        suggestions.push(
          `Consider also removing ${name} as it only depends on selected features`
        )
      }
    }

    return suggestions
  }

  /**
   * Get cache key for feature set
   */
  private getCacheKey(features: string[]): string {
    return features.sort().join('|')
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}
