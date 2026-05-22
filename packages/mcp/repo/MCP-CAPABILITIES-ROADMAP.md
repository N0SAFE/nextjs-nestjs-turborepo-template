# MCP Capabilities Roadmap

This document defines the comprehensive set of MCP capabilities to be implemented for effective monorepo management.

## Overview

The MCP Repo Manager will expose multiple types of capabilities:
- **Tools**: Execute actions and commands
- **Resources**: Provide read-only data and context
- **Prompts**: Pre-defined prompt templates for common tasks
- **Sampling**: Request LLM completions for code generation
- **Server Instructions**: Guide LLM behavior within the repo context

---

## 📦 Package Management

### Tools

#### Core Package Operations
- [x] `list-packages` - List all packages with metadata
- [x] `get-package-info` - Get detailed package information
- [x] `create-package` - Scaffold new package
- [x] `update-package` - Update package.json fields
- [x] `delete-package` - Remove package (with safety checks)
- [ ] `rename-package` - Rename package and update all references
- [ ] `move-package` - Move package to different location
- [ ] `link-package` - Create workspace link between packages
- [ ] `unlink-package` - Remove workspace link

#### Dependency Management
- [ ] `add-dependency` - Add dependency to package
- [ ] `remove-dependency` - Remove dependency from package
- [ ] `update-dependency` - Update dependency version
- [ ] `list-dependencies` - List all dependencies with versions
- [ ] `check-dependency-updates` - Check for available updates
- [ ] `sync-dependency-versions` - Sync versions across packages
- [ ] `find-circular-dependencies` - Detect circular dependencies
- [ ] `analyze-dependency-graph` - Generate dependency visualization

#### Version Management
- [ ] `bump-version` - Bump package version (major/minor/patch)
- [ ] `sync-versions` - Sync versions across related packages
- [ ] `check-version-consistency` - Ensure version consistency

### Resources

#### Package Information
- [ ] `package://list` - List of all packages (JSON)
- [ ] `package://{name}` - Detailed package info
- [ ] `package://{name}/dependencies` - Package dependencies
- [ ] `package://{name}/dependents` - Packages that depend on this
- [ ] `package://{name}/scripts` - Available scripts
- [ ] `package://{name}/files` - Package file structure

#### Dependency Graph
- [ ] `graph://overview` - Visual dependency graph
- [ ] `graph://package/{name}` - Package-specific graph
- [ ] `graph://circular` - Circular dependency report
- [ ] `graph://unused` - Unused dependencies report

#### Package Metadata
- [ ] `metadata://catalog` - Workspace catalog (if using)
- [ ] `metadata://workspace-config` - Workspace configuration
- [ ] `metadata://turbo-config` - Turborepo configuration

---

## 🛠️ Command Execution

### Tools

#### Code Quality
- [x] `run-eslint` - Run ESLint
- [x] `run-prettier` - Format code
- [x] `run-typecheck` - Type check with TypeScript
- [ ] `run-stylelint` - Lint styles (if applicable)
- [ ] `fix-lint-errors` - Auto-fix linting errors
- [ ] `format-staged` - Format only staged files

#### Testing
- [x] `run-tests` - Run tests
- [ ] `run-test-file` - Run specific test file
- [ ] `run-test-coverage` - Generate coverage report
- [ ] `run-e2e-tests` - Run end-to-end tests
- [ ] `run-integration-tests` - Run integration tests
- [ ] `watch-tests` - Run tests in watch mode
- [ ] `update-snapshots` - Update test snapshots

#### Build & Development
- [x] `run-build` - Build packages
- [x] `run-clean` - Clean build artifacts
- [ ] `run-dev` - Start development servers
- [ ] `run-dev-api` - Start API dev server
- [ ] `run-dev-web` - Start web dev server
- [ ] `run-docker-up` - Start Docker services
- [ ] `run-docker-down` - Stop Docker services
- [ ] `rebuild-package` - Clean and rebuild specific package
- [ ] `watch-build` - Build in watch mode

#### Database Operations
- [ ] `db-migrate` - Run database migrations
- [ ] `db-seed` - Seed database
- [ ] `db-reset` - Reset database
- [ ] `db-generate` - Generate Drizzle schema
- [ ] `db-push` - Push schema changes
- [ ] `db-studio` - Open database studio

#### Git Operations
- [ ] `git-status` - Get git status
- [ ] `git-changed-files` - List changed files
- [ ] `git-changed-packages` - List packages with changes
- [ ] `git-create-branch` - Create new branch
- [ ] `git-commit` - Create commit with conventional format

### Resources

#### Command History
- [ ] `command://history` - Recent command executions
- [ ] `command://running` - Currently running commands
- [ ] `command://failed` - Failed commands with errors

#### Build Status
- [ ] `build://status` - Current build status
- [ ] `build://cache` - Turborepo cache status
- [ ] `build://logs/{package}` - Build logs for package

#### Test Results
- [ ] `test://results/latest` - Latest test run results
- [ ] `test://coverage` - Coverage report
- [ ] `test://failing` - Currently failing tests

---

## 🏗️ Scaffolding & Code Generation

### Tools

#### Package Scaffolding
- [x] `scaffold-config-package` - New config package
- [x] `scaffold-bin-package` - New CLI tool
- [x] `scaffold-mcp-package` - New MCP server
- [x] `scaffold-ui-package` - New UI package
- [x] `scaffold-contracts-package` - New contracts package
- [x] `scaffold-types-package` - New types package
- [ ] `scaffold-app` - New application (web/api/doc)
- [ ] `scaffold-lib-package` - New library package

#### Code Generation
- [ ] `generate-component` - Generate React component
- [ ] `generate-hook` - Generate custom React hook
- [ ] `generate-service` - Generate NestJS service
- [ ] `generate-controller` - Generate NestJS controller
- [ ] `generate-module` - Generate NestJS module
- [ ] `generate-orpc-contract` - Generate ORPC contract
- [ ] `generate-orpc-client-hook` - Generate client hook for ORPC
- [ ] `generate-route` - Generate Next.js route with declarative routing
- [ ] `generate-test` - Generate test file for existing code

#### Migration Tools
- [ ] `migrate-to-typescript` - Convert JS to TS
- [ ] `migrate-to-esm` - Convert to ES modules
- [ ] `update-imports` - Update import paths after refactor

### Resources

#### Templates
- [ ] `template://package/{type}` - Package templates
- [ ] `template://component/{variant}` - Component templates
- [ ] `template://test/{type}` - Test templates
- [ ] `template://config/{tool}` - Configuration templates

#### Scaffolding Options
- [ ] `scaffold://package-types` - Available package types
- [ ] `scaffold://component-variants` - Available component types
- [ ] `scaffold://examples` - Example implementations

---

## 📋 Prompts

### Development Prompts

#### Package Management
- [ ] `create-new-package` - Guide through package creation
  - Input: Package name, type, description
  - Walks through: Setup, dependencies, configuration
  
- [ ] `add-package-dependency` - Guide dependency addition
  - Input: Package name, dependency name
  - Suggests: Version, dependency type, workspace reference

#### Code Review
- [ ] `review-changes` - Review current changes
  - Analyzes: Git diff, affected packages
  - Checks: Tests, types, lint, conventions
  
- [ ] `review-pr` - Review pull request
  - Input: PR number or branch
  - Analyzes: Changes, impact, test coverage

#### Testing
- [ ] `write-tests-for-file` - Generate tests
  - Input: File path
  - Generates: Test structure, test cases
  
- [ ] `improve-test-coverage` - Suggest coverage improvements
  - Input: Package or file
  - Analyzes: Current coverage, suggests tests

#### Documentation
- [ ] `document-package` - Generate package documentation
  - Input: Package name
  - Generates: README, API docs, examples
  
- [ ] `update-agents-md` - Update AGENTS.md
  - Input: Package name, changes
  - Updates: Development guidelines

#### Refactoring
- [ ] `refactor-component` - Suggest refactoring
  - Input: Component path
  - Suggests: Patterns, improvements
  
- [ ] `extract-shared-code` - Find duplicates
  - Analyzes: Code duplication
  - Suggests: Shared utilities, packages

#### Debugging
- [ ] `debug-build-error` - Help debug build failures
  - Input: Error message or package
  - Suggests: Solutions, related issues
  
- [ ] `debug-type-error` - Help fix TypeScript errors
  - Input: Error message or file
  - Explains: Error, suggests fixes

---

## 🤖 Sampling (LLM Completions)

### Code Generation Sampling

- [ ] `sample-component-code` - Generate component implementation
  - Input: Component spec, requirements
  - Returns: Component code following project patterns
  
- [ ] `sample-test-code` - Generate test implementation
  - Input: Code to test, test type
  - Returns: Test code following project conventions
  
- [ ] `sample-orpc-contract` - Generate ORPC contract
  - Input: API spec, endpoint requirements
  - Returns: Type-safe ORPC contract
  
- [ ] `sample-migration-code` - Generate migration code
  - Input: Current code, target pattern
  - Returns: Refactored code

### Documentation Sampling

- [ ] `sample-readme` - Generate README content
  - Input: Package info, features
  - Returns: Comprehensive README
  
- [ ] `sample-api-docs` - Generate API documentation
  - Input: Code, contracts
  - Returns: API documentation
  
- [ ] `sample-changelog` - Generate changelog entry
  - Input: Changes, commits
  - Returns: Formatted changelog

### Configuration Sampling

- [ ] `sample-tsconfig` - Generate TypeScript config
  - Input: Package type, requirements
  - Returns: Appropriate tsconfig.json
  
- [ ] `sample-package-json` - Generate package.json
  - Input: Package type, dependencies
  - Returns: Complete package.json

---

## 📖 Resources (Read-Only Data)

### Repository Structure

- [ ] `repo://summary` - High-level repo overview
- [ ] `repo://structure` - Directory tree structure
- [ ] `repo://stats` - Repository statistics
- [ ] `repo://recent-changes` - Recent file changes

### Configuration Files

- [ ] `config://turbo` - Turborepo configuration
- [ ] `config://typescript` - TypeScript configs overview
- [ ] `config://eslint` - ESLint configuration
- [ ] `config://prettier` - Prettier configuration
- [ ] `config://docker` - Docker configurations

### Code Analysis

- [ ] `analysis://complexity` - Code complexity metrics
- [ ] `analysis://duplication` - Code duplication report
- [ ] `analysis://unused-exports` - Unused exports
- [ ] `analysis://dead-code` - Dead code detection
- [ ] `analysis://bundle-size` - Bundle size analysis

### Documentation

- [ ] `docs://index` - Documentation index
- [ ] `docs://core-concepts` - Core concepts documentation
- [ ] `docs://guides` - Development guides
- [ ] `docs://agents` - AGENTS.md files index
- [ ] `docs://architecture` - Architecture documentation

### Environment

- [ ] `env://variables` - Environment variables (non-sensitive)
- [ ] `env://docker-status` - Docker containers status
- [ ] `env://services` - Running services status

---

## 🎓 Server Instructions

### Contextual Guidelines

These instructions guide the LLM's behavior when working in this repository:

#### General Repository Context

```
You are working in a Next.js + NestJS monorepo managed with Turborepo.

Key patterns to follow:
- Use Bun as the package manager and runtime
- Follow the Service-Adapter pattern for API layers
- Use ORPC for type-safe API contracts
- Create custom React Query hooks for ORPC consumption
- Use declarative routing for Next.js routes
- Follow the Documentation-First workflow
```

#### Package-Specific Context

```
When working in {package-type}:
- Follow conventions defined in packages/{type}/AGENTS.md
- Use workspace dependencies with catalog: or * versions
- Ensure proper exports in package.json
- Add tests in test/ directory mirroring src/ structure
```

#### Code Quality Standards

```
Before submitting changes:
- Run type-check: bun run type-check
- Run tests: bun run test
- Run lint: bun run lint
- Ensure no console.logs remain
- Update relevant documentation
```

#### Architecture Patterns

```
Repository Core Concepts (from .docs/core-concepts/):
- 00-EFFICIENT-EXECUTION-PROTOCOL.md
- 01-DOCUMENTATION-FIRST-WORKFLOW.md
- 02-SERVICE-ADAPTER-PATTERN.md
- 03-REPOSITORY-OWNERSHIP-RULE.md
- 11-ORPC-CLIENT-HOOKS-PATTERN.md

Always follow these patterns when making changes.
```

#### Testing Requirements

```
Test requirements:
- Unit tests for services and utilities
- Integration tests for APIs and components
- Follow Vitest conventions
- Maintain >80% coverage for new code
- Tests in test/ directory, not src/
```

#### Commit Conventions

```
Use conventional commits:
- feat(scope): Add new feature
- fix(scope): Bug fix
- docs(scope): Documentation changes
- refactor(scope): Code refactoring
- test(scope): Test changes
- chore(scope): Maintenance tasks
```

---

## 🔐 Security & Validation

### Tools

- [ ] `audit-dependencies` - Security audit of dependencies
- [ ] `check-env-security` - Validate environment variable usage
- [ ] `scan-secrets` - Scan for accidentally committed secrets
- [ ] `validate-package-exports` - Ensure proper exports

### Resources

- [ ] `security://audit-report` - Security audit results
- [ ] `security://vulnerabilities` - Known vulnerabilities
- [ ] `security://env-violations` - Environment security issues

---

## 📊 Analytics & Metrics

### Tools

- [ ] `analyze-performance` - Performance metrics
- [ ] `analyze-bundle` - Bundle analysis
- [ ] `generate-metrics-report` - Comprehensive metrics

### Resources

- [ ] `metrics://build-times` - Build performance metrics
- [ ] `metrics://test-times` - Test execution times
- [ ] `metrics://package-sizes` - Package size statistics
- [ ] `metrics://complexity` - Code complexity metrics

---

## 🔄 CI/CD Integration

### Tools

- [ ] `run-ci-checks` - Run all CI checks locally
- [ ] `simulate-deployment` - Simulate deployment process
- [ ] `check-deployment-readiness` - Pre-deployment validation

### Resources

- [ ] `ci://status` - CI pipeline status
- [ ] `ci://recent-runs` - Recent CI runs
- [ ] `deployment://history` - Deployment history
- [ ] `deployment://environments` - Environment configurations

---

## Implementation Priority

### Phase 1: Core Functionality (Current)
- [x] Basic package management tools
- [x] Basic command execution tools
- [x] Basic scaffolding tools
- [ ] Package and dependency resources
- [ ] Command execution resources

### Phase 2: Enhanced Developer Experience
- [ ] Prompts for common tasks
- [ ] Code generation sampling
- [ ] Server instructions
- [ ] Test and build resources

### Phase 3: Advanced Features
- [ ] Advanced scaffolding and generation
- [ ] Security and validation tools
- [ ] Analytics and metrics
- [ ] CI/CD integration

### Phase 4: Intelligence & Automation
- [ ] Code analysis and suggestions
- [ ] Automated refactoring tools
- [ ] Smart dependency management
- [ ] Predictive tooling

---

## Technical Implementation Notes

### Resource URI Schemes

```
package://{name}              # Package information
package://{name}/dependencies # Package dependencies
graph://overview              # Dependency graph
config://{tool}               # Configuration files
docs://{category}/{page}      # Documentation
test://results/latest         # Test results
build://status                # Build status
```

### Prompt Parameters

All prompts should support:
- `context`: Additional context from user
- `targetPackage`: Package to operate on
- `options`: Tool-specific options
- `examples`: Request examples in response

### Sampling Integration

Use `CreateMessageRequest` for:
- Code generation based on patterns
- Documentation generation
- Migration suggestions
- Refactoring proposals

### Server Instruction Scoping

Instructions should be:
- Scoped by package type
- Scoped by file pattern
- Scoped by task type
- Overridable by user

---

## Future Considerations

### Possible Extensions
- **AI-Powered Code Review**: Automated PR reviews
- **Smart Dependency Resolution**: Optimal dependency versions
- **Performance Optimization**: Automated performance improvements
- **Documentation Generation**: Auto-generate from code
- **Migration Automation**: Automated framework/library upgrades
- **Security Monitoring**: Real-time security alerts
- **Cost Analysis**: Bundle and deployment cost tracking

### Integration Opportunities
- GitHub Actions integration
- Docker orchestration
- Database management
- Deployment automation
- Monitoring and observability
- Error tracking

---

## Contributing

When implementing new capabilities:

1. Update this roadmap with implementation status
2. Create corresponding tools/resources/prompts
3. Add tests for new functionality
4. Update AGENTS.md with usage guidelines
5. Document in README.md
6. Add examples of usage

## Notes

- All tools should return structured data when possible
- Resources should be cacheable where appropriate
- Prompts should guide users through complex tasks
- Sampling should respect project patterns and conventions
- Server instructions should be comprehensive but not restrictive
