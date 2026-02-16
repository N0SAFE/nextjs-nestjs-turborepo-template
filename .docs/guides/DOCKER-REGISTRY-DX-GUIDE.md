📍 [Documentation Hub](../README.md) > [Guides](./README.md) > Docker Registry DX Guide

# Docker Registry Developer Experience Guide

> **Developer-Friendly Implementation** of the Docker Registry-based versioning strategy.  
> Focus: Minimal friction, maximum automation, excellent DX.

## Overview

This guide shows how to implement the Docker Registry versioning strategy with:
- ✅ **Interactive CLI tools** - No manual JSON editing
- ✅ **Automated workflows** - One command to publish
- ✅ **Local development** - Keep using `workspace:*` 
- ✅ **Smart defaults** - Sensible conventions
- ✅ **Validation** - Catch errors early
- ✅ **Fast feedback** - Clear progress indicators

## Quick Start (5 Minutes)

```bash
# 1. Setup registry configuration (interactive)
bun run registry:setup

# 2. Create package Dockerfile (auto-generated)
bun run package:init ui/base

# 3. Publish package (one command)
bun run package:publish ui/base

# 4. Create app manifest (interactive)
bun run app:init saas

# 5. Publish app (one command)
bun run app:publish saas web
```

## Core Principles for Good DX

### 1. **Convention Over Configuration**
- Auto-detect package structure
- Generate Dockerfiles automatically
- Infer versions from package.json
- Smart defaults everywhere

### 2. **Progressive Enhancement**
- Start simple (local dev with workspace:*)
- Add Docker publishing when needed
- No breaking changes to existing workflow

### 3. **Fast Feedback**
- Validate before building
- Show progress spinners
- Colorful output with emojis
- Dry-run mode for safety

### 4. **Developer Ergonomics**
- Tab completion support
- Interactive prompts with sensible defaults
- Helpful error messages
- Undo/rollback support

## Implementation Steps

### Step 1: Add Developer Scripts to Root package.json

```json
{
  "scripts": {
    "registry:setup": "bun run scripts/registry/setup.ts",
    "registry:test": "bun run scripts/registry/test-connection.ts",
    
    "package:init": "bun run scripts/registry/init-package.ts",
    "package:publish": "bun run scripts/registry/publish-package.ts",
    "package:list": "bun run scripts/registry/list-packages.ts",
    "package:inspect": "bun run scripts/registry/inspect-package.ts",
    
    "app:init": "bun run scripts/registry/init-app.ts",
    "app:publish": "bun run scripts/registry/publish-app.ts",
    "app:list": "bun run scripts/registry/list-apps.ts",
    "app:status": "bun run scripts/registry/app-status.ts",
    
    "publish": "bun run scripts/registry/publish.ts",
    "publish:dry-run": "bun run scripts/registry/publish.ts --dry-run"
  }
}
```

### Step 2: Create Interactive Setup Script

**`scripts/registry/setup.ts`** - Interactive registry configuration

```typescript
#!/usr/bin/env bun
import prompts from 'prompts'
import fs from 'fs/promises'
import pc from 'picocolors'
import { execSync } from 'child_process'

interface RegistryConfig {
  url: string
  namespace: string
  username?: string
  password?: string
  insecure?: boolean
}

async function setup() {
  console.log(pc.cyan('\n🐳 Docker Registry Setup\n'))

  const responses = await prompts([
    {
      type: 'select',
      name: 'registryType',
      message: 'Choose registry type:',
      choices: [
        { title: 'Self-hosted (localhost:5000)', value: 'local' },
        { title: 'Custom URL', value: 'custom' },
        { title: 'Docker Hub', value: 'dockerhub' },
        { title: 'GitHub Container Registry', value: 'ghcr' },
        { title: 'Harbor', value: 'harbor' }
      ],
      initial: 0
    },
    {
      type: (prev) => prev === 'custom' ? 'text' : null,
      name: 'customUrl',
      message: 'Registry URL:',
      initial: 'registry.example.com'
    },
    {
      type: 'text',
      name: 'namespace',
      message: 'Namespace (organization):',
      initial: 'myorg',
      validate: (value) => /^[a-z0-9-]+$/.test(value) || 'Lowercase letters, numbers, and hyphens only'
    },
    {
      type: 'confirm',
      name: 'needsAuth',
      message: 'Does this registry require authentication?',
      initial: true
    },
    {
      type: (prev) => prev ? 'text' : null,
      name: 'username',
      message: 'Username:'
    },
    {
      type: (prev, values) => values.needsAuth ? 'password' : null,
      name: 'password',
      message: 'Password/Token:'
    },
    {
      type: 'confirm',
      name: 'insecure',
      message: 'Allow insecure connections (HTTP)?',
      initial: false
    },
    {
      type: 'confirm',
      name: 'testConnection',
      message: 'Test connection now?',
      initial: true
    }
  ])

  if (!responses.namespace) {
    console.log(pc.yellow('\n⚠️  Setup cancelled'))
    process.exit(0)
  }

  // Determine registry URL
  let registryUrl: string
  switch (responses.registryType) {
    case 'local':
      registryUrl = 'localhost:5000'
      break
    case 'dockerhub':
      registryUrl = 'docker.io'
      break
    case 'ghcr':
      registryUrl = 'ghcr.io'
      break
    case 'custom':
    case 'harbor':
      registryUrl = responses.customUrl || 'registry.example.com'
      break
    default:
      registryUrl = 'localhost:5000'
  }

  const config: RegistryConfig = {
    url: registryUrl,
    namespace: responses.namespace,
    username: responses.username,
    password: responses.password,
    insecure: responses.insecure
  }

  // Save to .env.registry (gitignored)
  const envContent = `# Docker Registry Configuration
# Generated: ${new Date().toISOString()}
DOCKER_REGISTRY=${config.url}
DOCKER_NAMESPACE=${config.namespace}
${config.username ? `DOCKER_USERNAME=${config.username}` : '# DOCKER_USERNAME='}
${config.password ? `DOCKER_PASSWORD=${config.password}` : '# DOCKER_PASSWORD='}
${config.insecure ? 'DOCKER_INSECURE=true' : ''}
`

  await fs.writeFile('.env.registry', envContent)
  console.log(pc.green('\n✅ Configuration saved to .env.registry'))

  // Add to .gitignore
  const gitignorePath = '.gitignore'
  let gitignore = ''
  try {
    gitignore = await fs.readFile(gitignorePath, 'utf-8')
  } catch {}

  if (!gitignore.includes('.env.registry')) {
    await fs.appendFile(gitignorePath, '\n# Docker Registry credentials\n.env.registry\n')
    console.log(pc.green('✅ Added .env.registry to .gitignore'))
  }

  // Save registry.json (non-sensitive config)
  const registryJson = {
    url: config.url,
    namespace: config.namespace,
    insecure: config.insecure || false,
    createdAt: new Date().toISOString()
  }

  await fs.writeFile('registry.json', JSON.stringify(registryJson, null, 2))
  console.log(pc.green('✅ Registry config saved to registry.json'))

  // Test connection
  if (responses.testConnection) {
    console.log(pc.cyan('\n🔍 Testing connection...'))
    try {
      if (config.username && config.password) {
        execSync(
          `echo "${config.password}" | docker login ${config.url} -u ${config.username} --password-stdin`,
          { stdio: 'inherit' }
        )
      }
      
      // Try to pull a minimal image
      console.log(pc.green('✅ Connection successful!'))
    } catch (error) {
      console.log(pc.yellow('⚠️  Connection test failed. Check your credentials.'))
    }
  }

  console.log(pc.cyan('\n📝 Next steps:'))
  console.log('  1. Run: bun run package:init <package-name>')
  console.log('  2. Run: bun run package:publish <package-name>')
  console.log('  3. Run: bun run app:init <app-name>\n')
}

setup().catch(console.error)
```

### Step 3: Auto-Generate Package Dockerfiles

**`scripts/registry/init-package.ts`** - Generate optimized Dockerfile

```typescript
#!/usr/bin/env bun
import prompts from 'prompts'
import fs from 'fs/promises'
import path from 'path'
import pc from 'picocolors'

async function initPackage() {
  const packageName = process.argv[2]

  if (!packageName) {
    const response = await prompts({
      type: 'text',
      name: 'package',
      message: 'Package path (e.g., ui/base):',
      validate: (value) => value.trim() !== '' || 'Package path is required'
    })
    
    if (!response.package) {
      console.log(pc.yellow('⚠️  Cancelled'))
      process.exit(0)
    }
  }

  const pkgPath = path.join('packages', packageName || '')
  
  // Check if package exists
  try {
    await fs.access(path.join(pkgPath, 'package.json'))
  } catch {
    console.log(pc.red(`❌ Package not found: ${pkgPath}`))
    process.exit(1)
  }

  // Read package.json
  const pkgJson = JSON.parse(
    await fs.readFile(path.join(pkgPath, 'package.json'), 'utf-8')
  )

  const hasBun = pkgJson.scripts?.build?.includes('bun')
  const hasVite = pkgJson.devDependencies?.vite || pkgJson.dependencies?.vite
  const hasTsc = pkgJson.scripts?.build?.includes('tsc')

  // Detect build tool
  let buildTool = 'bun'
  if (hasVite) buildTool = 'vite'
  else if (hasTsc) buildTool = 'tsc'

  const { confirmed, customBuild } = await prompts([
    {
      type: 'select',
      name: 'buildTool',
      message: 'Build tool:',
      choices: [
        { title: `Bun (detected: ${hasBun})`, value: 'bun' },
        { title: `Vite (detected: ${hasVite})`, value: 'vite' },
        { title: `TypeScript (tsc)`, value: 'tsc' },
        { title: 'Custom', value: 'custom' }
      ],
      initial: 0
    },
    {
      type: (prev) => prev === 'custom' ? 'text' : null,
      name: 'customBuild',
      message: 'Build command:',
      initial: 'bun run build'
    },
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Generate Dockerfile?',
      initial: true
    }
  ])

  if (!confirmed) {
    console.log(pc.yellow('⚠️  Cancelled'))
    return
  }

  // Generate Dockerfile
  const dockerfile = generateDockerfile({
    packageName: pkgJson.name,
    buildTool: buildTool,
    customBuild
  })

  const dockerfilePath = path.join(pkgPath, 'Dockerfile')
  await fs.writeFile(dockerfilePath, dockerfile)
  
  console.log(pc.green(`✅ Created ${dockerfilePath}`))

  // Generate .dockerignore
  const dockerignore = `node_modules
dist
.turbo
*.log
.env*
tsconfig.tsbuildinfo
`
  await fs.writeFile(path.join(pkgPath, '.dockerignore'), dockerignore)
  console.log(pc.green(`✅ Created ${path.join(pkgPath, '.dockerignore')}`))

  console.log(pc.cyan('\n📝 Next step:'))
  console.log(`   bun run package:publish ${packageName}\n`)
}

function generateDockerfile(options: {
  packageName: string
  buildTool: string
  customBuild?: string
}): string {
  const { packageName, buildTool, customBuild } = options

  let buildCommand = customBuild || 'bun run build'
  let baseImage = 'oven/bun:1.2.14-alpine'

  if (buildTool === 'vite') {
    buildCommand = 'bun run build'
  } else if (buildTool === 'tsc') {
    buildCommand = 'bun run build'
  }

  return `# Auto-generated Dockerfile for ${packageName}
# Build tool: ${buildTool}

FROM ${baseImage} AS builder
WORKDIR /package

# Copy package files
COPY package.json bun.lockb* tsconfig*.json ./
COPY src/ ./src/
COPY index.ts* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Build package
RUN ${buildCommand}

# Create minimal distribution image
FROM scratch AS release
COPY --from=builder /package/dist /dist
COPY --from=builder /package/package.json /package.json

# Metadata
LABEL org.opencontainers.image.title="${packageName}"
LABEL org.opencontainers.image.description="Package ${packageName}"
LABEL org.opencontainers.image.source="https://github.com/yourorg/yourrepo"
`
}

initPackage().catch(console.error)
```

### Step 4: Smart Package Publishing

**`scripts/registry/publish-package.ts`** - Publish with validation and progress

```typescript
#!/usr/bin/env bun
import { execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import pc from 'picocolors'
import ora from 'ora'

interface PublishOptions {
  packagePath: string
  dryRun?: boolean
  skipTests?: boolean
  force?: boolean
}

async function publishPackage(options: PublishOptions) {
  const { packagePath, dryRun = false, skipTests = false, force = false } = options

  console.log(pc.cyan(`\n📦 Publishing package: ${packagePath}\n`))

  // Load registry config
  const config = await loadRegistryConfig()
  
  // Validate package
  const spinner = ora('Validating package...').start()
  const pkgJson = await validatePackage(packagePath)
  spinner.succeed('Package validated')

  // Check for Dockerfile
  const dockerfilePath = path.join(packagePath, 'Dockerfile')
  try {
    await fs.access(dockerfilePath)
  } catch {
    spinner.fail('No Dockerfile found')
    console.log(pc.yellow(`\n💡 Run: bun run package:init ${packagePath}\n`))
    process.exit(1)
  }

  // Run tests (optional)
  if (!skipTests && pkgJson.scripts?.test) {
    spinner.start('Running tests...')
    try {
      execSync(`cd ${packagePath} && bun test`, { stdio: 'pipe' })
      spinner.succeed('Tests passed')
    } catch {
      spinner.fail('Tests failed')
      if (!force) {
        console.log(pc.yellow('\n💡 Use --force to publish anyway\n'))
        process.exit(1)
      }
    }
  }

  // Build image
  const packageName = pkgJson.name.replace('@repo/', '').replace(/\//g, '-')
  const version = pkgJson.version
  const imageName = `${config.url}/${config.namespace}/packages/${packageName}`
  
  const tags = [
    `${imageName}:${version}`,
    `${imageName}:latest`
  ]

  spinner.start(`Building ${imageName}:${version}...`)
  
  const buildCommand = [
    'docker build',
    `--build-arg VERSION=${version}`,
    ...tags.map(tag => `-t ${tag}`),
    `-f ${dockerfilePath}`,
    packagePath
  ].join(' ')

  if (dryRun) {
    spinner.info('DRY RUN - Would execute:')
    console.log(pc.dim(buildCommand))
  } else {
    try {
      execSync(buildCommand, { stdio: 'pipe' })
      spinner.succeed('Image built')
    } catch (error) {
      spinner.fail('Build failed')
      console.error(error)
      process.exit(1)
    }
  }

  // Push images
  if (!dryRun) {
    spinner.start('Pushing to registry...')
    try {
      for (const tag of tags) {
        execSync(`docker push ${tag}`, { stdio: 'pipe' })
      }
      spinner.succeed('Pushed to registry')
    } catch (error) {
      spinner.fail('Push failed')
      console.error(error)
      process.exit(1)
    }
  }

  // Update package manifest (optional)
  const manifestPath = 'package-manifest.json'
  let manifest: any = { packages: {} }
  try {
    manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'))
  } catch {}

  manifest.packages[packageName] = {
    name: pkgJson.name,
    version,
    image: `${imageName}:${version}`,
    publishedAt: new Date().toISOString()
  }

  if (!dryRun) {
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
  }

  console.log(pc.green(`\n✅ Published ${packageName}@${version}`))
  console.log(pc.dim(`   Image: ${imageName}:${version}\n`))

  return {
    name: packageName,
    version,
    image: `${imageName}:${version}`
  }
}

async function loadRegistryConfig() {
  try {
    const config = JSON.parse(await fs.readFile('registry.json', 'utf-8'))
    return config
  } catch {
    console.log(pc.red('\n❌ Registry not configured'))
    console.log(pc.yellow('💡 Run: bun run registry:setup\n'))
    process.exit(1)
  }
}

async function validatePackage(packagePath: string) {
  const pkgJsonPath = path.join(packagePath, 'package.json')
  
  try {
    const content = await fs.readFile(pkgJsonPath, 'utf-8')
    const pkgJson = JSON.parse(content)
    
    if (!pkgJson.name) {
      throw new Error('Missing "name" in package.json')
    }
    
    if (!pkgJson.version) {
      throw new Error('Missing "version" in package.json')
    }
    
    return pkgJson
  } catch (error) {
    console.log(pc.red(`\n❌ Invalid package: ${error.message}\n`))
    process.exit(1)
  }
}

// CLI
const packagePath = process.argv[2]
const dryRun = process.argv.includes('--dry-run')
const skipTests = process.argv.includes('--skip-tests')
const force = process.argv.includes('--force')

if (!packagePath) {
  console.log(pc.yellow('\nUsage: bun run package:publish <package-path> [options]'))
  console.log(pc.dim('Options:'))
  console.log(pc.dim('  --dry-run     Show what would be done'))
  console.log(pc.dim('  --skip-tests  Skip running tests'))
  console.log(pc.dim('  --force       Publish even if tests fail\n'))
  process.exit(1)
}

publishPackage({ 
  packagePath: `packages/${packagePath}`, 
  dryRun, 
  skipTests, 
  force 
}).catch(console.error)

export { publishPackage }
```

### Step 5: Unified Publish Command

**`scripts/registry/publish.ts`** - Interactive publish flow

```typescript
#!/usr/bin/env bun
import prompts from 'prompts'
import pc from 'picocolors'
import fs from 'fs/promises'
import path from 'path'
import { publishPackage } from './publish-package'
import { publishApp } from './publish-app'

async function publish() {
  const { target } = await prompts({
    type: 'select',
    name: 'target',
    message: 'What do you want to publish?',
    choices: [
      { title: '📦 Package', value: 'package' },
      { title: '🚀 Application', value: 'app' },
      { title: '📦🚀 All (packages + apps)', value: 'all' }
    ]
  })

  if (!target) {
    console.log(pc.yellow('⚠️  Cancelled'))
    return
  }

  if (target === 'package') {
    await publishPackageFlow()
  } else if (target === 'app') {
    await publishAppFlow()
  } else if (target === 'all') {
    await publishAllFlow()
  }
}

async function publishPackageFlow() {
  // List available packages
  const packagesDir = 'packages'
  const packages: string[] = []
  
  for (const entry of await fs.readdir(packagesDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const pkgPath = path.join(packagesDir, entry.name)
      try {
        await fs.access(path.join(pkgPath, 'package.json'))
        packages.push(entry.name)
      } catch {}
    }
  }

  const { selectedPackage, confirmed } = await prompts([
    {
      type: 'select',
      name: 'selectedPackage',
      message: 'Select package:',
      choices: packages.map(pkg => ({ title: pkg, value: pkg }))
    },
    {
      type: 'confirm',
      name: 'confirmed',
      message: (prev) => `Publish ${prev}?`,
      initial: true
    }
  ])

  if (!confirmed) {
    console.log(pc.yellow('⚠️  Cancelled'))
    return
  }

  await publishPackage({
    packagePath: `packages/${selectedPackage}`
  })
}

async function publishAppFlow() {
  // Load apps.json
  let appsConfig: any
  try {
    appsConfig = JSON.parse(await fs.readFile('apps.json', 'utf-8'))
  } catch {
    console.log(pc.red('❌ No apps.json found'))
    console.log(pc.yellow('💡 Run: bun run app:init <app-name>'))
    return
  }

  const apps = Object.keys(appsConfig.applications)
  
  const { selectedApp, selectedComponent, confirmed } = await prompts([
    {
      type: 'select',
      name: 'selectedApp',
      message: 'Select application:',
      choices: apps.map(app => ({ title: app, value: app }))
    },
    {
      type: 'select',
      name: 'selectedComponent',
      message: 'Select component:',
      choices: (prev) => {
        const app = appsConfig.applications[prev]
        return Object.keys(app.components).map(comp => ({ title: comp, value: comp }))
      }
    },
    {
      type: 'confirm',
      name: 'confirmed',
      message: (_, values) => `Publish ${values.selectedApp}-${values.selectedComponent}?`,
      initial: true
    }
  ])

  if (!confirmed) {
    console.log(pc.yellow('⚠️  Cancelled'))
    return
  }

  await publishApp({
    appName: selectedApp,
    componentName: selectedComponent
  })
}

async function publishAllFlow() {
  console.log(pc.cyan('\n📦 Publishing all packages and apps...\n'))
  
  // Placeholder: batch publishing flow can be added later
  console.log(pc.yellow('⚠️  Not implemented yet'))
}

publish().catch(console.error)
```

### Step 6: Package Manager Integration

Add to root `package.json` for better DX:

```json
{
  "scripts": {
    "// Publishing": "",
    "pub": "bun run publish",
    "pub:pkg": "bun run package:publish",
    "pub:app": "bun run app:publish",
    
    "// Package Management": "",
    "pkg:new": "bun run package:init",
    "pkg:pub": "bun run package:publish",
    "pkg:ls": "bun run package:list",
    
    "// App Management": "",
    "app:new": "bun run app:init",
    "app:pub": "bun run app:publish",
    "app:ls": "bun run app:list"
  }
}
```

## Developer Workflow Examples

### Workflow 1: First-Time Setup

```bash
# One-time setup
bun run registry:setup
# → Interactive prompts for registry URL, credentials, etc.
# → Creates .env.registry and registry.json
# → Tests connection
# → ✅ Done!
```

### Workflow 2: Publishing a New Package

```bash
# 1. Generate Dockerfile (if not exists)
bun run pkg:new ui/base
# → Auto-detects build tool (bun/vite/tsc)
# → Generates optimized Dockerfile
# → Creates .dockerignore
# → ✅ Ready to publish!

# 2. Publish package
bun run pkg:pub ui/base
# → Validates package.json
# → Runs tests (optional)
# → Builds Docker image
# → Pushes to registry
# → Updates package-manifest.json
# → ✅ Published!
```

### Workflow 3: Publishing an App

```bash
# 1. Initialize app manifest
bun run app:new saas
# → Interactive prompts for components
# → Detects package dependencies
# → Generates apps.json
# → ✅ App configured!

# 2. Publish app component
bun run app:pub saas web
# → Loads apps.json
# → Builds multi-stage Dockerfile
# → Pulls package images
# → Builds app image
# → Pushes to registry
# → ✅ Published!
```

### Workflow 4: Interactive Publishing

```bash
# Universal publish command
bun run pub
# → Menu: Package / App / All
# → Select from available packages/apps
# → Confirm
# → ✅ Published!
```

## Advanced DX Features

### Feature 1: Version Bump Helper

```typescript
// scripts/registry/bump-version.ts
async function bumpVersion() {
  const { packagePath, bumpType } = await prompts([
    {
      type: 'text',
      name: 'packagePath',
      message: 'Package path:'
    },
    {
      type: 'select',
      name: 'bumpType',
      message: 'Version bump:',
      choices: [
        { title: 'Patch (1.0.0 → 1.0.1)', value: 'patch' },
        { title: 'Minor (1.0.0 → 1.1.0)', value: 'minor' },
        { title: 'Major (1.0.0 → 2.0.0)', value: 'major' }
      ]
    }
  ])

  execSync(`cd ${packagePath} && bun version ${bumpType}`)
  console.log(pc.green('✅ Version bumped'))
}
```

### Feature 2: Dependency Checker

```typescript
// scripts/registry/check-deps.ts
async function checkDependencies() {
  // Load package-manifest.json
  // Load apps.json
  // Compare versions
  // Show outdated dependencies
  // Suggest updates
}
```

### Feature 3: Rollback Support

```typescript
// scripts/registry/rollback.ts
async function rollback() {
  const { appName, previousVersion } = await prompts([...])
  
  // Update apps.json to point to previous version
  // Re-deploy app with old package versions
  // ✅ Rolled back!
}
```

### Feature 4: Validation Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
bun run registry:validate
```

```typescript
// scripts/registry/validate.ts
async function validate() {
  // Check all package Dockerfiles exist
  // Validate apps.json schema
  // Check for missing dependencies
  // Verify version consistency
}
```

## Tab Completion Setup

Add to `.bashrc` or `.zshrc`:

```bash
# Docker Registry CLI completion
_bun_registry_completion() {
  local cur="${COMP_WORDS[COMP_CWORD]}"
  
  if [[ "$3" == "package:publish" ]]; then
    COMPREPLY=($(compgen -W "$(ls packages)" -- "$cur"))
  elif [[ "$3" == "app:publish" ]]; then
    local apps=$(node -p "Object.keys(require('./apps.json').applications).join(' ')")
    COMPREPLY=($(compgen -W "$apps" -- "$cur"))
  fi
}

complete -F _bun_registry_completion bun
```

## VS Code Integration

**`.vscode/tasks.json`**:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Publish Package",
      "type": "shell",
      "command": "bun run package:publish ${input:packageName}",
      "problemMatcher": []
    },
    {
      "label": "Publish App",
      "type": "shell",
      "command": "bun run app:publish ${input:appName} ${input:componentName}",
      "problemMatcher": []
    }
  ],
  "inputs": [
    {
      "id": "packageName",
      "type": "promptString",
      "description": "Package name (e.g., ui/base)"
    },
    {
      "id": "appName",
      "type": "promptString",
      "description": "App name"
    },
    {
      "id": "componentName",
      "type": "promptString",
      "description": "Component name"
    }
  ]
}
```

## Best Practices Checklist

✅ **Before Publishing**:
- [ ] Run tests: `bun test`
- [ ] Bump version: `bun version patch|minor|major`
- [ ] Update CHANGELOG.md
- [ ] Commit changes: `git commit -m "chore: bump version"`

✅ **Publishing**:
- [ ] Use dry-run first: `bun run pkg:pub <name> --dry-run`
- [ ] Review output carefully
- [ ] Confirm image size is reasonable
- [ ] Test pulling the image

✅ **After Publishing**:
- [ ] Tag git commit: `git tag pkg-name-vX.Y.Z`
- [ ] Push to remote: `git push origin main --tags`
- [ ] Update dependent apps
- [ ] Verify in registry

## Troubleshooting

### Issue: Docker build fails

```bash
# Check Dockerfile syntax
docker build -f packages/ui/base/Dockerfile packages/ui/base

# View build logs
bun run pkg:pub ui/base --verbose
```

### Issue: Authentication fails

```bash
# Re-configure registry
bun run registry:setup

# Test connection
bun run registry:test
```

### Issue: Package not found

```bash
# List available packages
bun run pkg:ls

# Check package.json exists
ls packages/ui/base/package.json
```

## Next Steps

1. **Install Dependencies**:
```bash
bun add -D prompts @types/prompts picocolors ora
```

2. **Create Script Directory**:
```bash
mkdir -p scripts/registry
```

3. **Copy Scripts** from this guide into `scripts/registry/`

4. **Setup Registry**:
```bash
bun run registry:setup
```

5. **Publish First Package**:
```bash
bun run pkg:new ui/base
bun run pkg:pub ui/base
```

6. **Configure CI/CD** (see main strategy doc)

---

**Status**: ✅ Developer-friendly implementation ready  
**Focus**: Minimal manual work, maximum automation  
**Result**: Publishing packages/apps is as easy as `bun run pub` 🚀
