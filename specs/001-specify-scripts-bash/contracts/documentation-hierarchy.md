# Documentation Hierarchy Contract

**Purpose**: Defines the 5 main documentation categories and their properties

**Endpoints** (Metadata Operations):
- `GET /docs/categories` - List all documentation categories
- `GET /docs/categories/{category_id}` - Get category details
- `POST /docs/categories/validate` - Validate category structure

---

## Schema: DocumentationCategory

```yaml
DocumentationCategory:
  type: object
  required:
    - id
    - name
    - slug
    - directory
    - mandatory
    - readingOrder
  properties:
    id:
      type: string
      enum: ["CORE_CONCEPTS", "GUIDES", "FEATURES", "PLANNING", "REFERENCE", "DEPRECATED"]
      description: "Unique category identifier"
    name:
      type: string
      description: "Display name for the category"
    slug:
      type: string
      pattern: "^[a-z0-9-]+$"
      description: "URL-friendly identifier"
    description:
      type: string
      description: "Purpose and contents of this category"
    directory:
      type: string
      pattern: "^docs/[a-z0-9-]+$"
      description: "Relative path to category directory"
    mandatory:
      type: boolean
      description: "Whether reading this category is mandatory for all developers/LLMs"
    readingOrder:
      type: integer
      minimum: 1
      maximum: 6
      description: "Position in recommended reading order"
    isMutable:
      type: boolean
      description: "Whether documents can be added/removed/modified in this category"
```

## Schema: CategoryList

```yaml
CategoryList:
  type: object
  properties:
    categories:
      type: array
      items:
        $ref: "#/components/schemas/DocumentationCategory"
    totalCount:
      type: integer
    validationStatus:
      type: string
      enum: ["VALID", "WARNINGS", "ERRORS"]
    timestamp:
      type: string
      format: date-time
```

---

## Sample Response

```json
{
  "categories": [
    {
      "id": "CORE_CONCEPTS",
      "name": "Core Concepts",
      "slug": "core-concepts",
      "description": "Non-negotiable architectural patterns and principles mandatory for all development",
      "directory": "docs/core-concepts",
      "mandatory": true,
      "readingOrder": 1,
      "isMutable": false
    },
    {
      "id": "GUIDES",
      "name": "Guides",
      "slug": "guides",
      "description": "Step-by-step how-to documentation organized by topic",
      "directory": "docs/guides",
      "mandatory": false,
      "readingOrder": 2,
      "isMutable": true
    },
    {
      "id": "FEATURES",
      "name": "Features",
      "slug": "features",
      "description": "Feature-specific implementation details and guides",
      "directory": "docs/features",
      "mandatory": false,
      "readingOrder": 3,
      "isMutable": true
    },
    {
      "id": "PLANNING",
      "name": "Planning",
      "slug": "planning",
      "description": "Planning and specification documents for features",
      "directory": "docs/planning",
      "mandatory": false,
      "readingOrder": 4,
      "isMutable": true
    },
    {
      "id": "REFERENCE",
      "name": "Reference",
      "slug": "reference",
      "description": "Lookup tables, command references, and API documentation",
      "directory": "docs/reference",
      "mandatory": false,
      "readingOrder": 5,
      "isMutable": true
    },
    {
      "id": "DEPRECATED",
      "name": "Deprecated",
      "slug": "deprecated",
      "description": "Archive for legacy and outdated documentation",
      "directory": "docs/deprecated",
      "mandatory": false,
      "readingOrder": 6,
      "isMutable": false
    }
  ],
  "totalCount": 6,
  "validationStatus": "VALID",
  "timestamp": "2025-10-16T10:30:00Z"
}
```
