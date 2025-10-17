/**
 * Types for Framework Swapping (Phase 6)
 * Defines types for detecting and swapping between frameworks
 */

/**
 * Supported frameworks for detection and swapping
 */
export type FrameworkType =
  | 'nextjs'
  | 'react'
  | 'vue'
  | 'angular'
  | 'svelte'
  | 'solid'
  | 'qwik'
  | 'astro'
  | 'remix'
  | 'nuxt'
  | 'unknown'

/**
 * Framework version information
 */
export interface FrameworkVersion {
  major: number
  minor: number
  patch: number
  full: string
  prerelease?: string
}

/**
 * Detected framework in project
 */
export interface DetectedFramework {
  type: FrameworkType
  version: FrameworkVersion
  confidence: number // 0-100
  evidence: FrameworkEvidence[]
  dependencies: string[]
  devDependencies: string[]
  config_files: string[]
}

/**
 * Evidence for framework detection
 */
export interface FrameworkEvidence {
  type: 'dependency' | 'devDependency' | 'file' | 'script' | 'config'
  value: string
  weight: number // 0-100
  description: string
}

/**
 * Framework swap configuration
 */
export interface FrameworkSwapConfig {
  from: FrameworkType
  to: FrameworkType
  preserve_features: boolean
  migrate_dependencies: boolean
  update_configs: boolean
  create_backup: boolean
  dry_run?: boolean
}

/**
 * Framework swap plan
 */
export interface FrameworkSwapPlan {
  config: FrameworkSwapConfig
  dependencies_to_add: DependencyChange[]
  dependencies_to_remove: string[]
  dependencies_to_update: DependencyChange[]
  files_to_create: FileChange[]
  files_to_modify: FileChange[]
  files_to_delete: string[]
  configs_to_update: ConfigChange[]
  scripts_to_update: ScriptChange[]
  warnings: string[]
  manual_steps: ManualStep[]
  estimated_time: number // in seconds
}

/**
 * Dependency change
 */
export interface DependencyChange {
  package: string
  from_version?: string
  to_version: string
  type: 'dependencies' | 'devDependencies' | 'peerDependencies'
  reason: string
}

/**
 * File change during swap
 */
export interface FileChange {
  path: string
  action: 'create' | 'modify' | 'delete'
  content?: string
  backup?: string
  description: string
}

/**
 * Config file change
 */
export interface ConfigChange {
  file: string
  changes: Record<string, unknown>
  merge_strategy: 'replace' | 'merge' | 'append'
  description: string
}

/**
 * Script change in package.json
 */
export interface ScriptChange {
  name: string
  from_command?: string
  to_command: string
  description: string
}

/**
 * Manual step required by user
 */
export interface ManualStep {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: 'configuration' | 'code' | 'build' | 'deployment'
  documentation_url?: string
}

/**
 * Framework swap result
 */
export interface FrameworkSwapResult {
  success: boolean
  from_framework: FrameworkType
  to_framework: FrameworkType
  dependencies_changed: number
  files_changed: number
  configs_changed: number
  scripts_changed: number
  backup_path?: string
  errors: Error[]
  warnings: string[]
  manual_steps: ManualStep[]
  duration: number // in milliseconds
}

/**
 * Framework compatibility information
 */
export interface FrameworkCompatibility {
  from: FrameworkType
  to: FrameworkType
  compatible: boolean
  difficulty: 'easy' | 'medium' | 'hard' | 'very-hard'
  compatibility_score: number // 0-100
  issues: CompatibilityIssue[]
  recommendations: string[]
}

/**
 * Compatibility issue
 */
export interface CompatibilityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: 'framework' | 'routing' | 'rendering' | 'api' | 'middleware' | 'assets' | 'i18n' | 'typescript' | 'dependency' | 'feature' | 'syntax' | 'config' | 'build'
  description: string
  impact: string
  suggestion: string
  documentation_url?: string
}

/**
 * Framework detection options
 */
export interface DetectionOptions {
  project_root?: string
  confidence_threshold?: number // minimum confidence to accept detection
  scan_depth?: number // how deep to scan directories
  include_implicit?: boolean // detect based on file patterns
  verbose?: boolean
}

/**
 * Framework swap options
 */
export interface SwapOptions {
  force?: boolean // skip compatibility checks
  interactive?: boolean // prompt for confirmations
  preserve_git?: boolean // preserve git history
  backup?: boolean // create backup before swap
  dry_run?: boolean // simulate without changes
  verbose?: boolean
}

/**
 * Framework feature mapping
 */
export interface FrameworkFeatureMap {
  routing: 'file-based' | 'module-based' | 'library' | 'unknown'
  ssr: boolean
  ssg: boolean
  api_routes: boolean
  middleware: boolean
  image_optimization: boolean
  i18n: boolean
  typescript: boolean
  css_modules: boolean
  sass: boolean
  tailwind: boolean
}

/**
 * Migration strategy for specific feature
 */
export interface MigrationStrategy {
  feature: string
  from_framework: FrameworkType
  to_framework: FrameworkType
  approach: 'direct' | 'adapter' | 'rewrite' | 'manual'
  steps: MigrationStep[]
  complexity: 'low' | 'medium' | 'high'
}

/**
 * Individual migration step
 */
export interface MigrationStep {
  order: number
  title: string
  description: string
  automated: boolean
  commands?: string[]
  files_affected?: string[]
  validation?: string
}
