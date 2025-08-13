# NextJS DevTool - Project Brief

## Project Overview

We're implementing a comprehensive DevTool system for Next.js applications based on a detailed specification. This is a contract-first, plugin-based development tool that provides type-safe RPC communication between server and client components.

## Core Objectives

### 1. Contract-First Architecture
- Each plugin defines its own ORPC contract embedded in its definition
- Contracts are co-located with plugins (not external definitions)
- Unified namespace: `core.*` for core plugins, `mod.<pluginName>.*` for modules

### 2. Selective Loading System
- Server/components/hooks are loaded on-demand via inline imports
- Load only what's needed (server OR client OR hooks)
- Performance optimization and bundle size reduction

### 3. Maximum Type Safety & Zero-Any Policy
- **Strict TypeScript**: Enable `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`
- **Zero-Any Rule**: Absolutely no `any` types allowed - use proper typing or generics
- **Type-Safe Communication**: Each component/hook receives a fully typed ORPC client
- **Usage Pattern**: `useDevTool<PluginContract>().orpc.[functionToCall]()`
- **Complete IntelliSense**: Full autocomplete, parameter validation, return type inference
- **Compile-Time Safety**: All errors caught at build time, not runtime
- **Generic Constraints**: Use bounded generics instead of `any` for flexibility
- **Union Types**: Prefer discriminated unions over loose object types

## Key Components

### Core Plugins (Always Present)
- **bundle**: Build info, assets, versions (`core.bundle.*`)
- **routes**: Route introspection (`core.routes.*`) 
- **cli**: Internal command exposure (`core.cli.*`)
- **logs**: Application logs access (`core.logs.*`)

### Module Plugins (Optional)
- **auth**: Sessions & user management (`mod.auth.*`)
- **todo**: Development task management (`mod.todo.*`)
- **tanstackQuery**: TanStack Query cache inspection (`mod.tanstackQuery.*`)

### Runtime System
- **Plugin Registry**: Zustand store for plugin state management
- **DevTool UI**: Reduced (compact bar) and Expanded (full panel) modes
- **useDevTool Hook**: Provides typed ORPC clients for each plugin

## Main API Functions

1. `usePlugins(pluginList: ModulePlugin[], options?)` - Merges UI/hooks of active plugins
2. `getRouterFromPlugins(pluginList: ModulePlugin[])` - Builds unified API router
3. `useDevTool<PluginContract>()` - Returns typed ORPC client for specific plugin

## Success Criteria

- **Complete Type Safety**: Zero `any` types, all interactions fully typed
- **Strict TypeScript Compliance**: Passes strictest TypeScript checks
- **Compile-Time Error Prevention**: All errors caught before runtime
- **IntelliSense Excellence**: Perfect autocomplete for all plugin APIs
- **Generic Type System**: Proper use of constrained generics over `any`
- **Plugin Isolation**: Independent activation/deactivation with type safety
- **UI Mode Transitions**: Seamless none → normal → expanded with typed state
- **Test Coverage**: ≥90% coverage with typed test utilities
- **Zero External Dependencies**: Only TypeScript/Node core (except ORPC)
- **Maintainable Architecture**: Clear, typed, self-documenting code structure

## Technology Stack

- TypeScript (strict mode)
- ORPC for type-safe RPC
- Zustand for state management
- React for UI components
- Node.js runtime (no external frameworks like Express)

## Repository Structure

Located at: `packages/nextjs-devtool/`
Following the specified directory structure with core/, modules/, runtime/, utils/, etc.

**Key Architecture Decision**: 
- `src/core/router.ts` contains **ONLY plugin definitions** (exports like `cliPlugin`, `bundlePlugin`)
- Implementation logic belongs in separate files (runtime/, utils/, individual plugin directories)
- This ensures clean separation between plugin declarations and runtime behavior
