# Progressive Setup Guide

## Overview

This guide outlines how to start from an empty repository and progressively build a modular monorepo by adding modules step by step. The approach ensures each addition is purposeful and maintains system integrity.

## Starting from Zero

### Step 1: Initialize Empty Repository

```bash
# Create new repository
mkdir my-modular-project
cd my-modular-project
git init

# Install modular CLI (global or via npx)
npm install -g @modular/cli
# or
npx @modular/cli init
```

### Step 2: Foundation Setup

The foundation layer provides the basic infrastructure:

```bash
# Install core foundation
modular init foundation

# This creates:
# ├── package.json          # Workspace configuration
# ├── turbo.json            # Turborepo setup
# ├── .gitignore           # Common ignore patterns
# ├── .npmrc               # Package manager config
# └── modular.config.json   # Module system config
```

### Step 3: Add Development Tools

```bash
# Add TypeScript support
modular add @modular/typescript

# Add linting and formatting
modular add @modular/eslint @modular/prettier

# Current structure:
# ├── package.json
# ├── turbo.json
# ├── tsconfig.json         # Base TypeScript config
# ├── eslint.config.js      # ESLint configuration
# ├── .prettierrc           # Prettier configuration
# └── packages/             # Empty packages directory
#     └── tsconfig/         # Shared TypeScript configs
```

## Progressive Framework Addition

### Scenario 1: Next.js Web Application

#### Phase 1: Basic Next.js Setup
```bash
# Add Next.js framework
modular add @modular/nextjs

# Creates:
# ├── apps/
# │   └── web/              # Next.js application
# │       ├── package.json
# │       ├── next.config.js
# │       ├── tsconfig.json
# │       └── src/
# │           └── app/      # App router structure
# └── packages/
#     └── tsconfig/         # Updated with Next.js configs
```

#### Phase 2: Add UI System
```bash
# Add Tailwind CSS
modular add @modular/tailwind

# Add Shadcn/ui components
modular add @modular/ui-shadcn

# Updates:
# ├── apps/web/
# │   ├── tailwind.config.js
# │   └── src/app/globals.css
# └── packages/
#     ├── ui/               # Shared UI components
#     └── tailwind-config/  # Shared Tailwind config
```

#### Phase 3: Add Authentication
```bash
# Add NextAuth.js
modular add @modular/auth-nextauth

# Creates/Updates:
# ├── apps/web/
# │   ├── .env.example      # Auth environment variables
# │   └── src/
# │       ├── app/api/auth/ # NextAuth API routes
# │       └── lib/auth.ts   # Auth configuration
# └── packages/
#     └── auth/             # Shared auth utilities
```

#### Phase 4: Add Backend
```bash
# Add Directus CMS
modular add @modular/directus

# Creates:
# ├── apps/
# │   ├── web/              # Existing Next.js app
# │   └── api/              # Directus backend
# │       ├── package.json
# │       ├── Dockerfile
# │       └── extensions/   # Custom Directus extensions
# ├── docker-compose.yml    # Development setup
# └── packages/
#     └── directus-sdk/     # Typed Directus client
```

### Scenario 2: Multi-Framework Setup

#### Starting Point
```bash
# Foundation + TypeScript + Tools
modular init foundation
modular add @modular/typescript @modular/eslint @modular/prettier
```

#### Add Multiple Frontends
```bash
# Admin panel with Next.js
modular add @modular/nextjs --name admin

# Public website with Nuxt.js  
modular add @modular/nuxtjs --name public

# Mobile API with NestJS
modular add @modular/nestjs --name api

# Result:
# ├── apps/
# │   ├── admin/            # Next.js admin panel
# │   ├── public/           # Nuxt.js public site
# │   └── api/              # NestJS API
# └── packages/             # Shared packages
```

#### Add Shared Packages
```bash
# Shared types across all apps
modular add @modular/shared-types

# Shared utilities
modular add @modular/shared-utils

# Database layer
modular add @modular/prisma

# Result:
# └── packages/
#     ├── shared-types/     # Common TypeScript types
#     ├── shared-utils/     # Utility functions
#     ├── database/         # Prisma schema and client
#     └── tsconfig/         # TypeScript configurations
```

## Progressive Enhancement Patterns

### Pattern 1: Start Simple, Add Complexity

```bash
# Week 1: Minimal viable setup
modular init foundation
modular add @modular/nextjs

# Week 2: Add styling
modular add @modular/tailwind

# Week 3: Add components
modular add @modular/ui-shadcn

# Week 4: Add authentication
modular add @modular/auth-nextauth

# Week 5: Add backend
modular add @modular/directus
```

### Pattern 2: Feature-Driven Addition

```bash
# User story: "As a user, I want to log in"
modular add @modular/auth-nextauth @modular/database-prisma

# User story: "As a user, I want a responsive UI" 
modular add @modular/tailwind @modular/ui-shadcn

# User story: "As an admin, I want to manage content"
modular add @modular/directus
```

### Pattern 3: Technology Migration

```bash
# Current: Basic React app
# Target: Full-stack Next.js with CMS

# Step 1: Upgrade to Next.js
modular migrate react-app @modular/nextjs

# Step 2: Add backend gradually
modular add @modular/directus

# Step 3: Integrate data layer
modular add @modular/directus-sdk
```

## Configuration Management

### Environment Variables
```bash
# Each module can add its environment variables
# .env.example is automatically updated

# Foundation
COMPOSE_PROJECT_NAME=my-project

# Next.js module adds:
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Auth module adds:
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Directus module adds:
DIRECTUS_DATABASE_HOST=localhost
DIRECTUS_DATABASE_PASSWORD=secret
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    
    // Next.js module adds:
    "dev:web": "turbo dev --filter=web",
    "build:web": "turbo build --filter=web",
    
    // Directus module adds:
    "dev:api": "turbo dev --filter=api", 
    "dev:full": "docker-compose up",
    
    // Testing module adds:
    "test": "turbo test",
    "test:watch": "turbo test:watch"
  }
}
```

## Interactive Module Addition

### CLI Prompts
```bash
$ modular add

? What type of module would you like to add?
❯ Web Framework (Next.js, Nuxt.js, Angular)
  API Framework (NestJS, Directus, AdonisJS)  
  UI Library (Shadcn/ui, Chakra UI, Material-UI)
  Authentication (NextAuth, Auth0, Supabase)
  Database (Prisma, Drizzle, TypeORM)
  Testing (Vitest, Jest, Playwright)
  Deployment (Docker, Vercel, Netlify)

? Choose a web framework:
❯ Next.js - React with SSR and app router
  Nuxt.js - Vue with universal rendering
  Angular - Full framework with CLI
  Vite + React - Minimal React setup
  Vite + Vue - Minimal Vue setup

? Configure Next.js:
  App name: (web) 
  ✅ Include TypeScript
  ✅ Include Tailwind CSS  
  ✅ Include ESLint
  ⬜ Include NextAuth.js
  ⬜ Include Shadcn/ui
```

### Guided Setup Wizards

```bash
# Full-stack setup wizard
$ modular wizard fullstack

Welcome to the Full-Stack Setup Wizard!
This will guide you through creating a complete application.

Step 1/5: Choose your frontend
❯ Next.js (React)
  Nuxt.js (Vue)
  Angular

Step 2/5: Choose your backend  
❯ Directus (Headless CMS)
  NestJS (Node.js API)
  AdonisJS (Node.js MVC)

Step 3/5: Choose your database
❯ PostgreSQL
  MySQL
  SQLite

Step 4/5: Choose UI framework
❯ Tailwind CSS + Shadcn/ui
  Styled Components
  Sass/SCSS

Step 5/5: Additional features
✅ Authentication (NextAuth.js)
✅ Testing (Vitest)
✅ Docker setup
⬜ GitHub Actions CI/CD
⬜ Monitoring (Sentry)

🚀 Setting up your full-stack application...
✅ Foundation installed
✅ Next.js configured
✅ Directus backend created  
✅ Authentication integrated
✅ UI components ready
✅ Docker environment configured

🎉 Your project is ready! Run 'bun run dev' to start developing.
```

## Validation and Safety

### Pre-Installation Checks
```bash
$ modular add @modular/auth-nuxt

⚠️  Compatibility Check:
❌ @modular/auth-nuxt requires @modular/nuxtjs
💡 Did you mean to install @modular/auth-nextauth instead?

? How would you like to proceed?
❯ Install @modular/nuxtjs first, then @modular/auth-nuxt
  Install @modular/auth-nextauth (for Next.js)
  Cancel and review options
```

### Rollback Support
```bash
# Each installation creates a checkpoint
$ modular history
1. Foundation setup (2024-01-15 10:00)
2. Added TypeScript (2024-01-15 10:05)  
3. Added Next.js (2024-01-15 10:15)
4. Added Auth (2024-01-15 11:00)

# Rollback if needed
$ modular rollback 3
⚠️  This will remove:
- NextAuth.js authentication
- Associated configuration
- Environment variables

? Confirm rollback? (y/N)
```

This progressive approach ensures developers can build exactly what they need without overwhelming complexity, while maintaining the ability to grow and adapt their monorepo over time.