# Breadcrumb Format Contract

**Purpose**: Defines the standard format and structure for breadcrumb navigation in documentation files

**Endpoints** (Metadata Operations):
- `GET /docs/breadcrumbs/{file_path}` - Get breadcrumb for specific file
- `POST /docs/breadcrumbs/validate` - Validate breadcrumb structure
- `GET /docs/breadcrumbs/stats` - Get breadcrumb coverage statistics

---

## Schema: Breadcrumb

```yaml
Breadcrumb:
  type: object
  required:
    - id
    - filePath
    - trail
    - format
  properties:
    id:
      type: string
      pattern: "^bc-[a-z0-9-]+$"
      description: "Unique breadcrumb identifier"
    filePath:
      type: string
      description: "Path to file that displays this breadcrumb"
    trail:
      type: array
      items:
        type: object
        required:
          - title
          - path
          - isClickable
        properties:
          title:
            type: string
            description: "Display text for breadcrumb item"
          path:
            type: string
            description: "Relative path to target file"
          isClickable:
            type: boolean
            description: "Whether this item should be a clickable link"
      minItems: 1
      description: "Sequence of breadcrumb items from root to current file"
    currentFile:
      type: string
      description: "The file this breadcrumb appears in (last item in trail)"
    format:
      type: string
      enum: ["EMOJI_SEPARATOR", "CHEVRON_SEPARATOR", "PIPE_SEPARATOR"]
      default: "EMOJI_SEPARATOR"
      description: "Visual format of breadcrumb display"
```

## Schema: BreadcrumbTrailItem

```yaml
BreadcrumbTrailItem:
  type: object
  required:
    - title
    - path
    - isClickable
  properties:
    title:
      type: string
      minLength: 1
      description: "Display text (20-50 characters recommended)"
    path:
      type: string
      pattern: "^([a-z0-9-]+/)*[a-z0-9-]+\\.md$"
      description: "Relative path using forward slashes"
    isClickable:
      type: boolean
      description: "Last item in trail should have isClickable: false"
```

---

## Display Formats

### Format 1: EMOJI_SEPARATOR (Recommended)
```markdown
📍 [Home](../../README.md) > [Core Concepts](../README.md) > ORPC Implementation Pattern
```

**Markdown**:
```markdown
📍 [Home](../../README.md) > [Core Concepts](../README.md) > ORPC Implementation Pattern
```

### Format 2: CHEVRON_SEPARATOR
```markdown
🏠 Home / 📚 Core Concepts / ORPC Implementation Pattern
```

**Markdown**:
```markdown
🏠 [Home](../../README.md) / 📚 [Core Concepts](../README.md) / ORPC Implementation Pattern
```

### Format 3: PIPE_SEPARATOR
```markdown
[Home](../../README.md) | [Core Concepts](../README.md) | ORPC Implementation Pattern
```

**Markdown**:
```markdown
[Home](../../README.md) | [Core Concepts](../README.md) | ORPC Implementation Pattern
```

---

## Sample Breadcrumbs

### Core Concept File

```json
{
  "id": "bc-core-concepts-orpc",
  "filePath": "core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md",
  "trail": [
    {
      "title": "Documentation Hub",
      "path": "README.md",
      "isClickable": true
    },
    {
      "title": "Core Concepts",
      "path": "core-concepts/README.md",
      "isClickable": true
    },
    {
      "title": "ORPC Implementation Pattern",
      "path": "core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md",
      "isClickable": false
    }
  ],
  "currentFile": "core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md",
  "format": "EMOJI_SEPARATOR"
}
```

**Rendered**:
```
📍 [Documentation Hub](../../README.md) > [Core Concepts](../README.md) > ORPC Implementation Pattern
```

---

### Guide File

```json
{
  "id": "bc-guides-getting-started",
  "filePath": "guides/GETTING-STARTED.md",
  "trail": [
    {
      "title": "Documentation Hub",
      "path": "../../README.md",
      "isClickable": true
    },
    {
      "title": "Guides",
      "path": "../README.md",
      "isClickable": true
    },
    {
      "title": "Getting Started",
      "path": "GETTING-STARTED.md",
      "isClickable": false
    }
  ],
  "currentFile": "guides/GETTING-STARTED.md",
  "format": "EMOJI_SEPARATOR"
}
```

**Rendered**:
```
📍 [Documentation Hub](../../README.md) > [Guides](../README.md) > Getting Started
```

---

### Reference File (Deep)

```json
{
  "id": "bc-reference-commands",
  "filePath": "reference/COMMANDS.md",
  "trail": [
    {
      "title": "Documentation Hub",
      "path": "../../README.md",
      "isClickable": true
    },
    {
      "title": "Reference",
      "path": "../README.md",
      "isClickable": true
    },
    {
      "title": "Commands",
      "path": "COMMANDS.md",
      "isClickable": false
    }
  ],
  "currentFile": "reference/COMMANDS.md",
  "format": "EMOJI_SEPARATOR"
}
```

---

## Validation Rules

### Breadcrumb Validation

1. **Trail Continuity**:
   - Trail must start from documentation root (README.md)
   - Each item must be one level deeper than previous
   - Paths must form valid hierarchy

2. **Link Validity**:
   - All clickable items must have valid relative paths
   - Paths must resolve to existing .md files
   - No broken links allowed

3. **Depth Constraint**:
   - Maximum breadcrumb depth: 4 items (root + 3 levels)
   - Typical depth: 2-3 items

4. **Last Item Rule**:
   - Last item in trail must be the current file
   - Last item must have `isClickable: false`
   - Last item path must match file's own path

5. **Format Consistency**:
   - All breadcrumbs should use same format throughout documentation
   - EMOJI_SEPARATOR recommended for consistency

### Coverage Requirements

- [ ] All core-concepts files have breadcrumbs
- [ ] All guide files have breadcrumbs
- [ ] All feature files have breadcrumbs
- [ ] All reference files have breadcrumbs
- [ ] 90% of planning files have breadcrumbs
- [ ] Deprecated files may use ARCHIVED format variant
- [ ] Total breadcrumb coverage: 95%+

---

## Implementation Checklist

When implementing breadcrumbs for a file:

1. [ ] Identify category and position in hierarchy
2. [ ] Determine relative path to each parent level
3. [ ] Create trail items with correct paths
4. [ ] Ensure all paths are clickable except last
5. [ ] Choose consistent format (EMOJI_SEPARATOR recommended)
6. [ ] Generate breadcrumb markdown at top of file
7. [ ] Validate all links work
8. [ ] Test in markdown preview

---

## Example Implementation

### In a Core Concept File

File: `docs/core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md`

```markdown
# ORPC Implementation Pattern

📍 [Documentation Hub](../../README.md) > [Core Concepts](README.md) > ORPC Implementation Pattern

## Overview

[Content of the file...]
```

### In a Guide File

File: `docs/guides/API-DEVELOPMENT.md`

```markdown
# API Development Guide

📍 [Documentation Hub](../../README.md) > [Guides](README.md) > API Development Guide

## Prerequisites

[Content of the file...]
```

### In a Reference File

File: `docs/reference/COMMANDS.md`

```markdown
# Command Reference

📍 [Documentation Hub](../../README.md) > [Reference](README.md) > Command Reference

## Available Commands

[Content of the file...]
```

