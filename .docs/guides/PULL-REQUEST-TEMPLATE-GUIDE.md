📍 [Documentation Hub](../README.md) > [Guides](./README.md) > Pull Request Template Guide

# Pull Request Template Guide

> **Last Updated**: 2025-12-02  
> **Audience**: All contributors  
> **Purpose**: Guide for using the enhanced PR template effectively

## Overview

This project uses an enhanced pull request template specifically designed for our Next.js + NestJS turborepo architecture. The template ensures:

- **Architecture Compliance**: Validates adherence to core concepts and patterns
- **Quality Assurance**: Comprehensive testing and validation checklists
- **Documentation**: Ensures changes are properly documented
- **CI/CD Alignment**: Mirrors actual pipeline requirements
- **Review Efficiency**: Helps reviewers understand changes quickly

## Template Structure

### 1. Basic Information
- **Description**: What and why
- **Related Issues**: Link to GitHub issues
- **Type of Change**: Bug fix, feature, breaking change, etc.

### 2. Affected Areas (🎯)
Identify which parts of the monorepo are affected:
- **Apps**: `apps/web`, `apps/api`
- **Packages**: `packages/ui`, `packages/contracts`, etc.
- **Infrastructure**: Docker, environment, CI/CD
- **Documentation**: Docs directory changes

**Why it matters**: Helps reviewers focus on relevant areas and understand the scope of changes.

### 3. Architecture & Patterns (🏗️)
The most critical section for this project:

#### Core Concepts Compliance
Confirm your changes follow these mandatory patterns:
- [Service-Adapter Pattern](../core-concepts/02-SERVICE-ADAPTER-PATTERN.md)
- [Repository Ownership Rule](../core-concepts/03-REPOSITORY-OWNERSHIP-RULE.md)
- [ORPC Implementation Pattern](../core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md)
- [ORPC Client Hooks Pattern](../core-concepts/11-ORPC-CLIENT-HOOKS-PATTERN.md)
- [Better Auth Integration](../core-concepts/07-BETTER-AUTH-INTEGRATION.md)

**How to use**:
1. Review relevant core concepts before implementing
2. Check applicable boxes as you implement
3. Mark N/A if architecture patterns aren't affected
4. Link to specific violations if any exceptions are needed

#### API & Type Safety
For API changes, ensure:
- ORPC contracts are updated
- Custom React Query hooks are created (not direct ORPC usage)
- Declarative routes are regenerated
- End-to-end type safety is verified

#### Next.js & Routing
For frontend changes, verify:
- Declarative routing used (no manual href strings)
- Route definitions include `page.info.ts` files
- Generated routes are updated

### 4. Testing & Quality (🧪)
Comprehensive testing checklist:

#### Test Coverage
```bash
bun run test              # Run all tests
bun run test:coverage     # Check coverage
bun run lint              # Lint check
bun run build             # Build verification
```

**Best practice**: Run these commands before creating the PR to catch issues early.

#### Build & Lint
- Ensure all checks pass locally
- Fix any TypeScript errors
- Address ESLint warnings
- Verify no new warnings introduced

### 5. Docker & Environment (🐳)

#### Docker Configuration
For changes affecting containerization:
- Update Docker compose files
- Verify container networking
- Test with full stack: `bun run dev`
- Test individual services

#### Environment Variables
When adding/modifying environment variables:
1. Update `.env.template` with new variables
2. Sync `.env.example`
3. Document in environment variable guides
4. Test with Docker environment

**Security note**: Never commit actual secrets or API keys.

### 6. Screenshots & Demos (📸)
For UI changes:
- Include before/after screenshots
- Add screen recordings for complex interactions
- Show responsive design (mobile, tablet, desktop)
- Capture different states (loading, error, success)

### 7. Database & Migrations (🔧)
For schema changes:

```bash
# Generate migration
bun run api -- db:generate

# Test migration
bun run api -- db:migrate

# Update seed data if needed
bun run api -- db:seed
```

**Important**: 
- Ensure migrations are backward compatible when possible
- Document breaking schema changes
- Provide rollback instructions for breaking changes

### 8. Performance Impact (📈)
Assess performance implications:
- **No impact**: Most changes fall here
- **Improves performance**: Describe optimizations
- **May impact performance**: Explain and provide mitigation

**When to measure**: For changes affecting:
- Database queries
- API response times
- Bundle size
- Page load times

### 9. Security Considerations (🔒)
Security checklist:
- [ ] Authentication/authorization verified
- [ ] Input validation implemented
- [ ] SQL injection protection (Drizzle ORM usage)
- [ ] XSS protection verified
- [ ] CORS configuration appropriate

**Red flags**: Direct database access, unvalidated user input, exposed secrets

### 10. Pre-Merge Checklist (📋)
Final verification before requesting review:

#### Code Quality
- Self-review completed
- Complex logic commented
- No debugging code left
- DRY principles followed

#### Documentation
- `.docs/` updated if needed
- Core concepts updated for new patterns
- README files updated
- API documentation updated

#### Dependencies
- Added via package manager (bun)
- Lock file updated
- Dependencies justified
- Internal packages use `*` version
- External packages pinned

### 11. Deployment Notes (🚀)
Document deployment requirements:

#### Common Scenarios
- **No special steps**: Most changes
- **Database migration**: Requires migration run
- **Environment variables**: New variables needed
- **Manual intervention**: Specific deployment steps

**Deployment checklist**:
- Backward compatibility verified
- Migrations tested in staging
- Rollback procedure documented
- Deployment order documented (multi-service changes)

### 12. Reviewer Guidance (🤝)
Help reviewers be effective:

#### Focus Areas
- **Key files**: List most important files
- **Special attention**: Areas with complex logic
- **Architecture decisions**: Design choices to validate

#### Questions for Reviewers
- List specific questions or concerns
- Ask for feedback on design decisions
- Highlight trade-offs made

#### Testing Instructions
```bash
# Provide exact steps for reviewers
git checkout <branch-name>
bun install
bun run dev

# Navigate to: <url>
# Test scenario: <description>
```

### 13. Final Verification (✅)
Before requesting review, confirm:
- [ ] All checkboxes addressed
- [ ] CI/CD pipeline passes
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Architecture patterns followed
- [ ] Tests added/updated
- [ ] Ready for review

## Common Scenarios

### Scenario 1: Adding a New API Endpoint

**Required sections to complete**:
1. ✅ Type of Change: New feature
2. ✅ Affected Areas:
   - API Server (`apps/api`)
   - API Contracts (`packages/contracts`)
3. ✅ Architecture & Patterns:
   - Service-Adapter Pattern (create Repository → Service → Controller)
   - ORPC Implementation Pattern (define contract)
   - ORPC Client Hooks Pattern (create custom hook)
4. ✅ Testing: Add integration tests for new endpoint
5. ✅ Documentation: Update API documentation

**Workflow**:
```bash
# 1. Create ORPC contract in packages/contracts/
# 2. Implement Service-Adapter pattern in apps/api/
# 3. Create custom React Query hook in apps/web/
# 4. Test the complete flow
bun run dev
bun run test
bun run lint
```

### Scenario 2: Adding a New Page to Web App

**Required sections to complete**:
1. ✅ Type of Change: New feature
2. ✅ Affected Areas:
   - Web App (`apps/web`)
3. ✅ Architecture & Patterns:
   - Declarative routing (create `page.info.ts`)
   - ORPC Client Hooks (use custom hooks, not direct ORPC)
4. ✅ Next.js & Routing:
   - Create route definition
   - Regenerate routes: `bun run web -- dr:build`
5. ✅ Screenshots: Before/after with new page
6. ✅ Testing: Test route navigation and data fetching

### Scenario 3: Updating Database Schema

**Required sections to complete**:
1. ✅ Type of Change: Configuration/build changes
2. ✅ Affected Areas:
   - Database Schema (`apps/api/src/db/`)
3. ✅ Database & Migrations:
   - Generate migration
   - Test migration
   - Update seed data
4. ✅ Deployment Notes:
   - Requires database migration
   - Backward compatibility assessment
   - Rollback plan
5. ✅ Testing: Test with fresh database and migration

**Workflow**:
```bash
# 1. Update schema in apps/api/src/db/drizzle/schema/
# 2. Generate migration
bun run api -- db:generate

# 3. Test migration
bun run api -- db:migrate

# 4. Update seeds if needed
bun run api -- db:seed

# 5. Verify in Docker
bun run dev
```

### Scenario 4: Documentation-Only Change

**Required sections to complete**:
1. ✅ Type of Change: Documentation update
2. ✅ Affected Areas:
   - Documentation (specify which docs)
3. ✅ Pre-Merge Checklist:
   - Documentation section only
4. ✅ Testing: Verify markdown rendering and links

**Simplified flow**: No need to complete architecture, testing, or deployment sections.

### Scenario 5: Fixing a Bug

**Required sections to complete**:
1. ✅ Type of Change: Bug fix
2. ✅ Affected Areas: Identify affected components
3. ✅ Architecture & Patterns: If patterns were violated, confirm fix
4. ✅ Testing:
   - Add regression test
   - Verify fix works
5. ✅ Security: If security bug, document mitigation

## Best Practices

### 1. Fill Out the Template Honestly
- Don't skip sections just to save time
- Mark N/A when truly not applicable
- Be thorough but concise

### 2. Use the Template as a Workflow Guide
- Review template before starting work
- Use checklist items as implementation guide
- Complete template as you work (not at the end)

### 3. Link to Core Concepts
- Reference specific core concept violations if any
- Explain why exceptions are needed
- Propose core concept updates if patterns should change

### 4. Provide Context for Reviewers
- Explain the "why" not just the "what"
- Highlight design decisions and trade-offs
- Make it easy for reviewers to test

### 5. Keep Documentation Updated
- Update `.docs/` as you implement
- Don't defer documentation updates
- Link to relevant documentation in PR description

## Automation and Tools

### CI/CD Integration
The template mirrors CI/CD checks:
- ✅ Lint: ESLint check
- ✅ Build: Package compilation
- ✅ Test: Unit and integration tests
- ✅ Type check: TypeScript validation

**Tip**: Run `bun run lint && bun run build && bun run test` before pushing to catch CI failures early.

### GitHub Actions
The PR template aligns with these CI jobs:
1. Setup & Install Dependencies
2. Generate Declarative Routes
3. Lint & Type Check
4. Build
5. Test
6. Deployment Ready

### Pre-commit Hooks
Husky pre-commit hooks help catch issues:
- Format code with Prettier
- Lint with ESLint
- Type check with TypeScript

## Troubleshooting

### Q: Template is too long, can I skip sections?
**A**: Only skip sections genuinely not applicable. Mark them N/A with a brief explanation.

### Q: I violated a core concept intentionally, what do I do?
**A**: 
1. Document the violation clearly
2. Explain why it's necessary
3. Propose updating the core concept
4. Request explicit approval from maintainers

### Q: CI is failing but passes locally
**A**: 
- Ensure `.env` variables are set correctly for CI
- Check if declarative routes were regenerated
- Verify Docker networking if services communicate
- Review CI logs for specific errors

### Q: How detailed should deployment notes be?
**A**: Detailed enough that someone unfamiliar with the change can deploy confidently:
- List exact steps
- Include command examples
- Document rollback procedure
- Note any service restart requirements

### Q: When should I create screenshots?
**A**: For any visible UI change:
- New pages or components
- Modified layouts
- Style/theme changes
- Interactive behavior changes
- Error states and loading states

## Template Maintenance

### When Template Should Be Updated
- New core concepts added
- CI/CD pipeline changes
- New package types added to monorepo
- Deployment process changes
- New documentation sections added

### How to Update Template
1. Edit `.github/pull_request_template.md`
2. Update this guide (`.docs/guides/PULL-REQUEST-TEMPLATE-GUIDE.md`)
3. Update copilot instructions if needed
4. Create a PR with template changes
5. Notify team of template updates

## Related Documentation

- [Core Concepts Index](../core-concepts/README.md) - All architectural patterns
- [Development Workflow](./DEVELOPMENT-WORKFLOW.md) - Daily development tasks
- [Testing Guide](../features/TESTING.md) - Testing strategies
- [Docker Build Strategies](./DOCKER-BUILD-STRATEGIES.md) - Docker configuration
- [Production Deployment](./PRODUCTION-DEPLOYMENT.md) - Deployment guide

## Questions?

If you have questions about:
- **Template usage**: Review this guide and examples
- **Core concepts**: Check `.docs/core-concepts/`
- **Specific patterns**: See relevant documentation
- **Template improvements**: Create an issue or PR

---

**Remember**: The PR template is a tool to help you create high-quality, well-documented changes. Use it as a checklist during development, not just at PR creation time.
