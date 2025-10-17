/**
 * Framework Swapping Module (Phase 6)
 * 
 * Provides detection, analysis, planning, and execution of framework swaps
 */

// Types
export type {
  FrameworkType,
  FrameworkVersion,
  DetectedFramework,
  FrameworkEvidence,
  FrameworkSwapConfig,
  FrameworkSwapPlan,
  FrameworkSwapResult,
  DependencyChange,
  FileChange,
  ConfigChange,
  ScriptChange,
  ManualStep,
  SwapOptions,
  FrameworkCompatibility,
  CompatibilityIssue,
} from './types'

// Framework Detection
export { FrameworkDetector } from './detector'

// Compatibility Analysis
export { CompatibilityAnalyzer } from './compatibility-analyzer'

// Swap Planning
export { SwapPlanner, type SwapPlannerOptions } from './planner'

// Swap Execution
export { SwapExecutor, type SwapExecutorOptions } from './executor'

// Migration Strategies
export {
  getMigrationStrategy,
  getMigrationComplexity,
  hasMigrationStrategy,
  getAvailableMigrationPaths,
  type MigrationStrategy,
  type MigrationStep,
  type CodeExample,
} from './migration-strategies'
