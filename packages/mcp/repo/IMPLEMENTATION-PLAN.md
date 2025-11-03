# MCP Repo Manager - Implementation Plan

**Created**: 2025-11-03  
**Status**: Planning Phase  
**Based on**: MCP-CAPABILITIES-ROADMAP.md

---

## Overview

This plan outlines the phased implementation of comprehensive MCP capabilities for effective monorepo management. The implementation will be organized into focused phases, building on the existing foundation.

## Current State Assessment

### ✅ Already Implemented (Phase 0)

**Services**:
- `PackageService` - Basic package operations
- `CommandService` - Command execution
- `ScaffoldService` - Package scaffolding

**Tools**:
- `list-apps` - List all applications
- `list-packages` - List all packages
- `get-package-info` - Get package details
- `create-package` - Create new package
- `run-eslint` - Lint code
- `run-prettier` - Format code
- `run-typecheck` - Type check
- `run-tests` - Run tests
- `run-build` - Build packages
- `run-clean` - Clean artifacts
- `scaffold-config-package` - Scaffold config package
- `scaffold-bin-package` - Scaffold bin package
- `scaffold-mcp-package` - Scaffold MCP server
- `scaffold-ui-package` - Scaffold UI package
- `scaffold-contracts-package` - Scaffold contracts package
- `scaffold-types-package` - Scaffold types package

**Infrastructure**:
- NestJS application with MCP integration
- Zod v4 schema validation
- Bun runtime support
- Basic error handling

---

## Phase 1: Foundation Enhancement (Week 1-2)

**Goal**: Strengthen core functionality with Resources, enhanced package management, and dependency tools.

### 1.1 Resources Implementation

**New Service**: `ResourceService`

**Resources to Implement**:
```typescript
// Repository overview
- repo://summary             // High-level overview
- repo://apps               // List of apps with metadata
- repo://packages           // List of packages with metadata
- repo://structure          // Directory tree
- repo://stats              // Repository statistics

// Package information
- package://{name}          // Detailed package info
- package://{name}/dependencies
- package://{name}/dependents
- package://{name}/scripts
- package://{name}/files

// AGENTS.md index
- repo://agents             // List all AGENTS.md files
- repo://agent/root         // Root AGENTS.md
- repo://agent/apps/{name}  // App-specific AGENTS.md
- repo://agent/packages/{name} // Package-specific AGENTS.md
```

**Implementation Steps**:
1. Create `ResourceService` with resource registration methods
2. Create `ResourceProvider` class with `@Resource` decorators
3. Implement file system scanning for package metadata
4. Implement dependency graph parsing
5. Implement AGENTS.md discovery and parsing
6. Add caching mechanism for resources
7. Write unit tests for all resources

**Files to Create/Modify**:
- `src/services/resource.service.ts` (new)
- `src/providers/resource.provider.ts` (new)
- `src/app.module.ts` (modify - register ResourceProvider)
- `src/types/resource.types.ts` (new)

### 1.2 Enhanced Package Management

**Extend `PackageService`**:

**New Methods**:
```typescript
- updatePackage(name, updates)    // Update package.json fields
- deletePackage(name, confirm)    // Delete with safety checks
- renamePackage(old, new)         // Rename and update refs
- movePackage(name, newPath)      // Move to different location
```

**New Tools**:
```typescript
- update-package     // Update package.json
- delete-package     // Remove package (with confirm flag)
- rename-package     // Rename with reference updates
- move-package       // Move package location
```

**Implementation Steps**:
1. Extend `PackageService` with new methods
2. Add safety checks for destructive operations
3. Implement reference updating (imports, dependencies)
4. Add rollback mechanism for failed operations
5. Create new tool methods in `PackageToolsProvider`
6. Write comprehensive tests

**Files to Modify**:
- `src/services/package.service.ts`
- `src/tools/package.tools.ts`
- Add `src/utils/reference-updater.ts` (new)

### 1.3 Dependency Management

**New Service**: `DependencyService`

**Methods**:
```typescript
- addDependency(pkg, dep, version, type)
- removeDependency(pkg, dep)
- updateDependency(pkg, dep, version)
- listDependencies(pkg, includeDevDeps)
- checkUpdates(pkg)
- syncVersions(packages, dep)
- findCircular()
- analyzeDependencyGraph()
- listInternalDependencies()
```

**New Tools**:
```typescript
- add-dependency           // Add dependency to package
- remove-dependency        // Remove dependency
- update-dependency        // Update version
- list-dependencies        // List all dependencies
- check-dependency-updates // Check for updates
- sync-dependency-versions // Sync across packages
- find-circular-dependencies
- analyze-dependency-graph
- list-internal-dependencies
```

**Dependency Graph Resources**:
```typescript
- graph://overview         // Visual graph
- graph://package/{name}   // Package-specific
- graph://circular         // Circular deps
- graph://unused          // Unused deps
- graph://uses/{name}     // What this package uses
- graph://used-by/{name}  // What uses this package
```

**Implementation Steps**:
1. Create `DependencyService`
2. Implement package.json parsing and modification
3. Build dependency graph data structure
4. Implement circular dependency detection algorithm
5. Create visualization data for graph resources
6. Implement workspace protocol handling
7. Create `DependencyToolsProvider`
8. Add comprehensive tests

**Files to Create**:
- `src/services/dependency.service.ts`
- `src/tools/dependency.tools.ts`
- `src/utils/graph-builder.ts`
- `src/utils/circular-detector.ts`

### 1.4 Version Management

**Extend `PackageService` or create `VersionService`**:

**Methods**:
```typescript
- bumpVersion(pkg, type: 'major'|'minor'|'patch')
- syncVersions(packages)
- checkVersionConsistency()
```

**New Tools**:
```typescript
- bump-version              // Bump version
- sync-versions            // Sync across packages
- check-version-consistency // Validate consistency
```

**Implementation Steps**:
1. Implement semver version bumping
2. Add version consistency checker
3. Implement cross-package version sync
4. Create tools
5. Write tests

**Files to Create/Modify**:
- `src/services/version.service.ts` (new)
- `src/tools/version.tools.ts` (new)

**Phase 1 Deliverables**:
- ✅ 15+ new resources
- ✅ 20+ new tools
- ✅ 3 new services
- ✅ Comprehensive test coverage
- ✅ Updated documentation

---

## Phase 2: Development Workflow Enhancement (Week 3-4)

**Goal**: Add script management, enhanced command execution, and build/test resources.

### 2.1 Script Management

**New Service**: `ScriptService`

**Methods**:
```typescript
- addScript(pkg, name, command)
- removeScript(pkg, name)
- updateScript(pkg, name, command)
- listScripts(pkg)
- runScript(pkg, script, args)
```

**New Tools**:
```typescript
- add-script        // Add script to package
- remove-script     // Remove script
- update-script     // Update script command
- list-scripts      // List package scripts
- run-script        // Execute package script
```

**Resources**:
```typescript
- package://{name}/scripts  // Available scripts
```

**Implementation Steps**:
1. Create `ScriptService`
2. Implement package.json script manipulation
3. Add script execution with argument passing
4. Create `ScriptToolsProvider`
5. Write tests

**Files to Create**:
- `src/services/script.service.ts`
- `src/tools/script.tools.ts`

### 2.2 Enhanced Command Execution

**Extend `CommandService`**:

**New Methods**:
```typescript
- runTestFile(file)
- runTestCoverage(pkg)
- runE2ETests()
- runIntegrationTests()
- watchTests(pkg)
- updateSnapshots(pkg)
- runDev(target: 'api'|'web'|'all')
- runDockerUp(mode, target)
- runDockerDown()
- rebuildPackage(pkg)
- watchBuild(pkg)
```

**New Tools**:
```typescript
- run-test-file          // Run specific test
- run-test-coverage      // Generate coverage
- run-e2e-tests         // E2E tests
- run-integration-tests // Integration tests
- watch-tests           // Watch mode
- update-snapshots      // Update snapshots
- run-dev               // Start dev servers
- run-docker-up         // Docker up
- run-docker-down       // Docker down
- rebuild-package       // Clean rebuild
- watch-build          // Watch build
```

**Resources**:
```typescript
- command://history     // Recent commands
- command://running     // Active commands
- command://failed      // Failed commands
- build://status        // Build status
- build://cache         // Turbo cache
- build://logs/{pkg}    // Build logs
- test://results/latest // Test results
- test://coverage       // Coverage report
- test://failing        // Failing tests
```

**Implementation Steps**:
1. Extend `CommandService` with new methods
2. Implement command history tracking
3. Add progress reporting for long-running commands
4. Create command execution context
5. Implement build and test result parsing
6. Create resources for command status
7. Update `CommandToolsProvider`
8. Write tests

**Files to Modify/Create**:
- `src/services/command.service.ts` (modify)
- `src/tools/command.tools.ts` (modify)
- `src/utils/command-executor.ts` (new)
- `src/utils/result-parser.ts` (new)

### 2.3 Database Operations

**New Service**: `DatabaseService`

**Methods**:
```typescript
- runMigrations()
- seedDatabase()
- resetDatabase()
- generateSchema()
- pushSchema()
- openStudio()
```

**New Tools**:
```typescript
- db-migrate     // Run migrations
- db-seed        // Seed database
- db-reset       // Reset database
- db-generate    // Generate schema
- db-push        // Push schema
- db-studio      // Open studio
```

**Implementation Steps**:
1. Create `DatabaseService`
2. Integrate with Drizzle commands
3. Add environment validation
4. Create tools
5. Write tests

**Files to Create**:
- `src/services/database.service.ts`
- `src/tools/database.tools.ts`

### 2.4 Git Integration

**New Service**: `GitService`

**Methods**:
```typescript
- getStatus()
- getChangedFiles()
- getChangedPackages()
- createBranch(name)
- commit(message, files)
```

**New Tools**:
```typescript
- git-status          // Git status
- git-changed-files   // Changed files
- git-changed-packages // Changed packages
- git-create-branch   // New branch
- git-commit          // Commit changes
```

**Resources**:
```typescript
- git://status        // Current status
- git://changes       // Recent changes
- git://branch        // Current branch
```

**Implementation Steps**:
1. Create `GitService`
2. Implement git command wrappers
3. Add conventional commit formatting
4. Create tools
5. Write tests

**Files to Create**:
- `src/services/git.service.ts`
- `src/tools/git.tools.ts`

**Phase 2 Deliverables**:
- ✅ 25+ new tools
- ✅ 10+ new resources
- ✅ 4 new services
- ✅ Enhanced command execution
- ✅ Updated documentation

---

## Phase 3: Code Generation & Prompts (Week 5-6)

**Goal**: Implement code generation, scaffolding enhancements, and prompt templates.

### 3.1 Enhanced Scaffolding

**Extend `ScaffoldService`**:

**New Methods**:
```typescript
- scaffoldApp(type, name)
- scaffoldLibPackage(name)
- generateComponent(pkg, name, variant)
- generateHook(pkg, name)
- generateService(pkg, name)
- generateController(pkg, name)
- generateModule(pkg, name)
- generateORPCContract(pkg, name)
- generateORPCClientHook(pkg, name)
- generateRoute(name, params)
- generateTest(filePath, type)
```

**New Tools**:
```typescript
- scaffold-app              // New app
- scaffold-lib-package      // New lib
- generate-component        // React component
- generate-hook            // React hook
- generate-service         // NestJS service
- generate-controller      // NestJS controller
- generate-module          // NestJS module
- generate-orpc-contract   // ORPC contract
- generate-orpc-client-hook // Client hook
- generate-route           // Next.js route
- generate-test            // Test file
```

**Implementation Steps**:
1. Create template system
2. Extend `ScaffoldService`
3. Implement code generators for each type
4. Add template customization
5. Create `GeneratorToolsProvider`
6. Write tests

**Files to Modify/Create**:
- `src/services/scaffold.service.ts` (modify)
- `src/services/generator.service.ts` (new)
- `src/tools/generator.tools.ts` (new)
- `src/templates/` (new directory)

### 3.2 Template System

**New Service**: `TemplateService`

**Methods**:
```typescript
- getTemplate(type, variant)
- renderTemplate(template, data)
- listTemplates(category)
```

**Resources**:
```typescript
- template://package/{type}    // Package templates
- template://component/{variant} // Component templates
- template://test/{type}       // Test templates
- template://config/{tool}     // Config templates
- scaffold://package-types     // Available types
- scaffold://component-variants // Component types
- scaffold://examples          // Examples
```

**Implementation Steps**:
1. Create `TemplateService`
2. Design template format
3. Create base templates
4. Implement template rendering
5. Add template resources
6. Write tests

**Files to Create**:
- `src/services/template.service.ts`
- `src/templates/*.template.ts`

### 3.3 Prompt Implementation

**New Service**: `PromptService`

**Prompts to Implement**:
```typescript
// Package Management
- create-new-package          // Guide package creation
- add-package-dependency      // Guide dependency addition

// Code Review
- review-changes             // Review git changes
- review-pr                  // Review pull request

// Testing
- write-tests-for-file       // Generate tests
- improve-test-coverage      // Suggest coverage improvements

// Documentation
- document-package           // Generate docs
- update-agents-md          // Update AGENTS.md

// Refactoring
- refactor-component         // Suggest refactoring
- extract-shared-code        // Find duplicates

// Debugging
- debug-build-error         // Debug build failures
- debug-type-error          // Fix TypeScript errors
```

**Implementation Steps**:
1. Create `PromptService`
2. Design prompt template format
3. Implement each prompt with proper parameters
4. Add context gathering for prompts
5. Register prompts in MCP
6. Write tests

**Files to Create**:
- `src/services/prompt.service.ts`
- `src/providers/prompt.provider.ts`
- `src/prompts/*.prompt.ts`

**Phase 3 Deliverables**:
- ✅ 15+ code generation tools
- ✅ 12+ prompt templates
- ✅ Template system
- ✅ 3 new services
- ✅ Updated documentation

---

## Phase 4: Intelligence & Analysis (Week 7-8)

**Goal**: Add code analysis, metrics, and intelligent tooling.

### 4.1 Code Analysis

**New Service**: `AnalysisService`

**Methods**:
```typescript
- analyzeComplexity(pkg)
- findDuplication(pkg)
- findUnusedExports(pkg)
- findDeadCode(pkg)
- analyzeBundleSize(pkg)
```

**New Tools**:
```typescript
- analyze-complexity    // Code complexity
- find-duplication     // Code duplication
- find-unused-exports  // Unused exports
- find-dead-code       // Dead code
- analyze-bundle-size  // Bundle analysis
```

**Resources**:
```typescript
- analysis://complexity   // Complexity metrics
- analysis://duplication  // Duplication report
- analysis://unused-exports // Unused exports
- analysis://dead-code    // Dead code
- analysis://bundle-size  // Bundle size
```

**Implementation Steps**:
1. Create `AnalysisService`
2. Integrate with analysis tools (eslint, tsc, etc.)
3. Implement complexity metrics
4. Implement duplication detection
5. Create tools and resources
6. Write tests

**Files to Create**:
- `src/services/analysis.service.ts`
- `src/tools/analysis.tools.ts`
- `src/utils/complexity-analyzer.ts`
- `src/utils/duplication-finder.ts`

### 4.2 Metrics & Monitoring

**New Service**: `MetricsService`

**Methods**:
```typescript
- getBuildMetrics()
- getTestMetrics()
- getPackageSizes()
- generateMetricsReport()
```

**Resources**:
```typescript
- metrics://build-times    // Build performance
- metrics://test-times     // Test times
- metrics://package-sizes  // Package sizes
- metrics://complexity     // Code complexity
```

**Implementation Steps**:
1. Create `MetricsService`
2. Implement metrics collection
3. Add metrics storage/caching
4. Create visualization data
5. Create resources
6. Write tests

**Files to Create**:
- `src/services/metrics.service.ts`
- `src/utils/metrics-collector.ts`

### 4.3 Security & Validation

**New Service**: `SecurityService`

**Methods**:
```typescript
- auditDependencies()
- checkEnvSecurity()
- scanSecrets()
- validatePackageExports()
```

**New Tools**:
```typescript
- audit-dependencies      // Security audit
- check-env-security     // Validate env vars
- scan-secrets           // Find secrets
- validate-package-exports // Check exports
```

**Resources**:
```typescript
- security://audit-report   // Audit results
- security://vulnerabilities // Vulnerabilities
- security://env-violations // Env issues
```

**Implementation Steps**:
1. Create `SecurityService`
2. Integrate with npm/bun audit
3. Implement secret scanning
4. Create tools and resources
5. Write tests

**Files to Create**:
- `src/services/security.service.ts`
- `src/tools/security.tools.ts`

**Phase 4 Deliverables**:
- ✅ 15+ analysis tools
- ✅ 10+ metric resources
- ✅ 3 new services
- ✅ Security tooling
- ✅ Updated documentation

---

## Phase 5: Advanced Features (Week 9-10)

**Goal**: Add sampling, server instructions, and CI/CD integration.

### 5.1 Sampling Implementation

**New Service**: `SamplingService`

**Sampling Operations**:
```typescript
// Code Generation
- sampleComponentCode(spec)
- sampleTestCode(code, type)
- sampleORPCContract(spec)
- sampleMigrationCode(current, target)

// Documentation
- sampleReadme(pkgInfo)
- sampleApiDocs(contracts)
- sampleChangelog(changes)

// Configuration
- sampleTsConfig(pkgType)
- samplePackageJson(pkgType, deps)
```

**Implementation Steps**:
1. Create `SamplingService`
2. Design sampling templates
3. Implement context gathering for sampling
4. Integrate with MCP sampling API
5. Write tests

**Files to Create**:
- `src/services/sampling.service.ts`
- `src/providers/sampling.provider.ts`

### 5.2 Server Instructions

**Implementation**:

**Instructions to Add**:
```
- General repository context
- Package-specific context
- Code quality standards
- Architecture patterns
- Testing requirements
- Commit conventions
```

**Implementation Steps**:
1. Create instruction templates
2. Implement dynamic instruction loading
3. Add package-specific instructions
4. Register with MCP
5. Write tests

**Files to Create**:
- `src/instructions/` (new directory)
- `src/providers/instruction.provider.ts`

### 5.3 CI/CD Integration

**New Service**: `CIService`

**Methods**:
```typescript
- runCIChecks()
- simulateDeployment()
- checkDeploymentReadiness()
```

**New Tools**:
```typescript
- run-ci-checks            // Run CI locally
- simulate-deployment      // Simulate deploy
- check-deployment-readiness // Pre-deploy check
```

**Resources**:
```typescript
- ci://status              // CI status
- ci://recent-runs         // Recent runs
- deployment://history     // Deploy history
- deployment://environments // Env configs
```

**Implementation Steps**:
1. Create `CIService`
2. Implement local CI simulation
3. Add deployment validation
4. Create tools and resources
5. Write tests

**Files to Create**:
- `src/services/ci.service.ts`
- `src/tools/ci.tools.ts`

**Phase 5 Deliverables**:
- ✅ Sampling integration
- ✅ Server instructions
- ✅ CI/CD tooling
- ✅ 2 new services
- ✅ Final documentation update

---

## Implementation Guidelines

### Code Quality Standards

**For All Implementations**:
1. **TypeScript**: Strict typing, no `any` types
2. **Error Handling**: Comprehensive try-catch with meaningful messages
3. **Logging**: Use NestJS logger for debugging
4. **Testing**: 80%+ coverage for new code
5. **Documentation**: JSDoc comments for all public methods
6. **Validation**: Zod schemas for all inputs

### File Organization

```
src/
├── services/           # Business logic services
│   ├── package.service.ts
│   ├── dependency.service.ts
│   ├── resource.service.ts
│   └── ...
├── tools/             # MCP tool providers
│   ├── package.tools.ts
│   ├── dependency.tools.ts
│   └── ...
├── providers/         # MCP providers (resources, prompts, sampling)
│   ├── resource.provider.ts
│   ├── prompt.provider.ts
│   └── sampling.provider.ts
├── instructions/      # Server instruction templates
├── templates/         # Code generation templates
├── prompts/          # Prompt templates
├── utils/            # Utility functions
│   ├── graph-builder.ts
│   ├── circular-detector.ts
│   └── ...
├── types/            # Type definitions
│   ├── package.types.ts
│   ├── resource.types.ts
│   └── ...
├── app.module.ts
└── main.ts
```

### Testing Strategy

**Test Files**:
```
test/
├── unit/
│   ├── services/
│   ├── tools/
│   └── utils/
├── integration/
│   ├── tools/
│   └── resources/
└── e2e/
    └── workflows/
```

**Test Coverage Goals**:
- Services: 90%+
- Tools: 85%+
- Utils: 95%+
- Overall: 80%+

### Documentation Requirements

**For Each Phase**:
1. Update `README.md` with new tools/resources
2. Update `AGENTS.md` with usage examples
3. Create `CHANGELOG.md` entries
4. Add JSDoc comments to all public APIs
5. Create examples in `examples/` directory

---

## Success Metrics

### Phase Completion Criteria

**Each phase must achieve**:
- ✅ All planned tools implemented
- ✅ All planned resources implemented
- ✅ Test coverage targets met
- ✅ Documentation updated
- ✅ Manual testing completed
- ✅ Code review passed

### Overall Project Success

**By project completion**:
- ✅ 100+ tools implemented
- ✅ 50+ resources available
- ✅ 15+ prompt templates
- ✅ Sampling integration complete
- ✅ Server instructions comprehensive
- ✅ 80%+ test coverage
- ✅ Complete documentation
- ✅ Working examples for all features

---

## Risk Management

### Identified Risks

1. **Complexity Creep**: Too many features making maintenance difficult
   - **Mitigation**: Modular design, clear service boundaries

2. **Performance**: Resource-intensive operations slowing down MCP
   - **Mitigation**: Caching, lazy loading, background processing

3. **Breaking Changes**: New features breaking existing functionality
   - **Mitigation**: Comprehensive testing, versioning

4. **Scope Creep**: Feature requests during implementation
   - **Mitigation**: Strict phase planning, change request process

### Dependencies

**Critical Dependencies**:
- `@rekog/mcp-nest` - MCP integration (stable)
- `zod` v4 - Validation (stable)
- NestJS - Framework (stable)

**Risk**: Breaking changes in dependencies
**Mitigation**: Pin versions, test before upgrading

---

## Next Steps

### Immediate Actions (This Week)

1. **Review and Approve Plan**
   - Stakeholder review
   - Adjust timeline if needed

2. **Setup Phase 1 Infrastructure**
   - Create branch: `feature/mcp-phase-1`
   - Setup test infrastructure
   - Create base files

3. **Begin Phase 1 Implementation**
   - Start with `ResourceService`
   - Implement repo://summary resource
   - Create first resource tests

### Week-by-Week Milestones

- **Week 1**: Phase 1.1 (Resources) complete
- **Week 2**: Phase 1.2-1.4 (Package & Dependency) complete
- **Week 3**: Phase 2.1-2.2 (Scripts & Commands) complete
- **Week 4**: Phase 2.3-2.4 (Database & Git) complete
- **Week 5**: Phase 3.1-3.2 (Generation & Templates) complete
- **Week 6**: Phase 3.3 (Prompts) complete
- **Week 7**: Phase 4.1-4.2 (Analysis & Metrics) complete
- **Week 8**: Phase 4.3 (Security) complete
- **Week 9**: Phase 5.1-5.2 (Sampling & Instructions) complete
- **Week 10**: Phase 5.3 (CI/CD) complete

---

## Appendix

### Tool Naming Conventions

- Use kebab-case: `add-dependency`, `run-tests`
- Verb-noun pattern: `create-package`, `list-packages`
- Consistent prefixes: `run-*`, `list-*`, `create-*`, `analyze-*`

### Resource URI Conventions

- Protocol prefixes: `repo://`, `package://`, `graph://`, `metrics://`
- Hierarchical paths: `package://{name}/dependencies`
- Consistent naming: lowercase, hyphenated

### Zod Schema Patterns

```typescript
// Tool parameters
z.object({
  name: z.string().describe('Package name'),
  optional: z.string().optional().describe('Optional param'),
})

// Resource responses
z.object({
  data: z.unknown(),
  metadata: z.object({
    timestamp: z.string(),
    source: z.string(),
  }),
})
```

### Error Response Format

```typescript
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Human readable message',
    details: { ... }
  }
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-03  
**Next Review**: Start of each phase
