/**
 * Types for the Customize Command
 * Represents the data structures used throughout the customize workflow
 */

import type { FeaturePackage } from '../eject/types'

/**
 * Registry entry for customizable features
 */
export interface CustomizeOption {
  id: string
  name: string
  description: string
  version: string
  category: 'styling' | 'auth' | 'database' | 'api' | 'ui' | 'build' | 'other'
  removable: boolean
  removable_reason?: string
  default: boolean
  dependencies: string[]
  conflicts: string[]
  files: CustomizeFile[]
  configs?: CustomizeConfig[]
  examples?: CustomizeExample[]
  documentation?: string
}

/**
 * File to be added during customization
 */
export interface CustomizeFile {
  source: string // Path relative to customize registry
  destination: string // Where to install in project
  type: 'component' | 'config' | 'utility' | 'example' | 'type' | 'style'
  overwrite: boolean
  template?: boolean // If true, variables can be substituted
  variables?: Record<string, string>
}

/**
 * Configuration to be integrated
 */
export interface CustomizeConfig {
  file: string // Config file to modify
  merge_strategy: 'deep' | 'shallow' | 'replace' | 'append'
  content: Record<string, unknown>
  description: string
}

/**
 * Example code for the feature
 */
export interface CustomizeExample {
  name: string
  description: string
  code: string
  language: string
  file?: string // Where to create example file
}

/**
 * Customize registry
 */
export interface CustomizeRegistry {
  version: string
  name: string
  description: string
  options: CustomizeOption[]
  categories: Record<string, string>
  metadata: RegistryMetadata
}

/**
 * Metadata about the customize registry
 */
export interface RegistryMetadata {
  author?: string
  license?: string
  repository?: string
  homepage?: string
  updated_at?: string
  total_options: number
}

/**
 * User prompt responses
 */
export interface PromptResponse {
  selected_options: string[]
  config_overrides?: Record<string, unknown>
  file_preferences?: FilePreferences
}

/**
 * File installation preferences
 */
export interface FilePreferences {
  overwrite_existing: boolean
  create_backups: boolean
  preserve_structure: boolean
  skip_examples: boolean
}

/**
 * Installation plan before execution
 */
export interface InstallationPlan {
  options_to_install: CustomizeOption[]
  files_to_create: CustomizeFile[]
  configs_to_merge: CustomizeConfig[]
  examples_to_generate?: CustomizeExample[]
  total_files: number
  total_configs: number
  estimated_size: number
  estimated_time: number // in seconds
  warnings: string[]
  dry_run?: boolean
}

/**
 * Installation result
 */
export interface InstallationResult {
  success: boolean
  installed_options: string[]
  created_files: string[]
  merged_configs: string[]
  warnings: string[]
  errors: Error[]
  summary: {
    total_files_created: number
    total_configs_merged: number
    total_time: number
    backups_created?: string[]
  }
}

/**
 * Config integration result
 */
export interface ConfigIntegrationResult {
  file: string
  success: boolean
  changes_made: number
  merge_conflicts?: string[]
  backup_created?: string
  error?: Error
}

/**
 * Validator result for customize operations
 */
export interface CustomizeValidationResult {
  valid: boolean
  errors: CustomizeValidationError[]
  warnings: CustomizeValidationWarning[]
  suggestions: string[]
}

/**
 * Validation error
 */
export interface CustomizeValidationError {
  option_id?: string
  message: string
  code: string
  category: 'missing' | 'invalid' | 'incompatible' | 'conflict'
  severity: 'error' | 'warning'
}

/**
 * Validation warning
 */
export interface CustomizeValidationWarning {
  option_id?: string
  message: string
  suggestion?: string
}

/**
 * Orchestrator state
 */
export interface CustomizeOrchestratorState {
  phase: 'loading' | 'selecting' | 'validating' | 'planning' | 'installing' | 'complete' | 'error'
  registry?: CustomizeRegistry
  selected_options?: string[]
  installation_plan?: InstallationPlan
  result?: InstallationResult
  error?: Error
  progress: number // 0-100
}

/**
 * Orchestrator options
 */
export interface CustomizeOrchestratorOptions {
  dry_run?: boolean
  verbose?: boolean
  interactive?: boolean
  backup?: boolean
  overwrite?: boolean
  config_overrides?: Record<string, unknown>
}

/**
 * Registry compatibility info
 */
export interface RegistryCompatibility {
  min_version: string
  max_version?: string
  required_features?: string[]
  incompatible_features?: string[]
}
