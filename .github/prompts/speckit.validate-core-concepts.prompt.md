````prompt
---
description: Validate that a feature specification complies with all mandatory core concepts from .docs/core-concepts/
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/bash/check-prerequisites.sh --json` from repo root and parse FEATURE_DIR. All paths must be absolute.

2. **Load core concepts**: Read ALL files from `.docs/core-concepts/`:
   - `README.md` - Core concepts index and enforcement rules
   - `00-EFFICIENT-EXECUTION-PROTOCOL.md` - AI communication rule
   - `01-DOCUMENTATION-FIRST-WORKFLOW.md` - AI workflow rule
   - `02-SERVICE-ADAPTER-PATTERN.md` - Three-layer architecture
   - `03-REPOSITORY-OWNERSHIP-RULE.md` - Repository ownership
   - `04-CORE-VS-FEATURE-ARCHITECTURE.md` - Module organization
   - `05-TYPE-MANIPULATION-PATTERN.md` - Type inference preference
   - `06-README-FIRST-DOCUMENTATION-DISCOVERY.md` - Documentation navigation
   - `07-BETTER-AUTH-INTEGRATION.md` - Authentication pattern
   - `08-FILE-MANAGEMENT-POLICY.md` - File deletion policy
   - `09-ORPC-IMPLEMENTATION-PATTERN.md` - Contract-first API development
   - `10-DOCUMENTATION-MAINTENANCE-PROTOCOL.md` - Documentation updates

3. **Load feature specification**: From FEATURE_DIR or user-specified path, read:
   - `spec.md` - Feature requirements and user stories
   - `tasks.md` - Implementation tasks
   - `plan.md` - Technical approach (optional)
   - `data-model.md` - Entity definitions (optional)
   - `contracts/` - API contracts (optional)

4. **Execute compliance audit**: For each core concept, validate:

   **00-EFFICIENT-EXECUTION-PROTOCOL** (AI Rule):
   - ✅ This is an AI execution guideline, not a spec requirement
   - ⚠️ Note: Ensure AI follows silent context gathering during implementation

   **01-DOCUMENTATION-FIRST-WORKFLOW** (AI Rule):
   - ✅ This is an AI execution guideline, not a spec requirement
   - ⚠️ Note: Ensure AI reads docs before implementing

   **02-SERVICE-ADAPTER-PATTERN** (Architecture):
   - Check tasks.md for database access patterns
   - ✅ PASS: Tasks show Repository → Service → Adapter flow
   - ❌ FAIL: Tasks show controllers directly accessing DatabaseService
   - ⚠️ WARNING: Tasks don't mention adapter layer for contract transformation
   - 🔧 FIX: Update tasks to follow: Repository (data access) → Service (business logic) → Adapter (entity to contract) → Controller (uses @Implement)

   **03-REPOSITORY-OWNERSHIP-RULE** (Architecture):
   - Check data-model.md and tasks.md for repository creation
   - ✅ PASS: Repositories owned by domain services (e.g., CapsuleRepository in capsule feature)
   - ❌ FAIL: Generic repositories or shared repositories across features
   - 🔧 FIX: Create feature-specific repositories owned by that feature's service

   **04-CORE-VS-FEATURE-ARCHITECTURE** (Organization):
   - Check plan.md for module structure
   - ✅ PASS: Plan shows apps/api/src/core/ and apps/api/src/features/ separation
   - ❌ FAIL: No clear core vs feature distinction
   - 🔧 FIX: Organize shared infrastructure in core/, feature code in features/[domain]/

   **05-TYPE-MANIPULATION-PATTERN** (AI Rule):
   - ✅ This is an AI implementation guideline, not a spec requirement
   - ⚠️ Note: Ensure AI uses type inference (z.infer<>) over manual type definitions

   **06-README-FIRST-DOCUMENTATION-DISCOVERY** (AI Rule):
   - ✅ This is an AI execution guideline, not a spec requirement
   - ⚠️ Note: Ensure AI reads docs/README.md first for navigation

   **07-BETTER-AUTH-INTEGRATION** (Architecture):
   - Check spec.md and tasks.md for authentication patterns
   - ✅ PASS: Tasks use AuthService.api for all auth operations (no direct Better Auth access)
   - ❌ FAIL: Tasks show direct betterAuth.* calls in controllers
   - 🔧 FIX: All auth operations must use AuthService.api wrapper (apps/api/src/core/modules/auth/services/auth.service.ts)

   **08-FILE-MANAGEMENT-POLICY** (Policy):
   - Check tasks.md for file deletion or removal tasks
   - ✅ PASS: No file deletion tasks, or deletions have explicit user approval
   - ❌ FAIL: Tasks include file deletions without permission
   - 🔧 FIX: Remove deletion tasks or add "requires user approval" note

   **09-ORPC-IMPLEMENTATION-PATTERN** (Architecture - CRITICAL):
   - Check tasks.md for API endpoint implementation
   - ✅ PASS: Every API endpoint has 3 sequential tasks:
     1. Define contract in packages/api-contracts/
     2. Implement controller using @Implement(contract)
     3. Generate ORPC client: bun run web -- generate
   - ❌ FAIL: API endpoints implemented without contract-first pattern
   - ⚠️ WARNING: Contract definition and implementation not sequential (no generation step)
   - 🔧 FIX: Split each API endpoint into 3 tasks:
     - TXXXa: Define [feature]Contract in packages/api-contracts/
     - TXXXb: Implement using @Implement([feature]Contract.[method])
     - TXXXc: Generate ORPC client: bun run web -- generate

   **10-DOCUMENTATION-MAINTENANCE-PROTOCOL** (Policy):
   - Check tasks.md for documentation update tasks
   - ✅ PASS: Documentation tasks include parent README updates and link validation
   - ❌ FAIL: Documentation changes without README maintenance
   - 🔧 FIX: Add tasks to update parent README when adding/modifying docs

5. **Generate compliance report**: Create structured output with:

   ```markdown
   # Core Concepts Compliance Report
   
   **Feature**: [Feature name from spec.md]
   **Specification Path**: [Path to spec]
   **Audit Date**: [Current date]
   
   ## Summary
   
   - ✅ Compliant: X/11 core concepts
   - ❌ Violations: Y/11 core concepts
   - ⚠️ Warnings: Z/11 core concepts
   
   ## Detailed Findings
   
   ### 🔴 CRITICAL VIOLATIONS (Must fix before implementation)
   
   #### 09-ORPC-IMPLEMENTATION-PATTERN
   - **Issue**: API endpoints implemented without contract-first pattern
   - **Location**: tasks.md, Phase X
   - **Impact**: No end-to-end type safety, manual API client maintenance
   - **Fix**: Split endpoint tasks into: define contract → implement with @Implement → generate client
   
   #### 02-SERVICE-ADAPTER-PATTERN
   - **Issue**: Controllers directly access DatabaseService
   - **Location**: tasks.md, Task TXXX
   - **Impact**: Breaks layered architecture, tight coupling
   - **Fix**: Add adapter layer: Repository → Service → Adapter → Controller
   
   ### ⚠️ WARNINGS (Recommended improvements)
   
   #### 04-CORE-VS-FEATURE-ARCHITECTURE
   - **Issue**: No clear core vs feature separation in plan
   - **Location**: plan.md, Module Structure section
   - **Impact**: Potential code organization issues
   - **Fix**: Document core/ and features/ separation
   
   ### ✅ COMPLIANT (No action required)
   
   - 07-BETTER-AUTH-INTEGRATION: All auth uses AuthService.api wrapper
   - 08-FILE-MANAGEMENT-POLICY: No unauthorized file deletions
   - 03-REPOSITORY-OWNERSHIP-RULE: Domain-specific repositories
   
   ## Recommendations
   
   1. **Before Implementation**: Fix all CRITICAL violations
   2. **During Implementation**: Address warnings for better maintainability
   3. **Code Review**: Verify compliance with Service-Adapter and ORPC patterns
   4. **Post-Implementation**: Update documentation per core concept 10
   
   ## Next Steps
   
   1. Update tasks.md to fix ORPC violations (split endpoints into 3-step pattern)
   2. Update tasks.md to add adapter layer for Service-Adapter compliance
   3. Review plan.md to document core vs feature architecture
   4. Re-run validation: `/speckit.validate-core-concepts`
   ```

6. **Output format**:
   - Default: Formatted markdown report (as shown above)
   - With --json flag: Structured JSON for automated tooling
   - With --summary flag: One-line summary with pass/fail status

## Validation Rules

**Automatic Failures** (Block implementation):
- Missing ORPC contract-first pattern for any API endpoint
- Controllers directly accessing DatabaseService (violates Service-Adapter)
- Direct Better Auth calls instead of AuthService.api wrapper
- File deletions without explicit permission

**Warnings** (Recommend fix):
- Missing adapter layer in Service-Adapter pattern
- No core vs feature architecture documentation
- Documentation changes without parent README updates
- Repositories not clearly owned by domain services

**AI Guidelines** (Informational only):
- Core concepts 00, 01, 05, 06 are AI execution rules
- These don't require spec changes, just AI adherence during implementation

## Context Enhancement

When analyzing compliance:
1. Read ENTIRE core concept file for each concept (not just title)
2. Look for examples in core concept docs showing correct vs incorrect patterns
3. Reference copilot-instructions.md for additional architectural context
4. Check AGENTS.md files in packages for implementation patterns
5. Cross-reference with actual codebase structure (apps/api/src/)

## Reporting Standards

- **Clear severity levels**: CRITICAL (❌) vs WARNING (⚠️) vs COMPLIANT (✅)
- **Actionable fixes**: Specific task updates, not vague "follow pattern"
- **Location references**: Exact file and line/section where issue occurs
- **Impact explanation**: Why this matters for maintainability/type safety
- **Before/After examples**: Show incorrect pattern and correct fix

Context for validation: $ARGUMENTS

The compliance report should be immediately actionable - developers should know exactly what to fix before implementation begins.

````