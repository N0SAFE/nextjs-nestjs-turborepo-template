# System Patterns & Architecture

## Monorepo Integration Patterns

### Package Boundaries & Imports
- **Package name**: `@repo/nextjs-devtool`
- **Internal imports**: Use `@repo/nextjs-devtool/*` paths (NOT `@/*`)
- **External packages**: Accessed via `@repo/*` pattern
- **Maintains proper separation**: Prevents accidental cross-package dependencies

### TypeScript Path Mapping
```typescript
// tsconfig.json paths configuration
"@repo/nextjs-devtool/*": ["./src/*"]
```

## Core Architecture Principles

### 1. Zero-Any Type Safety Policy

**Strictly Forbidden Patterns:**
```typescript
// ❌ NEVER DO THIS
const data: any = fetchData();
function process(input: any): any { }
const props: { [key: string]: any } = {};

// ✅ ALWAYS DO THIS INSTEAD
const data: UserProfile = fetchData();
function process<T extends Serializable>(input: T): ProcessedResult<T> { }
const props: Record<string, string | number | boolean> = {};
```

**Type Safety Enforcement:**
```typescript
// Use strict generic constraints
interface DevToolPlugin<TContract extends PluginContract = PluginContract> {
  kind: 'core' | 'module';
  name: string;
  version: string;
  contract: TContract;
  exports: PluginExports<TContract>;
  meta?: PluginMetadata;
}

// Constrained generics for flexibility without any
type TypedClient<T extends PluginContract> = {
  [K in keyof T['procedures']]: T['procedures'][K] extends infer P
    ? P extends ProcedureDefinition<infer Input, infer Output>
      ? (input: Input) => Promise<Output>
      : never
    : never;
};
```

### 2. Contract-First Design Pattern

Every plugin follows this structure:
```typescript
interface DevToolPlugin<TContract extends PluginContract = PluginContract> {
  kind: 'core' | 'module';
  name: string;
  version: string;
  
  // Embedded contract defining the API with full type safety
  contract: TContract;
  
  // Selective exports with inline imports - all fully typed
  exports: PluginExports<TContract>;
  
  meta?: PluginMetadata;
}

// Type-safe exports definition
interface PluginExports<T extends PluginContract> {
  server?: () => Promise<ORPCRouter<T>>;
  components?: Record<string, () => Promise<React.ComponentType<{ orpc: TypedClient<T> }>>>;
  hooks?: Record<string, () => Promise<(orpc: TypedClient<T>) => TypedHookResult>>;
}
```

### 2. Namespace Strategy with Type Safety

**Core Plugins**: `core.<domain>.*` with strict typing
```typescript
// Type-safe namespace definitions
type CoreNamespace = `core.${string}`;
type ModuleNamespace = `mod.${string}`;

interface CorePlugin<T extends CoreNamespace> extends DevToolPlugin<CoreContract<T>> {
  kind: 'core';
  contract: CoreContract<T>;
}

interface ModulePlugin<T extends ModuleNamespace> extends DevToolPlugin<ModuleContract<T>> {
  kind: 'module';
  contract: ModuleContract<T>;
}
```

**Examples with full type inference**:
- `core.bundle.version`: `() => Promise<{ version: string; buildTime: Date }>`
- `core.routes.list`: `() => Promise<RouteInfo[]>`
- `mod.auth.session.get`: `() => Promise<UserSession | null>`

### 3. Selective Loading Architecture with Type Safety

```typescript
// Plugin exports with complete type information
interface PluginExports<T extends PluginContract> {
  // Server-side router with typed procedures
  server?: () => Promise<ORPCRouter<T>>;
  
  // Components with typed ORPC client injection
  components?: {
    [K in string]: () => Promise<React.ComponentType<{ 
      orpc: TypedClient<T>;
      // Additional props are type-safe too
      onClose?: () => void;
      className?: string;
    }>>;
  };
  
  // Hooks with typed return values and parameters
  hooks?: {
    [K in string]: () => Promise<(orpc: TypedClient<T>) => TypedHookResult<T, K>>;
  };
}

// Example: Completely type-safe loading
const AuthPlugin: ModulePlugin<'mod.auth'> = {
  kind: 'module',
  name: 'auth',
  contract: authContract,
  exports: {
    server: () => import('./server'),    // Returns typed router
    components: {
      UserList: () => import('./components/UserList'),  // Expects { orpc: AuthClient }
    },
    hooks: {
      useSession: () => import('./hooks/useSession'),   // Returns session hook
    }
  }
};
```

### 4. Core Plugin Definitions Architecture (`src/core/router.ts`)

**Important**: The `src/core/router.ts` file is **ONLY** for plugin definitions and exports, not router implementation.

**File Purpose**:
- Define and export core plugin definitions
- Declare plugin contracts and metadata
- Export plugin objects for use by the system
- **NOT** for actual router creation or implementation logic

**Correct Structure**:
```typescript
// src/core/router.ts - Plugin Definitions Only

// Core Plugin Definitions
export const cliPlugin: CorePlugin<'core.cli'> = {
  kind: 'core',
  name: 'cli',
  version: '1.0.0',
  contract: cliContract,
  exports: {
    server: () => import('./cli/server'),
    components: {
      CliInterface: () => import('./cli/components/CliInterface'),
    },
    hooks: {
      useCliCommands: () => import('./cli/hooks/useCliCommands'),
    },
  },
  meta: {
    description: 'Internal command exposure and execution',
    author: 'DevTool Core Team',
  },
};

export const bundlePlugin: CorePlugin<'core.bundle'> = {
  kind: 'core',
  name: 'bundle',
  version: '1.0.0',
  contract: bundleContract,
  exports: {
    server: () => import('./bundle/server'),
    components: {
      BundleAnalyzer: () => import('./bundle/components/BundleAnalyzer'),
    },
  },
  meta: {
    description: 'Build information and asset analysis',
    author: 'DevTool Core Team',
  },
};

export const routesPlugin: CorePlugin<'core.routes'> = {
  kind: 'core',
  name: 'routes',
  version: '1.0.0',
  contract: routesContract,
  exports: {
    server: () => import('./routes/server'),
    components: {
      RouteExplorer: () => import('./routes/components/RouteExplorer'),
    },
  },
  meta: {
    description: 'Next.js route introspection and navigation',
    author: 'DevTool Core Team',
  },
};

export const logsPlugin: CorePlugin<'core.logs'> = {
  kind: 'core',
  name: 'logs',
  version: '1.0.0', 
  contract: logsContract,
  exports: {
    server: () => import('./logs/server'),
    components: {
      LogViewer: () => import('./logs/components/LogViewer'),
    },
  },
  meta: {
    description: 'Application logs access and filtering',
    author: 'DevTool Core Team',
  },
};

// Core plugins array for easy iteration
export const corePlugins = [
  cliPlugin,
  bundlePlugin,
  routesPlugin,
  logsPlugin,
] as const;
```

**What NOT to include in `src/core/router.ts`**:
```typescript
// ❌ DON'T PUT THESE IN router.ts:

// Router creation logic
function createRouter() { ... }

// Router aggregation functions  
function getRouterFromPlugins() { ... }

// ORPC implementation details
class ORPCRouter { ... }

// Runtime plugin management
class PluginManager { ... }

// Server implementation code
app.get('/api/...', handler);
```

**Where implementation logic belongs**:
- **Router creation**: `src/runtime/router.ts` or `src/utils/router.ts`
- **Plugin aggregation**: `src/runtime/plugins.ts` 
- **ORPC implementation**: `src/config/orpc.ts`
- **Server setup**: Individual plugin's `server/index.ts` files

## Component Relationships

### 1. Plugin Registry System (Zustand)

```typescript
interface PluginRegistryStore {
  plugins: Map<string, RegisteredPlugin>;
  activePlugins: Set<string>;
  selectedPlugin: string | null;
  selectedPage: string | null;
  
  // CRUD operations
  register(plugin: DevToolPlugin): void;
  unregister(pluginId: string): void;
  activate(pluginId: string): void;
  deactivate(pluginId: string): void;
  
  // Navigation
  selectPage(pluginId: string, pageId?: string): void;
  getSelectedPage(): { pluginId: string; pageId: string } | null;
}
```

### 2. DevTool State Management (Zustand)

```typescript
interface DevToolStateStore {
  // UI State
  mode: 'none' | 'normal' | 'expanded';
  setState(mode: DevToolStateMode): void;
  
  // Position & Layout
  position: { side: 'left'|'right'|'top'|'bottom'; size: number };
  setPosition(position: Partial<DevToolPosition>): void;
  
  // User Preferences
  settings: DevToolSettings;
  updateSettings(settings: Partial<DevToolSettings>): void;
  
  // Plugin Preferences
  pinnedPlugins: Set<string>;
  pinPlugin(id: string): void;
  unpinPlugin(id: string): void;
}
```

### 3. Router Aggregation Pattern

```typescript
function getRouterFromPlugins(plugins: ModulePlugin[]) {
  const router = createRouter()
    .merge('', coreRouter);  // Core always included
    
  plugins
    .filter(p => p.enabled !== false && p.router)
    .forEach(p => {
      const namespace = p.namespace ?? `mod.${p.name}.`;
      router.merge(namespace, p.router);
    });
    
  return router;
}
```

## Critical Implementation Paths

### 1. Type-Safe Client Access with Zero Any

```typescript
// Completely type-safe client access
function useDevTool<T extends PluginContract>(): { orpc: TypedORPCClient<T> } {
  const client = createTypedClient<T>();
  return { orpc: client };
}

// Usage with full type inference and validation
const { orpc } = useDevTool<AuthContract>();
const session = await orpc.session.get();  // Return type: UserSession | null
const user = await orpc.user.update({ id: "123", name: "John" });  // Params validated

// Error examples - these will fail at compile time:
// orpc.session.get("invalid param");  // ❌ Compile error
// orpc.nonexistent.method();          // ❌ Compile error  
// const wrong: string = await orpc.session.get();  // ❌ Type error
```

### 2. Strict Type Safety Patterns

**A. Procedure Definition with Input/Output Validation**
```typescript
import { z } from 'zod';

// Define strict input/output schemas
const getUserSchema = z.object({
  id: z.string().uuid(),
  includeProfile: z.boolean().optional(),
});

const userResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  profile: z.object({
    name: z.string(),
    avatar: z.string().url().optional(),
  }).optional(),
});

// Type-safe procedure definition
const authContract = {
  namespace: 'mod.auth' as const,
  procedures: {
    getUser: {
      input: getUserSchema,
      output: userResponseSchema,
    },
  },
} satisfies PluginContract;

// Derived types are automatically inferred
type AuthInput = z.infer<typeof getUserSchema>;  // { id: string; includeProfile?: boolean }
type AuthOutput = z.infer<typeof userResponseSchema>;  // { id: string; email: string; profile?: ... }
```

**B. Generic Plugin System with Constraints**
```typescript
// Base constraints for all plugins
interface PluginContract {
  namespace: string;
  procedures: Record<string, {
    input: z.ZodSchema;
    output: z.ZodSchema;
  }>;
}

// Plugin registry with type safety
class TypedPluginRegistry {
  private plugins = new Map<string, DevToolPlugin<PluginContract>>();
  
  register<T extends PluginContract>(plugin: DevToolPlugin<T>): void {
    // Type-safe registration
    this.plugins.set(plugin.name, plugin);
  }
  
  get<T extends PluginContract>(name: string): DevToolPlugin<T> | undefined {
    return this.plugins.get(name) as DevToolPlugin<T> | undefined;
  }
  
  // Get typed client for specific plugin
  getClient<T extends PluginContract>(name: string): TypedClient<T> | null {
    const plugin = this.get<T>(name);
    if (!plugin) return null;
    return createTypedClient<T>(plugin.contract);
  }
}
```

**C. Error Handling with Discriminated Unions**
```typescript
// Type-safe error handling without any
type PluginResult<T> = 
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

type LoadingState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// Usage with exhaustive pattern matching
function handleResult<T>(result: PluginResult<T>): T {
  switch (result.success) {
    case true:
      return result.data;  // TypeScript knows this is T
    case false:
      throw new Error(`Plugin error: ${result.error.message}`);
    default:
      // TypeScript ensures this is unreachable
      const _exhaustive: never = result;
      throw new Error('Unreachable');
  }
}
```

### 3. Plugin Lifecycle Management with Type Safety

```typescript
// Type-safe plugin activation flow
class PluginLifecycleManager {
  async activatePlugin<T extends PluginContract>(
    plugin: DevToolPlugin<T>
  ): Promise<PluginResult<RegisteredPlugin<T>>> {
    try {
      // 1. Plugin registration with type validation
      this.validateContract(plugin.contract);
      
      // 2. Dependency validation with typed dependencies
      await this.validateDependencies(plugin);
      
      // 3. Router integration with typed merging
      const router = await this.integrateRouter(plugin);
      
      // 4. UI integration with typed components
      const components = await this.loadComponents(plugin);
      
      // 5. State initialization with plugin-specific typed state
      const state = await this.initializeState(plugin);
      
      const registered: RegisteredPlugin<T> = {
        plugin,
        router,
        components,
        state,
        status: 'active',
        loadedAt: new Date(),
      };
      
      return { success: true, data: registered };
    } catch (error) {
      return { 
        success: false, 
        error: { 
          code: 'ACTIVATION_FAILED', 
          message: error.message,
          details: error 
        } 
      };
    }
  }
  
  private validateContract<T extends PluginContract>(contract: T): asserts contract is T {
    // Runtime validation that the contract matches TypeScript types
    if (!contract.namespace || typeof contract.namespace !== 'string') {
      throw new Error('Invalid contract: namespace must be a string');
    }
    
    if (!contract.procedures || typeof contract.procedures !== 'object') {
      throw new Error('Invalid contract: procedures must be an object');
    }
    
    // Validate each procedure has input/output schemas
    Object.entries(contract.procedures).forEach(([name, proc]) => {
      if (!proc.input || !proc.output) {
        throw new Error(`Invalid procedure ${name}: must have input and output schemas`);
      }
    });
  }
}
```

### 4. UI Mode Transitions with Type-Safe State

```typescript
// Strictly typed UI state transitions
type DevToolMode = 'none' | 'normal' | 'expanded';

interface DevToolStateTransition {
  from: DevToolMode;
  to: DevToolMode;
  trigger: 'user_action' | 'api_call' | 'error' | 'initialization';
  metadata?: Record<string, string | number | boolean>;  // No any allowed
}

interface DevToolState {
  mode: DevToolMode;
  position: {
    side: 'left' | 'right' | 'top' | 'bottom';
    size: number;  // pixels
    offset: { x: number; y: number };
  };
  selectedPlugin: string | null;
  selectedPage: string | null;
  pinnedPlugins: ReadonlySet<string>;  // Immutable for type safety
}

// Type-safe state transition function
function transitionState(
  current: DevToolState,
  transition: DevToolStateTransition
): DevToolState {
  // Exhaustive pattern matching ensures all cases handled
  switch (transition.to) {
    case 'none':
      return {
        ...current,
        mode: 'none',
        selectedPlugin: null,
        selectedPage: null,
      };
    
    case 'normal':
      return {
        ...current,
        mode: 'normal',
        // Preserve selected plugin if valid
        selectedPlugin: current.pinnedPlugins.has(current.selectedPlugin ?? '') 
          ? current.selectedPlugin 
          : Array.from(current.pinnedPlugins)[0] ?? null,
      };
    
    case 'expanded':
      return {
        ...current,
        mode: 'expanded',
        // Ensure we have a selected plugin in expanded mode
        selectedPlugin: current.selectedPlugin ?? Array.from(current.pinnedPlugins)[0] ?? null,
      };
    
    default:
      // TypeScript ensures this is unreachable
      const _exhaustive: never = transition.to;
      throw new Error(`Invalid transition target: ${_exhaustive}`);
  }
}
```

## Key Design Decisions

### 1. No External Framework Dependencies
- **Decision**: Use only TypeScript/Node, no Express/Fastify
- **Reasoning**: Minimize dependencies, maximum compatibility
- **Implementation**: Custom ORPC router implementation

### 2. Zustand for State Management
- **Decision**: Use Zustand over Redux/Context
- **Reasoning**: Minimal boilerplate, TypeScript-first, performance
- **Implementation**: Separate stores for registry and UI state

### 3. Inline Import Strategy
- **Decision**: Use dynamic imports for selective loading
- **Reasoning**: Bundle optimization, lazy loading, performance
- **Implementation**: Function factories that return import promises

### 4. Contract Co-location
- **Decision**: Embed contracts in plugin definitions
- **Reasoning**: Single source of truth, easier maintenance
- **Implementation**: TypeScript interfaces with embedded procedure definitions

## Error Handling Patterns

### 1. Plugin Dependency Validation
```typescript
if (strictDependencies) {
  const names = new Set(enabled.map(p => p.name));
  enabled.forEach(p =>
    (p.dependencies ?? []).forEach(dep => {
      if (!names.has(dep)) {
        throw new Error(`Missing dependency: ${p.name} -> ${dep}`);
      }
    })
  );
}
```

### 2. Graceful Plugin Failures
- Plugin loading errors don't crash entire system
- Failed plugins are marked as unavailable
- UI shows error state with retry option
- Router continues to work without failed plugin routes

### 3. Production Safety
```typescript
// DevToolProvider in production
if (process.env.NODE_ENV === 'production') {
  return null;  // Completely unmounted
}
```

## Performance Optimizations

### 1. Lazy Component Loading
- Components loaded only when UI page is visited
- Hooks loaded only when actually used in components
- Server code loaded only when API routes are called

### 2. Bundle Splitting
- Each plugin can have separate chunks
- Core plugins bundled together for efficiency
- Module plugins can be loaded independently

### 3. State Persistence
- UI preferences saved to localStorage
- Plugin states can be persisted per project
- Smart restoration on application restart
