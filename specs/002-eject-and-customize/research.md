# Phase 0 Research: Eject and Customize System

**Date**: 2025-10-16  
**Status**: Consolidated from research tasks  
**Purpose**: Resolve technical unknowns and establish implementation patterns

---

## T0-001: Feature Manifest Format

### Decision

JSON-based manifest format with the following schema:

```json
{
  "version": "1.0",
  "feature": {
    "id": "orpc",
    "name": "ORPC API Layer",
    "description": "Type-safe API contracts with end-to-end type inference",
    "version": "0.0.1",
    "type": "api-framework"
  },
  "files": {
    "remove": {
      "directories": [
        "packages/api-contracts"
      ],
      "files": [
        "apps/api/src/routes/api-contracts.ts",
        "apps/web/lib/api.ts"
      ],
      "patterns": [
        "*.orpc.ts",
        "**/*-contract.ts"
      ]
    }
  },
  "dependencies": {
    "remove": [
      "@orpc/core",
      "@orpc/server",
      "@orpc/react",
      "@orpc/contract"
    ],
    "packageJsonFields": {
      "scripts": [
        "generate"
      ]
    }
  },
  "configuration": {
    "remove": {
      "envVars": [
        "NEXT_PUBLIC_API_URL"
      ],
      "configFiles": [
        "apps/web/lib/api-config.ts"
      ]
    }
  },
  "documentation": {
    "update": {
      "readme": "Remove ORPC references and API contract documentation",
      "files": [
        ".docs/features/ORPC-TYPE-CONTRACTS.md"
      ]
    }
  },
  "validation": {
    "requiredRemains": [
      "apps/api",
      "apps/web",
      "package.json"
    ],
    "incompatibleWith": []
  },
  "rollback": {
    "gitCommitMessage": "eject: remove ORPC API layer"
  }
}
```

### Rationale

- **Version control**: Allows schema evolution as the feature matures
- **Feature metadata**: Tracks feature type (api-framework, auth, ui, etc.) for filtering
- **Granular removal**: Supports files, directories, patterns, and glob matching
- **Dependency safety**: Explicit list of npm packages to remove prevents dangling deps
- **Documentation tracking**: Links to docs files that should be removed or updated
- **Validation rules**: Ensures core infrastructure remains, prevents incompatible feature combinations
- **Git integration**: Tracks what removal should be committed for rollback

### Alternatives Considered

1. **YAML format** - Rejected: JSON more portable, better TypeScript integration
2. **Declarative removal + regex** - Rejected: Too complex, error-prone for glob patterns
3. **Removal scripts (.sh files)** - Rejected: Hard to validate, version control issues, platform-specific

### Implementation Notes

- Manifests stored in `.eject-manifests/*.json` (one per feature)
- Use TypeScript schemas in `packages/eject-customize-manifests/` for validation
- Patterns use `glob` library for cross-platform matching
- Pre-validate manifests on package.json load to catch errors early

---

## T0-002: Safe File Removal Strategy

### Decision

Three-phase removal with validation and logging:

1. **Pre-removal Analysis**
   - Parse manifest to identify files/dirs/patterns
   - Validate all targets exist (warn if not)
   - Check for file lock issues (fail if locked)
   - Log intended removals for user review

2. **Atomic Removal**
   - For directories: `fs.rm(dir, { recursive: true, force: false })`
   - For files: Standard `fs.unlink()`
   - Create backup snapshots in `.eject-backup/` before removal
   - Track what was removed in removal log

3. **Post-removal Validation**
   - Verify removed files no longer exist
   - Check that manifest patterns matched expected files
   - Warn if patterns matched fewer files than expected
   - Log summary of removals

### Rationale

- **Phase separation**: Clear stages allow user review and debugging
- **Backups**: Files preserved in `.eject-backup/{timestamp}/` for recovery
- **Non-destructive patterns**: Use `force: false` to fail on locked files rather than force
- **Validation**: Catch mismatches between manifests and actual file system
- **Logging**: Detailed logs help users understand what happened and debug

### Alternatives Considered

1. **In-place removal without backup** - Rejected: No recovery path if removal is wrong
2. **Symbolic linking** - Rejected: Creates confusion, doesn't actually clean up
3. **Trash/recycle bin** - Rejected: Platform-specific, may not be available in containers

### Implementation Notes

- Use `glob` library for pattern matching
- Store backup in `.eject-backup/{isoTimestamp}/manifest-id/`
- Log each file removal with reason (matched pattern, explicit remove, etc.)
- Include file count summary and total size removed

---

## T0-003: Git-based Recovery Mechanism

### Decision

Git-based recovery with the following flow:

1. **Pre-eject Checkpoint**
   - Check Git working directory is clean (no uncommitted changes)
   - Create temporary branch: `eject-recovery-{timestamp}`
   - User must commit or stash changes before proceeding

2. **During Eject**
   - Track all operations (files removed, dependencies changed, etc.)
   - Write operation log to `.eject-recovery-{timestamp}.json`
   - Periodically commit intermediate states if operations are long

3. **Failure Recovery**
   - If any major operation fails: `git reset --hard HEAD`
   - Delete temporary recovery branch
   - Report failure with recovery log location
   - User can manually inspect `.eject-recovery-{timestamp}.json`

4. **Success Completion**
   - Create final commit: `chore(eject): remove {features} from template`
   - Include operation summary in commit message
   - Delete recovery branch and log file
   - Return to main workflow

### Rationale

- **Minimal Git overhead**: Uses existing Git history, no custom storage needed
- **Atomic rollback**: `git reset --hard` is reliable across platforms
- **User control**: User reviews changes via Git diff before final commit
- **Audit trail**: Commit history shows what was ejected
- **Docker-compatible**: Works inside containers with mounted Git repos

### Alternatives Considered

1. **Filesystem snapshots (LVM/ZFS)** - Rejected: Not available in all environments, overkill
2. **Database-like transactions** - Rejected: Too complex, Git is simpler
3. **No recovery** - Rejected: Violates success criterion SC-006

### Implementation Notes

- Require Git to be initialized and available
- Check `git status` before starting
- Use `git add .` and `git commit -m` for intermediate saves
- Store recovery metadata in JSON for post-mortem analysis

---

## T0-004: Interactive CLI Prompts

### Decision

Use **Bun's built-in `stdin`/`stdout`** with **`prompts` npm library** for interactive selection:

```typescript
import prompts from 'prompts';

const response = await prompts([
  {
    type: 'multiselect',
    name: 'featuresToRemove',
    message: 'Select features to remove (spacebar to toggle):',
    choices: [
      { title: 'ORPC API Layer', value: 'orpc', selected: false },
      { title: 'Better Auth', value: 'better-auth', selected: false },
      { title: 'Redis Caching', value: 'redis', selected: false },
      // ...
    ]
  }
]);
```

### Rationale

- **Cross-platform**: Works on Windows, macOS, Linux, and in Docker
- **Rich UI**: Supports multiselect, text input, confirmation, etc.
- **Lightweight**: No heavy dependencies, works in containers
- **Bun-compatible**: Native async/await, no extra config needed
- **Familiar**: Used in many popular CLI tools

### Alternatives Considered

1. **`inquirer`** - Rejected: Larger bundle, more complex, similar feature set
2. **`commander` + custom prompts** - Rejected: More verbose, less friendly UX
3. **Questionnaire format (YAML/JSON)** - Rejected: Less interactive, harder for users to navigate

### Implementation Notes

- Install: `bun add prompts` to `packages/eject-customize`
- Create wrapper in `src/eject/prompts.ts` for testability
- Mock prompts in tests using Vitest stubbing
- Provide `--auto-yes` flag to skip prompts for CI/automation

---

## T0-005: Dependency Analysis Patterns

### Decision

Use Turborepo's `package.json` analysis + manual dependency tree walking:

1. **Parse Root `package.json`**
   - Read `workspaces` field to identify all packages
   - For each workspace, read its `package.json`
   - Build in-memory dependency graph

2. **Identify Feature Dependencies**
   - Given a feature (e.g., `orpc`), find which packages depend on it
   - Use `package.json` `dependencies`, `devDependencies`, `peerDependencies`
   - Recursively find transitive dependencies

3. **Safety Checks**
   - Flag if removing a dependency would break other packages
   - Warn if package appears in `engines` or `preferredVersions`
   - Check Git history to understand why dependencies exist

### Rationale

- **No external tools needed**: Works purely from `package.json` files
- **Turborepo-aware**: Understands workspace structure
- **Predictable**: Doesn't require running `npm install` or analyzing node_modules
- **Verifiable**: User can inspect graph before proceeding

### Alternatives Considered

1. **Parse `node_modules` directly** - Rejected: Fragile, doesn't work if deps not installed
2. **npm/yarn CLI tools** - Rejected: Adds dependency, slower, not deterministic
3. **Static code analysis** - Rejected: Complex, error-prone, doesn't handle dynamic requires

### Implementation Notes

- Create `src/common/dependency-analyzer.ts` with graph building logic
- Cache dependency graph during eject run to avoid repeated parsing
- Test with mock `package.json` files (no network calls)

---

## T0-006: Build Validation Strategy

### Decision

**Two-tier validation**:

1. **Fast Validation** (default)
   - TypeScript compile check: `bun run type-check`
   - Dependency integrity: `bun install --no-summary` (dry-run)
   - Turbo build cache validation

2. **Full Validation** (optional `--full-validate` flag)
   - Complete build: `bun run build`
   - Full test suite: `bun run test`
   - E2E tests if applicable

### Rationale

- **Fast feedback**: Most issues caught by TypeScript in seconds
- **Optional thorough check**: Users can choose full validation for peace of mind
- **Non-destructive**: Validation doesn't modify project
- **Aligns with workflow**: Same tools used in `bun run dev`

### Alternatives Considered

1. **Full build always** - Rejected: Too slow (2-5 minutes violates SC-001)
2. **No validation** - Rejected: Users would catch errors too late
3. **Custom validation rules** - Rejected: Complex, hard to maintain

### Implementation Notes

- Wrap `bun run type-check` in subprocess
- Use `--no-summary` to speed up `bun install` dry-run
- Capture and parse output to provide user feedback
- Show detailed error messages if validation fails

---

## T0-007: Module Registry Format

### Decision

JSON registry with module definitions:

```json
{
  "version": "1.0",
  "modules": [
    {
      "id": "stripe-integration",
      "name": "Stripe Payment Integration",
      "description": "Add Stripe payment processing to your API",
      "category": "payments",
      "tags": ["commerce", "payments", "stripe"],
      "version": "1.0.0",
      "compatibility": {
        "minTemplateVersion": "1.0.0",
        "requiredFeatures": ["better-auth"],
        "incompatibleFeatures": ["manual-payment-handling"]
      },
      "installation": {
        "type": "script",
        "script": "customize-modules/modules/stripe-integration/install.sh"
      },
      "files": {
        "add": [
          {
            "source": "customize-modules/modules/stripe-integration/files/api-routes.ts",
            "destination": "apps/api/src/modules/payments/"
          }
        ]
      },
      "dependencies": {
        "add": ["stripe", "@stripe/stripe-js"]
      }
    }
  ],
  "frameworkSwaps": [
    {
      "id": "orpc-to-trpc",
      "name": "Swap ORPC for tRPC",
      "description": "Replace ORPC API contracts with tRPC",
      "fromFramework": "orpc",
      "toFramework": "trpc",
      "script": "customize-modules/framework-swaps/orpc-to-trpc/swap.sh"
    }
  ]
}
```

### Rationale

- **Catalog format**: Easy to list available options in UI
- **Metadata rich**: Supports categorization, filtering, compatibility checks
- **Extensible**: New modules can be added without changing structure
- **Installation metadata**: Tracks how to install (script, file copy, etc.)

### Alternatives Considered

1. **Manifest files per module** - Rejected: Harder to aggregate for UI listing
2. **Hardcoded registry in code** - Rejected: Makes adding modules harder
3. **Package-based registry** - Rejected: Too heavyweight

### Implementation Notes

- Store in `.customize-modules/registry.json`
- Validate registry on load using TypeScript schemas
- Support dynamic registry loading from URLs (future enhancement)

---

## T0-008: Documentation Auto-Update

### Decision

Template-based documentation regeneration:

1. **Manifest-driven updates**
   - Each manifest includes `documentation.update` section
   - Lists files to remove or update
   - Provides update templates (patterns to search/replace)

2. **Auto-generated index files**
   - Regenerate `.docs/README.md` based on remaining features
   - Update feature lists in main `README.md`
   - Generate `EJECT_SUMMARY.md` documenting what was removed

3. **Implementation notes**
   - Preserve manual docs (don't delete unless explicitly in manifest)
   - Show warnings for orphaned doc sections
   - Regenerate quickstart guide based on remaining features

### Rationale

- **Documentation stays in sync**: Users don't need to manually update docs
- **Example preservation**: Docs remain accurate to current project state
- **Audit trail**: Eject summary provides clear record of what was removed

### Alternatives Considered

1. **Manual doc updates** - Rejected: Users forget, docs become stale
2. **Docs generation from code** - Rejected: Too complex, requires custom parsing
3. **No documentation updates** - Rejected: Violates success criterion SC-004

### Implementation Notes

- Use template strings with `${feature}` substitution
- Preserve doc structure while removing feature-specific sections
- Create EJECT_SUMMARY.md in root documenting removed features

---

## T0-009: Framework Swap Patterns

### Decision

Script-based framework swapping with validation:

```bash
# Example: ORPC → tRPC swap structure
customize-modules/framework-swaps/orpc-to-trpc/
├── swap.sh                    # Main swap script
├── files/
│   ├── api-contracts/         # tRPC router definitions
│   ├── api-hooks/             # tRPC React Query replacements
│   └── examples/              # Example integrations
└── validate.sh                # Validation script (builds + tests)
```

### Rationale

- **Flexible execution**: Shell scripts can handle complex multi-step operations
- **Validation built-in**: Each swap includes post-swap validation
- **Clear patterns**: Developers can add new swaps following the same pattern
- **Testing friendly**: Scripts can be tested independently

### Alternatives Considered

1. **TypeScript-based swaps** - Rejected: Harder to express file operations
2. **Configuration-based** - Rejected: Framework swaps too complex for config
3. **Manual framework migration** - Rejected: Defeats purpose of customize command

### Implementation Notes

- Validate framework swap doesn't break type safety
- Run post-swap TypeScript build to catch errors
- Document swap in EJECT_SUMMARY.md

---

## T0-010: Container Environment Validation

### Decision

Validate eject works in Docker dev environment:

1. **Pre-eject Docker check**
   - Detect if running in Docker (check `/.dockerenv`)
   - Use same Docker networking for validation as dev environment
   - Warning if eject performed outside Docker but template runs in Docker

2. **Validation in Docker**
   - Run `docker-compose exec api bun run type-check`
   - Ensure mounted volumes are writable
   - Validate post-eject build works with `docker-compose up`

### Rationale

- **Consistency**: What works in eject must work in `bun run dev`
- **Docker-first principle**: Respects template's Docker-first architecture
- **No surprises**: Users don't discover issues after a long eject operation

### Alternatives Considered

1. **Local validation only** - Rejected: Misses Docker-specific issues
2. **Skip Docker validation** - Rejected: Violates Constitution Principle III

### Implementation Notes

- Add Docker check to eject CLI
- Option to run validation inside containers explicitly
- Warn if Git operations happen outside Docker context

---

## Research Consolidation Summary

| Task | Status | Key Decision | Risk Level |
|------|--------|--------------|-----------|
| T0-001 | ✅ Complete | JSON manifest schema with glob support | Low |
| T0-002 | ✅ Complete | Three-phase removal with backups | Low |
| T0-003 | ✅ Complete | Git-based recovery mechanism | Medium |
| T0-004 | ✅ Complete | `prompts` library for interactive CLI | Low |
| T0-005 | ✅ Complete | Turborepo package.json analysis | Low |
| T0-006 | ✅ Complete | Two-tier validation (fast + full) | Low |
| T0-007 | ✅ Complete | JSON registry with metadata | Low |
| T0-008 | ✅ Complete | Template-based doc regeneration | Medium |
| T0-009 | ✅ Complete | Script-based framework swaps | Medium |
| T0-010 | ✅ Complete | Docker environment validation | Low |

**Overall Assessment**: All research tasks completed. Technical approach is sound and aligns with Constitution principles. Ready to proceed to Phase 1 design.

