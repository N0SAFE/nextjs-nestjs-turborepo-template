# Technology Context

## Core Technologies

### 1. TypeScript (Ultra-Strict Mode)
- **Version**: Latest stable (5.0+)
- **Configuration**: Maximum strictness enabled
- **Zero-Any Policy**: Absolutely no `any` types allowed
- **Benefits**: Complete compile-time safety, perfect IntelliSense

#### Strict TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,                          // Enable all strict checks
    "noImplicitAny": true,                   // Error on implicit any
    "strictNullChecks": true,                // Strict null checking
    "strictFunctionTypes": true,             // Strict function types
    "strictBindCallApply": true,             // Strict bind/call/apply
    "strictPropertyInitialization": true,    // Strict property initialization
    "noImplicitReturns": true,              // Error on implicit returns
    "noFallthroughCasesInSwitch": true,     // Error on switch fallthrough
    "noUncheckedIndexedAccess": true,       // Error on unchecked indexed access
    "noImplicitOverride": true,             // Require explicit override
    "exactOptionalPropertyTypes": true       // Exact optional property types
  }
}
```

### 2. ORPC (Type-Safe RPC)
- **Purpose**: Type-safe communication between client and server
- **Implementation**: Custom lightweight ORPC implementation
- **Features**: Procedure definitions, type inference, contract validation
- **Benefits**: End-to-end type safety, automatic client generation

### 3. React (Components & Hooks)
- **Version**: Compatible with existing Next.js setup
- **Usage**: UI components and custom hooks
- **Patterns**: Functional components, hooks for state and effects
- **Integration**: Works within Next.js application context

### 4. Zustand (State Management)
- **Purpose**: Plugin registry and UI state management
- **Benefits**: Minimal boilerplate, TypeScript-first, performance
- **Implementation**: Separate stores for different concerns
- **Persistence**: localStorage integration for user preferences

### 5. Node.js Runtime
- **Version**: Node 18+ (matching project requirements)
- **Usage**: Server-side plugin execution, development tools
- **Limitations**: No external server frameworks (Express, Fastify)
- **Benefits**: Consistent with existing project runtime

## Development Setup

### Project Structure
```
packages/nextjs-devtool/
├── src/
│   ├── core/              # Core plugins (always present)
│   │   └── router.ts      # Plugin definitions ONLY (not implementation)
│   ├── modules/           # Optional module plugins  
│   ├── runtime/           # Core runtime functions (router creation, etc.)
│   ├── utils/            # Shared utilities
│   ├── server/           # Server context and setup
│   └── cli/              # Future CLI scaffolding
├── tests/                # Unit and integration tests
├── memory-bank/          # Implementation tracking
└── main.ts              # Demonstration script
```

**Critical**: `src/core/router.ts` is for plugin definitions and exports only:
```typescript
// ✅ Correct usage - plugin definitions
export const cliPlugin: CorePlugin = { kind: 'core', name: 'cli', ... };
export const bundlePlugin: CorePlugin = { kind: 'core', name: 'bundle', ... };

// ❌ Wrong - implementation logic doesn't belong here
function createRouter() { ... }
function getRouterFromPlugins() { ... }
```

### Dependencies

#### Production Dependencies
- **None**: Zero runtime dependencies (self-contained)
- **Reason**: Maximum compatibility, minimal footprint

#### Development Dependencies
- **TypeScript**: Compilation and type checking
- **Testing Framework**: Vitest (matching project setup)
- **Build Tools**: Bun/Node.js native compilation

### Build Configuration

#### TypeScript Config
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist"
  }
}
```

#### Package.json Scripts
```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest",
    "demo": "node dist/main.js"
  }
}
```

## Technical Constraints

### 1. No External Server Frameworks
- **Constraint**: Cannot use Express, Fastify, Koa, etc.
- **Reasoning**: Avoid dependency conflicts, maintain lightweight nature
- **Solution**: Custom ORPC router implementation

### 2. Next.js Compatibility
- **Constraint**: Must work within existing Next.js applications
- **Requirements**: Compatible with App Router, server components
- **Integration**: Works as development-only package

### 3. Production Safety
- **Constraint**: Must be completely disabled in production
- **Implementation**: Environment-based conditional rendering
- **Verification**: No production bundle impact

### 4. Type Safety Requirements with Zero Tolerance
- **Constraint**: Zero `any` types anywhere in the codebase
- **Implementation**: Strict TypeScript + ESLint rules + pre-commit hooks
- **Validation**: Compile-time type checking + automated type testing
- **Enforcement**: CI/CD fails on any `any` type usage

#### Type Safety Enforcement Rules
```typescript
// ESLint rules for type safety
{
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unsafe-assignment": "error", 
  "@typescript-eslint/no-unsafe-call": "error",
  "@typescript-eslint/no-unsafe-member-access": "error",
  "@typescript-eslint/no-unsafe-return": "error",
  "@typescript-eslint/prefer-as-const": "error",
  "@typescript-eslint/prefer-readonly": "error"
}

// Type assertion patterns (when absolutely necessary)
// ❌ Never do this
const data = response as any;

// ✅ Always do this instead  
const data = response as ApiResponse<UserData>;
// or better yet
const data = ApiResponseSchema.parse(response);
```

## Tool Usage Patterns

### 1. Development Workflow
```bash
# Start development with watch mode
bun run dev

# Run tests during development
bun run test

# Build for testing
bun run build

# Test the built demo
bun run demo
```

### 2. Testing Strategy
- **Unit Tests**: Individual plugin functionality
- **Integration Tests**: Plugin composition and router building
- **Smoke Tests**: UI rendering and state transitions
- **Type Tests**: Contract validation and type inference

### 3. Plugin Development Pattern
```typescript
// 1. Define contract first
const authContract = {
  namespace: 'mod.auth',
  procedures: {
    'session.get': ProcedureDefinition,
    'users.list': ProcedureDefinition
  }
};

// 2. Implement server
const authRouter = createRouter()
  .procedure('session.get', async () => ({ userId: 'u1' }));

// 3. Create plugin definition
const authPlugin: ModulePlugin = {
  kind: 'module',
  name: 'auth',
  contract: authContract,
  router: authRouter,
  exports: {
    components: {
      AuthProvider: () => import('./components/AuthProvider')
    }
  }
};
```

## Integration Considerations

### 1. Next.js Integration
- **Development Only**: Only active in development mode
- **Route Handler**: Can integrate with Next.js API routes
- **Component Usage**: Works within existing component tree
- **Build Impact**: Zero impact on production builds

### 2. Monorepo Integration
- **Package Structure**: Follows existing monorepo patterns
- **Shared Configs**: Uses project ESLint, TypeScript configs
- **Testing**: Integrates with project-wide testing setup
- **Build System**: Compatible with Turborepo build pipeline

### 3. Type System Integration
- **Shared Types**: Can reference project-wide type definitions
- **Contract Validation**: Ensures type safety across plugin boundaries
- **IDE Support**: Full IntelliSense and error detection

## Performance Considerations

### 1. Bundle Size
- **Strategy**: Lazy loading for all plugin code
- **Implementation**: Dynamic imports for selective loading
- **Goal**: Minimal impact on application bundle size

### 2. Runtime Performance
- **State Management**: Optimized Zustand stores
- **Component Rendering**: Efficient React patterns
- **Memory Usage**: Careful cleanup of plugin resources

### 3. Development Experience
- **Hot Reloading**: Compatible with Next.js dev server
- **Fast Refresh**: React components support fast refresh
- **Type Checking**: Incremental TypeScript compilation
