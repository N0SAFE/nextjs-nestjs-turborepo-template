/**
 * Selection Validator - Validate feature selections
 * Part of Phase 4: Feature Selection Enhancements
 */

import type {
  SelectionValidation,
  SelectionError,
  SelectionWarning,
} from './types'
import { ValidationError } from './types'
import type { FeaturePackage } from '../eject/types'

/**
 * Validates feature selections against business rules
 */
export class SelectionValidator {
  private readonly features: Map<string, FeaturePackage>

  constructor(features: FeaturePackage[]) {
    this.features = new Map(features.map((f) => [f.name, f]))
  }

  /**
   * Validate a feature selection
   */
  validate(featureNames: string[]): SelectionValidation {
    const errors: SelectionError[] = []
    const warnings: SelectionWarning[] = []
    const suggestions: string[] = []

    // Check for empty selection
    if (featureNames.length === 0) {
      errors.push({
        feature: 'global',
        code: 'EMPTY_SELECTION',
        message: 'At least one feature must be selected',
        cause: 'missing',
      })
    }

    // Validate each feature
    for (const featureName of featureNames) {
      const featureErrors = this.validateFeature(featureName)
      errors.push(...featureErrors)

      const featureWarnings = this.validateFeatureWarnings(
        featureName,
        featureNames
      )
      warnings.push(...featureWarnings)
    }

    // Validate feature combinations
    const combinationErrors = this.validateCombinations(featureNames)
    errors.push(...combinationErrors)

    // Generate suggestions
    suggestions.push(...this.generateSuggestions(featureNames, errors, warnings))

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    }
  }

  /**
   * Validate individual feature
   */
  private validateFeature(featureName: string): SelectionError[] {
    const errors: SelectionError[] = []

    // Check if feature exists
    if (!this.features.has(featureName)) {
      errors.push({
        feature: featureName,
        code: 'FEATURE_NOT_FOUND',
        message: `Feature not found: ${featureName}`,
        cause: 'missing',
      })
      return errors
    }

    const feature = this.features.get(featureName)!

    // Check if feature is removable
    if (!feature.removable) {
      errors.push({
        feature: featureName,
        code: 'NOT_REMOVABLE',
        message: `Feature is not removable: ${featureName}`,
        cause: 'invalid',
      })
    }

    return errors
  }

  /**
   * Validate feature warnings
   */
  private validateFeatureWarnings(
    featureName: string,
    allSelected: string[]
  ): SelectionWarning[] {
    const warnings: SelectionWarning[] = []
    const feature = this.features.get(featureName)

    if (!feature) return warnings

    // Check for dependencies
    if (feature.dependencies && feature.dependencies.length > 0) {
      const unmetDeps = feature.dependencies.filter(
        (d) => !allSelected.includes(d)
      )

      if (unmetDeps.length > 0) {
        warnings.push({
          feature: featureName,
          code: 'UNMET_DEPENDENCIES',
          message: `${featureName} has unmet dependencies: ${unmetDeps.join(', ')}`,
          severity: 'warning',
        })
      }
    }

    // Check for peer dependencies
    const peerDeps = this.getPeerDependencies(featureName)
    if (peerDeps.length > 0) {
      const unmetPeers = peerDeps.filter((p) => !allSelected.includes(p))

      if (unmetPeers.length > 0) {
        warnings.push({
          feature: featureName,
          code: 'UNMET_PEER_DEPS',
          message: `${featureName} has peer dependencies: ${unmetPeers.join(', ')}`,
          severity: 'info',
        })
      }
    }

    return warnings
  }

  /**
   * Validate feature combinations
   */
  private validateCombinations(featureNames: string[]): SelectionError[] {
    const errors: SelectionError[] = []

    // Check for conflicts
    for (let i = 0; i < featureNames.length; i++) {
      for (let j = i + 1; j < featureNames.length; j++) {
        const feature1 = this.features.get(featureNames[i])
        const feature2 = this.features.get(featureNames[j])

        if (!feature1 || !feature2) continue

        // Check direct conflicts
        if (feature1.conflicts?.includes(feature2.name)) {
          errors.push({
            feature: feature1.name,
            code: 'CONFLICTING_FEATURES',
            message: `${feature1.name} conflicts with ${feature2.name}`,
            cause: 'incompatible',
          })
        }

        if (feature2.conflicts?.includes(feature1.name)) {
          errors.push({
            feature: feature2.name,
            code: 'CONFLICTING_FEATURES',
            message: `${feature2.name} conflicts with ${feature1.name}`,
            cause: 'incompatible',
          })
        }
      }
    }

    // Check for circular dependencies
    const circularDeps = this.findCircularDependencies(featureNames)
    for (const cycle of circularDeps) {
      errors.push({
        feature: cycle[0],
        code: 'CIRCULAR_DEPENDENCY',
        message: `Circular dependency detected: ${cycle.join(' → ')}`,
        cause: 'incompatible',
      })
    }

    // Check for dependency chains requiring all to be removed
    const problematicChains = this.findProblematicChains(featureNames)
    for (const chain of problematicChains) {
      errors.push({
        feature: chain[0],
        code: 'PROBLEMATIC_DEPENDENCY_CHAIN',
        message: `Removing ${chain[0]} requires also removing: ${chain.slice(1).join(', ')}`,
        cause: 'unmet_dependency',
      })
    }

    return errors
  }

  /**
   * Find peer dependencies
   */
  private getPeerDependencies(featureName: string): string[] {
    const peers = new Set<string>()

    for (const [name, feature] of this.features) {
      if (name === featureName) continue

      // A feature is a peer if they share dependencies
      const feature1 = this.features.get(featureName)
      if (!feature1) continue

      const sharedDeps = feature1.dependencies?.filter((d) =>
        feature.dependencies?.includes(d)
      )

      if (sharedDeps && sharedDeps.length > 0) {
        peers.add(name)
      }
    }

    return Array.from(peers)
  }

  /**
   * Find circular dependencies in selected features
   */
  private findCircularDependencies(featureNames: string[]): string[][] {
    const cycles: string[][] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const dfs = (node: string, path: string[]): boolean => {
      visited.add(node)
      recursionStack.add(node)
      path.push(node)

      const feature = this.features.get(node)
      if (feature?.dependencies) {
        for (const dep of feature.dependencies) {
          if (!featureNames.includes(dep)) continue

          if (!visited.has(dep)) {
            if (dfs(dep, [...path])) {
              return true
            }
          } else if (recursionStack.has(dep)) {
            const cycleStart = path.indexOf(dep)
            const cycle = path.slice(cycleStart)
            cycles.push([...cycle, dep])
            return true
          }
        }
      }

      recursionStack.delete(node)
      return false
    }

    for (const name of featureNames) {
      if (!visited.has(name)) {
        dfs(name, [])
      }
    }

    return cycles
  }

  /**
   * Find problematic dependency chains
   */
  private findProblematicChains(featureNames: string[]): string[][] {
    const chains: string[][] = []

    for (const featureName of featureNames) {
      const transitiveDeps = this.getTransitiveDependencies(featureName)
      const missingDeps = Array.from(transitiveDeps).filter(
        (d) => !featureNames.includes(d)
      )

      if (missingDeps.length > 0) {
        chains.push([featureName, ...missingDeps])
      }
    }

    return chains
  }

  /**
   * Get transitive dependencies
   */
  private getTransitiveDependencies(featureName: string): Set<string> {
    const deps = new Set<string>()
    const visited = new Set<string>()

    const collect = (name: string) => {
      if (visited.has(name)) return
      visited.add(name)

      const feature = this.features.get(name)
      if (!feature?.dependencies) return

      for (const dep of feature.dependencies) {
        if (!deps.has(dep)) {
          deps.add(dep)
          collect(dep)
        }
      }
    }

    collect(featureName)
    return deps
  }

  /**
   * Generate suggestions based on validation
   */
  private generateSuggestions(
    featureNames: string[],
    errors: SelectionError[],
    warnings: SelectionWarning[]
  ): string[] {
    const suggestions: string[] = []

    // Suggest error fixes
    const uniqueErrors = new Set(errors.map((e) => e.code))
    if (uniqueErrors.has('FEATURE_NOT_FOUND')) {
      suggestions.push('Remove unknown features from selection')
    }

    if (uniqueErrors.has('NOT_REMOVABLE')) {
      suggestions.push('Select only removable features')
    }

    if (uniqueErrors.has('CONFLICTING_FEATURES')) {
      suggestions.push('Resolve conflicting feature selections')
    }

    if (uniqueErrors.has('CIRCULAR_DEPENDENCY')) {
      suggestions.push('Remove one feature from the circular dependency chain')
    }

    // Suggest related actions
    if (featureNames.length > 0) {
      suggestions.push(
        `Use --analyze to see detailed impact analysis before proceeding`
      )
      suggestions.push(`Use --dry-run to preview changes without modifying files`)
    }

    // Suggest best practices
    if (warnings.length > 0) {
      suggestions.push(`Review ${warnings.length} warning(s) before proceeding`)
    }

    return suggestions
  }
}
