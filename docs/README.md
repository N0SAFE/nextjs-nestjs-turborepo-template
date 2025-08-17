# Documentation Home

Welcome to the documentation for this Next.js + NestJS monorepo template. This hub gives you a clear, consistent starting point and links to focused guides for each part of the stack.

> Use case this docs set is optimized for
>
> Docker-first SaaS app: develop locally with Docker, build end-to-end types with ORPC and declarative routing, and deploy to Render for production.
>
> Audience: Full‑stack developers starting a new project from this template.
>
> Out of scope: Non-Render cloud specifics, legacy CMS guides.

## How to use these docs

- Start with Overview and Quick Start if you're new
- Jump to Concepts to understand how core systems work
- Use Guides for day-to-day development and deployment
- Check Reference for commands, environment, and glossary

All docs follow the conventions in Docs Style Guide to stay consistent and avoid repetition.

## 🧭 Opinionated journey (recommended order)

1. Bootstrap your environment: ./GETTING-STARTED.md
2. Understand the system: ./ARCHITECTURE.md and ./TECH-STACK.md
3. Configure env via the template system: ./ENVIRONMENT-TEMPLATE-SYSTEM.md
4. Daily dev with Docker, routes, and ORPC: ./DEVELOPMENT-WORKFLOW.md and ./ORPC-TYPE-CONTRACTS.md
5. Build and test confidently: ./TESTING.md
6. Choose build strategy for prod: ./DOCKER-BUILD-STRATEGIES.md
7. Deploy to production:
	- Generic Docker Compose: ./PRODUCTION-DEPLOYMENT.md
	- Render PaaS: ./RENDER-DEPLOYMENT.md
8. Optional multi-project isolation on one machine: ./PROJECT-ISOLATION.md

You can still jump directly to any topic below.

## Overview

- Architecture overview: ./ARCHITECTURE.md
- Technology stack: ./TECH-STACK.md
- Getting started: ./GETTING-STARTED.md
- Development workflow: ./DEVELOPMENT-WORKFLOW.md

## Concepts (How it works)

- End-to-end types with ORPC: ./concepts/orpc.md
- Declarative routing in Next.js: ./concepts/declarative-routing.md
- Authentication with Better Auth: ./concepts/authentication.md
- Database with Drizzle ORM: ./concepts/database.md
- Monorepo with Turborepo: ./concepts/monorepo.md

## Guides (Do this)

- Testing: ./TESTING.md
- Production deployment: ./PRODUCTION-DEPLOYMENT.md
- Render deployment: ./RENDER-DEPLOYMENT.md
- Docker build strategies: ./DOCKER-BUILD-STRATEGIES.md
- Memory optimization (Docker): ./MEMORY-OPTIMIZATION.md
- Project isolation (multiple projects on one machine): ./PROJECT-ISOLATION.md

## Reference

- Environment template system: ./ENVIRONMENT-TEMPLATE-SYSTEM.md
- ORPC contracts (reference): ./ORPC-TYPE-CONTRACTS.md
- Docs style guide: ./STYLEGUIDE.md
- Glossary: ./GLOSSARY.md

## Archived/Legacy

The following historical documents are preserved for context but are not part of the active workflow:

- Docker migration summary (Directus → NestJS): ../DOCKER-MIGRATION-SUMMARY.md
- Testing implementation and success summaries: ./TESTING-IMPLEMENTATION-SUMMARY.md, ./TESTING-SUCCESS-SUMMARY.md

## Contributing to docs

Please follow ./STYLEGUIDE.md. When a topic already exists, link to it rather than duplicating content. If you must diverge, add only the delta and reference the primary source.
