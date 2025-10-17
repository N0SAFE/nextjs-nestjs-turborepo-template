/**
 * Feature Selector - Interactive feature selection with prompts
 * Part of Phase 4: Feature Selection Enhancements
 */

import type { FeatureSelection, PromptOptions, PromptResult } from './types'
import { SelectorError } from './types'
import { CompatibilityAnalyzer } from './compatibility-analyzer'
import { ImpactAnalyzer } from './impact-analyzer'
import { DependencyVisualizer } from './dependency-visualizer'
import type { FeaturePackage } from '../eject/types'

/**
 * Manages interactive feature selection
 */
export class FeatureSelector {
  private readonly features: FeaturePackage[]
  private readonly compatibilityAnalyzer: CompatibilityAnalyzer
  private readonly impactAnalyzer: ImpactAnalyzer
  private readonly visualizer: DependencyVisualizer

  constructor(features: FeaturePackage[]) {
    this.features = features
    this.compatibilityAnalyzer = new CompatibilityAnalyzer(features)
    this.impactAnalyzer = new ImpactAnalyzer(features)
    this.visualizer = new DependencyVisualizer(features)
  }

  /**
   * Perform interactive feature selection
   */
  async select(options: PromptOptions): Promise<PromptResult> {
    if (!options.interactive) {
      throw new SelectorError(
        'Non-interactive mode not supported in this method',
        'INTERACTIVE_REQUIRED'
      )
    }

    const selectedFeatures: string[] = []
    const timestamp = new Date().toISOString()

    // For testing, this would normally prompt the user
    // In real implementation, this would use inquirer or similar
    // For now, return mock result
    return {
      selectedFeatures,
      confirmed: false,
      timestamp,
    }
  }

  /**
   * Get feature selection with analysis
   */
  async analyzeSelection(featureNames: string[]): Promise<FeatureSelection> {
    // Validate features exist
    const validFeatures: string[] = []
    for (const name of featureNames) {
      if (!this.features.find((f) => f.name === name)) {
        throw new SelectorError(`Feature not found: ${name}`, 'FEATURE_NOT_FOUND')
      }
      validFeatures.push(name)
    }

    // Get compatibility analysis
    const compatibility = await this.compatibilityAnalyzer.check(validFeatures)

    // Get impact analysis
    const impacts = await this.impactAnalyzer.analyze(validFeatures)

    return {
      features: validFeatures,
      selectedCount: validFeatures.length,
      totalAvailable: this.features.length,
      compatibility,
      impacts,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Get features grouped by type
   */
  getFeaturesGrouped(): Map<string, FeaturePackage[]> {
    const grouped = new Map<string, FeaturePackage[]>()

    for (const feature of this.features) {
      const type = feature.type
      if (!grouped.has(type)) {
        grouped.set(type, [])
      }
      grouped.get(type)!.push(feature)
    }

    return grouped
  }

  /**
   * Get removable features only
   */
  getRemovableFeatures(): FeaturePackage[] {
    return this.features.filter((f) => f.removable)
  }

  /**
   * Get suggested features based on dependencies
   */
  getSuggestedFeatures(selectedFeatures: string[]): string[] {
    const suggestions = new Set<string>()

    for (const selected of selectedFeatures) {
      const feature = this.features.find((f) => f.name === selected)
      if (!feature) continue

      // Add dependent features that might also want to be removed
      for (const other of this.features) {
        if (
          other.name !== selected &&
          other.dependencies?.includes(selected) &&
          !selectedFeatures.includes(other.name)
        ) {
          suggestions.add(other.name)
        }
      }
    }

    return Array.from(suggestions)
  }

  /**
   * Format selection summary
   */
  formatSelectionSummary(selection: FeatureSelection): string {
    const lines: string[] = []

    lines.push('═══════════════════════════════════════')
    lines.push('  FEATURE SELECTION SUMMARY')
    lines.push('═══════════════════════════════════════')
    lines.push('')

    lines.push(`📋 Selected Features: ${selection.selectedCount}/${selection.totalAvailable}`)
    lines.push(`   ${selection.features.join(', ')}`)
    lines.push('')

    // Compatibility
    lines.push('🔗 Compatibility Check:')
    if (selection.compatibility.compatible) {
      lines.push('   ✅ All features are compatible')
    } else {
      const errors = selection.compatibility.issues.filter(
        (i) => i.severity === 'error'
      )
      lines.push(`   ❌ Found ${errors.length} compatibility issue(s)`)
      for (const error of errors) {
        lines.push(`      • ${error.description}`)
      }
    }

    if (selection.compatibility.warnings.length > 0) {
      lines.push('   ⚠️  Warnings:')
      for (const warning of selection.compatibility.warnings) {
        lines.push(`      • ${warning}`)
      }
    }

    lines.push('')

    // Impact
    lines.push('💥 Impact Analysis:')
    lines.push(`   Risk Level: ${selection.impacts.riskLevel.toUpperCase()}`)
    lines.push(`   Files Impacted: ${selection.impacts.totalImpactedFiles}`)
    lines.push(`   Dependencies Affected: ${selection.impacts.totalImpactedDependencies}`)
    lines.push(
      `   Estimated Lines Removed: ${selection.impacts.totalLinesRemoved.toLocaleString()}`
    )

    if (selection.impacts.recommendations.length > 0) {
      lines.push('')
      lines.push('💡 Recommendations:')
      for (const rec of selection.impacts.recommendations) {
        lines.push(`   ${rec}`)
      }
    }

    lines.push('')
    lines.push('═══════════════════════════════════════')

    return lines.join('\n')
  }

  /**
   * Format features for display
   */
  formatFeaturesDisplay(
    features: FeaturePackage[],
    highlight?: string[]
  ): string {
    const lines: string[] = []

    for (const feature of features) {
      const isHighlighted = highlight?.includes(feature.name)
      const marker = isHighlighted ? '➤' : ' '
      const removable = feature.removable ? '✓' : '✗'

      lines.push(
        `${marker} [${removable}] ${feature.name.padEnd(20)} (${feature.type})`
      )
      lines.push(`        ${feature.description}`)

      if (feature.dependencies?.length) {
        lines.push(
          `        Depends: ${feature.dependencies.join(', ')}`
        )
      }

      if (feature.conflicts?.length) {
        lines.push(`        Conflicts: ${feature.conflicts.join(', ')}`)
      }

      lines.push('')
    }

    return lines.join('\n')
  }

  /**
   * Validate selection is complete
   */
  validateSelection(selectedFeatures: string[]): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (selectedFeatures.length === 0) {
      errors.push('At least one feature must be selected')
    }

    for (const name of selectedFeatures) {
      const feature = this.features.find((f) => f.name === name)
      if (!feature) {
        errors.push(`Feature not found: ${name}`)
        continue
      }

      if (!feature.removable) {
        errors.push(`Feature is not removable: ${name}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Filter features by criteria
   */
  filterFeatures(criteria: {
    type?: string
    removable?: boolean
    hasConflicts?: boolean
    hasDependencies?: boolean
  }): FeaturePackage[] {
    return this.features.filter((f) => {
      if (criteria.type && f.type !== criteria.type) return false
      if (criteria.removable !== undefined && f.removable !== criteria.removable)
        return false
      if (
        criteria.hasConflicts !== undefined &&
        (f.conflicts?.length || 0 > 0) !== criteria.hasConflicts
      )
        return false
      if (
        criteria.hasDependencies !== undefined &&
        (f.dependencies?.length || 0 > 0) !== criteria.hasDependencies
      )
        return false
      return true
    })
  }

  /**
   * Get feature by name
   */
  getFeature(name: string): FeaturePackage | undefined {
    return this.features.find((f) => f.name === name)
  }

  /**
   * Get all features
   */
  getAllFeatures(): FeaturePackage[] {
    return this.features
  }
}
