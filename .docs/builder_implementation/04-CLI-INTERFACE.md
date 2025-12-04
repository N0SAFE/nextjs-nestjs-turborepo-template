# CLI Interface

📍 [Documentation Hub](../README.md) > [Builder Implementation](./README.md) > CLI Interface

## Overview

The Stratum Builder CLI provides an intuitive command-line interface for creating and managing projects. This document details all available commands, options, and interactive features.

## Installation

```bash
# Global installation
npm install -g @stratum/builder
# or
yarn global add @stratum/builder
# or
pnpm add -g @stratum/builder
# or
bun add -g @stratum/builder

# Verify installation
stratum --version
stratum --help
```

## Commands

### `stratum init`

Initialize a new Stratum project with interactive setup.

**Usage**:
```bash
stratum init [project-name] [options]
```

**Arguments**:
- `project-name` - Name of the project (optional, will prompt if not provided)

**Options**:
- `-t, --template <template>` - Use a predefined template
- `-f, --features <features...>` - Pre-select features (space-separated)
- `-d, --directory <path>` - Target directory (default: ./project-name)
- `-p, --package-manager <pm>` - Package manager (npm, yarn, pnpm, bun)
- `--skip-install` - Skip dependency installation
- `--skip-git` - Skip git initialization
- `--yes, -y` - Use all defaults, skip prompts
- `--dry-run` - Show what would be created without creating it

**Examples**:

```bash
# Interactive setup
stratum init my-app

# Quick start with template
stratum init my-app --template saas

# Pre-select features
stratum init my-app --features orpc better-auth database

# Use specific package manager
stratum init my-app --package-manager bun

# Skip prompts, use defaults
stratum init my-app --yes

# Dry run to preview
stratum init my-app --dry-run
```

**Interactive Flow**:

```
$ stratum init my-app

🎯 Stratum Builder v1.0.0

✔ Project name: my-app
✔ Description: My awesome SaaS application
✔ Package manager: bun

📦 Select features:

Core Features (required):
  ✓ Base Template (Next.js + NestJS)
  ✓ TypeScript
  ✓ Turborepo

Feature Plugins:
  ◯ ORPC (Type-safe API)
  ◯ Better Auth (Authentication)
  ◯ Database (PostgreSQL + Drizzle)
  ◯ Redis (Caching)
  ◯ Job Queue (Bull)
  ◯ Event System
  ◯ File Upload
  ◯ Email Service
  ◯ Webhooks
  ◯ Search
  ◯ i18n

Infrastructure Plugins:
  ◯ Docker
  ◯ CI/CD
  ◯ Monitoring
  ◯ Testing

UI Plugins:
  ◯ Shadcn UI
  ◯ Tailwind CSS
  ◯ Theme System

Integration Plugins:
  ◯ Stripe
  ◯ Analytics
  ◯ SEO

Press <space> to select, <a> to toggle all, <i> to invert selection
```

**Dependency Resolution**:

```
✔ Features selected: ORPC, Better Auth, Database, Docker

📊 Analyzing dependencies...

Required dependencies will be installed:
  • Base Template (required by Better Auth)
  • TypeScript (required by ORPC)
  • Turborepo (core requirement)

Optional dependencies detected:
  ◯ Redis - Recommended for Better Auth session caching
  ◯ Email - Required for Better Auth email verification

Continue without optional dependencies? (y/N)
```

**Generation Progress**:

```
🚀 Creating your Stratum project...

✓ Creating project structure
✓ Installing base template
✓ Installing TypeScript
✓ Installing Turborepo
✓ Installing ORPC (1/4)
  ✓ Copying templates
  ✓ Configuring API
  ✓ Configuring Web
  ✓ Generating types
✓ Installing Better Auth (2/4)
  ✓ Setting up authentication
  ✓ Creating auth tables
  ✓ Configuring providers
✓ Installing Database (3/4)
  ✓ Setting up PostgreSQL
  ✓ Configuring Drizzle ORM
  ✓ Creating migrations
✓ Installing Docker (4/4)
  ✓ Creating Dockerfiles
  ✓ Setting up Docker Compose

📦 Installing dependencies...
   This may take a few minutes...

✓ Project created successfully!

📝 Next steps:

  cd my-app
  
  # Set up environment variables
  cp .env.example .env
  
  # Start development server
  bun run dev
  
  # Run database migrations
  bun run api -- db:migrate

📚 Documentation: https://stratum.dev/docs
🐛 Issues: https://github.com/stratum/builder/issues

Happy coding! 🎉
```

---

### `stratum add`

Add features to an existing project.

**Usage**:
```bash
stratum add <features...> [options]
```

**Arguments**:
- `features...` - Features to add (space-separated)

**Options**:
- `-y, --yes` - Skip confirmation prompts
- `--dry-run` - Preview changes without applying them
- `--force` - Force installation even if conflicts detected

**Examples**:

```bash
# Add single feature
stratum add redis

# Add multiple features
stratum add redis job-queue email

# Preview changes
stratum add stripe --dry-run

# Force installation
stratum add custom-auth --force
```

**Interactive Flow**:

```
$ stratum add redis job-queue

🔍 Analyzing existing project...

Current features:
  • base
  • typescript
  • orpc
  • database

New features to add:
  • redis
  • job-queue

📊 Dependency analysis:

No additional dependencies required.

⚠️  Configuration changes:
  • .env - Add REDIS_URL
  • docker-compose.yml - Add Redis service
  • apps/api/src/main.ts - Initialize Redis connection

Continue? (Y/n)

✓ Installing Redis
✓ Installing Job Queue
✓ Updating configuration
✓ Running post-install tasks

✓ Features added successfully!

📝 Migration guide created: MIGRATION.md

Next steps:
  1. Review MIGRATION.md for manual changes
  2. Update .env with Redis configuration
  3. Restart development server
```

---

### `stratum remove`

Remove features from an existing project.

**Usage**:
```bash
stratum remove <features...> [options]
```

**Arguments**:
- `features...` - Features to remove (space-separated)

**Options**:
- `-y, --yes` - Skip confirmation prompts
- `--keep-data` - Keep database tables/data
- `--dry-run` - Preview changes

**Examples**:

```bash
# Remove feature
stratum remove redis

# Remove with data preservation
stratum remove database --keep-data

# Preview removal
stratum remove email --dry-run
```

**Interactive Flow**:

```
$ stratum remove redis

⚠️  WARNING: This will remove Redis and all related configuration.

The following features depend on Redis:
  • job-queue
  • event-system (optional)

Do you want to remove dependent features too? (y/N)

Files to be deleted:
  • apps/api/src/redis/
  • docker/redis.conf

Configuration changes:
  • Remove REDIS_URL from .env
  • Remove Redis service from docker-compose.yml

Continue? (y/N)

✓ Backing up project
✓ Removing Redis configuration
✓ Removing dependent features
✓ Cleaning up files
✓ Updating configuration

✓ Redis removed successfully!

⚠️  Manual steps required:
  1. Remove Redis-related environment variables
  2. Restart development server
```

---

### `stratum update`

Update Stratum Builder or project features.

**Usage**:
```bash
stratum update [features...] [options]
```

**Arguments**:
- `features...` - Specific features to update (optional, updates all if not specified)

**Options**:
- `--builder` - Update the builder CLI itself
- `-y, --yes` - Skip confirmation prompts
- `--dry-run` - Preview updates

**Examples**:

```bash
# Update all features
stratum update

# Update specific features
stratum update orpc better-auth

# Update builder CLI
stratum update --builder

# Preview updates
stratum update --dry-run
```

**Interactive Flow**:

```
$ stratum update

🔍 Checking for updates...

Available updates:
  • orpc: 1.0.0 → 1.2.0
  • better-auth: 1.0.0 → 1.1.0
  • database: 1.0.0 → 1.0.1

Release notes:
  orpc v1.2.0:
    - New OpenAPI features
    - Performance improvements
    - Breaking: Changed client API

  better-auth v1.1.0:
    - Added MFA support
    - Fixed session expiry bug

Update all features? (Y/n)

✓ Backing up project
✓ Updating orpc
  ⚠️  Breaking changes detected
  📝 Migration guide: .stratum/migrations/orpc-1.2.0.md
✓ Updating better-auth
✓ Updating database
✓ Running migrations
✓ Updating dependencies

✓ Update complete!

⚠️  Action required:
  1. Review migration guides in .stratum/migrations/
  2. Update your code according to breaking changes
  3. Test your application thoroughly
```

---

### `stratum plugins`

List available plugins and their status.

**Usage**:
```bash
stratum plugins [options]
```

**Options**:
- `--installed` - Show only installed plugins
- `--available` - Show only available plugins
- `--category <category>` - Filter by category
- `--search <query>` - Search plugins
- `--json` - Output as JSON

**Examples**:

```bash
# List all plugins
stratum plugins

# Show installed only
stratum plugins --installed

# Filter by category
stratum plugins --category feature

# Search plugins
stratum plugins --search auth

# JSON output
stratum plugins --json
```

**Output**:

```
$ stratum plugins

📦 Stratum Plugins

Core Plugins:
  ✓ base              Base Template (Next.js + NestJS)
  ✓ typescript        TypeScript Configuration
  ✓ turborepo         Monorepo Build System

Feature Plugins:
  ✓ orpc              Type-safe RPC Framework
  ✓ better-auth       Modern Authentication
  ✓ database          PostgreSQL + Drizzle ORM
  ○ redis             Redis Caching Layer
  ○ job-queue         Bull Queue System
  ○ event-system      Event-Driven Architecture
  ○ file-upload       File Management
  ○ email             Email Service
  ○ webhooks          Webhook Management
  ○ search            Full-Text Search
  ○ i18n              Internationalization

Infrastructure Plugins:
  ✓ docker            Docker Containerization
  ○ ci-cd             CI/CD Pipelines
  ○ monitoring        Application Monitoring
  ○ testing           Testing Framework

UI Plugins:
  ✓ shadcn-ui         UI Component Library
  ✓ tailwind          Tailwind CSS
  ○ theme             Theming System

Integration Plugins:
  ○ stripe            Stripe Payments
  ○ analytics         Analytics Integration
  ○ seo               SEO Optimization

Legend: ✓ Installed  ○ Available

Use 'stratum plugins --installed' to see only installed plugins.
Use 'stratum add <plugin>' to install a plugin.
```

---

### `stratum validate`

Validate project configuration and dependencies.

**Usage**:
```bash
stratum validate [options]
```

**Options**:
- `--fix` - Automatically fix issues
- `--verbose` - Show detailed validation results

**Examples**:

```bash
# Validate project
stratum validate

# Validate and fix issues
stratum validate --fix

# Verbose output
stratum validate --verbose
```

**Output**:

```
$ stratum validate

🔍 Validating project...

✓ Project structure is valid
✓ Dependencies are correctly installed
✓ Configuration files are valid
⚠️  Environment variables:
    Missing: REDIS_URL
    Fix: Add REDIS_URL to .env file
✗ Database connection failed
    Error: Connection refused
    Fix: Ensure PostgreSQL is running

Summary:
  ✓ 3 passed
  ⚠️  1 warning
  ✗ 1 error

Run 'stratum validate --fix' to automatically fix issues.
```

---

### `stratum info`

Display project information and configuration.

**Usage**:
```bash
stratum info [options]
```

**Options**:
- `--json` - Output as JSON
- `--verbose` - Show detailed information

**Examples**:

```bash
# Show project info
stratum info

# JSON output
stratum info --json

# Verbose output
stratum info --verbose
```

**Output**:

```
$ stratum info

📊 Project Information

Name: my-app
Description: My awesome SaaS application
Version: 1.0.0
Builder Version: 1.0.0
Created: 2024-01-15
Last Modified: 2024-01-20

Package Manager: bun
Node Version: 20.x

Installed Features (8):
  Core:
    • base (1.0.0)
    • typescript (1.0.0)
    • turborepo (1.0.0)
  
  Features:
    • orpc (1.2.0)
    • better-auth (1.0.0)
    • database (1.0.0)
  
  Infrastructure:
    • docker (1.0.0)
  
  UI:
    • shadcn-ui (1.0.0)

Configuration:
  API Port: 3001
  Web Port: 3000
  Database: PostgreSQL
  Cache: None

Environment:
  Development: ✓
  Production: Not configured
```

---

### `stratum config`

Manage project configuration.

**Usage**:
```bash
stratum config <action> [options]
```

**Actions**:
- `get <key>` - Get configuration value
- `set <key> <value>` - Set configuration value
- `unset <key>` - Remove configuration value
- `list` - List all configuration

**Examples**:

```bash
# Get value
stratum config get api.port

# Set value
stratum config set api.port 3002

# Remove value
stratum config unset redis.host

# List all
stratum config list
```

---

### `stratum doctor`

Diagnose and fix common issues.

**Usage**:
```bash
stratum doctor [options]
```

**Options**:
- `--fix` - Automatically fix issues
- `--verbose` - Show detailed diagnostics

**Examples**:

```bash
# Run diagnostics
stratum doctor

# Fix issues automatically
stratum doctor --fix
```

**Output**:

```
$ stratum doctor

🏥 Running diagnostics...

Environment:
  ✓ Node.js version: 20.10.0
  ✓ Package manager: bun 1.3.1
  ✓ Git: 2.40.0

Project Health:
  ✓ Valid project structure
  ✓ All dependencies installed
  ⚠️  5 dependencies have updates available
  ✗ TypeScript compilation failed
      Error in apps/api/src/user/user.service.ts:15:3
      Fix: Run 'bun run build' to see full errors

Services:
  ✓ PostgreSQL: Running on port 5432
  ✗ Redis: Not running
      Fix: Start Redis with 'docker-compose up redis'

Configuration:
  ✓ Environment variables are set
  ⚠️  .env.example is outdated
      Fix: Run 'stratum config sync'

Security:
  ✓ No known vulnerabilities
  ✓ Dependencies are up to date

Summary:
  ✓ 9 passed
  ⚠️  2 warnings
  ✗ 2 errors

Run 'stratum doctor --fix' to automatically fix issues.
```

---

## Configuration File

### `.stratum.json`

Project manifest file created by the builder:

```json
{
  "version": "1.0.0",
  "builder": "1.0.0",
  "created": "2024-01-15T10:00:00Z",
  "lastModified": "2024-01-20T15:30:00Z",
  "name": "my-app",
  "description": "My awesome SaaS application",
  "packageManager": "bun",
  
  "plugins": {
    "base": {
      "version": "1.0.0",
      "installed": "2024-01-15T10:00:00Z"
    },
    "typescript": {
      "version": "1.0.0",
      "installed": "2024-01-15T10:00:00Z"
    },
    "orpc": {
      "version": "1.2.0",
      "installed": "2024-01-15T10:00:00Z",
      "updated": "2024-01-20T15:30:00Z",
      "config": {
        "enableOpenAPI": true,
        "clientPort": 3001
      }
    },
    "better-auth": {
      "version": "1.0.0",
      "installed": "2024-01-15T10:00:00Z",
      "config": {
        "providers": ["credentials", "google"],
        "sessionExpiry": "7d",
        "enableMFA": false
      }
    }
  },
  
  "config": {
    "api": {
      "port": 3001
    },
    "web": {
      "port": 3000
    },
    "database": {
      "type": "postgres",
      "port": 5432
    }
  },
  
  "custom": {
    "projectName": "My SaaS App",
    "author": "John Doe",
    "license": "MIT"
  }
}
```

## Global Configuration

### `~/.stratum/config.json`

User-level configuration:

```json
{
  "defaultPackageManager": "bun",
  "defaultTemplate": "saas",
  "telemetry": true,
  "updateCheck": true,
  "cache": {
    "enabled": true,
    "ttl": 86400
  },
  "plugins": {
    "registry": "https://registry.stratum.dev"
  }
}
```

## Environment Variables

The CLI respects these environment variables:

- `STRATUM_PACKAGE_MANAGER` - Default package manager
- `STRATUM_REGISTRY` - Plugin registry URL
- `STRATUM_CACHE_DIR` - Cache directory
- `STRATUM_NO_TELEMETRY` - Disable telemetry
- `STRATUM_NO_UPDATE_CHECK` - Disable update checks

## Exit Codes

- `0` - Success
- `1` - General error
- `2` - Invalid arguments
- `3` - Configuration error
- `4` - Network error
- `5` - File system error
- `6` - Validation error

## Next Steps

- Review [Template Generation](./05-TEMPLATE-GENERATION.md) for how projects are created
- Study [Use Cases](./12-USE-CASES.md) for practical examples
- Read [Troubleshooting](./14-TROUBLESHOOTING.md) for common issues

---

*The CLI is designed to be intuitive and helpful, guiding users through every step.*
