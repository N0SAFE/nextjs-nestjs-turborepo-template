# Package Modules

## Overview

Package modules provide shared functionality, utilities, and components that can be used across multiple applications within the monorepo. These modules promote code reuse, maintain consistency, and provide specialized functionality for specific use cases.

## Authentication Modules

### NextAuth.js Module (`@modular/auth-nextauth`)

**Purpose**: Authentication solution specifically for Next.js applications.

```yaml
module_definition:
  name: "@modular/auth-nextauth"
  category: package
  type: authentication
  description: "NextAuth.js authentication for Next.js applications"
  
provides:
  - oauth-providers
  - session-management
  - jwt-tokens
  - database-sessions
  - email-authentication
  - credentials-auth
  
requires:
  - "@modular/nextjs"
  
compatible_with:
  - "@modular/prisma"
  - "@modular/postgres"
  - "@modular/directus"
  
conflicts:
  - "@modular/auth-nuxt"
  - "@modular/auth-angular"
```

**File Structure Created**:
```
packages/auth/
├── package.json
├── src/
│   ├── config/
│   │   ├── auth.ts          # NextAuth configuration
│   │   ├── providers.ts     # OAuth providers setup
│   │   └── callbacks.ts     # Custom callbacks
│   ├── middleware/
│   │   └── auth-middleware.ts
│   ├── hooks/
│   │   ├── use-session.ts
│   │   └── use-auth.ts
│   ├── types/
│   │   └── auth.types.ts
│   └── utils/
│       ├── jwt.ts
│       └── session.ts
└── README.md
```

**Integration with Apps**:
```typescript
// apps/web/src/app/api/auth/[...nextauth]/route.ts
import { authConfig } from '@repo/auth/config'
import NextAuth from 'next-auth'

const handler = NextAuth(authConfig)
export { handler as GET, handler as POST }
```

### Nuxt Auth Module (`@modular/auth-nuxt`)

**Purpose**: Authentication solution for Nuxt.js applications.

```yaml
module_definition:
  name: "@modular/auth-nuxt"
  category: package
  type: authentication
  description: "Nuxt Auth module with composables and middleware"
  
provides:
  - oauth-providers
  - composables
  - middleware
  - session-management
  - ssr-support
  
requires:
  - "@modular/nuxtjs"
  
conflicts:
  - "@modular/auth-nextauth"
  - "@modular/auth-angular"
```

### Auth0 Module (`@modular/auth-auth0`)

**Purpose**: Auth0 integration for multiple frameworks.

```yaml
module_definition:
  name: "@modular/auth-auth0"
  category: package
  type: authentication
  description: "Auth0 integration with multiple framework support"
  
provides:
  - auth0-integration
  - social-login
  - enterprise-sso
  - mfa-support
  
compatible_with:
  - "@modular/nextjs"
  - "@modular/nuxtjs"
  - "@modular/angular"
  
alternatives:
  - "@modular/auth-nextauth"
  - "@modular/auth-supabase"
```

## UI and Component Libraries

### Shadcn/ui Module (`@modular/ui-shadcn`)

**Purpose**: Modern React component library built on Radix UI and Tailwind CSS.

```yaml
module_definition:
  name: "@modular/ui-shadcn"
  category: package
  type: ui-library
  description: "Shadcn/ui React components with Tailwind CSS"
  
provides:
  - react-components
  - accessible-ui
  - customizable-design
  - dark-mode
  - typography
  
requires:
  - "@modular/nextjs" # or any React-based framework
  - "@modular/tailwind"
  
conflicts:
  - "@modular/ui-chakra"
  - "@modular/ui-material"
```

**File Structure Created**:
```
packages/ui/
├── package.json
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── form.tsx
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── footer.tsx
│   │   └── forms/
│   │       ├── auth-form.tsx
│   │       └── contact-form.tsx
│   ├── hooks/
│   │   ├── use-toast.ts
│   │   └── use-theme.ts
│   ├── lib/
│   │   └── utils.ts
│   └── styles/
│       └── globals.css
├── tailwind.config.js
└── README.md
```

### Vuetify Module (`@modular/ui-vuetify`)

**Purpose**: Material Design component library for Vue.js.

```yaml
module_definition:
  name: "@modular/ui-vuetify"
  category: package
  type: ui-library
  description: "Vuetify Material Design components for Vue"
  
provides:
  - vue-components
  - material-design
  - responsive-grid
  - theming
  
requires:
  - "@modular/nuxtjs" # or Vue-based framework
  
conflicts:
  - "@modular/ui-shadcn"
  - "@modular/ui-quasar"
```

### Angular Material Module (`@modular/ui-angular-material`)

**Purpose**: Angular implementation of Material Design.

```yaml
module_definition:
  name: "@modular/ui-angular-material"
  category: package
  type: ui-library
  description: "Angular Material Design components"
  
provides:
  - angular-components
  - material-design
  - cdk-primitives
  - accessibility
  
requires:
  - "@modular/angular"
  
conflicts:
  - "@modular/ui-shadcn"
  - "@modular/ui-primeng"
```

## Database and ORM Packages

### Prisma Package (`@modular/database-prisma`)

**Purpose**: Shared Prisma schema and client for database operations.

```yaml
module_definition:
  name: "@modular/database-prisma"
  category: package
  type: database
  description: "Shared Prisma client and database utilities"
  
provides:
  - prisma-client
  - type-definitions
  - migrations
  - seed-scripts
  
requires:
  - "@modular/foundation"
  
compatible_with:
  - "@modular/postgres"
  - "@modular/mysql"
  - "@modular/sqlite"
  
conflicts:
  - "@modular/database-drizzle"
```

**File Structure Created**:
```
packages/database/
├── package.json
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seeds/
│       ├── users.ts
│       └── posts.ts
├── src/
│   ├── client.ts          # Prisma client singleton
│   ├── types.ts           # Generated types
│   ├── queries/
│   │   ├── users.ts
│   │   └── posts.ts
│   └── utils/
│       ├── pagination.ts
│       └── filters.ts
└── scripts/
    ├── generate.js
    └── migrate.js
```

### Database Adapters (`@modular/db-adapters`)

**Purpose**: Database connection utilities for different environments.

```yaml
module_definition:
  name: "@modular/db-adapters"
  category: package
  type: database
  description: "Database connection adapters and utilities"
  
provides:
  - connection-pooling
  - environment-configs
  - health-checks
  - migrations
  
compatible_with:
  - "@modular/postgres"
  - "@modular/mysql"
  - "@modular/redis"
```

## State Management Packages

### Zustand Store (`@modular/store-zustand`)

**Purpose**: Lightweight state management with Zustand.

```yaml
module_definition:
  name: "@modular/store-zustand"
  category: package
  type: state-management
  description: "Zustand stores for shared state management"
  
provides:
  - global-state
  - persistence
  - devtools
  - typescript-support
  
compatible_with:
  - "@modular/nextjs"
  - "@modular/vite-react"
  
conflicts:
  - "@modular/store-redux"
  - "@modular/store-jotai"
```

**File Structure Created**:
```
packages/store/
├── package.json
├── src/
│   ├── stores/
│   │   ├── auth-store.ts
│   │   ├── ui-store.ts
│   │   └── cart-store.ts
│   ├── middleware/
│   │   ├── persist.ts
│   │   └── devtools.ts
│   ├── hooks/
│   │   ├── use-auth-store.ts
│   │   └── use-ui-store.ts
│   ├── types/
│   │   └── store.types.ts
│   └── utils/
│       └── store-utils.ts
└── README.md
```

### Pinia Store (`@modular/store-pinia`)

**Purpose**: Vue state management with Pinia.

```yaml
module_definition:
  name: "@modular/store-pinia"
  category: package
  type: state-management
  description: "Pinia stores for Vue applications"
  
provides:
  - vue-state
  - composition-api
  - ssr-support
  - devtools
  
requires:
  - "@modular/nuxtjs" # or Vue framework
  
conflicts:
  - "@modular/store-zustand"
  - "@modular/store-vuex"
```

## Utility Packages

### Shared Types (`@modular/types`)

**Purpose**: Common TypeScript types and interfaces.

```yaml
module_definition:
  name: "@modular/types"
  category: package
  type: utilities
  description: "Shared TypeScript types and interfaces"
  
provides:
  - common-types
  - api-types
  - utility-types
  - validation-schemas
  
compatible_with: # All modules
  - "*"
```

**File Structure Created**:
```
packages/types/
├── package.json
├── src/
│   ├── api/
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   └── response.types.ts
│   ├── ui/
│   │   ├── component.types.ts
│   │   └── theme.types.ts
│   ├── database/
│   │   └── models.types.ts
│   ├── utils/
│   │   ├── common.types.ts
│   │   └── helpers.types.ts
│   └── index.ts
└── README.md
```

### Shared Utilities (`@modular/utils`)

**Purpose**: Common utility functions and helpers.

```yaml
module_definition:
  name: "@modular/utils"
  category: package
  type: utilities
  description: "Shared utility functions and helpers"
  
provides:
  - date-helpers
  - string-utils
  - validation
  - formatting
  - api-helpers
  
compatible_with:
  - "*"
```

**File Structure Created**:
```
packages/utils/
├── package.json
├── src/
│   ├── date/
│   │   ├── format.ts
│   │   └── parse.ts
│   ├── string/
│   │   ├── slugify.ts
│   │   └── truncate.ts
│   ├── validation/
│   │   ├── email.ts
│   │   └── password.ts
│   ├── api/
│   │   ├── fetch.ts
│   │   └── error-handler.ts
│   ├── format/
│   │   ├── currency.ts
│   │   └── number.ts
│   └── index.ts
├── tests/
└── README.md
```

### Validation Package (`@modular/validation`)

**Purpose**: Shared validation schemas and utilities.

```yaml
module_definition:
  name: "@modular/validation"
  category: package
  type: utilities
  description: "Zod validation schemas and utilities"
  
provides:
  - zod-schemas
  - form-validation
  - api-validation
  - type-inference
  
requires:
  - "@modular/types"
  
compatible_with:
  - "@modular/nextjs"
  - "@modular/nuxtjs"
  - "@modular/nestjs"
```

## Configuration Packages

### ESLint Config (`@modular/eslint-config`)

**Purpose**: Shared ESLint configuration.

```yaml
module_definition:
  name: "@modular/eslint-config"
  category: package
  type: configuration
  description: "Shared ESLint rules and configurations"
  
provides:
  - lint-rules
  - typescript-rules
  - react-rules
  - vue-rules
  
compatible_with:
  - "*"
```

### Tailwind Config (`@modular/tailwind-config`)

**Purpose**: Shared Tailwind CSS configuration.

```yaml
module_definition:
  name: "@modular/tailwind-config"
  category: package
  type: configuration
  description: "Shared Tailwind CSS configuration and plugins"
  
provides:
  - design-tokens
  - custom-utilities
  - component-classes
  - theme-config
  
compatible_with:
  - "@modular/nextjs"
  - "@modular/nuxtjs"
  - "@modular/angular"
```

### TypeScript Config (`@modular/tsconfig`)

**Purpose**: Shared TypeScript configurations.

```yaml
module_definition:
  name: "@modular/tsconfig"
  category: package
  type: configuration
  description: "Shared TypeScript configurations for different environments"
  
provides:
  - base-config
  - nextjs-config
  - node-config
  - library-config
  
compatible_with:
  - "*"
```

## Testing Packages

### Test Utils (`@modular/test-utils`)

**Purpose**: Shared testing utilities and helpers.

```yaml
module_definition:
  name: "@modular/test-utils"
  category: package
  type: testing
  description: "Shared testing utilities and setup"
  
provides:
  - test-helpers
  - mock-data
  - render-utils
  - api-mocks
  
compatible_with:
  - "@modular/vitest"
  - "@modular/jest"
  - "@modular/playwright"
```

**File Structure Created**:
```
packages/test-utils/
├── package.json
├── src/
│   ├── setup/
│   │   ├── vitest.setup.ts
│   │   └── jest.setup.ts
│   ├── mocks/
│   │   ├── api.mocks.ts
│   │   ├── auth.mocks.ts
│   │   └── data.mocks.ts
│   ├── helpers/
│   │   ├── render.ts
│   │   ├── user-events.ts
│   │   └── api-helpers.ts
│   ├── fixtures/
│   │   ├── users.json
│   │   └── posts.json
│   └── index.ts
└── README.md
```

## Package Module Usage Patterns

### Cross-Package Dependencies

```typescript
// packages/auth/src/config/auth.ts
import type { User } from '@repo/types'
import { validateEmail } from '@repo/utils'
import { db } from '@repo/database'

export const authConfig = {
  // Configuration using shared utilities
}
```

### Monorepo Package Sharing

```json
// apps/web/package.json
{
  "dependencies": {
    "@repo/ui": "workspace:*",
    "@repo/auth": "workspace:*", 
    "@repo/types": "workspace:*",
    "@repo/utils": "workspace:*"
  }
}
```

### Conditional Package Loading

```bash
# Only add packages that are compatible
modular add @modular/ui-shadcn  # Only if React framework exists
modular add @modular/ui-vuetify # Only if Vue framework exists
```

This package module system creates a robust ecosystem of reusable components, utilities, and configurations that can be shared across different applications while maintaining type safety and consistency.