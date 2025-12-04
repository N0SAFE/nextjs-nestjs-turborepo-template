# Configuration Interfaces

📍 [Documentation Hub](../README.md) > [Builder Implementation](./README.md) > Configuration Interfaces

## Overview

The Stratum Builder provides two primary ways to configure and generate projects: a powerful CLI interface for developers who prefer the terminal, and a visual web interface for those who prefer a graphical configuration experience. Both interfaces produce the same result but cater to different user preferences and workflows.

## CLI-Based Configuration

### Interactive Mode (Default)

The simplest way to configure a project is through the interactive CLI prompts:

```bash
stratum init my-project
```

This launches an interactive session that guides you through all configuration options.

### Non-Interactive Mode (Flags-Based)

For automation, CI/CD, or when you know exactly what you want, use command-line flags:

```bash
stratum init my-project \
  --template saas \
  --features orpc better-auth database redis \
  --package-manager bun \
  --typescript strict \
  --api-port 3001 \
  --web-port 3000 \
  --skip-git false \
  --skip-install false
```

### Complete CLI Flag Reference

#### Basic Flags

```bash
# Project Information
--project-name <name>           # Project name (also first argument)
--description <text>            # Project description
--author <name>                 # Project author
--license <type>                # License type (MIT, Apache-2.0, etc.)

# Environment
--package-manager <pm>          # npm, yarn, pnpm, or bun
--node-version <version>        # Node.js version (18, 20, etc.)
--directory <path>              # Target directory

# Template Selection
--template <name>               # Use predefined template
                                # Options: minimal, saas, api-only, full

# Behavior
--yes, -y                       # Accept all defaults
--dry-run                       # Preview without creating
--skip-install                  # Don't run npm install
--skip-git                      # Don't initialize git
--force                         # Overwrite existing directory
```

#### Feature Selection Flags

```bash
# Core Features (automatically included)
--typescript                    # TypeScript support (always on)
--typescript-strict             # Enable strict mode
--turborepo                    # Turborepo (always on)

# Feature Plugins
--features <list>              # Space-separated list of features
--orpc                         # Add ORPC type-safe API
--better-auth                  # Add Better Auth
--database                     # Add PostgreSQL + Drizzle
--redis                        # Add Redis caching
--job-queue                    # Add Bull job queue
--event-system                 # Add event bus
--file-upload                  # Add file upload
--email                        # Add email service
--webhooks                     # Add webhook system
--search                       # Add full-text search
--i18n                         # Add internationalization

# Infrastructure
--docker                       # Add Docker setup
--ci-cd                        # Add CI/CD pipelines
--monitoring                   # Add monitoring (Sentry)
--testing                      # Add testing setup

# UI Plugins
--shadcn-ui                    # Add Shadcn UI components
--tailwind                     # Add Tailwind CSS
--theme                        # Add theme system

# Integration Plugins
--stripe                       # Add Stripe integration
--analytics                    # Add analytics
--seo                          # Add SEO optimization
```

#### Configuration Flags

```bash
# API Configuration
--api-port <port>              # API server port (default: 3001)
--api-host <host>              # API server host
--api-cors-origins <urls>      # CORS origins (comma-separated)

# Web Configuration
--web-port <port>              # Web server port (default: 3000)
--web-host <host>              # Web server host

# Database Configuration
--db-type <type>               # postgres, mysql, sqlite
--db-host <host>               # Database host
--db-port <port>               # Database port
--db-name <name>               # Database name

# Redis Configuration
--redis-host <host>            # Redis host
--redis-port <port>            # Redis port

# Better Auth Configuration
--auth-providers <list>        # Auth providers (comma-separated)
                               # Options: credentials,google,github,microsoft
--auth-session-expiry <time>   # Session expiry (e.g., 7d, 24h)
--auth-mfa                     # Enable MFA
--auth-email-verification      # Enable email verification

# ORPC Configuration
--orpc-openapi                 # Enable OpenAPI generation
--orpc-validation              # Enable validation

# Docker Configuration
--docker-node-version <ver>    # Node version in Docker
--docker-include-redis         # Include Redis in Docker
--docker-include-postgres      # Include Postgres in Docker

# File Upload Configuration
--upload-storage <type>        # local, s3, r2
--upload-max-size <bytes>      # Max file size

# Email Configuration
--email-provider <provider>    # smtp, sendgrid, resend, mailgun
--email-from <address>         # Default sender email
```

### Complete CLI Examples

#### Example 1: Minimal SaaS with CLI

```bash
stratum init my-saas \
  --template minimal \
  --features orpc better-auth database \
  --package-manager bun \
  --auth-providers credentials,google \
  --yes
```

#### Example 2: Full-Featured SaaS with CLI

```bash
stratum init advanced-saas \
  --features orpc better-auth database redis job-queue email file-upload \
  --features shadcn-ui tailwind theme \
  --features docker ci-cd monitoring \
  --package-manager bun \
  --typescript-strict \
  --auth-providers credentials,google,github \
  --auth-mfa \
  --db-type postgres \
  --upload-storage s3 \
  --email-provider resend \
  --api-port 3001 \
  --web-port 3000
```

#### Example 3: API-Only Backend with CLI

```bash
stratum init api-service \
  --features orpc better-auth database redis job-queue \
  --features docker monitoring testing \
  --package-manager bun \
  --db-type postgres \
  --api-port 3001 \
  --skip-web
```

#### Example 4: Microservices Architecture with CLI

```bash
stratum init microservices \
  --template monorepo \
  --features orpc database redis event-system docker \
  --package-manager bun \
  --multiple-services user-service,payment-service,notification-service
```

### CLI Configuration File

For complex configurations, use a configuration file:

```bash
# Create config file: stratum.config.json
{
  "project": {
    "name": "my-saas",
    "description": "Advanced SaaS Platform",
    "author": "John Doe",
    "license": "MIT"
  },
  "environment": {
    "packageManager": "bun",
    "nodeVersion": "20"
  },
  "features": [
    "orpc",
    "better-auth",
    "database",
    "redis",
    "job-queue",
    "email",
    "file-upload",
    "shadcn-ui",
    "docker"
  ],
  "config": {
    "api": {
      "port": 3001,
      "cors": {
        "origins": ["https://myapp.com"]
      }
    },
    "betterAuth": {
      "providers": ["credentials", "google", "github"],
      "enableMFA": true,
      "sessionExpiry": "30d"
    },
    "fileUpload": {
      "storage": "s3",
      "maxSize": 10485760
    }
  }
}

# Use config file
stratum init --config stratum.config.json
```

### CLI Command Generation

Generate CLI commands from configurations:

```bash
# Export current config as CLI command
stratum config export --format cli

# Output:
stratum init my-project \
  --features orpc better-auth database \
  --package-manager bun \
  --auth-providers credentials,google \
  --api-port 3001
```

---

## Web-Based Configuration Interface

### Overview

The Stratum Builder Web Interface provides a visual, user-friendly way to configure projects. It's perfect for users who:
- Prefer graphical interfaces
- Want to explore available features visually
- Need to share configurations with team members
- Want to save and reuse configurations

### Accessing the Web Interface

```bash
# Start the configuration web app
stratum ui

# Or access the hosted version
# https://builder.stratum.dev
```

### Web Interface Features

#### 1. **Visual Project Setup**

**Step 1: Project Information**
```
┌─────────────────────────────────────────────┐
│  🎯 Create New Project                      │
├─────────────────────────────────────────────┤
│                                             │
│  Project Name:                              │
│  [my-awesome-saas________________]          │
│                                             │
│  Description:                               │
│  [Production-ready SaaS platform_]          │
│                                             │
│  Author:                                    │
│  [John Doe_____________________]            │
│                                             │
│  License:        Package Manager:           │
│  [MIT ▼]        [bun ▼]                    │
│                                             │
│           [Next: Select Template →]         │
└─────────────────────────────────────────────┘
```

**Step 2: Template Selection**
```
┌─────────────────────────────────────────────┐
│  📦 Choose a Template                        │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Minimal  │  │   SaaS   │  │ API Only │ │
│  │   🎯    │  │    🚀    │  │    ⚙️    │ │
│  │          │  │  ⭐ Most │  │          │ │
│  │ Basic    │  │  Popular │  │ Backend  │ │
│  │ starter  │  │          │  │   only   │ │
│  └──────────┘  └──────────┘  └──────────┘ │
│                                             │
│  ┌──────────┐  ┌──────────┐                │
│  │   Full   │  │  Custom  │                │
│  │    💎    │  │    🛠️    │                │
│  │          │  │          │                │
│  │ All      │  │ Choose   │                │
│  │ features │  │ features │                │
│  └──────────┘  └──────────┘                │
│                                             │
│  [← Back]          [Next: Features →]      │
└─────────────────────────────────────────────┘
```

**Step 3: Feature Selection (Visual Grid)**
```
┌─────────────────────────────────────────────────────────┐
│  ✨ Select Features                                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Core Features (Required)                                │
│  ─────────────────────────────────────────────          │
│  [✓] Base Template      [✓] TypeScript                  │
│  [✓] Turborepo                                          │
│                                                          │
│  🔌 Feature Plugins                                      │
│  ─────────────────────────────────────────────          │
│  [ ] ORPC               [ ] Better Auth                  │
│      Type-safe API           Authentication              │
│      Dependencies: TS        Dependencies: DB            │
│                                                          │
│  [ ] Database           [ ] Redis                        │
│      PostgreSQL + Drizzle    Caching Layer              │
│      Dependencies: TS        Dependencies: None          │
│                                                          │
│  [ ] Job Queue          [ ] Event System                 │
│      Bull Queues             Event Bus                   │
│      Dependencies: Redis     Dependencies: None          │
│                                                          │
│  [ ] File Upload        [ ] Email Service                │
│      S3/Local Storage        SMTP/Providers             │
│      Dependencies: None      Dependencies: None          │
│                                                          │
│  🏗️ Infrastructure                                       │
│  ─────────────────────────────────────────────          │
│  [ ] Docker             [ ] CI/CD                        │
│  [ ] Monitoring         [ ] Testing                      │
│                                                          │
│  🎨 UI & Design                                          │
│  ─────────────────────────────────────────────          │
│  [ ] Shadcn UI          [ ] Tailwind CSS                 │
│  [ ] Theme System                                        │
│                                                          │
│  Selected: 3 features | Dependencies: Auto-resolved     │
│                                                          │
│  [← Back]      [View Dependencies]  [Next: Configure →] │
└─────────────────────────────────────────────────────────┘
```

**Step 4: Dependency Visualization**
```
┌─────────────────────────────────────────────┐
│  🔗 Dependency Tree                          │
├─────────────────────────────────────────────┤
│                                             │
│  Your Selection:                            │
│  • Better Auth                              │
│  • ORPC                                     │
│  • Redis                                    │
│                                             │
│  Will Install:                              │
│  └── Base Template (required)               │
│      ├── TypeScript (required)              │
│      └── Turborepo (required)               │
│  └── Better Auth (selected)                 │
│      └── Database (auto-added)              │
│  └── ORPC (selected)                        │
│  └── Redis (selected)                       │
│                                             │
│  Optional Dependencies Detected:            │
│  [ ] Email - Recommended for Better Auth    │
│                                             │
│  Total plugins: 7                           │
│                                             │
│  [← Back]          [Next: Configure →]      │
└─────────────────────────────────────────────┘
```

**Step 5: Plugin Configuration**
```
┌─────────────────────────────────────────────┐
│  ⚙️ Configure Features                       │
├─────────────────────────────────────────────┤
│                                             │
│  📦 Better Auth Configuration                │
│  ─────────────────────────────────────      │
│  Authentication Providers:                  │
│  [✓] Email/Password                         │
│  [✓] Google OAuth                           │
│  [ ] GitHub OAuth                           │
│  [ ] Microsoft OAuth                        │
│                                             │
│  Session Expiry:                            │
│  [7d ▼] (7 days, 30 days, 90 days)        │
│                                             │
│  [✓] Enable email verification              │
│  [ ] Enable multi-factor authentication     │
│                                             │
│  📦 Database Configuration                   │
│  ─────────────────────────────────────      │
│  Database Type: [PostgreSQL ▼]             │
│  Host: [localhost____________]              │
│  Port: [5432____]                           │
│                                             │
│  📦 API Configuration                        │
│  ─────────────────────────────────────      │
│  Port: [3001____]                           │
│  CORS Origins:                              │
│  [http://localhost:3000_________]           │
│                                             │
│  [← Back]       [Preview Command →]        │
└─────────────────────────────────────────────┘
```

**Step 6: Command Preview & Generation**
```
┌─────────────────────────────────────────────────────────┐
│  🚀 Ready to Generate                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Your configuration is ready! Here's the CLI command:    │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ stratum init my-awesome-saas \                     │ │
│  │   --features orpc better-auth database redis \    │ │
│  │   --package-manager bun \                          │ │
│  │   --auth-providers credentials,google \            │ │
│  │   --auth-session-expiry 7d \                       │ │
│  │   --db-type postgres \                             │ │
│  │   --api-port 3001                                  │ │
│  │                                                    │ │
│  │ [📋 Copy Command]                                  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Options:                                                │
│  • [💾 Save Configuration] - Save as JSON               │
│  • [📤 Share Configuration] - Get shareable link        │
│  • [⚡ Generate Now] - Create project directly          │
│                                                          │
│  [← Back]              [Generate Project →]             │
└─────────────────────────────────────────────────────────┘
```

### Web Interface Implementation

#### Technology Stack

```typescript
// Web Interface Tech Stack
{
  "framework": "Next.js 15",
  "ui": "Shadcn UI + Tailwind CSS",
  "state": "Zustand",
  "forms": "React Hook Form + Zod",
  "api": "tRPC/ORPC",
  "deployment": "Vercel/Netlify"
}
```

#### Core Components

```typescript
// app/page.tsx - Main configuration wizard
export default function ConfigurationWizard() {
  return (
    <StepperProvider>
      <ConfigurationStepper>
        <Step1_ProjectInfo />
        <Step2_TemplateSelection />
        <Step3_FeatureSelection />
        <Step4_DependencyView />
        <Step5_PluginConfiguration />
        <Step6_CommandGeneration />
      </ConfigurationStepper>
    </StepperProvider>
  );
}

// components/FeatureCard.tsx
interface FeatureCardProps {
  feature: Plugin;
  selected: boolean;
  onToggle: () => void;
}

export function FeatureCard({ feature, selected, onToggle }: FeatureCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all",
        selected && "ring-2 ring-primary"
      )}
      onClick={onToggle}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{feature.name}</CardTitle>
          {selected && <CheckIcon className="h-5 w-5 text-primary" />}
        </div>
        <CardDescription>{feature.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Dependencies:</span>
            {feature.dependencies.length > 0 
              ? feature.dependencies.join(', ')
              : 'None'
            }
          </div>
          {feature.optionalDependencies && (
            <div className="text-muted-foreground">
              <span className="font-medium">Optional:</span>
              {feature.optionalDependencies.join(', ')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// components/DependencyGraph.tsx
export function DependencyGraph({ plugins }: { plugins: Plugin[] }) {
  // Visual dependency tree using React Flow or D3.js
  return (
    <div className="w-full h-96">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      />
    </div>
  );
}

// components/CommandGenerator.tsx
export function CommandGenerator({ config }: { config: Configuration }) {
  const command = generateCommand(config);
  
  return (
    <div className="space-y-4">
      <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
        <code>{command}</code>
      </pre>
      
      <div className="flex gap-2">
        <Button onClick={() => copyToClipboard(command)}>
          <CopyIcon /> Copy Command
        </Button>
        <Button variant="outline" onClick={() => saveConfig(config)}>
          <SaveIcon /> Save Config
        </Button>
        <Button variant="outline" onClick={() => shareConfig(config)}>
          <ShareIcon /> Share
        </Button>
      </div>
    </div>
  );
}
```

### API Integration

```typescript
// app/api/generate/route.ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const config = await req.json();
  
  // Validate configuration
  const validation = await validateConfiguration(config);
  if (!validation.valid) {
    return Response.json(
      { error: validation.errors },
      { status: 400 }
    );
  }
  
  // Generate CLI command
  const command = generateCliCommand(config);
  
  // Optionally: Generate project server-side
  if (config.generateNow) {
    await executeBuilder(command);
  }
  
  return Response.json({
    command,
    config,
    downloadUrl: config.generateNow ? '/download/project.zip' : null
  });
}

// lib/command-generator.ts
export function generateCliCommand(config: Configuration): string {
  const parts = ['stratum init', config.project.name];
  
  // Add features
  if (config.features.length > 0) {
    parts.push(`--features ${config.features.join(' ')}`);
  }
  
  // Add package manager
  parts.push(`--package-manager ${config.environment.packageManager}`);
  
  // Add plugin configurations
  for (const [pluginId, pluginConfig] of Object.entries(config.plugins)) {
    const plugin = getPlugin(pluginId);
    const flags = generatePluginFlags(plugin, pluginConfig);
    parts.push(...flags);
  }
  
  return parts.join(' \\\n  ');
}

function generatePluginFlags(plugin: Plugin, config: any): string[] {
  const flags: string[] = [];
  
  // Better Auth example
  if (plugin.id === 'better-auth') {
    if (config.providers) {
      flags.push(`--auth-providers ${config.providers.join(',')}`);
    }
    if (config.sessionExpiry) {
      flags.push(`--auth-session-expiry ${config.sessionExpiry}`);
    }
    if (config.enableMFA) {
      flags.push('--auth-mfa');
    }
  }
  
  // Database example
  if (plugin.id === 'database') {
    flags.push(`--db-type ${config.type}`);
    flags.push(`--db-host ${config.host}`);
    flags.push(`--db-port ${config.port}`);
  }
  
  return flags;
}
```

### Configuration Sharing

```typescript
// Share configuration via URL
export function shareConfiguration(config: Configuration): string {
  // Encode config as base64
  const encoded = btoa(JSON.stringify(config));
  
  // Generate shareable URL
  const url = `https://builder.stratum.dev/config/${encoded}`;
  
  // Or use short URL service
  const shortUrl = await createShortUrl(url);
  
  return shortUrl;
}

// Load configuration from URL
export function loadSharedConfiguration(encoded: string): Configuration {
  const decoded = atob(encoded);
  return JSON.parse(decoded);
}

// Example URL:
// https://builder.stratum.dev/config/eyJwcm9qZWN0Ijp7...
```

### Configuration Templates

The web interface includes predefined templates:

```typescript
// lib/templates.ts
export const templates = {
  minimal: {
    name: 'Minimal SaaS',
    description: 'Basic SaaS starter',
    features: ['orpc', 'better-auth', 'database'],
    config: {
      betterAuth: {
        providers: ['credentials']
      }
    }
  },
  
  saas: {
    name: 'Full SaaS',
    description: 'Complete SaaS platform',
    features: [
      'orpc',
      'better-auth',
      'database',
      'redis',
      'job-queue',
      'email',
      'file-upload',
      'shadcn-ui',
      'docker'
    ],
    config: {
      betterAuth: {
        providers: ['credentials', 'google'],
        enableMFA: true
      },
      fileUpload: {
        storage: 's3'
      }
    }
  },
  
  apiOnly: {
    name: 'API Only',
    description: 'Backend service',
    features: [
      'orpc',
      'better-auth',
      'database',
      'redis',
      'job-queue',
      'docker'
    ],
    skipWeb: true
  }
};
```

## Configuration Export & Import

### Export Options

Both CLI and web interface support configuration export:

```bash
# CLI: Export current config
stratum config export --format json > my-config.json
stratum config export --format yaml > my-config.yaml
stratum config export --format cli > my-config.sh

# Web: Download button provides all formats
```

### Import Configuration

```bash
# CLI: Import from file
stratum init --config my-config.json

# Web: Upload button or paste JSON
```

### Configuration Schema

```json
{
  "$schema": "https://stratum.dev/schema/v1/config.json",
  "version": "1.0.0",
  "project": {
    "name": "my-saas",
    "description": "My SaaS Application",
    "author": "John Doe",
    "license": "MIT"
  },
  "environment": {
    "packageManager": "bun",
    "nodeVersion": "20"
  },
  "features": [
    "orpc",
    "better-auth",
    "database",
    "redis"
  ],
  "plugins": {
    "betterAuth": {
      "providers": ["credentials", "google"],
      "sessionExpiry": "7d",
      "enableMFA": false
    },
    "database": {
      "type": "postgres",
      "host": "localhost",
      "port": 5432
    },
    "orpc": {
      "enableOpenAPI": true
    }
  },
  "config": {
    "api": {
      "port": 3001
    },
    "web": {
      "port": 3000
    }
  }
}
```

## Comparison: CLI vs Web Interface

| Feature | CLI | Web Interface |
|---------|-----|---------------|
| **Speed** | ⚡ Instant | 🐢 Slower (UI navigation) |
| **Automation** | ✅ Scriptable | ❌ Not scriptable |
| **User Experience** | 👨‍💻 Dev-friendly | 👥 User-friendly |
| **Discovery** | 📝 Need docs | 🔍 Visual exploration |
| **Configuration** | ⌨️ Typing flags | 🖱️ Click & select |
| **Sharing** | 📄 Copy command | 🔗 Share URL |
| **Validation** | ✅ Immediate | ✅ Real-time |
| **Dependencies** | ✅ Auto-resolved | 👁️ Visual tree |

## Best Practices

### When to Use CLI

- ✅ Automation and scripting
- ✅ CI/CD pipelines
- ✅ Quick project creation
- ✅ You know exactly what you want
- ✅ Terminal-first workflow

### When to Use Web Interface

- ✅ First-time users
- ✅ Exploring available features
- ✅ Complex configurations
- ✅ Sharing with non-technical team
- ✅ Visual dependency management

### Hybrid Workflow

Best of both worlds:

1. **Configure in Web**: Use visual interface to explore and configure
2. **Copy Command**: Get the generated CLI command
3. **Automate**: Use command in scripts/CI/CD
4. **Share**: Send URL to team members

## Integration with IDEs

### VS Code Extension

```typescript
// VS Code extension to launch web interface
{
  "command": "stratum.openBuilder",
  "title": "Stratum: Open Project Builder"
}

// Or use CLI directly
{
  "command": "stratum.initProject",
  "title": "Stratum: Initialize Project"
}
```

### JetBrains Plugin

Similar integration for WebStorm, IntelliJ IDEA, etc.

## Next Steps

- Review [CLI Interface](./04-CLI-INTERFACE.md) for detailed CLI documentation
- Study [Configuration](./06-CONFIGURATION.md) for config file structure
- Explore [Use Cases](./12-USE-CASES.md) for practical examples
- Read [Implementation Roadmap](./IMPLEMENTATION-ROADMAP.md) for development plan

---

*Flexible configuration interfaces ensure all users can create projects efficiently, whether they prefer CLI or GUI.*
