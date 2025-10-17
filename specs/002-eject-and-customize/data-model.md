# Phase 1 Design: Data Model & Entities

**Date**: 2025-10-16  
**Status**: Design specification  
**Purpose**: Define entities, relationships, and validation rules for implementation

---

## Entity Model Overview

The Eject and Customize system manages three primary entity types:

1. **Template Features** - Removable/swappable components of the template
2. **Eject Configurations** - User selections and removal records
3. **Custom Modules** - Available modules and framework alternatives
4. **Operation Logs** - Records of operations for recovery and auditing

---

## FeatureManifest Entity

**Purpose**: Defines what should be removed when a feature is ejected

```typescript
interface FeatureManifest {
  // Metadata
  version: "1.0";
  feature: {
    id: string;                    // e.g., "orpc", "better-auth", "redis"
    name: string;                  // e.g., "ORPC API Layer"
    description: string;           // User-facing description
    version: string;               // Manifest version
    type: "api-framework" | "auth" | "cache" | "ui" | "service" | "utility";
    category?: string;             // e.g., "backend", "frontend", "infrastructure"
  };

  // File Operations
  files: {
    remove: {
      directories: string[];       // Full paths to remove recursively
      files: string[];             // Specific files to delete
      patterns: string[];          // Glob patterns to match (e.g., "*.orpc.ts")
    };
  };

  // Dependency Management
  dependencies: {
    remove: string[];              // npm package names to remove
    packageJsonFields: {
      scripts?: string[];          // Script names to remove (e.g., "generate")
      devDependencies?: string[];
      peerDependencies?: string[];
    };
  };

  // Configuration Cleanup
  configuration: {
    remove: {
      envVars?: string[];          // Environment variable names to remove
      configFiles: string[];       // Configuration files to delete
      configSections?: {           // Sections within files to remove
        [filePath: string]: string[];
      };
    };
  };

  // Documentation Updates
  documentation: {
    update: {
      readme?: string;             // Update instructions for README
      files: string[];             // Doc files to remove or update
    };
  };

  // Validation Rules
  validation: {
    requiredRemains: string[];     // Paths that MUST exist after removal
    incompatibleWith: string[];    // Features that can't be removed together
  };

  // Recovery Support
  rollback: {
    gitCommitMessage: string;      // Commit message for rollback
  };
}
```

**Validation Rules**:
- ✅ `feature.id` must be unique across all manifests
- ✅ All paths in `remove.directories` and `remove.files` must be relative to project root
- ✅ Glob patterns must be valid (validated with `glob` library)
- ✅ `requiredRemains` paths are validated to still exist after removal
- ✅ `incompatibleWith` features prevent removal if other selected features are listed

**State Transitions**:
```
NOT_LOADED → LOADED → VALIDATED → READY_FOR_REMOVAL → APPLIED → VALIDATED_POST_REMOVAL
```

**Database Considerations**: Manifests are stored as JSON files in `.eject-manifests/`, not in a database. Each manifest is independent and can be edited/added without system restarts.

---

## EjectConfiguration Entity

**Purpose**: Captures user selections and tracks removal operations

```typescript
interface EjectConfiguration {
  // Session metadata
  id: string;                      // UUID for this eject session
  timestamp: string;               // ISO 8601 timestamp
  version: "1.0";
  
  // User Selections
  features: {
    selected: {
      remove: string[];            // Feature IDs to remove
      keep: string[];              // Feature IDs to keep
    };
  };

  // Operation Tracking
  operations: {
    startedAt: string;
    completedAt?: string;
    status: "in-progress" | "completed" | "failed" | "rolled-back";
    steps: OperationStep[];
  };

  // Safety
  backup: {
    location: string;              // Path to backup (.eject-backup/{timestamp}/)
    filesCount: number;
    totalSize: number;             // Bytes
  };

  // Git Context
  git: {
    beforeEjectCommit: string;      // Git commit SHA before eject
    afterEjectCommit?: string;      // Commit after successful eject
    cleanWorkingTree: boolean;
  };

  // Rollback Information
  rollback?: {
    available: boolean;
    method: "git-reset" | "restore-from-backup";
    command: string;
  };
}

interface OperationStep {
  id: string;
  type: "manifest-load" | "pre-removal-analysis" | "file-removal" | "dependency-cleanup" | "config-update" | "doc-update" | "validation" | "git-commit";
  status: "pending" | "in-progress" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  details: {
    filesProcessed?: number;
    filesRemoved?: number;
    dependencies?: string[];
    errors?: string[];
  };
}
```

**Validation Rules**:
- ✅ `features.selected.remove` and `features.selected.keep` must not overlap
- ✅ At least one feature must be selected (can't eject nothing)
- ✅ `timestamp` must be valid ISO 8601
- ✅ `git.beforeEjectCommit` must be valid commit SHA (if git available)

**State Transitions**:
```
NOT_STARTED → MANIFEST_LOADED → READY_FOR_REMOVAL 
  → FILE_REMOVAL_IN_PROGRESS 
  → VALIDATION_IN_PROGRESS 
  → COMPLETED or FAILED
  
If FAILED: ROLLBACK_AVAILABLE
```

**Persistence**: EjectConfiguration saved to `.eject-recovery-{timestamp}.json` during operation for recovery purposes.

---

## CustomModule Entity

**Purpose**: Defines a module that can be added to the ejected project

```typescript
interface CustomModule {
  // Metadata
  id: string;                      // e.g., "stripe-integration"
  name: string;
  description: string;
  category: "integration" | "ui-addition" | "service-layer" | "framework-component";
  tags: string[];
  version: string;

  // Compatibility
  compatibility: {
    minTemplateVersion: string;    // e.g., "1.0.0"
    requiredFeatures: string[];    // e.g., ["better-auth"] - must be kept in eject
    incompatibleFeatures: string[]; // e.g., ["manual-payment-handling"]
  };

  // Installation
  installation: {
    type: "script" | "file-copy" | "npm-install" | "manual";
    script?: string;               // Path to install script
    dependencies?: {
      npm?: string[];              // Packages to install
      files?: {                     // Files to copy
        [source: string]: string;   // source → destination
      };
    };
  };

  // Integration Points
  integration: {
    modifiesFiles: string[];       // Files the module modifies (e.g., package.json)
    createsDirectories: string[];  // New directories created
    environmentVars?: string[];    // New env vars required
  };

  // Documentation
  documentation: {
    quickStart: string;            // Quick start instructions
    configurationSteps: string[];
    exampleUsage: string;
    links?: {
      [key: string]: string;
    };
  };
}

interface FrameworkSwap {
  id: string;                      // e.g., "orpc-to-trpc"
  name: string;
  description: string;
  fromFramework: string;           // e.g., "orpc"
  toFramework: string;             // e.g., "trpc"
  version: string;
  
  installation: {
    type: "script";
    script: string;                // Path to swap script
  };
  
  documentation: {
    preSwapChecklist: string[];
    postSwapValidation: string[];
  };
}
```

**Validation Rules**:
- ✅ `requiredFeatures` must exist in active template features
- ✅ `incompatibleFeatures` can't be satisfied by current project
- ✅ Installation script must be executable and exist
- ✅ `minTemplateVersion` compared against current template version

**State Transitions**:
```
REGISTERED → COMPATIBILITY_CHECK_PASSED → INSTALLATION_IN_PROGRESS → INSTALLED → VALIDATED
```

---

## OperationLog Entity

**Purpose**: Comprehensive record of eject/customize operations for auditing and debugging

```typescript
interface OperationLog {
  // Session metadata
  sessionId: string;               // Links to EjectConfiguration.id
  operationType: "eject" | "customize";
  timestamp: string;
  duration: number;                // Milliseconds

  // Detailed Changes
  changes: {
    filesRemoved: {
      path: string;
      reason: "manifest-explicit" | "manifest-pattern" | "dependency-cleanup" | "config-cleanup";
      size: number;
    }[];
    
    filesAdded?: {
      path: string;
      source: string;               // Where it came from (module, template, etc.)
      size: number;
    }[];
    
    dependencies: {
      type: "removed" | "added";
      packages: {
        name: string;
        oldVersion?: string;
        newVersion?: string;
      }[];
    };
    
    configurations: {
      file: string;
      type: "removed" | "modified" | "added";
      changes: string[];            // Brief description of changes
    }[];
  };

  // Results
  results: {
    success: boolean;
    message: string;
    errors?: {
      step: string;
      error: string;
      recoveryPath?: string;
    }[];
  };

  // Environment Context
  context: {
    nodeVersion: string;
    bunVersion: string;
    osType: string;
    gitAvailable: boolean;
    dockerContext?: boolean;
  };
}
```

**Retention Policy**: Logs kept for 30 days in `.eject-logs/` for debugging. Older logs can be archived.

---

## Relationship Diagram

```
FeatureManifest
    ↓ (defines removal for)
EjectConfiguration
    ↓ (produces)
OperationLog

CustomModule
    ↓ (requires)
EjectConfiguration (must have ejected first)
    ↓ (produces)
OperationLog

FrameworkSwap
    ↓ (can modify)
CustomModule (or replace it entirely)
```

---

## Validation & Constraints

### Pre-Eject Validation

- ✅ Git working tree is clean (no uncommitted changes)
- ✅ All selected feature manifests exist and are valid JSON
- ✅ No incompatible feature combinations selected
- ✅ Required infrastructure (apps/api, apps/web, core packages) not in removal list

### Post-Eject Validation

- ✅ All specified files/directories were removed
- ✅ All specified dependencies removed from package.json
- ✅ TypeScript compilation succeeds (`bun run type-check`)
- ✅ Required paths still exist (`requiredRemains`)
- ✅ No dangling imports or broken references

### Customize Validation

- ✅ Project has been ejected (marker file or git history check)
- ✅ Module compatibility satisfied (required features exist)
- ✅ Installation script executes without errors
- ✅ Post-installation TypeScript check passes
- ✅ Required environment variables documented

---

## Storage & Persistence

### Manifest Storage
- **Location**: `.eject-manifests/*.json`
- **Format**: JSON, validated against TypeScript schema
- **Lifecycle**: Persisted for template lifetime (reused across multiple ejects)

### Configuration Storage
- **Location**: `.eject-recovery-{timestamp}.json`
- **Format**: JSON
- **Lifecycle**: Retained for 30 days for recovery/auditing

### Operation Logs
- **Location**: `.eject-logs/{timestamp}.json`
- **Format**: JSON, compressed if >1MB
- **Lifecycle**: Retained for 30 days, then archived

### Backups
- **Location**: `.eject-backup/{timestamp}/{manifest-id}/*`
- **Format**: Original file format
- **Lifecycle**: Optional cleanup via `bun run eject:cleanup --age=7d`

---

## Type Safety & TypeScript Integration

All entities have TypeScript interfaces exported from `packages/eject-customize-manifests/`:

```typescript
// Consumer code can import and use
import type { 
  FeatureManifest, 
  EjectConfiguration, 
  CustomModule, 
  OperationLog 
} from '@repo/eject-customize-manifests';

// Validation functions
import { 
  validateManifest, 
  validateConfiguration, 
  validateModule 
} from '@repo/eject-customize-manifests';

// Example usage
const manifest: FeatureManifest = JSON.parse(manifestJson);
validateManifest(manifest); // Throws if invalid
```

---

## Success Mapping

| Data Model Feature | Success Criterion | How it helps |
|---|---|---|
| OperationStep tracking | SC-005 (80% task completion) | Detailed logging helps users understand progress |
| OperationLog archival | SC-004 (doc updates) | Provides audit trail for transparency |
| Backup storage | SC-006 (1-min rollback) | Quick restore from backup if needed |
| Compatibility checking | SC-002 (95% build success) | Prevents incompatible removals upfront |
| FeatureManifest schema | SC-007 (90% auto-detection) | Consistent, comprehensive feature definitions |

