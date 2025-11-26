# AGENTS.md — Auth Package Guide

This package provides shared authentication configuration for Better Auth across the monorepo.

## Structure

- `src/server/` - Server-side auth factory, plugins, and permissions
- `src/client/` - Client-side auth factory and plugins
- `src/types.ts` - Shared types and interfaces

## Key Exports

### Server (`@repo/auth/server`)
- `betterAuthFactory` - Factory function to create Better Auth instance
- Server plugins: `masterTokenPlugin`, `loginAsPlugin`
- Permissions: `useAdmin`, `useOrganization`, permission config

### Client (`@repo/auth/client`)
- `createAuthClientFactory` - Factory to create Better Auth client with plugins
- Client plugins: `masterTokenClient`, `loginAsClientPlugin`
- Guards: `hasMasterTokenPlugin`

### Types
- `IEnvService` - Interface for environment service (to be implemented by API)

## Usage

See main README for usage examples in API and Web apps.
