# Framework Modules

## Overview

Framework modules provide the primary application structure and determine the core technology stack. Each framework module sets up the foundation for building specific types of applications with their associated tooling, routing, and build systems.

## Web Framework Modules

### Next.js Module (`@modular/nextjs`)

**Purpose**: React-based framework with SSR, SSG, and app router capabilities.

```yaml
module_definition:
  name: "@modular/nextjs"
  category: framework
  type: webapp
  description: "Next.js React framework with routing, SSR, and modern app structure"
  
provides:
  - react
  - ssr
  - ssg
  - routing
  - image-optimization
  - api-routes
  
requires:
  - "@modular/foundation"
  - "@modular/typescript"
  
recommends:
  - "@modular/tailwind"
  - "@modular/eslint"
  
conflicts:
  - "@modular/nuxtjs"
  - "@modular/angular"
  - "@modular/vite-react"
```

**File Structure Created**:
```
apps/web/
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── .env.example
├── public/
│   ├── favicon.ico
│   └── logo.svg
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── loading.tsx
    ├── components/
    │   └── ui/
    ├── lib/
    │   └── utils.ts
    └── types/
        └── index.ts
```

**Configuration Integration**:
```javascript
// turbo.json updates
{
  "pipeline": {
    "web#dev": {
      "cache": false,
      "persistent": true
    },
    "web#build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    }
  }
}
```

### Nuxt.js Module (`@modular/nuxtjs`)

**Purpose**: Vue-based framework with universal rendering and modular architecture.

```yaml
module_definition:
  name: "@modular/nuxtjs"
  category: framework
  type: webapp
  description: "Nuxt.js Vue framework with SSR, SSG, and module ecosystem"
  
provides:
  - vue
  - ssr
  - ssg
  - routing
  - auto-imports
  - composables
  
requires:
  - "@modular/foundation"
  - "@modular/typescript"
  
recommends:
  - "@modular/tailwind"
  - "@modular/eslint"
  
conflicts:
  - "@modular/nextjs"
  - "@modular/angular"
  - "@modular/vite-vue"
```

**File Structure Created**:
```
apps/web/
├── package.json
├── nuxt.config.ts
├── tsconfig.json
├── tailwind.config.js
├── .env.example
├── public/
├── assets/
├── components/
│   └── ui/
├── composables/
├── layouts/
│   └── default.vue
├── middleware/
├── pages/
│   └── index.vue
├── plugins/
├── server/
│   └── api/
└── types/
    └── index.ts
```

### Angular Module (`@modular/angular`)

**Purpose**: Full-featured framework with TypeScript, dependency injection, and CLI tooling.

```yaml
module_definition:
  name: "@modular/angular"
  category: framework
  type: webapp
  description: "Angular framework with TypeScript, RxJS, and complete toolchain"
  
provides:
  - angular
  - typescript
  - rxjs
  - cli-tooling
  - dependency-injection
  - routing
  
requires:
  - "@modular/foundation"
  - "@modular/typescript"
  
recommends:
  - "@modular/angular-material"
  - "@modular/eslint"
  
conflicts:
  - "@modular/nextjs"
  - "@modular/nuxtjs"
```

**File Structure Created**:
```
apps/web/
├── package.json
├── angular.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── .env.example
├── src/
│   ├── main.ts
│   ├── index.html
│   ├── styles.css
│   ├── app/
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.component.css
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── assets/
│   └── environments/
└── public/
```

### Vite + React Module (`@modular/vite-react`)

**Purpose**: Minimal React setup with Vite for fast development.

```yaml
module_definition:
  name: "@modular/vite-react"
  category: framework
  type: webapp
  description: "Lightweight React setup with Vite build tool"
  
provides:
  - react
  - vite
  - fast-hmr
  - spa
  
requires:
  - "@modular/foundation"
  - "@modular/typescript"
  
compatible_with:
  - "@modular/ui-shadcn"
  - "@modular/styled-components"
  
conflicts:
  - "@modular/nextjs"
  - "@modular/nuxtjs"
  - "@modular/angular"
```

### Vite + Vue Module (`@modular/vite-vue`)

**Purpose**: Minimal Vue setup with Vite for fast development.

```yaml
module_definition:
  name: "@modular/vite-vue"
  category: framework
  type: webapp
  description: "Lightweight Vue setup with Vite build tool"
  
provides:
  - vue
  - vite
  - fast-hmr
  - spa
  
requires:
  - "@modular/foundation"
  - "@modular/typescript"
  
compatible_with:
  - "@modular/ui-vuetify"
  - "@modular/vue-router"
  
conflicts:
  - "@modular/nextjs"
  - "@modular/nuxtjs"
  - "@modular/angular"
```

## API Framework Modules

### Directus Module (`@modular/directus`)

**Purpose**: Headless CMS with auto-generated API and admin interface.

```yaml
module_definition:
  name: "@modular/directus"
  category: framework
  type: api
  description: "Directus headless CMS with REST/GraphQL APIs"
  
provides:
  - cms
  - rest-api
  - graphql-api
  - admin-panel
  - file-management
  - user-management
  
requires:
  - "@modular/foundation"
  
recommends:
  - "@modular/postgres"
  - "@modular/docker"
  
conflicts:
  - "@modular/nestjs"
  - "@modular/adonisjs"
  - "@modular/express"
```

**File Structure Created**:
```
apps/api/
├── package.json
├── Dockerfile
├── .env.example
├── directus.config.js
├── extensions/
│   ├── hooks/
│   ├── endpoints/
│   └── interfaces/
└── data/
    └── uploads/
```

### NestJS Module (`@modular/nestjs`)

**Purpose**: Node.js framework with TypeScript, decorators, and dependency injection.

```yaml
module_definition:
  name: "@modular/nestjs"
  category: framework
  type: api
  description: "NestJS Node.js framework with TypeScript and decorators"
  
provides:
  - nestjs
  - decorators
  - dependency-injection
  - swagger
  - guards
  - interceptors
  
requires:
  - "@modular/foundation"
  - "@modular/typescript"
  
recommends:
  - "@modular/prisma"
  - "@modular/swagger"
  
conflicts:
  - "@modular/directus"
  - "@modular/adonisjs"
  - "@modular/express"
```

**File Structure Created**:
```
apps/api/
├── package.json
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── .env.example
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── auth/
│   ├── users/
│   └── common/
│       ├── decorators/
│       ├── guards/
│       └── interceptors/
└── test/
```

### AdonisJS Module (`@modular/adonisjs`)

**Purpose**: Node.js MVC framework with TypeScript and built-in ORM.

```yaml
module_definition:
  name: "@modular/adonisjs"
  category: framework
  type: api
  description: "AdonisJS MVC framework with TypeScript and Lucid ORM"
  
provides:
  - adonisjs
  - mvc-pattern
  - lucid-orm
  - authentication
  - validation
  - session-management
  
requires:
  - "@modular/foundation"
  - "@modular/typescript"
  
recommends:
  - "@modular/postgres"
  - "@modular/redis"
  
conflicts:
  - "@modular/directus"
  - "@modular/nestjs"
  - "@modular/express"
```

## Framework Selection Guide

### Decision Matrix

| Use Case | Recommended Framework | Reasoning |
|----------|----------------------|-----------|
| **Marketing Website** | Nuxt.js or Next.js | SSG capabilities, SEO optimization |
| **E-commerce** | Next.js + Directus | React ecosystem, headless commerce |
| **Dashboard/Admin** | Angular or Next.js | Complex state management, forms |
| **Blog/Content Site** | Nuxt.js + Directus | Content-focused, easy authoring |
| **Mobile App API** | NestJS or AdonisJS | RESTful APIs, authentication |
| **Rapid Prototype** | Vite + React/Vue | Fast development, minimal setup |
| **Enterprise App** | Angular + NestJS | Full-stack TypeScript, scalability |

### Technology Preferences

#### React Ecosystem
```bash
# Modern React with SSR
modular add @modular/nextjs

# Minimal React SPA
modular add @modular/vite-react

# UI Libraries
modular add @modular/ui-shadcn @modular/styled-components
```

#### Vue Ecosystem
```bash
# Full-stack Vue with SSR
modular add @modular/nuxtjs

# Minimal Vue SPA  
modular add @modular/vite-vue

# UI Libraries
modular add @modular/ui-vuetify @modular/ui-primevue
```

#### Full-Stack TypeScript
```bash
# Frontend
modular add @modular/angular

# Backend
modular add @modular/nestjs

# Shared packages
modular add @modular/shared-types @modular/validation
```

### Migration Paths

#### From Create React App to Next.js
```bash
# Current: Basic React app
# Target: Next.js with SSR

modular migrate cra @modular/nextjs
# Automatically converts components, updates routing, adds SSR
```

#### From Express to NestJS  
```bash
# Current: Express.js API
# Target: NestJS with TypeScript

modular migrate express @modular/nestjs
# Converts routes to controllers, adds decorators, updates structure
```

#### From Vue CLI to Nuxt.js
```bash
# Current: Vue SPA
# Target: Nuxt.js universal app

modular migrate vue-cli @modular/nuxtjs
# Updates to Nuxt structure, adds SSR, converts router
```

## Framework Module Templates

### Template Structure
```
templates/
├── nextjs/
│   ├── base/              # Minimal Next.js setup
│   ├── with-auth/         # Next.js + NextAuth
│   ├── with-cms/          # Next.js + Directus
│   └── enterprise/        # Full-featured setup
├── nuxtjs/
│   ├── base/
│   ├── content/           # Nuxt Content setup
│   └── spa/               # SPA mode
└── angular/
    ├── base/
    ├── material/          # Angular Material
    └── enterprise/        # NgRx, testing, etc.
```

### Custom Templates
```bash
# Create custom template from current setup
modular template create my-nextjs-starter --from apps/web

# Use custom template
modular add @modular/nextjs --template my-nextjs-starter

# Share template
modular template publish my-nextjs-starter
```

This framework module system provides flexibility in choosing the right technology stack while maintaining consistency in structure and development experience across different frameworks.