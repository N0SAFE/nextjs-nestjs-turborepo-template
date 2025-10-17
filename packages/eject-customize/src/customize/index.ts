/**
 * Customize Command - Phase 5
 * Export all customize modules
 */

// Types
export type {
  CustomizeOption,
  CustomizeFile,
  CustomizeConfig,
  CustomizeExample,
  CustomizeRegistry,
  RegistryMetadata,
  PromptResponse,
  FilePreferences,
  InstallationPlan,
  InstallationResult,
  ConfigIntegrationResult,
  CustomizeValidationResult,
  CustomizeValidationError,
  CustomizeValidationWarning,
  CustomizeOrchestratorState,
  CustomizeOrchestratorOptions,
  RegistryCompatibility,
} from './types'

// Modules
export { Installer } from './installer'
export { ConfigIntegrator } from './config-integrator'
export { RegistryLoader } from './registry-loader'
export { CustomizePrompts } from './prompts'
export { CustomizeValidator } from './validator'
export { CustomizeOrchestrator } from './orchestrator'
