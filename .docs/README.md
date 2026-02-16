# Documentation Hub

> **Last Updated**: 2026-02-13

Central entrypoint for project documentation.

This repository has two complementary documentation spaces:

- **`.docs/`**: canonical operational and architectural documentation
- **`docs/`**: supplemental deep-dive design notes and focused architecture writeups

## Recommended reading path

1. [Getting Started](./guides/GETTING-STARTED.md)
2. [Architecture](./reference/ARCHITECTURE.md)
3. [Tech Stack](./reference/TECH-STACK.md)
4. [Environment Template System](./features/ENVIRONMENT-TEMPLATE-SYSTEM.md)
5. [Development Workflow](./guides/DEVELOPMENT-WORKFLOW.md)
6. [ORPC Type Contracts](./features/ORPC-TYPE-CONTRACTS.md)
7. [Testing](./features/TESTING.md)
8. Deployment guides:
   - [Production Deployment](./guides/PRODUCTION-DEPLOYMENT.md)
   - [Render Deployment](./guides/RENDER-DEPLOYMENT.md)

## Main sections

### Core concepts (mandatory patterns)

- [Core Concepts Index](./core-concepts/README.md)

### Concepts (system explanations)

- [Concepts Index](./concepts/README.md)

### Guides (how-to)

- [Guides Index](./guides/README.md)
- [Getting Started](./guides/GETTING-STARTED.md)
- [Development Workflow](./guides/DEVELOPMENT-WORKFLOW.md)
- [Docker Build Strategies](./guides/DOCKER-BUILD-STRATEGIES.md)
- [Production Deployment](./guides/PRODUCTION-DEPLOYMENT.md)
- [Render Deployment](./guides/RENDER-DEPLOYMENT.md)

### Features (system-focused)

- [Features Index](./features/README.md)
- [ORPC Type-Safe Contracts](./features/ORPC-TYPE-CONTRACTS.md)
- [Testing](./features/TESTING.md)
- [Environment Template System](./features/ENVIRONMENT-TEMPLATE-SYSTEM.md)
- [Copilot Setup](./features/COPILOT-SETUP.md)

### Reference

- [Reference Index](./reference/README.md)
- [Canonical Paths & Imports](./reference/CANONICAL-PATHS-AND-IMPORTS.md)
- [Architecture](./reference/ARCHITECTURE.md)
- [Tech Stack](./reference/TECH-STACK.md)
- [Glossary](./reference/GLOSSARY.md)

### Planning

- [Planning Index](./planning/README.md)

### Deprecated / historical

- [Deprecated Index](./deprecated/README.md)

## Documentation quality rules

- Keep one primary source per topic
- Link instead of duplicating
- Ensure command examples match `package.json` scripts
- Keep relative links valid
- Update index files when adding new docs

For style conventions, see [STYLEGUIDE.md](./STYLEGUIDE.md).
