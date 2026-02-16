📍 [Documentation Hub](./README.md) > Navigation

# Documentation Navigation Guide

> **Last Updated**: 2026-02-13

Use this page to quickly find the right documentation area.

## Directory map

```text
.docs/
├── README.md              Main hub (start here)
├── NAVIGATION.md          This guide
├── core-concepts/         Mandatory architecture/process rules
├── guides/                Task-driven how-to docs
├── features/              Feature/system deep dives
├── planning/              Plans and implementation roadmaps
├── reference/             Stable technical references
├── deprecated/            Historical/archived documents
└── bin/                   Documentation tooling scripts
```

## Quick paths by goal

- Set up project: [guides/GETTING-STARTED.md](./guides/GETTING-STARTED.md)
- Daily development: [guides/DEVELOPMENT-WORKFLOW.md](./guides/DEVELOPMENT-WORKFLOW.md)
- Understand architecture: [reference/ARCHITECTURE.md](./reference/ARCHITECTURE.md)
- Understand ORPC flow: [features/ORPC-TYPE-CONTRACTS.md](./features/ORPC-TYPE-CONTRACTS.md)
- Configure env: [features/ENVIRONMENT-TEMPLATE-SYSTEM.md](./features/ENVIRONMENT-TEMPLATE-SYSTEM.md)
- Deploy production: [guides/PRODUCTION-DEPLOYMENT.md](./guides/PRODUCTION-DEPLOYMENT.md)
- Deploy Render: [guides/RENDER-DEPLOYMENT.md](./guides/RENDER-DEPLOYMENT.md)

## Recommended onboarding

1. [README.md](./README.md)
2. [core-concepts/README.md](./core-concepts/README.md)
3. [guides/GETTING-STARTED.md](./guides/GETTING-STARTED.md)
4. [guides/DEVELOPMENT-WORKFLOW.md](./guides/DEVELOPMENT-WORKFLOW.md)

## Validation commands

From repository root:

```bash
bun run .docs/bin/check-doc-links.ts --file .docs/README.md --depth 2
bun run .docs/bin/check-doc-links.ts --file .docs/guides/README.md --depth 2
```

For visual structure mapping:

```bash
bun run .docs/bin/generate-doc-diagram.ts --start .docs/README.md --depth 2
```

## Note on `docs/`

The top-level `docs/` directory contains additional focused design notes. For operational guidance and canonical workflows, prefer `.docs/`.
