# Link Conventions Contract

**Purpose**: Defines the standard format and conventions for internal cross-references between documentation files

**Endpoints** (Metadata Operations):
- `GET /docs/links/validate` - Validate all internal links
- `GET /docs/links/stats` - Get link statistics
- `POST /docs/links/check-broken` - Check for broken links

---

## Link Format Standards

### Basic Link Format

**Syntax**:
```markdown
[Display Text](relative/path/to/file.md)
```

**Requirements**:
- Use relative paths from current file's directory
- Use forward slashes `/` (not backslashes)
- Include `.md` extension
- Use descriptive link text (not "click here")
- Maximum link text: 50 characters

### Examples

#### Core Concept Link from Guide

**File**: `docs/guides/API-DEVELOPMENT.md`  
**Linking to**: `docs/core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md`

```markdown
See [ORPC Implementation Pattern](../core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md) for type-safe API design.
```

#### Sibling Document Link

**File**: `docs/guides/GETTING-STARTED.md`  
**Linking to**: `docs/guides/DEVELOPMENT-WORKFLOW.md` (same directory)

```markdown
Continue with [Development Workflow](./DEVELOPMENT-WORKFLOW.md).
```

#### Reference Link from Feature

**File**: `docs/features/TESTING.md`  
**Linking to**: `docs/reference/GLOSSARY.md`

```markdown
See the [Glossary](../reference/GLOSSARY.md) for terminology definitions.
```

#### Parent Directory Link

**File**: `docs/core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md`  
**Linking to**: `docs/core-concepts/README.md` (parent index)

```markdown
Back to [Core Concepts Index](./README.md)
```

#### Root Index Link

**File**: `docs/guides/PRODUCTION-DEPLOYMENT.md`  
**Linking to**: `docs/README.md` (root hub)

```markdown
Return to [Documentation Hub](../../README.md)
```

---

## Path Resolution Rules

### Relative Path Calculation

**Rule 1: Same Directory**
```markdown
# File: docs/guides/GETTING-STARTED.md
# Target: docs/guides/DEVELOPMENT-WORKFLOW.md
[Development Workflow](./DEVELOPMENT-WORKFLOW.md)
```

**Rule 2: Sibling Directory**
```markdown
# File: docs/guides/GETTING-STARTED.md
# Target: docs/reference/GLOSSARY.md
[Glossary](../reference/GLOSSARY.md)
```

**Rule 3: Parent + Sibling**
```markdown
# File: docs/core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md
# Target: docs/guides/API-DEVELOPMENT.md
[API Development](../guides/API-DEVELOPMENT.md)
```

**Rule 4: Multiple Levels Up**
```markdown
# File: docs/planning/PROJECT-ISOLATION-IMPLEMENTATION.md
# Target: docs/README.md
[Documentation Hub](../../README.md)
```

---

## Link Type Classifications

### 1. Prerequisite Links
**When**: Target file should be read before current file  
**Icon**: 📚 (optional)  
**Example**:
```markdown
**Prerequisite**: Read [ORPC Overview](../core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md) first
```

### 2. Related/See Also Links
**When**: Target provides related information  
**Icon**: 🔗 (optional)  
**Example**:
```markdown
**See also**: [Database Operations](./DATABASE-OPERATIONS.md)
```

### 3. Concept Explanation Links
**When**: Target explains a concept mentioned in current file  
**Icon**: 💡 (optional)  
**Example**:
```markdown
Follow the [Repository Ownership Rule](../core-concepts/03-REPOSITORY-OWNERSHIP-RULE.md)
```

### 4. Implementation Links
**When**: Target shows how to implement the current concept  
**Icon**: 🛠️ (optional)  
**Example**:
```markdown
See [ORPC Implementation Pattern](../core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md) for implementation details
```

### 5. Example Links
**When**: Target provides concrete examples  
**Icon**: 📋 (optional)  
**Example**:
```markdown
Examples: [API Implementation Examples](./examples/API-EXAMPLES.md)
```

---

## Deep Linking Convention

### Linking to Specific Sections

**Syntax**:
```markdown
[Display Text](path/to/file.md#section-heading)
```

**Heading Conversion Rules**:
- Convert to lowercase
- Replace spaces with hyphens
- Remove special characters
- Keep first 50 characters

**Examples**:
```markdown
# File: ORPC-IMPLEMENTATION-PATTERN.md
## Contract Definition
### Basic Contract

# Linking to it:
[Basic Contract Definition](../core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md#basic-contract)
```

---

## Link Validation Rules

### Validation Checklist

1. **Path Exists**
   - [ ] Target file exists at specified path
   - [ ] Path resolves correctly from current file
   - [ ] No `../` beyond repository root

2. **Link Text**
   - [ ] Descriptive (not "click here", "link", "here")
   - [ ] 5-50 characters
   - [ ] Title-cased
   - [ ] Matches target file title when possible

3. **Format**
   - [ ] Uses `[text](path)` syntax
   - [ ] Uses relative paths (not absolute)
   - [ ] Uses forward slashes
   - [ ] Includes `.md` extension

4. **Context**
   - [ ] Link text matches the content
   - [ ] Link helps reader understand relationship
   - [ ] No redundant links (avoid multiple links to same file in short section)

5. **Bidirectional**
   - [ ] If A links to B, should B link back to A (for related links)?
   - [ ] Breadcrumbs always include parent link
   - [ ] "See also" sections reciprocal

---

## Cross-Reference Statistics

### Required Metrics

Track these for documentation health:

```json
{
  "totalLinks": 85,
  "internalLinks": 82,
  "externalLinks": 3,
  "brokenLinks": 0,
  "averageLinksPerFile": 2.8,
  "filesWithoutLinks": 2,
  "linksPerCategory": {
    "core-concepts": 45,
    "guides": 22,
    "features": 12,
    "reference": 6
  },
  "linkTypeDistribution": {
    "related": 40,
    "prerequisite": 22,
    "concept": 15,
    "implementation": 6,
    "example": 2
  }
}
```

### Target Metrics

- Broken links: 0 (100% valid)
- Average links per file: 2-4
- Link coverage: 80%+ of files have at least 1 outgoing link
- Reciprocal links: 60%+ of related links are bidirectional

---

## Automation & Validation

### Link Checker Tool Configuration

```yaml
# .linkcheck.yml
ignorePatterns:
  - "node_modules/**"
  - "deprecated/**"  # Optional: ignore archived docs
  
internalLinks:
  enabled: true
  validateMarkdownLinks: true
  
externalLinks:
  enabled: false  # Disable external for now
  
outputFormat: "json"
reportFile: ".reports/link-check.json"
```

### CI/CD Integration

Add link validation to git pre-commit:

```bash
# hooks/pre-commit
npm run linkcheck
if [ $? -ne 0 ]; then
  echo "❌ Broken links found! Run 'npm run linkcheck:fix' to attempt auto-fix"
  exit 1
fi
```

---

## Best Practices

### DO ✅

- Use descriptive link text that conveys meaning
- Use relative paths for all internal links
- Link from specific to general (details to concepts)
- Create bidirectional links for closely related files
- Update links when moving files
- Group related links in "See Also" sections

### DON'T ❌

- Use generic text like "click here", "link", "read more"
- Use absolute paths (use relative instead)
- Create circular link chains (A → B → C → A)
- Link to files marked as DEPRECATED
- Hardcode full URLs for internal files
- Use different path styles in same file

---

## Common Link Patterns

### Documentation Discovery Pattern

```markdown
# In any doc linking to core-concepts

For architectural rules, see [Core Concepts](../../core-concepts/README.md):
- [ORPC Implementation](../../core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md)
- [Service Architecture](../../core-concepts/02-SERVICE-ADAPTER-PATTERN.md)
- [File Management Policy](../../core-concepts/08-FILE-MANAGEMENT-POLICY.md)
```

### Implementation Guide Pattern

```markdown
# In guides, linking to concepts

This guide builds on [ORPC Implementation Pattern](../core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md).

For complete API examples, see [API Implementation](./examples/API-IMPL.md).
```

### Reference Cross-Link Pattern

```markdown
# In reference docs, linking to guides and concepts

**Related**: 
- Learn more: [API Development Guide](../guides/API-DEVELOPMENT.md)
- Concept: [ORPC Pattern](../core-concepts/09-ORPC-IMPLEMENTATION-PATTERN.md)
- Examples: [ORPC Examples](./ORPC-EXAMPLES.md)
```

---

## Implementation Checklist

Before linking in documentation:

- [ ] Confirm target file exists and is in correct location
- [ ] Use relative path from current file's directory
- [ ] Use descriptive, meaningful link text (5-50 chars)
- [ ] Verify relative path resolves correctly
- [ ] Add bidirectional link if related content
- [ ] Test link in markdown preview
- [ ] Run link checker tool to validate
- [ ] Update link if file is moved later

