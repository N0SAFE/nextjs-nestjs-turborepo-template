/**
 * Impact Analyzer - Analyze the impact of removing features
 * Part of Phase 4: Feature Selection Enhancements
 */

import type { RemovalImpact, ImpactAnalysis } from './types'
import { ImpactError } from './types'
import type { FeaturePackage } from '../eject/types'

/**
 * Analyzes the impact of feature removal
 */
export class ImpactAnalyzer {
  private readonly features: Map<string, FeaturePackage>
  private readonly cache: Map<string, ImpactAnalysis> = new Map()

  constructor(features: FeaturePackage[]) {
    this.features = new Map(features.map((f) => [f.name, f]))
  }

  /**
   * Analyze impact of removing features
   */
  async analyze(featureNames: string[]): Promise<ImpactAnalysis> {
    // Check cache first
    const cacheKey = this.getCacheKey(featureNames)
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Validate all features exist
    for (const name of featureNames) {
      if (!this.features.has(name)) {
        throw new ImpactError(`Feature not found: ${name}`, name)
      }
    }

    const impacts: RemovalImpact[] = []
    let totalImpactedFiles = 0
    let totalImpactedDependencies = 0
    let totalLinesRemoved = 0
    let hasBreakingChanges = false

    // Analyze each feature
    for (const featureName of featureNames) {
      const feature = this.features.get(featureName)!
      const impact = this.analyzeFeatureImpact(feature, featureNames)

      impacts.push(impact)
      totalImpactedFiles += impact.affectedFiles.length
      totalImpactedDependencies += impact.affectedDependencies.length
      totalLinesRemoved += impact.estimatedLinesRemoved
      hasBreakingChanges = hasBreakingChanges || impact.breakingChanges
    }

    // Find dependent features (features that depend on removed ones)
    const dependentFeatures = this.findDependentFeatures(featureNames)

    const riskLevel = this.calculateRiskLevel(
      totalImpactedFiles,
      totalLinesRemoved,
      hasBreakingChanges,
      dependentFeatures.length
    )

    const recommendations = this.generateRecommendations(
      featureNames,
      impacts,
      dependentFeatures
    )

    const result: ImpactAnalysis = {
      features: featureNames,
      totalImpactedFiles,
      totalImpactedDependencies,
      totalLinesRemoved,
      impacts,
      riskLevel,
      recommendations,
    }

    this.cache.set(cacheKey, result)
    return result
  }

  /**
   * Analyze impact of a single feature
   */
  private analyzeFeatureImpact(
    feature: FeaturePackage,
    allRemovedFeatures: string[]
  ): RemovalImpact {
    // Find features that depend on this one
    const dependentFeatures: string[] = []
    for (const [name, other] of this.features) {
      if (
        name !== feature.name &&
        other.dependencies?.includes(feature.name) &&
        !allRemovedFeatures.includes(name)
      ) {
        dependentFeatures.push(name)
      }
    }

    // Estimate files affected
    const affectedFiles = this.estimateAffectedFiles(feature)

    // Get dependencies
    const affectedDependencies = [
      ...(feature.dependencies || []),
      ...(feature.devDependencies || []),
    ]

    // Estimate lines removed (rough estimate)
    const estimatedLinesRemoved = this.estimateLinesRemoved(feature)

    // Check for breaking changes
    const breakingChanges = dependentFeatures.length > 0

    // Determine severity
    let severity: 'critical' | 'high' | 'medium' | 'low' = 'low'
    if (feature.type === 'framework') severity = 'critical'
    else if (feature.type === 'library') severity = 'high'
    else if (breakingChanges) severity = 'medium'
    else severity = 'low'

    return {
      feature: feature.name,
      affectedFiles,
      affectedDependencies,
      dependentFeatures,
      estimatedLinesRemoved,
      breakingChanges,
      severity,
    }
  }

  /**
   * Estimate affected files based on feature type
   */
  private estimateAffectedFiles(feature: FeaturePackage): string[] {
    // This is a mock implementation - real implementation would
    // analyze actual codebase
    const baseFiles = 3
    const fileCount =
      baseFiles + (feature.dependencies?.length || 0) * 2 +
      (feature.devDependencies?.length || 0)

    const files: string[] = []
    for (let i = 0; i < fileCount; i++) {
      files.push(`src/${feature.name}/module-${i}.ts`)
    }

    return files
  }

  /**
   * Estimate lines of code removed
   */
  private estimateLinesRemoved(feature: FeaturePackage): number {
    // Mock implementation - in reality would analyze actual code
    const typeMultiplier =
      feature.type === 'framework' ? 5000 :
      feature.type === 'library' ? 2000 :
      feature.type === 'tool' ? 1000 :
      500

    const depMultiplier = (feature.dependencies?.length || 0) * 200
    const devDepMultiplier = (feature.devDependencies?.length || 0) * 100

    return typeMultiplier + depMultiplier + devDepMultiplier
  }

  /**
   * Find features that depend on removed features
   */
  private findDependentFeatures(removedFeatures: string[]): string[] {
    const dependents = new Set<string>()

    for (const [name, feature] of this.features) {
      if (removedFeatures.includes(name)) continue

      if (feature.dependencies) {
        for (const dep of feature.dependencies) {
          if (removedFeatures.includes(dep)) {
            dependents.add(name)
            break
          }
        }
      }
    }

    return Array.from(dependents)
  }

  /**
   * Calculate risk level
   */
  private calculateRiskLevel(
    filesImpacted: number,
    linesRemoved: number,
    hasBreakingChanges: boolean,
    dependentCount: number
  ): 'critical' | 'high' | 'medium' | 'low' {
    let score = 0

    score += filesImpacted * 10
    score += linesRemoved / 100
    score += hasBreakingChanges ? 50 : 0
    score += dependentCount * 25

    if (score >= 200) return 'critical'
    if (score >= 100) return 'high'
    if (score >= 50) return 'medium'
    return 'low'
  }

  /**
   * Generate recommendations based on impact
   */
  private generateRecommendations(
    features: string[],
    impacts: RemovalImpact[],
    dependents: string[]
  ): string[] {
    const recommendations: string[] = []

    // Check for critical impacts
    const criticalImpacts = impacts.filter((i) => i.severity === 'critical')
    if (criticalImpacts.length > 0) {
      recommendations.push(
        `⚠️  CRITICAL: Removing ${criticalImpacts.map((i) => i.feature).join(', ')} may cause severe issues`
      )
    }

    // Check for dependent features
    if (dependents.length > 0) {
      recommendations.push(
        `⚠️  These features depend on your selections: ${dependents.join(', ')}`
      )
    }

    // Check for large code removal
    const totalLines = impacts.reduce((sum, i) => sum + i.estimatedLinesRemoved, 0)
    if (totalLines > 5000) {
      recommendations.push(
        `📊 You're removing ~${totalLines} lines of code. Consider testing thoroughly.`
      )
    }

    // Check for many files affected
    const totalFiles = impacts.reduce((sum, i) => sum + i.affectedFiles.length, 0)
    if (totalFiles > 20) {
      recommendations.push(
        `📁 This will affect ~${totalFiles} files. Ensure comprehensive testing.`
      )
    }

    // Suggest backup
    recommendations.push('💾 Ensure you have a backup before proceeding.')

    // Suggest dry-run
    recommendations.push('🔍 Consider using --dry-run to preview changes.')

    return recommendations
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
