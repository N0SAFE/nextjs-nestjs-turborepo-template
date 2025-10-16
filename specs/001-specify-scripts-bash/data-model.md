# Data Model: Documentation Structure Reorganization

**Phase**: Phase 1 (Design & Contracts)  
**Date**: 2025-10-16  
**Purpose**: Define the entities and relationships that comprise the new documentation structure

---

## Entity Definitions

### 1. DocumentationCategory

**Purpose**: Represents the 5 main organizational categories for documentation

**Attributes**:
- `id` (string): Unique identifier (e.g., "CORE_CONCEPTS", "GUIDES", "FEATURES", "PLANNING", "REFERENCE", "DEPRECATED")
- `name` (string): Display name (e.g., "Core Concepts", "Guides", "Features", "Planning", "Reference", "Deprecated")
- `slug` (string): URL-friendly identifier (e.g., "core-concepts", "guides", "features", "planning", "reference", "deprecated")
- `description` (string): Explanation of category purpose and contents
- `directory` (string): Path relative to `/docs/` (e.g., "core-concepts", "guides", "features", "planning", "reference", "deprecated")
- `mandatory` (boolean): Whether reading this category is mandatory for all developers/LLMs (true for CORE_CONCEPTS, false for others)
- `readingOrder` (number): Position in recommended reading order (1-6)
- `isMutable` (boolean): Whether documents in this category can be added/removed/modified (false for CORE_CONCEPTS, true for others)

**Validation**:
- All categories must have unique `id` and `slug`
- `directory` must be a valid subdirectory name
- `readingOrder` must be between 1-6 and unique across all categories

**Example**:
```yaml
id: "CORE_CONCEPTS"
name: "Core Concepts"
slug: "core-concepts"
description: "Non-negotiable architectural patterns and principles mandatory for all development"
directory: "core-concepts"
mandatory: true
readingOrder: 1
isMutable: false
```

---

### 2. DocumentationFile

**Purpose**: Represents an individual documentation file

**Attributes**:
- `id` (string): Unique identifier (e.g., "09-ORPC-IMPLEMENTATION-PATTERN")
- `filename` (string): File name with extension (e.g., "09-ORPC-IMPLEMENTATION-PATTERN.md")
- `path` (string): Full path relative to `/docs/` (e.g., "core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md")
- `title` (string): Human-readable title (e.g., "ORPC Implementation Pattern")
- `category` (DocumentationCategory): Which category this file belongs to
- `description` (string): Brief description (1-2 sentences) of file purpose
- `status` (enum): Current status - ACTIVE, DEPRECATED, ARCHIVED, DRAFT
- `priority` (number): Importance/reading priority within category (1-high to 3-low)
- `prerequisites` (array[DocumentationFile]): Files that should be read first
- `relatedFiles` (array[DocumentationFile]): Cross-referenced related files
- `tags` (array[string]): Searchable tags (e.g., ["ORPC", "API", "type-safety"])
- `lastUpdated` (date): Date of last modification
- `enforceability` (enum): How this is enforced - MANDATORY_CODE_REVIEW, MANDATORY_LLM, OPTIONAL_REFERENCE, INFORMATIONAL
- `hasHubLink` (boolean): Whether this file is listed in the hub (core-concepts/README.md)
- `hasBreadcrumb` (boolean): Whether this file includes breadcrumb navigation
- `internalLinkCount` (number): Number of internal cross-references

**Validation**:
- `path` must start with a valid `category.directory`
- `filename` must match the last segment of `path`
- `prerequisites` must form a DAG (no circular dependencies)
- `status` DEPRECATED files must have deprecation notice in file content
- Core-concepts files must have `hasHubLink: true` and `mandatory: true`

**Example**:
```yaml
id: "09-ORPC-IMPLEMENTATION-PATTERN"
filename: "09-ORPC-IMPLEMENTATION-PATTERN.md"
path: "core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md"
title: "ORPC Implementation Pattern"
category: "CORE_CONCEPTS"
description: "Type-safe RPC framework for end-to-end type safety across API boundaries"
status: "ACTIVE"
priority: 1
prerequisites: ["00-EFFICIENT-EXECUTION-PROTOCOL", "01-DOCUMENTATION-FIRST-WORKFLOW"]
relatedFiles: ["ORPC-TYPE-CONTRACTS", "API-DEVELOPMENT"]
tags: ["ORPC", "API", "type-safety", "contracts"]
lastUpdated: "2025-10-16"
enforceability: "MANDATORY_CODE_REVIEW"
hasHubLink: true
hasBreadcrumb: true
internalLinkCount: 15
```

---

### 3. NavigationHierarchy

**Purpose**: Defines the hierarchical structure and navigation paths through documentation

**Attributes**:
- `id` (string): Unique identifier (e.g., "HUB_PRIMARY", "COPILOT_ENTRY", "DEVELOPER_ONBOARDING")
- `name` (string): Display name (e.g., "Primary Documentation Hub", "Copilot Entry Point", "Developer Onboarding Journey")
- `entryPoint` (DocumentationFile): Root file for this navigation path (e.g., core-concepts/README.md for hub)
- `level1` (array[DocumentationFile]): Top-level files in hierarchy
- `level2` (array[DocumentationFile]): Secondary files in hierarchy
- `level3` (array[DocumentationFile]): Tertiary files in hierarchy (optional)
- `maxDepthFromEntry` (number): Maximum number of clicks to reach deepest file (target: ≤3)
- `purpose` (string): Why this navigation hierarchy exists
- `audience` (array[string]): Target audiences (e.g., ["LLM_AGENTS", "DEVELOPERS", "MAINTAINERS"])

**Validation**:
- Files cannot appear in multiple hierarchies at same level (each file has single parent in nav)
- `maxDepthFromEntry` must be calculated and verified
- All level1 files must be reachable from `entryPoint`

**Example**:
```yaml
id: "HUB_PRIMARY"
name: "Primary Documentation Hub"
entryPoint: "core-concepts/README.md"
level1:
  - "core-concepts/00-EFFICIENT-EXECUTION-PROTOCOL.md"
  - "core-concepts/01-DOCUMENTATION-FIRST-WORKFLOW.md"
  - "core-concepts/02-SERVICE-ADAPTER-PATTERN.md"
  # ... (all 12 core concepts)
level2:
  - "guides/GETTING-STARTED.md"
  - "guides/DEVELOPMENT-WORKFLOW.md"
  - "features/ORPC-TYPE-CONTRACTS.md"
  # ... (related guides and features)
maxDepthFromEntry: 2
purpose: "Single entry point for all mandatory patterns and architectural guidance"
audience: ["LLM_AGENTS", "DEVELOPERS", "MAINTAINERS"]
```

---

### 4. Breadcrumb

**Purpose**: Navigation context showing where a file sits in the documentation hierarchy

**Attributes**:
- `id` (string): Unique identifier (e.g., "bc-core-concepts-orpc")
- `filePath` (string): Path to file that displays this breadcrumb (e.g., "core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md")
- `trail` (array): Sequence of breadcrumb items from root to current file
  - Each item: `{ title, path, isClickable }`
- `currentFile` (DocumentationFile): The file this breadcrumb appears in
- `format` (string): Breadcrumb format template (e.g., "📍 {parent} > {current}")

**Validation**:
- All items in `trail` except last must have `isClickable: true`
- Last item in `trail` should represent the current file (typically `isClickable: false`)
- `trail` length should match document depth in hierarchy

**Example**:
```yaml
id: "bc-core-concepts-orpc"
filePath: "core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md"
trail:
  - title: "Home"
    path: "README.md"
    isClickable: true
  - title: "Core Concepts"
    path: "core-concepts/README.md"
    isClickable: true
  - title: "ORPC Implementation Pattern"
    path: "core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md"
    isClickable: false
format: "📍 {parent} > {current}"
```

---

### 5. CrossReference

**Purpose**: Represents links between documentation files

**Attributes**:
- `id` (string): Unique identifier (e.g., "xref-001")
- `sourceFile` (DocumentationFile): File containing the link
- `targetFile` (DocumentationFile): File being linked to
- `linkType` (enum): Type of relationship
  - "PREREQUISITE" - target should be read before source
  - "RELATED" - target provides related information
  - "CONCEPT" - target explains a concept used in source
  - "EXAMPLE" - target demonstrates the topic
  - "IMPLEMENTATION" - target shows how to implement concept
  - "BACKLINK" - bidirectional reference
- `linkText` (string): Display text for link in markdown
- `sectionInTarget` (string): Optional section/heading in target (e.g., "## API Contracts" for deep links)
- `isInternal` (boolean): Whether this is an internal doc-to-doc link (true) or external (false)
- `isValid` (boolean): Whether the target file exists and link works

**Validation**:
- Both `sourceFile` and `targetFile` must exist
- `linkType` determines expected relationship direction
- Cross-references should not form cycles (except BACKLINK pairs)
- All internal cross-references must be validated

**Example**:
```yaml
id: "xref-001"
sourceFile: "guides/API-DEVELOPMENT.md"
targetFile: "core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md"
linkType: "CONCEPT"
linkText: "ORPC Implementation Pattern"
sectionInTarget: "## Overview"
isInternal: true
isValid: true
```

---

### 6. DocumentationIndex

**Purpose**: Composite entity representing the entire documentation structure

**Attributes**:
- `version` (string): Version of documentation structure (e.g., "1.0.0")
- `lastGenerated` (date): When this index was last generated
- `categories` (array[DocumentationCategory]): All documentation categories
- `files` (array[DocumentationFile]): All documentation files
- `hierarchies` (array[NavigationHierarchy]): All navigation paths
- `crossReferences` (array[CrossReference]): All internal links
- `statistics` (object):
  - `totalFiles` (number)
  - `totalCategories` (number)
  - `activeFiles` (number)
  - `deprecatedFiles` (number)
  - `totalLines` (number)
  - `internalLinkCount` (number)
  - `brokenLinkCount` (number)
  - `averageDepthFromHub` (number)
- `validationStatus` (enum): VALID, WARNINGS, ERRORS
- `validationMessages` (array[string]): Issues found during validation

**Validation**:
- All files must belong to exactly one category
- All categories must be represented in at least one hierarchy
- No broken cross-references
- Average depth from hub ≤ 3
- All core-concepts files must have hub links

**Example**:
```yaml
version: "1.0.0"
lastGenerated: "2025-10-16T10:30:00Z"
statistics:
  totalFiles: 32
  totalCategories: 6
  activeFiles: 28
  deprecatedFiles: 4
  totalLines: 115000
  internalLinkCount: 85
  brokenLinkCount: 0
  averageDepthFromHub: 2.1
validationStatus: "VALID"
validationMessages: []
```

---

## Relationships

### Documentation Category → Files
- **Type**: One-to-Many
- **Cardinality**: 1 category : N files
- **Constraint**: Each file belongs to exactly one category
- **Example**: CORE_CONCEPTS category contains 12 DocumentationFile entities

### DocumentationFile → Cross-References
- **Type**: One-to-Many
- **Cardinality**: 1 file : N outgoing references
- **Constraint**: Files can have multiple outgoing links
- **Example**: ORPC-IMPLEMENTATION-PATTERN.md links to 15 other files

### NavigationHierarchy → Files
- **Type**: Many-to-Many
- **Cardinality**: N hierarchies : M files
- **Constraint**: A file can appear in multiple navigation hierarchies
- **Example**: GETTING-STARTED.md appears in both PRIMARY_HUB and DEVELOPER_ONBOARDING hierarchies

### DocumentationFile → Breadcrumb
- **Type**: One-to-One
- **Cardinality**: 1 file : 1 breadcrumb (or 1 file : 0 breadcrumbs for some)
- **Constraint**: Each active file should have breadcrumb
- **Example**: ORPC-IMPLEMENTATION-PATTERN.md has breadcrumb showing path from hub

---

## Constraints & Rules

### Structural Constraints

1. **Single Entry Point Rule**: 
   - Core-concepts/README.md MUST be the only entry point for Copilot agents
   - Copilot-instructions.md MUST delegate explicitly to this entry point

2. **No Duplication Rule**:
   - Core-concept rules MUST NOT appear outside `/docs/core-concepts/`
   - Each concept documented in exactly one location

3. **Backward Compatibility Rule**:
   - All existing links MUST remain valid after reorganization
   - Legacy paths may use redirects

4. **Depth Constraint**:
   - Average navigation depth from hub ≤ 3 clicks
   - Ensures discoverability for both humans and LLMs

5. **Mandatory Reading Rule**:
   - All 12 core-concepts MUST be listed in core-concepts/README.md
   - Each MUST be marked as mandatory
   - Each MUST have direct link

### Validation Rules

1. **Link Validation**:
   - All internal cross-references must point to existing files
   - Relative paths must resolve correctly
   - Zero broken links allowed

2. **Completeness Validation**:
   - Every documentation file must have:
     - Title and description
     - Category assignment
     - Breadcrumb (for active files)
     - Related files/prerequisites
   - Every category must have index file (README.md)

3. **Status Validation**:
   - DEPRECATED files must have deprecation notice
   - ARCHIVED files should not appear in active navigation
   - DRAFT files should not be linked from active docs

4. **Hub Validation**:
   - Core-concepts/README.md must list all 12 concepts
   - Each listed concept must have valid link
   - Hub must include link to COPILOT-WORKFLOW-DIAGRAM.md

---

## Implementation Notes

### Phase 1 Deliverables

This data model defines the structure for:
1. **Directory reorganization** - How docs are organized into categories
2. **Navigation system** - How readers navigate between docs
3. **Cross-reference system** - How docs link to each other
4. **Validation framework** - How to verify structure is correct

### Phase 2 Implementation

Tasks will use this data model to:
1. Create directory structure (categories)
2. Reorganize existing files into categories
3. Create index files and breadcrumbs
4. Add cross-references between files
5. Update copilot-instructions.md entry point
6. Validate all links and structure

### Validation Checklist

Before considering Phase 1 complete:
- [ ] All 6 document categories defined and validated
- [ ] All 28+ documentation files classified and validated
- [ ] All breadcrumbs follow consistent format
- [ ] All cross-references validated (zero broken links)
- [ ] Average depth from hub ≤ 3
- [ ] Copilot-instructions.md explicitly references core-concepts/README.md
- [ ] Core-concepts/README.md lists all 12 concepts with mandatory flags
- [ ] NAVIGATION.md meta-guide created and links to this data model

