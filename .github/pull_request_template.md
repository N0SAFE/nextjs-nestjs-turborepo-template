# 🚀 Pull Request

## 📋 Description
Briefly describe what this PR does and why.

## 🔗 Related Issues
- Closes #(issue number)
- Related to #(issue number)

## 📦 Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] 🚀 New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Configuration/build changes
- [ ] 🧪 Test improvements
- [ ] ♻️ Refactoring (no functional changes)
- [ ] 🎨 Style/UI changes

## 🎯 Affected Areas
Which parts of the codebase does this PR affect?

### Monorepo Components
- [ ] Web App (`apps/web`)
- [ ] API Server (`apps/api`)
- [ ] UI Components (`packages/ui`)
- [ ] API Contracts (`packages/api-contracts`)
- [ ] Shared Types (`packages/types`)
- [ ] Utilities (`packages/utils`)
- [ ] Other Package: ___________

### Infrastructure & Configuration
- [ ] Docker Configuration (`docker/`)
- [ ] Environment Variables (`.env`, `.env.template`)
- [ ] Build Configuration (`turbo.json`, `package.json`)
- [ ] CI/CD Pipelines (`.github/workflows/`)
- [ ] Database Schema (`apps/api/src/db/`)

### Documentation
- [ ] Core Concepts (`.docs/core-concepts/`)
- [ ] Guides (`.docs/guides/`)
- [ ] Reference Docs (`.docs/reference/`)
- [ ] README files
- [ ] Other: ___________

## 🏗️ Architecture & Patterns
Confirm compliance with project architecture patterns:

### Core Concepts (Select all that apply)
- [ ] ✅ Follows [Service-Adapter Pattern](../.docs/core-concepts/02-SERVICE-ADAPTER-PATTERN.md) (Controllers → Services → Repositories)
- [ ] ✅ Respects [Repository Ownership Rule](../.docs/core-concepts/03-REPOSITORY-OWNERSHIP-RULE.md)
- [ ] ✅ Uses [ORPC Implementation Pattern](../.docs/core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md) for API contracts
- [ ] ✅ Uses [ORPC Client Hooks Pattern](../.docs/core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md) (no direct ORPC in components)
- [ ] ✅ Follows [Better Auth Integration](../.docs/core-concepts/07-BETTER-AUTH-INTEGRATION.md) pattern
- [ ] ✅ Adheres to [Core vs Feature Architecture](../.docs/core-concepts/04-CORE-VS-FEATURE-ARCHITECTURE.md)
- [ ] ✅ Follows [Documentation-First Workflow](../.docs/core-concepts/01-DOCUMENTATION-FIRST-WORKFLOW.md)
- [ ] ✅ Complies with [File Management Policy](../.docs/core-concepts/08-FILE-MANAGEMENT-POLICY.md)
- [ ] N/A - No architecture patterns affected

### API & Type Safety
- [ ] ORPC contracts updated in `packages/api-contracts/` (if applicable)
- [ ] Custom React Query hooks created for ORPC endpoints (if applicable)
- [ ] Declarative routes regenerated with `bun run web -- dr:build` (if routes changed)
- [ ] End-to-end type safety verified
- [ ] No direct database access from controllers (Service-Adapter pattern followed)
- [ ] N/A - No API changes

### Next.js & Routing
- [ ] Declarative routing used (no manual `href` strings)
- [ ] Route definitions include `page.info.ts` files
- [ ] Generated routes updated (`apps/web/src/routes/index.ts`)
- [ ] App Router patterns followed (Next.js 15)
- [ ] N/A - No routing changes

## 🧪 Testing & Quality

### Test Coverage
- [ ] Tests pass locally: `bun run test`
- [ ] Coverage maintained/improved: `bun run test:coverage`
- [ ] New tests added for new functionality
- [ ] Existing tests updated for changes
- [ ] Manual testing completed
- [ ] No console errors/warnings

### Build & Lint
- [ ] Lint passes: `bun run lint`
- [ ] Build succeeds: `bun run build`
- [ ] Type checking passes (no TypeScript errors)
- [ ] No new warnings introduced

### Test Commands Used
```bash
# Run all tests
bun run test

# Check test coverage
bun run test:coverage

# Lint codebase
bun run lint

# Build all packages
bun run build

# Docker-based testing (if applicable)
bun run dev  # Verify in Docker environment
```

## 🐳 Docker & Environment

### Docker Configuration
- [ ] Docker compose files updated (if needed)
- [ ] Container networking verified
- [ ] Volume mounts configured correctly
- [ ] Service dependencies documented
- [ ] N/A - No Docker changes

### Environment Variables
- [ ] `.env.template` updated with new variables
- [ ] `.env.example` synced with template
- [ ] Environment variable documentation updated
- [ ] Required variables documented in deployment guides
- [ ] Secrets handled securely (not committed)
- [ ] N/A - No environment changes

### Docker Testing
- [ ] Tested with full stack: `bun run dev`
- [ ] Tested API service: `bun run dev:api`
- [ ] Tested web service: `bun run dev:web`
- [ ] Service communication verified (API ↔ DB ↔ Web)
- [ ] N/A - No Docker testing needed

## 📸 Screenshots & Demos
Add screenshots or screen recordings for visual changes:

### Before
<!-- Screenshot of the current state -->

### After
<!-- Screenshot of the new state -->

## 🔧 Database & Migrations

### Schema Changes
- [ ] Database schema modified
- [ ] Migration generated: `bun run api -- db:generate`
- [ ] Migration tested: `bun run api -- db:migrate`
- [ ] Seed data updated (if needed): `bun run api -- db:seed`
- [ ] Schema changes documented
- [ ] N/A - No database changes

### Data Considerations
- [ ] Backward compatible schema changes
- [ ] Data migration strategy documented
- [ ] Rollback plan documented (for breaking changes)
- [ ] N/A - No data impact

## 📈 Performance Impact
- [ ] ✅ No performance impact
- [ ] ✅ Improves performance (describe below)
- [ ] ⚠️ May impact performance (explain mitigation below)

**Performance Notes:**
<!-- Describe any performance considerations, measurements, or optimizations -->

## 🔒 Security Considerations
- [ ] ✅ No security implications
- [ ] ✅ Security improvements (describe below)
- [ ] ⚠️ Potential security implications (explain and justify below)
- [ ] Authentication/authorization verified
- [ ] Input validation implemented
- [ ] SQL injection protection verified (Drizzle ORM usage)
- [ ] XSS protection verified
- [ ] CORS configuration appropriate

**Security Notes:**
<!-- Describe any security considerations, threat model changes, or mitigations -->

## 📋 Pre-Merge Checklist

### Code Quality
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented complex logic areas
- [ ] Code is DRY (Don't Repeat Yourself)
- [ ] No debugging code left (console.logs, debugger statements)

### Documentation
- [ ] Documentation updated in `.docs/` (if needed)
- [ ] Core concepts updated (if new patterns introduced)
- [ ] README files updated (if needed)
- [ ] API documentation updated (if API changes)
- [ ] Inline code comments added for complex logic
- [ ] No documentation changes needed

### Dependencies
- [ ] Dependencies added via package manager (bun)
- [ ] Lock file updated (`bun.lockb`)
- [ ] Dependencies are necessary and justified
- [ ] Workspace dependencies use `*` version (internal packages)
- [ ] External dependencies pinned to specific versions
- [ ] N/A - No dependency changes

### CI/CD Compliance
- [ ] All CI checks passing (lint, build, test)
- [ ] Declarative routes generated (if applicable)
- [ ] No new TypeScript errors
- [ ] No new ESLint warnings/errors
- [ ] Build completes successfully
- [ ] Tests pass in CI environment

## 🚀 Deployment Notes

### Deployment Requirements
- [ ] ✅ No special deployment steps needed
- [ ] ⚠️ Requires database migration (see details below)
- [ ] ⚠️ Requires environment variable updates (see details below)
- [ ] ⚠️ Requires dependency updates (see details below)
- [ ] ⚠️ Requires manual intervention (see details below)

### Deployment Checklist
- [ ] Backward compatible with current production
- [ ] Database migrations tested in staging
- [ ] Environment variables documented
- [ ] Rollback procedure documented (for breaking changes)
- [ ] Deployment order documented (if multi-service)

**Deployment Instructions:**
<!-- Provide step-by-step deployment instructions if needed -->

## 🤝 Reviewer Guidance

### Focus Areas
**Key files to review:**
- 
- 

**Areas needing special attention:**
- 
- 

**Architecture decisions to validate:**
- 
- 

### Questions for Reviewers
1. 
2. 
3. 

### Testing Instructions for Reviewers
```bash
# Steps to test this PR
git checkout <branch-name>
bun install
bun run dev

# Navigate to: <url>
# Test scenario: <description>
```

## 📊 Related Pull Requests
List any related or dependent PRs:
- #(PR number) - Description
- #(PR number) - Description

## 📝 Additional Notes & Context
<!-- Add any additional notes, design decisions, trade-offs, technical debt, or future considerations -->

---

## ✅ Final Verification

Before requesting review, confirm:
- [ ] All checkboxes above are addressed
- [ ] CI/CD pipeline passes
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Architecture patterns followed
- [ ] Tests added/updated
- [ ] Ready for review

---

**Reviewers:** Please review architecture compliance, code quality, and test coverage before approving.
