# 🧠 Memory Bank: @repo/env-template-prompter

## 📋 Project Overview

**Package Name:** `@repo/env-template-prompter`  
**Purpose:** A sophisticated TypeScript package for interactive environment configuration from `.env.template` files  
**Architecture:** Service-based with dependency injection (NestJS-inspired)  
**Testing:** Vitest for all testing scenarios  
**APIs:** Both CLI and programmatic interfaces  

## 🎯 Goals & Objectives

### Primary Goals
1. **Convert existing init.js script** into a professional TypeScript package
2. **Implement service-based architecture** with dependency injection
3. **Create plugin system** for custom transformers
4. **Provide dual APIs** (CLI + programmatic)
5. **Achieve 100% test coverage** with Vitest
6. **Maintain backward compatibility** with existing .env.template format

### Key Features to Preserve
- ✅ Template parsing with complex syntax: `{{type|param=value|param2=value2}}`
- ✅ Group-based organization (explicit + auto-detection fallback)
- ✅ Transformer system (extract_port, extract_hostname, cors_origins, etc.)
- ✅ Variable references and dependencies (@{VAR}, ${expression})
- ✅ Skip/auto-derive logic for dependent fields
- ✅ Debug mode with comprehensive logging
- ✅ Beautiful CLI output with colors and progress

### New Features to Add
- 🆕 Plugin architecture for custom transformers
- 🆕 Programmatic API for integration
- 🆕 Comprehensive test suite
- 🆕 Type safety throughout
- 🆕 Documentation and examples

## 🏗️ Implementation Phases

### Phase 1: Foundation Setup ⏳
**Status:** Planning  
**Tasks:**
- [ ] Create package structure
- [ ] Setup TypeScript configuration
- [ ] Configure Vitest testing
- [ ] Setup basic build system
- [ ] Create core type definitions

### Phase 2: Service Implementation ⏳
**Status:** Not Started  
**Tasks:**
- [ ] Implement TemplateParserService
- [ ] Implement ValidationService  
- [ ] Implement TransformerService with plugin architecture
- [ ] Implement GroupingService
- [ ] Implement ConfigService
- [ ] Implement PromptService
- [ ] Implement OutputService

### Phase 3: Integration & Orchestration ⏳
**Status:** Not Started  
**Tasks:**
- [ ] Create EnvTemplatePrompter main class
- [ ] Implement dependency injection container
- [ ] Create CLI interface
- [ ] Create programmatic API
- [ ] Add debug utilities

### Phase 4: Testing & Documentation ⏳
**Status:** Not Started  
**Tasks:**
- [ ] Write unit tests for all services
- [ ] Create integration tests
- [ ] Add E2E testing scenarios
- [ ] Write comprehensive documentation
- [ ] Create usage examples

### Phase 5: Integration & Migration ⏳
**Status:** Not Started  
**Tasks:**
- [ ] Update root project to use new package
- [ ] Migrate existing .env.template
- [ ] Update turbo.json configuration
- [ ] Deprecate old init.js script

## 🔧 Technical Implementation Details

### Service Dependencies Map
```
EnvTemplatePrompter (Main Orchestrator)
├── ConfigService (no dependencies)
├── TemplateParserService → ConfigService
├── ValidationService → ConfigService
├── TransformerService → ValidationService, ConfigService
├── GroupingService → ConfigService
├── PromptService → ValidationService, TransformerService, ConfigService
└── OutputService → ConfigService
```

### Plugin Architecture
- **Transformer Plugins:** Custom logic for field transformation
- **Validator Plugins:** Custom validation rules
- **Prompt Plugins:** Custom prompt types
- **Output Plugins:** Custom output formats

### Configuration Strategy
- All configuration embedded in `.env.template` files
- `SYSTEM_ENV_TEMPLATE_CONFIG` variable for explicit groups
- CLI flags for runtime behavior (debug, help)
- No external configuration files needed

### Testing Strategy
- **Unit Tests:** Each service tested in isolation with mocked dependencies
- **Integration Tests:** Service interactions and workflows
- **E2E Tests:** Complete CLI scenarios with fixture templates
- **Plugin Tests:** Custom plugin validation and registration

## 📊 Current State Analysis

### Existing Functionality (from init.js)
1. **Template Parsing:** ✅ Complex syntax parsing
2. **Validation:** ✅ URL, number, string, boolean validation
3. **Transformers:** ✅ 6 built-in transformers
4. **Grouping:** ✅ Explicit + auto-detection
5. **Prompting:** ✅ Interactive CLI with prompts library
6. **Output:** ✅ .env file generation with comments
7. **Debug:** ✅ Comprehensive debug logging

### Migration Complexity
- **High:** Service architecture refactoring
- **Medium:** Type system implementation
- **Medium:** Plugin system architecture
- **Low:** Feature preservation

## 🚧 Known Challenges

1. **Transformer Context:** Ensuring proper variable resolution in grouped scenarios
2. **Plugin API Design:** Balancing flexibility with type safety
3. **Testing Complexity:** Mocking interactive prompts
4. **Migration Path:** Maintaining backward compatibility
5. **Performance:** Handling large .env.template files

## 📝 Notes & Decisions

### Architectural Decisions
- **Dependency Injection:** Manual injection (no heavy DI container)
- **Error Handling:** Service-level error boundaries
- **Async Patterns:** Promise-based APIs throughout
- **Plugin Registration:** Runtime registration with type validation

### Code Quality Standards
- **TypeScript Strict Mode:** Enabled
- **ESLint:** Airbnb configuration
- **Prettier:** Standard formatting
- **Test Coverage:** Minimum 90%
- **Documentation:** JSDoc for all public APIs

---

**Last Updated:** July 14, 2025  
**Next Review:** After Phase 1 completion
