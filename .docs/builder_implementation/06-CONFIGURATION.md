# Configuration System

📍 [Documentation Hub](../README.md) > [Builder Implementation](./README.md) > Configuration

## Overview

The Stratum Builder uses a multi-layered configuration system that allows customization at global, project, and plugin levels. This document explains how configuration works, where it's stored, and how to customize it.

## Configuration Layers

```
┌─────────────────────────────────────┐
│  Global Configuration               │  ~/.stratum/config.json
│  (User preferences)                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Project Configuration              │  .stratum.json
│  (Project-specific settings)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Plugin Configuration               │  plugins.config.js
│  (Plugin-specific overrides)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Environment Variables              │  .env
│  (Runtime configuration)            │
└─────────────────────────────────────┘
```

Configuration is merged in order: Global → Project → Plugin → Environment

## Global Configuration

### Location

`~/.stratum/config.json` (User home directory)

### Structure

```json
{
  "version": "1.0.0",
  "preferences": {
    "packageManager": "bun",
    "editor": "vscode",
    "defaultTemplate": "saas",
    "autoUpdate": true
  },
  "telemetry": {
    "enabled": true,
    "anonymousId": "uuid"
  },
  "cache": {
    "enabled": true,
    "directory": "~/.stratum/cache",
    "ttl": 86400
  },
  "plugins": {
    "registry": "https://registry.stratum.dev",
    "autoInstall": false,
    "checkUpdates": true
  },
  "ui": {
    "theme": "auto",
    "progressBar": true,
    "emojis": true
  }
}
```

### Management Commands

```bash
# Get global config value
stratum config global get preferences.packageManager

# Set global config value
stratum config global set preferences.packageManager bun

# List all global config
stratum config global list

# Reset to defaults
stratum config global reset

# Edit in editor
stratum config global edit
```

## Project Configuration

### Location

`.stratum.json` (Project root)

### Structure

```json
{
  "version": "1.0.0",
  "builder": {
    "version": "1.0.0",
    "minVersion": "1.0.0"
  },
  "project": {
    "name": "my-app",
    "description": "My awesome SaaS application",
    "author": "John Doe",
    "license": "MIT",
    "created": "2024-01-15T10:00:00Z",
    "lastModified": "2024-01-20T15:30:00Z"
  },
  "environment": {
    "packageManager": "bun",
    "nodeVersion": "20.x",
    "bunVersion": "1.3.1"
  },
  "plugins": {
    "base": {
      "version": "1.0.0",
      "installed": "2024-01-15T10:00:00Z"
    },
    "orpc": {
      "version": "1.2.0",
      "installed": "2024-01-15T10:00:00Z",
      "updated": "2024-01-20T15:30:00Z",
      "config": {
        "enableOpenAPI": true,
        "enableValidation": true,
        "clientPort": 3001
      }
    },
    "better-auth": {
      "version": "1.0.0",
      "installed": "2024-01-15T10:00:00Z",
      "config": {
        "providers": ["credentials", "google", "github"],
        "sessionExpiry": "7d",
        "enableMFA": false,
        "enableEmailVerification": true
      }
    },
    "database": {
      "version": "1.0.0",
      "installed": "2024-01-15T10:00:00Z",
      "config": {
        "type": "postgres",
        "host": "localhost",
        "port": 5432,
        "migrations": true
      }
    }
  },
  "config": {
    "api": {
      "port": 3001,
      "host": "localhost",
      "cors": {
        "enabled": true,
        "origins": ["http://localhost:3000"]
      }
    },
    "web": {
      "port": 3000,
      "host": "localhost"
    }
  },
  "scripts": {
    "dev": "stratum dev",
    "build": "stratum build",
    "test": "stratum test"
  },
  "custom": {
    "deployment": {
      "platform": "render",
      "autoDeployment": true
    }
  }
}
```

### Management Commands

```bash
# Get project config value
stratum config get api.port

# Set project config value
stratum config set api.port 3002

# Update plugin config
stratum config set plugins.orpc.config.enableOpenAPI false

# List all project config
stratum config list

# Validate configuration
stratum config validate

# Export configuration
stratum config export > config-backup.json

# Import configuration
stratum config import config-backup.json
```

## Plugin Configuration

### Static Configuration

Defined in plugin metadata:

```typescript
// plugins/better-auth/index.ts
export const betterAuthPlugin: Plugin = {
  id: 'better-auth',
  name: 'Better Auth',
  
  // Default configuration
  config: {
    providers: ['credentials'],
    sessionExpiry: '7d',
    enableMFA: false,
    enableEmailVerification: true,
    enableSocialLogin: true,
    jwtSecret: '${JWT_SECRET}',
    cookie: {
      name: 'auth_token',
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    }
  },
  
  // Configuration schema (for validation)
  configSchema: z.object({
    providers: z.array(z.enum([
      'credentials',
      'google',
      'github',
      'microsoft',
      'facebook'
    ])),
    sessionExpiry: z.string(),
    enableMFA: z.boolean(),
    enableEmailVerification: z.boolean(),
    jwtSecret: z.string().min(32)
  })
};
```

### Dynamic Configuration

Interactive prompts during installation:

```typescript
// plugins/better-auth/configure.ts
export async function configure(context: PluginContext) {
  const answers = await prompts([
    {
      type: 'multiselect',
      name: 'providers',
      message: 'Select authentication providers:',
      choices: [
        { title: 'Email/Password', value: 'credentials', selected: true },
        { title: 'Google OAuth', value: 'google' },
        { title: 'GitHub OAuth', value: 'github' },
        { title: 'Microsoft OAuth', value: 'microsoft' }
      ],
      hint: 'Space to select, Enter to confirm'
    },
    {
      type: 'text',
      name: 'sessionExpiry',
      message: 'Session expiry duration:',
      initial: '7d',
      validate: value => {
        return /^\d+[smhdw]$/.test(value) || 'Invalid duration format (e.g., 7d, 24h)';
      }
    },
    {
      type: 'confirm',
      name: 'enableMFA',
      message: 'Enable multi-factor authentication?',
      initial: false
    },
    {
      type: prev => prev ? 'multiselect' : null,
      name: 'mfaMethods',
      message: 'Select MFA methods:',
      choices: [
        { title: 'TOTP (Authenticator App)', value: 'totp' },
        { title: 'SMS', value: 'sms' },
        { title: 'Email', value: 'email' }
      ]
    },
    {
      type: 'confirm',
      name: 'enableEmailVerification',
      message: 'Enable email verification?',
      initial: true
    }
  ]);
  
  return answers;
}
```

### Configuration Overrides

User can override plugin config in `.stratum.json`:

```json
{
  "plugins": {
    "better-auth": {
      "config": {
        "providers": ["credentials", "google"],
        "sessionExpiry": "30d",
        "enableMFA": true
      }
    }
  }
}
```

## Environment Variables

### .env Files

Environment-specific configuration:

```bash
# .env.example - Template for all environments
NODE_ENV=development

# API Configuration
API_PORT=3001
API_HOST=localhost
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/myapp

# Redis (if installed)
REDIS_URL=redis://localhost:6379

# Auth (if installed)
JWT_SECRET=your-secret-key-min-32-characters
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email (if installed)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=password

# Monitoring (if installed)
SENTRY_DSN=https://...
```

### Environment Variables Management

```typescript
// plugins/better-auth/env.ts
export const envVars: EnvVarDefinition[] = [
  {
    key: 'JWT_SECRET',
    description: 'Secret key for JWT token generation',
    required: true,
    validate: (value) => {
      if (value.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters');
      }
      return true;
    },
    generate: () => {
      // Auto-generate if not provided
      return crypto.randomBytes(32).toString('hex');
    }
  },
  {
    key: 'GOOGLE_CLIENT_ID',
    description: 'Google OAuth client ID',
    required: (config) => config.providers.includes('google'),
    link: 'https://console.cloud.google.com/apis/credentials'
  },
  {
    key: 'GOOGLE_CLIENT_SECRET',
    description: 'Google OAuth client secret',
    required: (config) => config.providers.includes('google')
  }
];
```

### Auto-generated .env

Builder can generate `.env` files:

```bash
# Generate .env from template
stratum env generate

# Validate .env against requirements
stratum env validate

# Show missing environment variables
stratum env check

# Sync .env.example with current plugins
stratum env sync
```

## Configuration Schema

### Validation

All configuration is validated against schemas:

```typescript
import { z } from 'zod';

// Global configuration schema
const globalConfigSchema = z.object({
  version: z.string(),
  preferences: z.object({
    packageManager: z.enum(['npm', 'yarn', 'pnpm', 'bun']),
    editor: z.enum(['vscode', 'vim', 'emacs', 'sublime']),
    defaultTemplate: z.string(),
    autoUpdate: z.boolean()
  }),
  telemetry: z.object({
    enabled: z.boolean(),
    anonymousId: z.string().uuid()
  }),
  cache: z.object({
    enabled: z.boolean(),
    directory: z.string(),
    ttl: z.number().positive()
  })
});

// Project configuration schema
const projectConfigSchema = z.object({
  version: z.string(),
  builder: z.object({
    version: z.string(),
    minVersion: z.string()
  }),
  project: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    author: z.string().optional(),
    license: z.string().optional()
  }),
  plugins: z.record(z.object({
    version: z.string(),
    installed: z.string().datetime(),
    config: z.record(z.any()).optional()
  }))
});

// Validate configuration
function validateConfig(config: unknown): boolean {
  try {
    projectConfigSchema.parse(config);
    return true;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    return false;
  }
}
```

## Configuration Migration

### Version Compatibility

Handle configuration from older builder versions:

```typescript
interface Migration {
  from: string;
  to: string;
  migrate: (config: any) => any;
}

const migrations: Migration[] = [
  {
    from: '0.9.x',
    to: '1.0.0',
    migrate: (config) => {
      // Rename fields
      if (config.auth) {
        config.plugins.betterAuth = {
          version: '1.0.0',
          config: config.auth
        };
        delete config.auth;
      }
      
      // Update structure
      config.version = '1.0.0';
      
      return config;
    }
  }
];

async function migrateConfig(config: any): Promise<any> {
  let migrated = config;
  
  for (const migration of migrations) {
    if (satisfies(config.version, migration.from)) {
      console.log(`Migrating from ${migration.from} to ${migration.to}...`);
      migrated = migration.migrate(migrated);
    }
  }
  
  return migrated;
}
```

## Advanced Configuration

### Conditional Configuration

Configuration based on environment:

```typescript
// .stratum.js (JavaScript config for dynamic values)
module.exports = {
  config: {
    api: {
      port: process.env.NODE_ENV === 'production' ? 80 : 3001,
      cors: {
        origins: process.env.NODE_ENV === 'production'
          ? [process.env.PUBLIC_URL]
          : ['http://localhost:3000']
      }
    }
  }
};
```

### Programmatic Configuration

Access configuration in code:

```typescript
import { StratumConfig } from '@stratum/builder';

// Load configuration
const config = await StratumConfig.load();

// Get values
const apiPort = config.get('api.port');
const hasAuth = config.hasPlugin('better-auth');

// Set values
config.set('api.port', 3002);
await config.save();

// Watch for changes
config.watch('api.port', (newValue, oldValue) => {
  console.log(`Port changed from ${oldValue} to ${newValue}`);
});
```

### Configuration Inheritance

Projects can extend base configurations:

```json
{
  "extends": "@stratum/config-saas",
  "plugins": {
    "better-auth": {
      "config": {
        "providers": ["credentials", "google"]
      }
    }
  }
}
```

## Configuration Best Practices

### 1. Use Environment Variables for Secrets

Never store secrets in `.stratum.json`:

```json
// ❌ Bad
{
  "plugins": {
    "better-auth": {
      "config": {
        "jwtSecret": "actual-secret-here"
      }
    }
  }
}

// ✅ Good
{
  "plugins": {
    "better-auth": {
      "config": {
        "jwtSecret": "${JWT_SECRET}"
      }
    }
  }
}
```

### 2. Document Configuration Options

Provide clear documentation:

```typescript
export const plugin = {
  config: {
    // Session expiry duration
    // Format: number + unit (s=seconds, m=minutes, h=hours, d=days)
    // Examples: '24h', '7d', '30d'
    // Default: '7d'
    sessionExpiry: '7d'
  }
};
```

### 3. Validate Early

Validate configuration at load time:

```typescript
const config = await loadConfig();
const validation = await validateConfig(config);

if (!validation.valid) {
  console.error('Configuration errors:');
  validation.errors.forEach(error => {
    console.error(`  - ${error.path}: ${error.message}`);
  });
  process.exit(1);
}
```

### 4. Provide Defaults

Always provide sensible defaults:

```typescript
const config = {
  api: {
    port: process.env.API_PORT || 3001,
    host: process.env.API_HOST || 'localhost'
  }
};
```

### 5. Version Configuration

Track configuration version for migrations:

```json
{
  "version": "1.0.0",
  "builder": {
    "version": "1.0.0",
    "minVersion": "0.9.0"
  }
}
```

## Configuration Examples

### Minimal SaaS Configuration

```json
{
  "version": "1.0.0",
  "project": {
    "name": "my-saas",
    "description": "Minimal SaaS application"
  },
  "plugins": {
    "base": { "version": "1.0.0" },
    "typescript": { "version": "1.0.0" },
    "orpc": { "version": "1.2.0" },
    "database": { "version": "1.0.0" },
    "better-auth": { "version": "1.0.0" }
  }
}
```

### Full-Featured SaaS Configuration

```json
{
  "version": "1.0.0",
  "project": {
    "name": "advanced-saas",
    "description": "Full-featured SaaS application"
  },
  "plugins": {
    "base": { "version": "1.0.0" },
    "typescript": { "version": "1.0.0" },
    "orpc": {
      "version": "1.2.0",
      "config": {
        "enableOpenAPI": true,
        "enableValidation": true
      }
    },
    "database": { "version": "1.0.0" },
    "redis": { "version": "1.0.0" },
    "better-auth": {
      "version": "1.0.0",
      "config": {
        "providers": ["credentials", "google", "github"],
        "enableMFA": true
      }
    },
    "job-queue": { "version": "1.0.0" },
    "email": { "version": "1.0.0" },
    "file-upload": {
      "version": "1.0.0",
      "config": {
        "storage": "s3",
        "maxSize": 10485760
      }
    },
    "docker": { "version": "1.0.0" },
    "ci-cd": { "version": "1.0.0" },
    "monitoring": { "version": "1.0.0" }
  },
  "config": {
    "api": {
      "port": 3001,
      "cors": {
        "origins": ["https://myapp.com"]
      }
    }
  }
}
```

## Next Steps

- Review [Dependency Resolution](./07-DEPENDENCY-RESOLUTION.md) for dependency management
- Study [Testing Strategy](./09-TESTING-STRATEGY.md) for testing configuration
- Read [Extension Guide](./11-EXTENSION-GUIDE.md) for plugin configuration

---

*Proper configuration management ensures consistent, maintainable projects.*
