/**
 * Phase 4: Feature Selection Enhancement types
 * Defines types for compatibility checking, impact analysis, and dependency visualization
 */

import type { FeaturePackage } from '../eject/types'

/**
 * Represents a compatibility issue between features
 */
export interface CompatibilityIssue {
  feature1: string
  feature2: string
  type: 'conflict' | 'dependency' | 'peer' | 'incompatible'
  severity: 'error' | 'warning' | 'info'
  description: string
  recommendation?: string
}

/**
 * Result of compatibility analysis
 */
export interface CompatibilityResult {
  compatible: boolean
  issues: CompatibilityIssue[]
  warnings: string[]
  suggestions: string[]
}

/**
 * Represents impact of removing a feature
 */
export interface RemovalImpact {
  feature: string
  affectedFiles: string[]
  affectedDependencies: string[]
  dependentFeatures: string[]
  estimatedLinesRemoved: number
  breakingChanges: boolean
  severity: 'critical' | 'high' | 'medium' | 'low'
}

/**
 * Result of impact analysis
 */
export interface ImpactAnalysis {
  features: string[]
  totalImpactedFiles: number
  totalImpactedDependencies: number
  totalLinesRemoved: number
  impacts: RemovalImpact[]
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  recommendations: string[]
}

/**
 * Node in dependency graph
 */
export interface DependencyNode {
  id: string
  feature: FeaturePackage
  dependencies: string[]
  dependents: string[]
  level: number
}

/**
 * Dependency graph visualization
 */
export interface DependencyGraph {
  nodes: Map<string, DependencyNode>
  edges: Array<{ from: string; to: string; type: 'depends' | 'conflicts' }>
  rootNodes: string[]
  leafNodes: string[]
}

/**
 * Feature selection with metadata
 */
export interface FeatureSelection {
  features: string[]
  selectedCount: number
  totalAvailable: number
  compatibility: CompatibilityResult
  impacts: ImpactAnalysis
  timestamp: string
}

/**
 * Selection validation result
 */
export interface SelectionValidation {
  valid: boolean
  errors: SelectionError[]
  warnings: SelectionWarning[]
  suggestions: string[]
}

/**
 * Selection error
 */
export interface SelectionError {
  feature: string
  code: string
  message: string
  cause: 'missing' | 'invalid' | 'incompatible' | 'unmet_dependency'
}

/**
 * Selection warning
 */
export interface SelectionWarning {
  feature: string
  code: string
  message: string
  severity: 'warning' | 'info'
}

/**
 * Prompt options for feature selection
 */
export interface PromptOptions {
  interactive: boolean
  showDependencies: boolean
  showCompatibility: boolean
  showImpact: boolean
  allowMultiSelect: boolean
  groupByType: boolean
}

/**
 * Prompt result
 */
export interface PromptResult {
  selectedFeatures: string[]
  confirmed: boolean
  timestamp: string
}

/**
 * Custom error for selection operations
 */
export class SelectionException extends Error {
  constructor(
    message: string,
    public code: string,
    public feature: string,
    public cause?: Error
  ) {
    super(`Selection Error [${code}]: ${message}`)
    this.name = 'SelectionException'
  }
}

/**
 * Compatibility analyzer error
 */
export class CompatibilityError extends Error {
  constructor(
    message: string,
    public feature: string,
    public cause?: Error
  ) {
    super(`Compatibility Error: ${message}`)
    this.name = 'CompatibilityError'
  }
}

/**
 * Impact analyzer error
 */
export class ImpactError extends Error {
  constructor(
    message: string,
    public feature: string,
    public cause?: Error
  ) {
    super(`Impact Error: ${message}`)
    this.name = 'ImpactError'
  }
}

/**
 * Feature selector error
 */
export class SelectorError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(`Selector Error [${code}]: ${message}`)
    this.name = 'SelectorError'
  }
}

/**
 * Validation error
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: SelectionError[],
    public cause?: Error
  ) {
    super(`Validation Error: ${message}`)
    this.name = 'ValidationError'
  }
}
