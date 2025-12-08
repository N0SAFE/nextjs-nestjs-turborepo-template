# Plugin System v2 Design Document

## Overview

This document describes the redesigned plugin system that supports:
1. **Plugin Input Configuration**: Each plugin receives typed configuration
2. **Global Config Object**: Shared configuration accessible by all plugins
3. **Plugin Output**: Results and hooks that dependent plugins can access
4. **Enhancement Plugins**: Plugins that intercept and modify their dependency's output

## Core Concepts

### Plugin Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Plugin Execution Flow                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. RESOLUTION PHASE                                                     │
│     ├── Sort plugins by dependencies (topological order)                 │
│     ├── Identify enhancement plugins (plugins that modify dependencies)  │
│     └── Build execution graph                                            │
│                                                                          │
│  2. INITIALIZATION PHASE (per plugin, in order)                          │
│     ├── Create plugin context with:                                      │
│     │   ├── globalConfig (readonly)                                      │
│     │   ├── pluginInput (typed config from scaffold-config.json)         │
│     │   └── dependencyOutputs (outputs from dependencies)                │
│     └── Call plugin.initialize(context)                                  │
│                                                                          │
│  3. EXECUTION PHASE (per plugin, in order)                               │
│     ├── Call plugin.execute(context)                                     │
│     ├── Collect plugin output:                                           │
│     │   ├── files (FileSpec[])                                           │
│     │   ├── dependencies (DependencySpec[])                              │
│     │   ├── hooks (PluginHooks - functions for dependent plugins)        │
│     │   └── data (arbitrary typed data)                                  │
│     └── Store output for dependent plugins                               │
│                                                                          │
│  4. ENHANCEMENT PHASE (IMMEDIATELY after each base plugin)                   │
│     ├── For each enhancement plugin targeting this base plugin:              │
│     │   ├── Get current output (may already be enhanced)                     │
│     │   ├── Call enhancer.enhance(currentOutput, context)                    │
│     │   └── Replace stored output with enhanced version                      │
│     └── Result: Base plugin output is FULLY ENHANCED before consumers run    │
│                                                                              │
│  5. CONSUMER PHASE (after all enhancements applied)                          │
│     ├── Consumer plugins receive FINAL enhanced output                       │
│     ├── getDependencyOutput() returns fully enhanced data                    │
│     └── getDependencyHooks() returns all hooks (base + enhancements)         │
│                                                                              │
│  6. FINALIZATION PHASE                                                       │
│     ├── Merge all file contributions                                     │
│     ├── Execute CLI commands                                             │
│     └── Generate final output                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Plugin Types

#### 1. Standard Plugin
Creates files, adds dependencies, provides output for dependents.

```typescript
class DrizzlePlugin extends BasePlugin<DrizzleConfig, DrizzleOutput> {
  // Input config from scaffold-config.json
  inputSchema = z.object({
    provider: z.enum(['postgresql', 'mysql', 'sqlite']),
    migrations: z.boolean().default(true),
    studio: z.boolean().default(true),
  });

  // Output accessible by dependent plugins
  async execute(context: PluginContext<DrizzleConfig>): Promise<DrizzleOutput> {
    return {
      files: [...],
      dependencies: [...],
      output: {
        schemaPath: 'src/db/schema',
        connectionString: context.globalConfig.database.connectionString,
        // Hooks for dependent plugins
        hooks: {
          addTable: (tableDef) => this.generateTable(tableDef),
          addRelation: (relation) => this.generateRelation(relation),
          getSchemaImport: () => "import { db } from '@/db'",
        },
      },
    };
  }
}
```

#### 2. Enhancement Plugin
Modifies the output of its target plugin.

```typescript
class BetterAuthAdminPlugin extends EnhancementPlugin<BetterAuthAdminConfig, BetterAuthOutput> {
  // This plugin enhances 'better-auth'
  enhances = 'better-auth';

  async enhance(
    targetOutput: BetterAuthOutput,
    context: PluginContext<BetterAuthAdminConfig>
  ): Promise<BetterAuthOutput> {
    // Modify the better-auth output
    return {
      ...targetOutput,
      output: {
        ...targetOutput.output,
        // Add admin-specific configuration
        adminPlugins: [...targetOutput.output.plugins, this.getAdminPlugin()],
        // Extend hooks
        hooks: {
          ...targetOutput.output.hooks,
          getAdminRoutes: () => this.generateAdminRoutes(),
        },
      },
    };
  }
}
```

#### 3. Consumer Plugin
Depends on another plugin and uses its output.

```typescript
class BetterAuthClientPlugin extends BasePlugin<BetterAuthClientConfig, BetterAuthClientOutput> {
  dependencies = ['better-auth'];

  async execute(context: PluginContext<BetterAuthClientConfig>): Promise<BetterAuthClientOutput> {
    // Access the better-auth plugin's output
    const authOutput = context.getDependencyOutput<BetterAuthOutput>('better-auth');
    
    // Use the instance specified in config
    const instance = authOutput.instances.find(i => i.name === context.input.instance);
    
    // Use hooks provided by better-auth
    const authSchemas = authOutput.hooks.getAuthSchemas();
    
    return {
      files: this.generateClientFiles(instance, authSchemas),
      dependencies: [...],
      output: {
        clientInstance: instance,
        hooks: {
          useAuth: () => "import { useAuth } from '@/lib/auth-client'",
        },
      },
    };
  }
}
```

## Type Definitions

### Global Config

```typescript
/**
 * Global configuration accessible by all plugins
 * Set from scaffold-config.json at the project level
 */
interface GlobalConfig {
  /** Project metadata */
  project: {
    name: string;
    description?: string;
    author?: string;
    license?: string;
  };
  
  /** Package manager in use */
  packageManager: 'bun' | 'npm' | 'yarn' | 'pnpm';
  
  /** App configurations */
  apps: ResolvedAppConfig[];
  
  /** Environment configuration */
  env: {
    nodeEnv: 'development' | 'production' | 'test';
    /** Environment variables that should be available */
    variables: Record<string, string>;
  };
  
  /** Database configuration (if any) */
  database?: {
    provider: DatabaseProvider;
    connectionString?: string;
  };
  
  /** Feature flags */
  features: {
    docker: boolean;
    ci: boolean;
    testing: boolean;
    authentication: boolean;
    [key: string]: boolean;
  };
  
  /** Paths configuration */
  paths: {
    root: string;
    apps: string;
    packages: string;
  };
  
  /** Additional custom config */
  custom: Record<string, unknown>;
}
```

### Plugin Input/Output

```typescript
/**
 * Base plugin input schema
 */
interface PluginInput<T = unknown> {
  /** Plugin-specific configuration */
  config: T;
  /** Whether plugin is enabled (for optional plugins) */
  enabled?: boolean;
}

/**
 * Plugin output structure
 */
interface PluginOutput<TData = unknown, THooks = Record<string, unknown>> {
  /** Generated files */
  files: FileSpec[];
  /** Dependencies to add */
  dependencies: DependencySpec[];
  /** Scripts to add */
  scripts: ScriptSpec[];
  /** CLI commands to run */
  cliCommands: CLICommandSpec[];
  /** Typed data output for dependent plugins */
  data: TData;
  /** Hook functions for dependent plugins */
  hooks: THooks;
  /** Warnings generated */
  warnings: string[];
  /** Notes for user */
  notes: string[];
}

/**
 * Plugin context provided during execution
 */
interface PluginContext<TInput = unknown> {
  /** Plugin input configuration */
  input: TInput;
  /** Global configuration (readonly) */
  globalConfig: Readonly<GlobalConfig>;
  /** Output path */
  outputPath: string;
  /** Check if a plugin is enabled */
  hasPlugin(pluginId: string): boolean;
  /** Get dependency output (type-safe) */
  getDependencyOutput<T extends PluginOutput>(pluginId: string): T['data'];
  /** Get dependency hooks (type-safe) */
  getDependencyHooks<T extends PluginOutput>(pluginId: string): T['hooks'];
  /** Get all enabled plugins */
  getEnabledPlugins(): string[];
  /** Dry run mode */
  dryRun: boolean;
  /** Verbose mode */
  verbose: boolean;
}
```

### Plugin Definition

```typescript
/**
 * Base plugin interface
 */
interface IPlugin<
  TInput = unknown,
  TData = unknown,
  THooks extends Record<string, (...args: any[]) => any> = Record<string, never>
> {
  /** Unique plugin identifier */
  id: string;
  /** Plugin symbol for type-safe references */
  symbol: PluginSymbol;
  /** Human-readable name */
  name: string;
  /** Description */
  description: string;
  /** Plugin version */
  version: string;
  /** Plugin category */
  category: PluginCategory;
  /** Input configuration schema (Zod) */
  inputSchema: z.ZodSchema<TInput>;
  /** Dependencies (plugin IDs) */
  dependencies: string[];
  /** Optional dependencies */
  optionalDependencies?: string[];
  /** Plugins this conflicts with */
  conflicts?: string[];
  /** Supported app types */
  supportedApps: AppTypeId[] | '*';
  /** Priority (lower = earlier) */
  priority: number;
  
  /** Initialize plugin (before execution) */
  initialize?(context: PluginContext<TInput>): Promise<void>;
  
  /** Execute plugin */
  execute(context: PluginContext<TInput>): Promise<PluginOutput<TData, THooks>>;
  
  /** Cleanup after execution (optional) */
  cleanup?(context: PluginContext<TInput>): Promise<void>;
}

/**
 * Enhancement plugin interface
 * Enhances/modifies another plugin's output
 */
interface IEnhancementPlugin<
  TInput = unknown,
  TTargetOutput extends PluginOutput = PluginOutput
> extends IPlugin<TInput, TTargetOutput['data'], TTargetOutput['hooks']> {
  /** Plugin ID this enhancement targets */
  enhances: string;
  
  /** 
   * Enhance the target plugin's output
   * Called after the target plugin executes
   */
  enhance(
    targetOutput: TTargetOutput,
    context: PluginContext<TInput>
  ): Promise<TTargetOutput>;
}
```

## Better-Auth Example

### Multi-Instance Architecture Concept

The better-auth plugin supports **multiple independent instances**, where each instance is a completely isolated authentication system with its own:

- **Database schema**: Separate tables for users, sessions, accounts
- **Plugin stack**: Different auth plugins per instance (admin, oauth, api-keys, etc.)
- **Configuration**: Instance-specific session strategy, expiry, security settings
- **Use case**: Tailored for specific authentication scenarios

#### Why Multiple Instances?

| Instance | Use Case | Typical Plugins | Session Strategy |
|----------|----------|-----------------|------------------|
| `endUser` | End-user authentication (web app) | oauth-google, email-password, admin | JWT, 7d expiry |
| `apiAccess` | API/Machine-to-machine auth | api-key, bearer, rate-limit | JWT, 30d expiry |
| `internalAdmin` | Internal admin dashboard | admin, 2fa, audit-log | Database session, 1h expiry |
| `b2bTenant` | Multi-tenant B2B auth | organization, sso-saml, rbac | JWT, 24h expiry |

Each instance generates its own:
- Database schema (e.g., `auth.users`, `api_auth.users`)
- Auth client (`@/lib/auth/endUser/client.ts`)
- Auth server (`@/lib/auth/endUser/server.ts`)
- Configuration file (`@/lib/auth/endUser/config.ts`)

### Configuration Structure

```json
{
  "plugins": {
    "better-auth": {
      "instances": [
        {
          "name": "endUser",
          "description": "Primary authentication for web app users",
          "version": "1.0.0",
          "database": {
            "type": "drizzle",
            "schema": "auth",
            "tablePrefix": ""
          },
          "plugins": ["oauth-google", "oauth-github", "email-password", "bearer"],
          "session": {
            "strategy": "jwt",
            "expiry": "7d",
            "refreshToken": true
          },
          "security": {
            "rateLimit": { "max": 100, "window": "15m" },
            "csrf": true
          }
        },
        {
          "name": "apiAccess",
          "description": "Machine-to-machine API authentication",
          "version": "1.0.0",
          "database": {
            "type": "drizzle",
            "schema": "api_auth",
            "tablePrefix": "api_"
          },
          "plugins": ["api-key", "bearer", "rate-limit"],
          "session": {
            "strategy": "jwt",
            "expiry": "30d",
            "refreshToken": false
          },
          "security": {
            "rateLimit": { "max": 1000, "window": "1m" }
          }
        }
      ]
    },
    "better-auth.plugins/admin": {
      "instance": "endUser",
      "dashboard": {
        "enabled": true,
        "path": "/admin/auth",
        "features": ["user-management", "session-viewer", "audit-log"]
      }
    },
    "better-auth.plugins/oauth-google": {
      "instance": "endUser",
      "clientId": "${GOOGLE_CLIENT_ID}",
      "clientSecret": "${GOOGLE_CLIENT_SECRET}",
      "scopes": ["email", "profile"]
    },
    "better-auth/client": {
      "instance": "endUser"
    },
    "better-auth/server": {
      "instance": "endUser"
    }
  }
}
```

### Enhancement Plugin Execution Order

**Critical Concept**: Enhancement plugins are **inserted between** the enhanced plugin and its consumers in the execution chain. This ensures consumers always receive the fully enhanced output.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    EXECUTION ORDER WITH ENHANCEMENT PLUGINS                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  PHASE 1: Base Plugin Execution                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  better-auth.execute()  →  BaseOutput {                                     │    │
│  │                              instances: [...],                              │    │
│  │                              hooks: { getInstance, addPlugin, ... }         │    │
│  │                           }                                                 │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                          │                                           │
│                                          ▼                                           │
│  PHASE 2: Enhancement Plugins (in dependency order)                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  better-auth.plugins/admin.enhance(BaseOutput)                              │    │
│  │      → EnhancedOutput1 { ...BaseOutput, adminRoutes, hooks.getAdmin }       │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                          │                                           │
│                                          ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  better-auth.plugins/audit.enhance(EnhancedOutput1)                         │    │
│  │      → EnhancedOutput2 { ...EnhancedOutput1, auditLog, hooks.logEvent }     │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                          │                                           │
│                                          ▼                                           │
│  PHASE 3: Consumer Plugins (receive FINAL enhanced output)                           │
│  ┌──────────────────────────────────────┐  ┌──────────────────────────────────┐     │
│  │  better-auth/client.execute()        │  │  better-auth/server.execute()    │     │
│  │                                      │  │                                  │     │
│  │  getDependencyOutput('better-auth')  │  │  getDependencyOutput('better-auth')│   │
│  │  → EnhancedOutput2 (FULLY ENHANCED)  │  │  → EnhancedOutput2 (FULLY ENHANCED)│   │
│  │                                      │  │                                  │     │
│  │  // Has access to:                   │  │  // Has access to:               │     │
│  │  // - Base hooks                     │  │  // - Base hooks                 │     │
│  │  // - Admin hooks (from enhancement) │  │  // - Admin hooks                │     │
│  │  // - Audit hooks (from enhancement) │  │  // - Audit hooks                │     │
│  └──────────────────────────────────────┘  └──────────────────────────────────┘     │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Plugin Dependency Graph (Multi-Instance, Multi-Plugin Ecosystem)

This graph demonstrates:
1. **Multiple independent plugin ecosystems** (better-auth, orpc) running in parallel
2. **Multi-instance support** within each ecosystem
3. **Deep dependency chains** (consumers of consumers)
4. **Cross-ecosystem integration** (better-auth-orpc bridges two ecosystems)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         LAYER 0: BASE PLUGINS                                                    │
│                                    (Independent, can run in parallel)                                            │
├────────────────────────────────────────────────────────────┬────────────────────────────────────────────────────┤
│                                                            │                                                    │
│  ┌──────────────────────────────────────────────────────┐  │  ┌──────────────────────────────────────────────┐  │
│  │                    better-auth                       │  │  │                    orpc                      │  │
│  │                  (main plugin)                       │  │  │                (main plugin)                 │  │
│  │                                                      │  │  │                                              │  │
│  │  instances: [                                        │  │  │  instances: [                                │  │
│  │    { name: 'endUser', plugins: [...] },              │  │  │    { name: 'public', prefix: '/api' },       │  │
│  │    { name: 'apiAccess', plugins: [...] }             │  │  │    { name: 'internal', prefix: '/internal' } │  │
│  │  ]                                                   │  │  │  ]                                           │  │
│  │                                                      │  │  │                                              │  │
│  │  hooks:                                              │  │  │  hooks:                                      │  │
│  │    getInstance(name)                                 │  │  │    getInstance(name)                         │  │
│  │    addPlugin(instance, plugin)                       │  │  │    addRouter(instance, router)               │  │
│  │    getAuthSchemas(instance)                          │  │  │    getRouterType(instance)                   │  │
│  │    getAuthClient(instance)                           │  │  │    getContractType(instance)                 │  │
│  └──────────────────────────────────────────────────────┘  │  └──────────────────────────────────────────────┘  │
│                            │                               │                          │                         │
├────────────────────────────┼───────────────────────────────┼──────────────────────────┼─────────────────────────┤
│                            │     LAYER 1: ENHANCEMENTS     │                          │                         │
│                            ▼     (Modify base output)      │                          ▼                         │
│  ┌────────────────────────────────────────────────────┐    │    ┌────────────────────────────────────────────┐  │
│  │            ENHANCEMENT PLUGINS                     │    │    │          ENHANCEMENT PLUGINS               │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌────────────┐  │    │    │  ┌──────────────┐ ┌──────────────────────┐ │  │
│  │  │ .plugins/    │ │ .plugins/    │ │ .plugins/  │  │    │    │  │ .plugins/    │ │ .plugins/            │ │  │
│  │  │ admin        │ │ oauth-google │ │ api-key    │  │    │    │  │ validation   │ │ rate-limit           │ │  │
│  │  │              │ │              │ │            │  │    │    │  │              │ │                      │ │  │
│  │  │ inst:endUser │ │ inst:endUser │ │ inst:api   │  │    │    │  │ inst:public  │ │ inst:public,internal │ │  │
│  │  └──────────────┘ └──────────────┘ └────────────┘  │    │    │  └──────────────┘ └──────────────────────┘ │  │
│  └────────────────────────────────────────────────────┘    │    └────────────────────────────────────────────┘  │
│                            │                               │                          │                         │
│              ══════════════╧══════════════                 │            ══════════════╧══════════════           │
│              ENHANCED OUTPUT (merged)                      │            ENHANCED OUTPUT (merged)                │
│              ═════════════════════════════                 │            ═════════════════════════               │
│                            │                               │                          │                         │
├────────────────────────────┼───────────────────────────────┼──────────────────────────┼─────────────────────────┤
│                            │    LAYER 2: CONSUMERS         │                          │                         │
│                            ▼    (Use enhanced output)      │                          ▼                         │
│  ┌──────────────────────────────────────────────────────┐  │  ┌──────────────────────────────────────────────┐  │
│  │              CONSUMER PLUGINS (Level 1)              │  │  │            CONSUMER PLUGINS (Level 1)        │  │
│  │                                                      │  │  │                                              │  │
│  │  ┌────────────────────┐  ┌────────────────────────┐  │  │  │  ┌──────────────────┐  ┌──────────────────┐  │  │
│  │  │ better-auth/client │  │ better-auth/server     │  │  │  │  │ orpc/client      │  │ orpc/server      │  │  │
│  │  │                    │  │                        │  │  │  │  │                  │  │                  │  │  │
│  │  │ instance: 'endUser'│  │ instance: 'endUser'    │  │  │  │  │ instance:'public'│  │ instance:'public'│  │  │
│  │  │                    │  │                        │  │  │  │  │                  │  │                  │  │  │
│  │  │ Output:            │  │ Output:                │  │  │  │  │ Output:          │  │ Output:          │  │  │
│  │  │ - useAuth()        │  │ - getAuth()            │  │  │  │  │ - orpcClient     │  │ - orpcHandler    │  │  │
│  │  │ - useSession()     │  │ - validateSession()    │  │  │  │  │ - useQuery()     │  │ - createRouter() │  │  │
│  │  │                    │  │ - authMiddleware()     │  │  │  │  │                  │  │                  │  │  │
│  │  └────────────────────┘  └───────────┬────────────┘  │  │  │  └──────────────────┘  └────────┬─────────┘  │  │
│  │                                      │               │  │  │                                 │            │  │
│  └──────────────────────────────────────┼───────────────┘  │  └─────────────────────────────────┼────────────┘  │
│                                         │                  │                                    │               │
├─────────────────────────────────────────┼──────────────────┼────────────────────────────────────┼───────────────┤
│                                         │   LAYER 3: DEEP CONSUMERS                            │               │
│                                         │   (Consumers of consumers)                           │               │
│                                         │                                                      │               │
│                                         │    ┌─────────────────────────────────────────────────┤               │
│                                         │    │                                                 │               │
│                                         ▼    ▼                                                 ▼               │
│                          ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│                          │                     better-auth-orpc                                            │   │
│                          │              (CROSS-ECOSYSTEM INTEGRATION)                                      │   │
│                          │                                                                                 │   │
│                          │  Dependencies:                                                                  │   │
│                          │    - better-auth/server (for auth middleware, session validation)               │   │
│                          │    - orpc/server (for router creation, procedure definitions)                   │   │
│                          │                                                                                 │   │
│                          │  What it does:                                                                  │   │
│                          │    - Creates authenticated ORPC procedures                                      │   │
│                          │    - Adds auth context to ORPC handlers                                         │   │
│                          │    - Generates type-safe auth-aware API routes                                  │   │
│                          │                                                                                 │   │
│                          │  Output:                                                                        │   │
│                          │    data:                                                                        │   │
│                          │      - authRouter (ORPC router with auth middleware)                            │   │
│                          │      - protectedProcedure (base procedure with auth)                            │   │
│                          │    hooks:                                                                       │   │
│                          │      - createAuthProcedure(options) → procedure with session                    │   │
│                          │      - getAuthContext() → typed auth context for handlers                       │   │
│                          │      - withAuth(procedure) → wraps procedure with auth check                    │   │
│                          └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                              │                                                 │
├──────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────┤
│                                                              │   LAYER 4+: FURTHER CONSUMERS                   │
│                                                              │   (Can nest infinitely)                         │
│                                                              ▼                                                 │
│                          ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│                          │                        my-app/api-routes                                        │   │
│                          │                     (Application-level consumer)                                │   │
│                          │                                                                                 │   │
│                          │  Dependencies:                                                                  │   │
│                          │    - better-auth-orpc (for authenticated procedures)                            │   │
│                          │                                                                                 │   │
│                          │  Uses hooks from better-auth-orpc:                                              │   │
│                          │    const userRouter = createAuthProcedure({                                     │   │
│                          │      requireAuth: true,                                                         │   │
│                          │      roles: ['admin']                                                           │   │
│                          │    }).query(({ ctx }) => {                                                      │   │
│                          │      // ctx.session is typed and available                                      │   │
│                          │      return ctx.session.user;                                                   │   │
│                          │    });                                                                          │   │
│                          └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                                │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Dependency Chain Depth Examples

```
EXAMPLE 1: Simple chain (depth 2)
─────────────────────────────────
better-auth → better-auth/client
    └─ Direct consumer, uses getInstance() and getAuthClient() hooks

EXAMPLE 2: Enhanced chain (depth 2 + enhancements)
──────────────────────────────────────────────────
better-auth → [admin, oauth] → better-auth/server
    └─ Consumer receives FULLY ENHANCED output including admin routes and oauth config

EXAMPLE 3: Cross-ecosystem chain (depth 3)
──────────────────────────────────────────
better-auth → better-auth/server ─┐
                                  ├─→ better-auth-orpc
orpc → orpc/server ───────────────┘
    └─ Bridges two ecosystems, depends on consumers from BOTH

EXAMPLE 4: Deep application chain (depth 4+)
────────────────────────────────────────────
better-auth → better-auth/server → better-auth-orpc → my-app/api-routes → my-app/admin-api
    └─ Each layer can add its own hooks and data for the next layer to consume
```

### ORPC Multi-Instance Configuration

```json
{
  "plugins": {
    "orpc": {
      "instances": [
        {
          "name": "public",
          "description": "Public-facing API endpoints",
          "prefix": "/api",
          "version": "v1",
          "features": {
            "openapi": true,
            "playground": true
          }
        },
        {
          "name": "internal",
          "description": "Internal service-to-service API",
          "prefix": "/internal",
          "version": "v1",
          "features": {
            "openapi": false,
            "playground": false,
            "serviceAuth": true
          }
        }
      ]
    },
    "orpc.plugins/validation": {
      "instance": "public",
      "schema": "zod",
      "strict": true
    },
    "orpc.plugins/rate-limit": {
      "instances": ["public", "internal"],
      "public": { "max": 100, "window": "1m" },
      "internal": { "max": 1000, "window": "1m" }
    },
    "orpc/client": {
      "instance": "public"
    },
    "orpc/server": {
      "instance": "public"
    },
    "better-auth-orpc": {
      "authInstance": "endUser",
      "orpcInstance": "public",
      "features": {
        "sessionContext": true,
        "roleBasedAccess": true,
        "auditLogging": true
      }
    }
  }
}
```

### Cross-Ecosystem Plugin Implementation

```typescript
// better-auth-orpc.plugin.ts
export class BetterAuthOrpcPlugin extends BasePlugin<BetterAuthOrpcInput, BetterAuthOrpcOutput> {
  id = 'better-auth-orpc';
  symbol = BETTER_AUTH_ORPC;
  
  // DEEP DEPENDENCIES: Depends on consumers, not base plugins
  dependencies = ['better-auth/server', 'orpc/server'];
  
  inputSchema = z.object({
    authInstance: z.string(),
    orpcInstance: z.string(),
    features: z.object({
      sessionContext: z.boolean().default(true),
      roleBasedAccess: z.boolean().default(false),
      auditLogging: z.boolean().default(false),
    }).optional(),
  });

  async execute(context: PluginContext<BetterAuthOrpcInput>): Promise<BetterAuthOrpcOutput> {
    // Get outputs from CONSUMER plugins (not base plugins)
    // These outputs already include all enhancements
    const authServerOutput = context.getDependencyOutput<BetterAuthServerOutput>('better-auth/server');
    const authServerHooks = context.getDependencyHooks<BetterAuthServerOutput>('better-auth/server');
    
    const orpcServerOutput = context.getDependencyOutput<OrpcServerOutput>('orpc/server');
    const orpcServerHooks = context.getDependencyHooks<OrpcServerOutput>('orpc/server');
    
    // Use hooks from both ecosystems
    const authMiddleware = authServerHooks.authMiddleware();
    const createRouter = orpcServerHooks.createRouter(context.input.orpcInstance);
    
    // Create authenticated procedures
    const protectedProcedure = this.createProtectedProcedure(authMiddleware, context);
    
    return {
      files: this.generateFiles(context),
      dependencies: [...],
      scripts: [],
      cliCommands: [],
      data: {
        authRouter: this.createAuthRouter(protectedProcedure),
        protectedProcedure,
        authInstance: context.input.authInstance,
        orpcInstance: context.input.orpcInstance,
      },
      hooks: {
        // Hooks for FURTHER consumers (my-app/api-routes, etc.)
        createAuthProcedure: (options: AuthProcedureOptions) => {
          return this.buildProcedure(protectedProcedure, options, authServerHooks);
        },
        getAuthContext: () => {
          return this.getContextType(authServerOutput);
        },
        withAuth: (procedure: AnyProcedure) => {
          return this.wrapWithAuth(procedure, authMiddleware);
        },
        // Expose underlying hooks for advanced use cases
        getAuthServerHooks: () => authServerHooks,
        getOrpcServerHooks: () => orpcServerHooks,
      },
      warnings: [],
      notes: ['Auth-protected ORPC procedures are now available'],
    };
  }
}
```

### Instance-Specific File Generation

Each instance generates isolated, self-contained files:

```
src/
├── lib/
│   └── auth/
│       ├── endUser/                    # Instance: endUser
│       │   ├── client.ts               # Auth client with OAuth, admin hooks
│       │   ├── server.ts               # Server-side auth handler
│       │   ├── config.ts               # Instance configuration
│       │   ├── schemas.ts              # Drizzle schemas (auth.*)
│       │   └── plugins/
│       │       ├── admin.ts            # Admin plugin config
│       │       └── oauth-google.ts     # OAuth plugin config
│       │
│       └── apiAccess/                  # Instance: apiAccess
│           ├── client.ts               # API key validation client
│           ├── server.ts               # Server-side API auth
│           ├── config.ts               # Instance configuration
│           ├── schemas.ts              # Drizzle schemas (api_auth.*)
│           └── plugins/
│               └── api-key.ts          # API key management
│
└── db/
    └── schema/
        ├── auth.ts                     # endUser schema (auth.users, auth.sessions, ...)
        └── api-auth.ts                 # apiAccess schema (api_auth.keys, api_auth.tokens, ...)
```

### Implementation Example

```typescript
// better-auth.plugin.ts
export class BetterAuthPlugin extends BasePlugin<BetterAuthInput, BetterAuthOutput> {
  id = 'better-auth';
  symbol = BETTER_AUTH;
  
  inputSchema = z.object({
    instances: z.array(z.object({
      name: z.string(),
      version: z.string().optional(),
      database: z.object({
        type: z.enum(['drizzle', 'prisma']),
        schema: z.string().optional(),
      }),
      plugins: z.array(z.string()).default([]),
      session: z.object({
        strategy: z.enum(['jwt', 'database']),
        expiry: z.string().default('7d'),
      }).optional(),
    })),
  });

  async execute(context: PluginContext<BetterAuthInput>): Promise<BetterAuthOutput> {
    const instances = context.input.instances.map(inst => this.createInstance(inst, context));
    
    return {
      files: this.generateFiles(instances),
      dependencies: this.getDependencies(),
      scripts: [],
      cliCommands: [],
      data: {
        instances,
        config: this.buildConfig(instances),
      },
      hooks: {
        getInstance: (name: string) => instances.find(i => i.name === name),
        getAuthClient: (instanceName: string) => this.getAuthClient(instanceName, instances),
        getAuthSchemas: (instanceName: string) => this.getAuthSchemas(instanceName, instances),
        addPlugin: (instanceName: string, plugin: AuthPlugin) => {
          const instance = instances.find(i => i.name === instanceName);
          if (instance) {
            instance.plugins.push(plugin);
          }
        },
      },
      warnings: [],
      notes: ['Run `bun run db:push` to apply auth schema changes'],
    };
  }
}

// better-auth-admin.plugin.ts (Enhancement)
export class BetterAuthAdminPlugin extends EnhancementPlugin<BetterAuthAdminInput, BetterAuthOutput> {
  id = 'better-auth.plugins/admin';
  symbol = BETTER_AUTH_ADMIN;
  enhances = 'better-auth';
  
  inputSchema = z.object({
    instance: z.string(),
    dashboard: z.object({
      enabled: z.boolean().default(true),
      path: z.string().default('/admin'),
    }).optional(),
  });

  async enhance(
    targetOutput: BetterAuthOutput,
    context: PluginContext<BetterAuthAdminInput>
  ): Promise<BetterAuthOutput> {
    const instanceName = context.input.instance;
    const instance = targetOutput.data.instances.find(i => i.name === instanceName);
    
    if (!instance) {
      throw new Error(`Instance '${instanceName}' not found in better-auth config`);
    }
    
    // Add admin plugin to the instance
    targetOutput.hooks.addPlugin(instanceName, this.createAdminPlugin(context));
    
    // Generate admin-specific files
    const adminFiles = this.generateAdminFiles(instance, context);
    
    return {
      ...targetOutput,
      files: [...targetOutput.files, ...adminFiles],
      data: {
        ...targetOutput.data,
        adminConfig: this.buildAdminConfig(context),
      },
      hooks: {
        ...targetOutput.hooks,
        getAdminRoutes: () => this.generateAdminRoutes(context),
        getAdminClient: () => this.getAdminClient(instance),
      },
    };
  }
}

// better-auth-client.plugin.ts (Consumer)
export class BetterAuthClientPlugin extends BasePlugin<BetterAuthClientInput, BetterAuthClientOutput> {
  id = 'better-auth/client';
  symbol = BETTER_AUTH_CLIENT;
  dependencies = ['better-auth'];
  supportedApps = ['nextjs'] as AppTypeId[];
  
  inputSchema = z.object({
    instance: z.string(),
  });

  async execute(context: PluginContext<BetterAuthClientInput>): Promise<BetterAuthClientOutput> {
    // Get better-auth output (may have been enhanced by admin plugin)
    const authOutput = context.getDependencyOutput<BetterAuthOutput>('better-auth');
    const authHooks = context.getDependencyHooks<BetterAuthOutput>('better-auth');
    
    const instance = authHooks.getInstance(context.input.instance);
    if (!instance) {
      throw new Error(`Instance '${context.input.instance}' not found`);
    }
    
    const authClient = authHooks.getAuthClient(context.input.instance);
    
    return {
      files: this.generateClientFiles(instance, authClient),
      dependencies: this.getClientDependencies(),
      scripts: [],
      cliCommands: [],
      data: {
        instance,
        clientConfig: authClient,
      },
      hooks: {
        useAuth: () => `import { useAuth } from '@/lib/auth/${instance.name}/client'`,
        useSession: () => `import { useSession } from '@/lib/auth/${instance.name}/client'`,
      },
      warnings: [],
      notes: [],
    };
  }
}
```

## Plugin Execution Service

```typescript
class PluginExecutionService {
  private pluginOutputs = new Map<string, PluginOutput>();
  private globalConfig: GlobalConfig;
  
  async executePlugins(
    plugins: IPlugin[],
    config: ResolvedProjectConfig
  ): Promise<ScaffoldResult> {
    // 1. Build global config
    this.globalConfig = this.buildGlobalConfig(config);
    
    // 2. Sort plugins by dependencies (topological sort)
    const sortedPlugins = this.topologicalSort(plugins);
    
    // 3. Separate plugin types
    const { standardPlugins, enhancementPlugins } = this.separatePlugins(sortedPlugins);
    
    // 4. Build enhancement execution graph
    // Group enhancers by their target plugin
    const enhancersByTarget = this.groupEnhancersByTarget(enhancementPlugins);
    
    // 5. Execute plugins with enhancement interleaving
    for (const plugin of standardPlugins) {
      // 5a. Execute base plugin
      const context = this.createContext(plugin, config);
      let output = await plugin.execute(context);
      this.pluginOutputs.set(plugin.id, output);
      
      // 5b. IMMEDIATELY apply all enhancements for this plugin
      // This ensures consumers always see the fully enhanced output
      const enhancers = enhancersByTarget.get(plugin.id) || [];
      for (const enhancer of this.sortEnhancersByPriority(enhancers)) {
        const enhancerContext = this.createContext(enhancer, config);
        output = await enhancer.enhance(output, enhancerContext);
        // Update the stored output with enhanced version
        this.pluginOutputs.set(plugin.id, output);
      }
    }
    
    // 6. Aggregate results
    return this.aggregateResults();
  }
  
  /**
   * Groups enhancement plugins by the plugin they enhance.
   * This allows us to apply all enhancers immediately after the base plugin executes.
   */
  private groupEnhancersByTarget(enhancers: IEnhancementPlugin[]): Map<string, IEnhancementPlugin[]> {
    const byTarget = new Map<string, IEnhancementPlugin[]>();
    for (const enhancer of enhancers) {
      const existing = byTarget.get(enhancer.enhances) || [];
      existing.push(enhancer);
      byTarget.set(enhancer.enhances, existing);
    }
    return byTarget;
  }
  
  /**
   * Sort enhancers by priority to ensure consistent execution order.
   * Lower priority = executes first (closer to base plugin)
   * Higher priority = executes later (closer to consumers)
   */
  private sortEnhancersByPriority(enhancers: IEnhancementPlugin[]): IEnhancementPlugin[] {
    return [...enhancers].sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  }
  
  private createContext<T>(plugin: IPlugin<T>, config: ResolvedProjectConfig): PluginContext<T> {
    const pluginConfig = config.plugins[plugin.id];
    const input = plugin.inputSchema.parse(pluginConfig);
    
    return {
      input,
      globalConfig: Object.freeze(this.globalConfig),
      outputPath: config.outputPath,
      dryRun: config.dryRun ?? false,
      verbose: config.verbose ?? false,
      hasPlugin: (id) => config.pluginIds.includes(id),
      getDependencyOutput: <T extends PluginOutput>(id: string) => {
        const output = this.pluginOutputs.get(id);
        if (!output) throw new Error(`Plugin '${id}' output not found. Ensure '${id}' is listed as a dependency.`);
        // IMPORTANT: This returns the FULLY ENHANCED output
        // All enhancement plugins have already been applied
        return output.data as T['data'];
      },
      getDependencyHooks: <T extends PluginOutput>(id: string) => {
        const output = this.pluginOutputs.get(id);
        if (!output) throw new Error(`Plugin '${id}' output not found. Ensure '${id}' is listed as a dependency.`);
        // IMPORTANT: This returns hooks INCLUDING those added by enhancement plugins
        return output.hooks as T['hooks'];
      },
      getEnabledPlugins: () => config.pluginIds,
    };
  }
}
```

### Enhancement Plugin Ordering Rules

```typescript
/**
 * Enhancement plugin ordering guarantees:
 * 
 * 1. ALWAYS AFTER BASE: Enhancement plugins execute immediately after their target
 * 2. BEFORE CONSUMERS: All enhancements complete before any consumer plugin executes
 * 3. PRIORITY ORDER: Multiple enhancers for same target sorted by priority
 * 4. CHAIN COMPOSITION: Each enhancer receives the output of the previous enhancer
 * 
 * Example execution order:
 * 
 *   1. better-auth.execute()                    → BaseOutput
 *   2. better-auth.plugins/admin.enhance()      → Enhanced1 (receives BaseOutput)
 *   3. better-auth.plugins/oauth.enhance()      → Enhanced2 (receives Enhanced1)
 *   4. better-auth.plugins/2fa.enhance()        → Enhanced3 (receives Enhanced2)
 *   --- All enhancements complete ---
 *   5. better-auth/client.execute()             → Receives Enhanced3
 *   6. better-auth/server.execute()             → Receives Enhanced3
 *   7. my-custom-auth-consumer.execute()        → Receives Enhanced3
 */

interface IEnhancementPlugin<TInput, TTargetOutput> extends IPlugin<TInput> {
  /** Plugin ID this enhancement targets */
  enhances: string;
  
  /** 
   * Priority for enhancement ordering (default: 100)
   * Lower = executes earlier (closer to base plugin)
   * Higher = executes later (closer to consumers)
   * 
   * Suggested ranges:
   * - 0-50: Core enhancements (schemas, base config)
   * - 50-100: Feature enhancements (plugins, routes)
   * - 100-150: UI/Dashboard enhancements
   * - 150+: Monitoring/logging enhancements
   */
  priority?: number;
  
  enhance(targetOutput: TTargetOutput, context: PluginContext<TInput>): Promise<TTargetOutput>;
}
```

## Migration Path

### Phase 1: Add Types (Non-breaking)
- Add new type definitions alongside existing types
- Create `PluginOutput`, `PluginContext`, `GlobalConfig` interfaces
- Update `BaseGenerator` with optional new methods

### Phase 2: Enhance Base Classes
- Add `BasePlugin` class extending `BaseGenerator`
- Add `EnhancementPlugin` class
- Implement `PluginExecutionService`

### Phase 3: Migrate Existing Generators
- Convert generators one by one to new plugin pattern
- Add input schemas
- Define typed outputs and hooks

### Phase 4: Implement Better-Auth Ecosystem
- Create `better-auth` main plugin with instances
- Create enhancement plugins (admin, oauth-*)
- Create consumer plugins (client, server)

## Benefits

1. **Type Safety**: Full TypeScript support for plugin inputs, outputs, and hooks
2. **Composability**: Plugins can build on each other's outputs
3. **Flexibility**: Enhancement plugins can modify behavior without changing source
4. **Discoverability**: Hooks provide clear API for dependent plugins
5. **Testing**: Each plugin can be tested in isolation with mock contexts
6. **Deep Nesting**: Consumer plugins can have their own consumers, enabling infinite composition

## Open Questions

1. **Circular Dependencies**: How to handle plugins that enhance each other? → **Answer**: Not allowed. Enhancement is one-directional.
2. **Order of Enhancements**: Multiple enhancers for same plugin? → **Answer**: Use `priority` field, lower = earlier execution
3. **Versioning**: How to handle breaking changes in plugin outputs? → Consider semantic versioning for output interfaces
4. **Hot Reloading**: Can we support live plugin updates in dev mode?
5. **Instance Isolation**: How to handle cross-instance dependencies in better-auth? → Currently not supported, instances are isolated
6. **Enhancement Conflicts**: What if two enhancers modify the same field? → Last enhancer (highest priority) wins
7. **Cross-Ecosystem Dependencies**: How to depend on consumers from different plugin ecosystems?
   - **Answer**: Deep consumers (like `better-auth-orpc`) list consumer plugins as dependencies, not base plugins
   - This ensures they receive fully enhanced output from ALL ecosystems
   - Example: `dependencies = ['better-auth/server', 'orpc/server']` - both are consumers
8. **Dependency Depth Limits**: How deep can consumer chains go?
   - **Answer**: No artificial limit. Each layer adds hooks for the next.
   - Example: base → consumer → cross-ecosystem → app-level → feature-specific
   - Performance consideration: Each layer adds execution overhead
9. **Cross-Instance References**: Can plugins reference multiple instances from different ecosystems?
   - **Answer**: Yes, cross-ecosystem plugins can specify which instance from each ecosystem to use
   - Example: `better-auth-orpc` with `{ authInstance: 'endUser', orpcInstance: 'public' }`
   - Validation: System verifies all referenced instances exist during resolution phase
