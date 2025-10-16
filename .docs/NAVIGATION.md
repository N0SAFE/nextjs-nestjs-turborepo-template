# Documentation Navigation Guide

This guide helps you navigate the restructured documentation and find what you need.

## 📂 Directory Structure

```
docs/
├── README.md                    ← START HERE: Main entry point
├── NAVIGATION.md               ← You are here
├── core-concepts/              ← Foundational principles (READ FIRST)
├── guides/                      ← How-to documentation
├── features/                    ← Feature-specific documentation
├── planning/                    ← Planning and architecture
├── reference/                   ← Technical reference
└── deprecated/                  ← Archived documentation (don't use)
```

## 🚀 Getting Started

### For First-Time Users
1. Read [Main README](./README.md) - 5 minutes
2. Read [Core Concepts Overview](./core-concepts/README.md) - 20 minutes
3. Follow [Getting Started Guide](./guides/GETTING-STARTED.md) - 30 minutes
4. Start [Development Workflow](./guides/DEVELOPMENT-WORKFLOW.md) - as needed

### For Existing Users
1. Check [guides/README.md](./guides/README.md) for task-specific guides
2. Reference [features/README.md](./features/README.md) for feature details
3. Check [reference/README.md](./reference/README.md) for technical specs

### For Deployment
1. Choose environment: [Production](./guides/PRODUCTION-DEPLOYMENT.md) or [Render](./guides/RENDER-DEPLOYMENT.md)
2. Reference [Docker Build Strategies](./guides/DOCKER-BUILD-STRATEGIES.md)
3. Troubleshoot: [Memory Optimization](./guides/MEMORY-OPTIMIZATION.md)

## 📚 Documentation Categories

### Core Concepts (docs/core-concepts/)
**Purpose**: Foundational principles that guide all development  
**Read When**: Learning project patterns and governance  
**Key Files**:
- 00-EFFICIENT-EXECUTION-PROTOCOL.md
- 01-DOCUMENTATION-FIRST-WORKFLOW.md
- 02-SERVICE-ADAPTER-PATTERN.md
- 03-REPOSITORY-OWNERSHIP-RULE.md
- 04-CORE-VS-FEATURE-ARCHITECTURE.md
- 05-TYPE-MANIPULATION-PATTERN.md
- 06-README-FIRST-DOCUMENTATION-DISCOVERY.md
- 07-BETTER-AUTH-INTEGRATION.md
- 08-FILE-MANAGEMENT-POLICY.md
- 09-ORPC-IMPLEMENTATION-PATTERN.md
- 10-DOCUMENTATION-MAINTENANCE-PROTOCOL.md
- COPILOT-WORKFLOW-DIAGRAM.md

### Guides (docs/guides/)
**Purpose**: How-to documentation for common tasks  
**Read When**: Performing specific workflows  
**Examples**:
- Getting started
- Development setup
- Deployment procedures
- Troubleshooting

### Features (docs/features/)
**Purpose**: Feature-specific documentation  
**Read When**: Using specific features  
**Examples**:
- ORPC API patterns
- Environment configuration
- Testing setup
- Copilot agent setup

### Planning (docs/planning/)
**Purpose**: Planning documentation for project decisions  
**Read When**: Planning infrastructure or multi-instance setups  
**Examples**:
- Project isolation
- Architecture planning

### Reference (docs/reference/)
**Purpose**: Technical reference materials  
**Read When**: Looking up technical specifications  
**Examples**:
- Technology stack details
- Architecture overview
- Glossary of terms
- Migration history

### Deprecated (docs/deprecated/)
**⚠️ Don't use this section**  
**Purpose**: Archive of outdated documentation  
**When to Reference**: Only for historical context or if no alternative exists

## 🎯 Finding What You Need

### By Use Case

**"I want to set up development"**
→ [Getting Started](./guides/GETTING-STARTED.md)

**"I want to deploy to production"**
→ [Production Deployment](./guides/PRODUCTION-DEPLOYMENT.md)

**"I want to deploy to Render"**
→ [Render Deployment](./guides/RENDER-DEPLOYMENT.md)

**"I want to learn ORPC"**
→ [ORPC Type-Safe Contracts](./features/ORPC-TYPE-CONTRACTS.md)

**"I want to understand the architecture"**
→ [Architecture Overview](./reference/ARCHITECTURE.md)

**"I want to see the tech stack"**
→ [Technology Stack](./reference/TECH-STACK.md)

**"I want to troubleshoot Docker"**
→ [Docker Build Strategies](./guides/DOCKER-BUILD-STRATEGIES.md) or [Memory Optimization](./guides/MEMORY-OPTIMIZATION.md)

**"I want to set up multiple projects"**
→ [Project Isolation](./planning/PROJECT-ISOLATION.md)

**"I need to write tests"**
→ [Testing](./features/TESTING.md)

**"I need to configure environment variables"**
→ [Environment Template System](./features/ENVIRONMENT-TEMPLATE-SYSTEM.md)

### By Document Type

**Setup & Getting Started**: guides/GETTING-STARTED.md  
**Workflow Guides**: guides/DEVELOPMENT-WORKFLOW.md  
**Deployment**: guides/PRODUCTION-DEPLOYMENT.md, guides/RENDER-DEPLOYMENT.md  
**Technology Info**: reference/TECH-STACK.md, reference/ARCHITECTURE.md  
**Features**: features/ directory  
**Patterns**: core-concepts/ directory  

## 📝 Adding New Documentation

When you create new documentation:

1. **Determine Category**:
   - Core Concept? → core-concepts/
   - How-to Guide? → guides/
   - Feature Doc? → features/
   - Technical Planning? → planning/
   - Technical Reference? → reference/
   - Archived/Old? → deprecated/

2. **Add Breadcrumb** (required):
   ```markdown
   📍 [Documentation Hub](../README.md) > [Category](./README.md) > Current File
   ```

3. **Update Category README**:
   - Add entry to index list
   - Add 1-line description
   - Add to "by use case" section if applicable

4. **Add Cross-References**:
   - Link to related files in other categories
   - Link from related files to your new file

5. **Validate Links**:
   ```bash
   npm run linkcheck
   npm run linkcheck:fix  # for automatic fixes
   ```

## 🔗 Breadcrumb Format

All files should have a breadcrumb at the very top:

```markdown
📍 [Documentation Hub](../README.md) > [Category Name](./README.md) > Current Page
```

This helps users:
- Understand current location in hierarchy
- Navigate back to category index
- Navigate to main documentation hub
- Know they're reading current documentation (not archived)

## 📊 Documentation Statistics

- **Total Documents**: 28+ active files
- **Deprecated Documents**: 6 archived files (in /deprecated)
- **Average Read Time**: 20-30 minutes per document
- **Cross-References**: 100+ internal links
- **Breadcrumbs**: 90%+ of files (as of 2025-10-16)

## 🎓 Reading Paths by Audience

### For New Developers
1. Core Concepts (all 12, ~2 hours)
2. Getting Started (30 min)
3. Development Workflow (ongoing reference)
4. Feature docs as needed

### For DevOps/Infrastructure
1. Architecture (30 min)
2. Tech Stack (20 min)
3. Docker Build Strategies (30 min)
4. Production Deployment (30 min)
5. Render Deployment (optional, 20 min)

### For Feature Development
1. Relevant Core Concept (10-20 min)
2. Feature documentation (20-60 min)
3. Related guides (as needed)

### For Troubleshooting
1. Search for topic in guides/
2. Check features/ for feature-specific issues
3. Reference reference/ for technical details
4. Check core-concepts/ for pattern clarification

## 🔄 Documentation Maintenance

Documentation is maintained through:
- Regular updates as code changes
- Cross-reference validation
- Breadcrumb consistency checks
- Archive reviews (annually)

For questions about maintaining documentation, see Core Concepts:
- [Documentation Maintenance Protocol](./core-concepts/10-DOCUMENTATION-MAINTENANCE-PROTOCOL.md)
- [Documentation-First Workflow](./core-concepts/01-DOCUMENTATION-FIRST-WORKFLOW.md)

## ❓ FAQ

**Q: Where should I look first?**  
A: Always start with [Core Concepts README](./core-concepts/README.md) - it's the foundation.

**Q: What if I can't find what I need?**  
A: Check the category README.md files or this NAVIGATION.md guide.

**Q: Are deprecated docs safe to read?**  
A: They're archived and may be outdated. Always check the "Alternative" column in [deprecated/README.md](./deprecated/README.md).

**Q: How do I know if documentation is current?**  
A: Look for breadcrumb at top (📍). If missing or in /deprecated, it may be outdated.

**Q: How often is documentation updated?**  
A: As code changes. Check git log for recent changes: `git log --oneline docs/`

---

**Last Updated**: 2025-10-16  
**Maintained By**: AI Coding Agent  
**Review Frequency**: Monthly
