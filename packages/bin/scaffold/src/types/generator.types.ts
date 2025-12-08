/**
 * Generator Type Definitions
 *
 * These types define the generator system for scaffolding files.
 * Supports multi-plugin file contributions with merge strategies.
 */

import type { ResolvedProjectConfig } from "./config.types";
import type { Plugin, PluginConfig } from "./plugin.types";

// ============================================================================
// File Operations
// ============================================================================

/**
 * File operation types
 */
export type FileOperation = "create" | "modify" | "delete" | "skip" | "pending";

/**
 * Merge strategy for multi-plugin file contributions
 */
export type MergeStrategy =
  | "replace"        // Full file replacement (last wins)
  | "json-merge"     // Deep merge JSON files (package.json, tsconfig)
  | "json-merge-deep"// Deep merge with array concatenation
  | "append"         // Append to end of file
  | "prepend"        // Prepend to start of file
  | "insert-after"   // Insert after a marker/pattern
  | "insert-before"  // Insert before a marker/pattern
  | "ast-transform"  // AST-based code modification
  | "line-merge"     // Merge unique lines (for .gitignore, etc.)
  | "section-merge"; // Merge by section markers

/**
 * File contribution from a plugin
 * Multiple plugins can contribute to the same file
 */
export interface FileContribution {
  /** Plugin ID making the contribution */
  pluginId: string;
  /** Relative path from project root */
  path: string;
  /** Content to contribute */
  content: string;
  /** How to merge with other contributions */
  mergeStrategy: MergeStrategy;
  /** Priority (lower = earlier, used for ordering contributions) */
  priority: number;
  /** For insert strategies: marker/pattern to find */
  marker?: string | RegExp;
  /** For section-merge: section identifier */
  section?: string;
  /** For AST transforms: the transform type */
  astTransform?: ASTTransformType;
  /** Whether this contribution is conditional */
  condition?: string;
  /** Skip if file already exists (for create operations) */
  skipIfExists?: boolean;
}

/**
 * AST transform types for code modification
 */
export type ASTTransformType =
  | "add-import"      // Add import statement
  | "add-export"      // Add export statement
  | "add-decorator"   // Add decorator to class
  | "add-method"      // Add method to class
  | "add-property"    // Add property to class/object
  | "add-array-item"  // Add item to array
  | "wrap-function"   // Wrap function call
  | "modify-object";  // Modify object literal

/**
 * AST transform specification
 */
export interface ASTTransform {
  type: ASTTransformType;
  /** Target (class name, function name, etc.) */
  target?: string;
  /** Content to add/modify */
  content: string;
  /** Position for ordered transforms */
  position?: "first" | "last" | "sorted";
  /** Sort key for sorted position */
  sortKey?: string;
}

/**
 * File specification for generation (legacy support)
 */
export interface FileSpec {
  /** Relative path from project root */
  path: string;
  /** File content (for create/modify) */
  content?: string;
  /** Operation to perform */
  operation: FileOperation;
  /** Template name (if generated from template) */
  template?: string;
  /** Template data context */
  templateData?: TemplateData;
  /** Whether to overwrite if exists */
  overwrite?: boolean;
  /** File permissions (octal) */
  permissions?: number;
  /** Skip reason (if operation is skip) */
  skipReason?: string;
  /** Merge strategy for multi-plugin support */
  mergeStrategy?: MergeStrategy;
  /** Priority (lower = earlier, used for ordering) */
  priority?: number;
  /** For insert strategies: marker/pattern to find */
  marker?: string | RegExp;
  /** For section-merge: section identifier */
  section?: string;
  /** For AST transforms: the transform type */
  astTransform?: ASTTransformType;
  /** Whether this file is conditional */
  condition?: string;
  /** Skip if file already exists */
  skipIfExists?: boolean;
}

// ============================================================================
// Guard System
// ============================================================================

/**
 * Guard check result
 */
export interface GuardResult {
  /** Guard ID */
  id?: string;
  /** Whether the guard passed */
  passed: boolean;
  /** Error/warning message if failed */
  message?: string;
  /** Severity: error blocks generation, warning is logged */
  severity: "error" | "warning" | "info";
  /** Suggested fix if available */
  suggestion?: string;
  /** Whether the guard was optional */
  optional?: boolean;
}

/**
 * Guard check types
 */
export type GuardType =
  | "dependency"    // Check if dependency is available
  | "file-exists"   // Check if file exists
  | "file-missing"  // Check if file is missing
  | "env-var"       // Check environment variable
  | "command"       // Check if command is available
  | "version"       // Check version requirements
  | "plugin"        // Check if plugin is enabled
  | "custom";       // Custom guard function

/**
 * Guard specification
 */
export interface GuardSpec {
  /** Unique ID for the guard */
  id?: string;
  /** Type of guard */
  type: GuardType;
  /** Guard name for logging */
  name: string;
  /** Description of what's being checked */
  description?: string;
  /** Guard-specific configuration */
  config: GuardConfig;
  /** Whether failure should block generation */
  blocking?: boolean;
  /** Human-readable message if guard fails */
  message?: string;
  /** Whether this guard is optional (non-blocking) */
  optional?: boolean;
}

/**
 * Guard configuration (union of all guard configs)
 */
export type GuardConfig =
  | DependencyGuardConfig
  | FileGuardConfig
  | EnvGuardConfig
  | CommandGuardConfig
  | VersionGuardConfig
  | PluginGuardConfig
  | CustomGuardConfig;

export interface DependencyGuardConfig {
  type: "dependency";
  /** Package name to check */
  package: string;
  /** Whether it's a dev dependency */
  dev?: boolean;
  /** Minimum version */
  minVersion?: string;
}

export interface FileGuardConfig {
  type: "file-exists" | "file-missing";
  /** File path to check */
  path: string;
  /** Pattern to match content */
  contentPattern?: string | RegExp;
}

export interface EnvGuardConfig {
  type: "env-var";
  /** Environment variable name */
  name: string;
  /** Expected value (if checking specific value) */
  value?: string;
  /** Pattern to match value */
  pattern?: RegExp;
}

export interface CommandGuardConfig {
  type: "command";
  /** Command to check */
  command: string;
  /** Arguments to pass */
  args?: string[];
  /** Expected exit code */
  exitCode?: number;
}

export interface VersionGuardConfig {
  type: "version";
  /** Tool to check version of */
  tool: "node" | "bun" | "npm" | "pnpm" | "yarn" | string;
  /** Minimum version */
  minVersion: string;
  /** Maximum version */
  maxVersion?: string;
}

export interface PluginGuardConfig {
  type: "plugin";
  /** Plugin ID to check */
  pluginId: string;
  /** Check mode: enabled or disabled */
  mode: "enabled" | "disabled";
}

export interface CustomGuardConfig {
  type: "custom";
  /** Custom check function name */
  fn: string;
  /** Function arguments */
  args?: unknown[];
}

// ============================================================================
// CLI Command Execution
// ============================================================================

/**
 * CLI command specification for scaffolding tools
 */
export interface CLICommandSpec {
  /** Command to execute (e.g., 'npx', 'bunx', 'shadcn') */
  command: string;
  /** Subcommand (e.g., 'init', 'add', 'g') */
  subcommand?: string;
  /** Command arguments */
  args: string[];
  /** Working directory (relative to output) */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Description for logging */
  description: string;
  /** Whether command is interactive */
  interactive?: boolean;
  /** Answers for non-interactive mode (stdin responses) */
  answers?: string[];
  /** Whether failure should stop the process */
  critical?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Pre-execution guards */
  guards?: GuardSpec[];
  /** Plugin ID that requested this command */
  pluginId: string;
  /** Priority for ordering commands */
  priority?: number;
}

/**
 * Predefined CLI commands for common tools
 */
export type CLICommandType =
  // Shadcn
  | "shadcn-init"
  | "shadcn-add"
  // NestJS
  | "nestjs-new"
  | "nestjs-generate"
  // Next.js
  | "nextjs-create"
  // Prisma
  | "prisma-init"
  | "prisma-generate"
  | "prisma-migrate"
  // Drizzle
  | "drizzle-kit-generate"
  | "drizzle-kit-push"
  // Package managers
  | "bun-install"
  | "npm-install"
  | "pnpm-install"
  // Git
  | "git-init"
  | "git-add"
  | "git-commit"
  // Docker
  | "docker-build"
  | "docker-compose-up"
  // Custom
  | "custom";

/**
 * CLI command result
 */
export interface CLICommandResult {
  /** Command that was executed */
  command: CLICommandSpec;
  /** Whether command succeeded */
  success: boolean;
  /** Exit code */
  exitCode: number;
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Duration in milliseconds */
  duration: number;
  /** Error message if failed */
  error?: string;
  /** Whether command was skipped */
  skipped?: boolean;
  /** Reason for skipping */
  skipReason?: string;
}

// ============================================================================
// Template System
// ============================================================================

/**
 * Template data context
 * Variables available to Handlebars templates
 */
export interface TemplateData {
  /** Project configuration */
  project: ResolvedProjectConfig;
  /** Current plugin being generated */
  plugin?: Plugin;
  /** Plugin-specific configuration */
  pluginConfig?: PluginConfig;
  /** List of all enabled plugins */
  enabledPlugins: string[];
  /** Helper flags for conditional generation */
  has: {
    auth: boolean;
    database: boolean;
    redis: boolean;
    docker: boolean;
    testing: boolean;
    ci: boolean;
    docs: boolean;
    api: boolean;
    web: boolean;
    [key: string]: boolean;
  };
  /** Package versions */
  versions: Record<string, string>;
  /** Custom data from plugin */
  custom?: Record<string, unknown>;
  /** File contributions from other plugins (for multi-plugin awareness) */
  contributions?: FileContribution[];
}

// ============================================================================
// Generator Context & Results
// ============================================================================

/**
 * Generator context passed to generators
 */
export interface GeneratorContext {
  /** Resolved project configuration */
  projectConfig: ResolvedProjectConfig;
  /** Current plugin configuration (if plugin-specific) */
  pluginConfig?: PluginConfig;
  /** Output directory path */
  outputPath: string;
  /** List of enabled plugin IDs */
  enabledPlugins: string[];
  /** Whether this is a dry run */
  dryRun: boolean;
  /** Whether to skip confirmation prompts */
  skipPrompts: boolean;
  /** Verbose output */
  verbose: boolean;
  /** Existing file contributions (from earlier plugins) */
  existingContributions?: Map<string, FileContribution[]>;
  /** Guard results from pre-checks (array for easy iteration) */
  guardResults?: GuardResult[];
}

/**
 * Result of a generator execution
 */
export interface GeneratorResult {
  /** Plugin ID that generated this result */
  pluginId: string;
  /** Whether generation was successful */
  success: boolean;
  /** Files that were created/modified/deleted */
  files: FileSpec[];
  /** File contributions (for multi-plugin merging) */
  contributions?: FileContribution[];
  /** Dependencies to add to package.json */
  dependencies?: DependencySpec[];
  /** Scripts to add to package.json */
  scripts?: ScriptSpec[];
  /** CLI commands to execute */
  cliCommands?: CLICommandSpec[];
  /** Post-generation commands to run (legacy) */
  postCommands?: PostCommand[];
  /** Guard specs to check before generation */
  guards?: GuardSpec[];
  /** Warning messages */
  warnings?: string[];
  /** Error message (if success is false) */
  error?: string;
  /** Duration in milliseconds */
  duration?: number;
  /** Post-install notes for users */
  notes?: string[];
}

// ============================================================================
// Dependency & Script Specs
// ============================================================================

/**
 * Dependency specification
 */
export interface DependencySpec {
  /** Package name */
  name: string;
  /** Version specifier */
  version: string;
  /** Dependency type: prod, dev, or peer */
  type: "prod" | "dev" | "peer";
  /** Whether this is a dev dependency (alias for type === 'dev') */
  dev?: boolean;
  /** Whether this is a peer dependency (alias for type === 'peer') */
  peer?: boolean;
  /** Whether this is an optional dependency */
  optional?: boolean;
  /** Target package.json (for monorepo) */
  target?: "root" | "api" | "web" | "doc" | string;
  /** Plugin that requested this dependency */
  pluginId?: string;
}

/**
 * Script specification
 */
export interface ScriptSpec {
  /** Script name */
  name: string;
  /** Script command */
  command: string;
  /** Target package.json (for monorepo) */
  target?: "root" | "api" | "web" | "doc" | string;
  /** Description for documentation */
  description?: string;
  /** Plugin that added this script */
  pluginId?: string;
}

/**
 * Post-generation command (legacy - prefer CLICommandSpec)
 */
export interface PostCommand {
  /** Command to execute */
  command: string;
  /** Arguments */
  args?: string[];
  /** Working directory (relative to output) */
  cwd?: string;
  /** Description of what the command does */
  description?: string;
  /** Whether failure should stop the process */
  critical?: boolean;
}

// ============================================================================
// Aggregated Results
// ============================================================================

/**
 * Aggregated result from all generators
 */
export interface ScaffoldResult {
  /** Overall success status */
  success: boolean;
  /** Project output path */
  outputPath: string;
  /** Project name */
  projectName: string;
  /** Individual generator results */
  results: GeneratorResult[];
  /** Total files created */
  filesCreated: number;
  /** Total files modified */
  filesModified: number;
  /** Total files skipped */
  filesSkipped: number;
  /** All dependencies to install */
  allDependencies: DependencySpec[];
  /** All scripts added */
  allScripts: ScriptSpec[];
  /** CLI commands executed */
  cliCommandResults?: CLICommandResult[];
  /** All post-generation commands (legacy) */
  postCommands: PostCommand[];
  /** Guard results */
  guardResults?: GuardResult[];
  /** All warnings collected */
  warnings: string[];
  /** Total duration in milliseconds */
  totalDuration: number;
  /** Timestamp */
  completedAt: Date;
}

// ============================================================================
// Generator Metadata & Registration
// ============================================================================

/**
 * Generator metadata for registration
 */
export interface GeneratorMetadata {
  /** Plugin ID this generator handles */
  pluginId: string;
  /** Generator priority (lower = earlier) */
  priority: number;
  /** Generator version */
  version: string;
  /** Generator description */
  description?: string;
  /** Whether generator supports incremental updates */
  supportsUpdate?: boolean;
  /** Files this generator contributes to */
  contributesTo?: string[];
  /** Files this generator depends on (from other plugins) */
  dependsOn?: string[];
}

/**
 * File modification specification
 * For modifying existing files (e.g., adding imports)
 */
export interface FileModification {
  /** File path */
  path: string;
  /** Type of modification */
  type: "insert" | "replace" | "append" | "prepend" | "delete-section";
  /** Content to insert/replace/append */
  content?: string;
  /** Pattern to find (for replace/insert-after) */
  pattern?: string | RegExp;
  /** Position for insert */
  position?: "before" | "after";
  /** Section markers for delete-section */
  startMarker?: string;
  /** Section markers for delete-section */
  endMarker?: string;
}

/**
 * Template helper function type
 */
export type TemplateHelper = (
  ...args: unknown[]
) => string | boolean | number | undefined;

/**
 * Template partial definition
 */
export interface TemplatePartial {
  /** Partial name */
  name: string;
  /** Partial content */
  content: string;
}

// ============================================================================
// Global Context Registry
// ============================================================================

/**
 * HTTP methods for route registration
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

/**
 * Route registration from a generator
 * Allows generators to register API routes they create
 */
export interface RouteRegistration {
  /** Plugin ID that registered this route */
  pluginId: string;
  /** Route path (e.g., '/api/users', '/api/health') */
  path: string;
  /** HTTP method */
  method: HttpMethod;
  /** ORPC contract name if using ORPC (e.g., 'userContract') */
  contract?: string;
  /** Route handler name (e.g., 'getUsers', 'createUser') */
  handler: string;
  /** Entity name if this is an entity CRUD route */
  entity?: string;
  /** Whether this route requires authentication */
  authenticated?: boolean;
  /** Required permissions for this route */
  permissions?: string[];
  /** Route description for documentation */
  description?: string;
  /** Request/response schema types */
  schemas?: {
    request?: string;
    response?: string;
    params?: string;
    query?: string;
  };
  /** Route tags for grouping */
  tags?: string[];
  /** Route metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Plugin registration for tracking active plugins
 * Allows generators to know what plugins are active
 */
export interface PluginRegistration {
  /** Plugin ID */
  pluginId: string;
  /** Plugin version */
  version: string;
  /** Plugin type/category */
  type: PluginType;
  /** Features this plugin provides */
  provides: string[];
  /** Features this plugin requires */
  requires?: string[];
  /** Plugin configuration */
  config?: Record<string, unknown>;
  /** Registration timestamp */
  registeredAt: Date;
}

/**
 * Plugin type categories
 */
export type PluginType =
  | "core"        // Core infrastructure (turborepo, typescript, etc.)
  | "app"         // Application scaffolding (nestjs, nextjs)
  | "auth"        // Authentication (better-auth)
  | "database"    // Database (drizzle, postgres)
  | "api"         // API layer (orpc, rest)
  | "ui"          // UI components (shadcn, tailwind)
  | "testing"     // Testing (vitest, playwright)
  | "infra"       // Infrastructure (docker, ci-cd)
  | "feature"     // Feature modules (health, user, etc.)
  | "utility";    // Utility plugins

/**
 * Feature registration for cross-generator coordination
 * Allows generators to register features they implement
 */
export interface FeatureRegistration {
  /** Plugin ID that registered this feature */
  pluginId: string;
  /** Feature identifier (e.g., 'user-crud', 'auth-guards') */
  featureId: string;
  /** Feature category */
  category: FeatureCategory;
  /** Files generated for this feature */
  files: string[];
  /** Dependencies this feature adds */
  dependencies?: string[];
  /** Scripts this feature adds */
  scripts?: string[];
  /** Routes this feature provides */
  routes?: RouteRegistration[];
  /** Hooks this feature provides */
  hooks?: HookRegistration[];
  /** Feature description */
  description?: string;
  /** Feature metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Feature categories
 */
export type FeatureCategory =
  | "authentication"  // Auth-related features
  | "authorization"   // Permission/access control
  | "api-endpoint"    // API endpoints
  | "ui-component"    // UI components
  | "state"           // State management
  | "utility"         // Utility functions
  | "middleware"      // Middleware
  | "guard"           // Guards
  | "decorator"       // Decorators
  | "hook"            // React hooks
  | "service"         // Backend services
  | "repository"      // Data access layer
  | "entity";         // Entity/model

/**
 * Hook registration for frontend hook generation
 */
export interface HookRegistration {
  /** Plugin ID that registered this hook */
  pluginId: string;
  /** Hook name (e.g., 'useUsers', 'useCreateUser') */
  name: string;
  /** Hook type */
  type: HookType;
  /** Related entity if entity-based */
  entity?: string;
  /** Related route if route-based */
  route?: RouteRegistration;
  /** Hook input type */
  inputType?: string;
  /** Hook output type */
  outputType?: string;
  /** Whether hook is auto-generated */
  autoGenerated?: boolean;
  /** Hook description */
  description?: string;
}

/**
 * Hook types for frontend
 */
export type HookType =
  | "query"           // Data fetching (useQuery)
  | "mutation"        // Data mutation (useMutation)
  | "infinite-query"  // Infinite scrolling
  | "subscription"    // Real-time subscription
  | "state"           // State hook (useState wrapper)
  | "store"           // Store hook (zustand)
  | "custom";         // Custom hook

/**
 * Subscription callback type for context registry changes
 */
export type ContextSubscriptionCallback<T> = (
  items: T[],
  added: T[],
  removed: T[]
) => void;

/**
 * Subscription options
 */
export interface SubscriptionOptions {
  /** Only receive updates for specific plugin(s) */
  filterByPlugin?: string | string[];
  /** Only receive updates for specific category */
  filterByCategory?: string;
  /** Only receive updates for specific tags */
  filterByTags?: string[];
  /** Receive initial state on subscribe */
  receiveInitial?: boolean;
}

/**
 * Context subscription handle
 */
export interface ContextSubscription {
  /** Unique subscription ID */
  id: string;
  /** Plugin that created this subscription */
  subscriberPluginId: string;
  /** Type of items being subscribed to */
  type: "routes" | "plugins" | "features" | "hooks";
  /** Unsubscribe function */
  unsubscribe: () => void;
}

/**
 * Context registry snapshot
 * Complete state of the registry at a point in time
 */
export interface ContextRegistrySnapshot {
  /** All registered routes */
  routes: RouteRegistration[];
  /** All registered plugins */
  plugins: PluginRegistration[];
  /** All registered features */
  features: FeatureRegistration[];
  /** All registered hooks */
  hooks: HookRegistration[];
  /** Snapshot timestamp */
  timestamp: Date;
}

/**
 * Context registry events
 */
export type ContextRegistryEvent =
  | { type: "route-added"; route: RouteRegistration }
  | { type: "route-removed"; route: RouteRegistration }
  | { type: "plugin-added"; plugin: PluginRegistration }
  | { type: "plugin-removed"; plugin: PluginRegistration }
  | { type: "feature-added"; feature: FeatureRegistration }
  | { type: "feature-removed"; feature: FeatureRegistration }
  | { type: "hook-added"; hook: HookRegistration }
  | { type: "hook-removed"; hook: HookRegistration }
  | { type: "snapshot-reset"; snapshot: ContextRegistrySnapshot };
