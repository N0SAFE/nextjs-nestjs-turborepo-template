# @repo/eject-customize

Framework-agnostic ejection and customization system for the Next.js + NestJS Turborepo template.

## Features

- **Eject**: Remove framework features and dependencies while maintaining core functionality
- **Customize**: Add custom modules and configurations
- **Framework Swapping**: Replace framework components with alternatives
- **Smart Dependency Analysis**: Understand impact before removing features
- **Recovery System**: Rollback capability with automatic backups

## Quick Start

```typescript
import { createEjectOrchestrator } from '@repo/eject-customize'

const orchestrator = createEjectOrchestrator({
  projectRoot: process.cwd(),
  features: ['authentication', 'ui-components'],
})

await orchestrator.eject()
```

## Architecture

```
src/
├── types/           # Type definitions and schemas
├── utils/           # Foundational utilities
├── eject/           # Ejection workflow
├── customize/       # Customization workflow
├── framework/       # Framework swapping
└── index.ts         # Main exports
```

## Documentation

See `.github/docs/eject-customize-*` for detailed feature documentation.
