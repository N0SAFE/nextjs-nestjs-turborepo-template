📍 [Documentation Hub](../README.md) > [Core Concepts](./README.md) > ORPC Query Utilities

# ORPC Query Utilities - Type-Safe Query Parameters

> **Type**: Core Concept - API Architecture  
> **Priority**: 🔴 CRITICAL  
> **Last Updated**: 2025-12-06

## Overview

The ORPC Query Utilities provide comprehensive, **type-safe query parameter** handling for filtering, sorting, pagination, and search operations. All utilities maintain full TypeScript type inference and integrate seamlessly with the ORPC builder pattern.

## Core Principle

**All query parameters are type-safe and validated** - from simple pagination to complex multi-field filtering with multiple operators. No more manually writing repetitive query validation code!

## Quick Start

```typescript
import { createQueryBuilder, standard } from "@repo/orpc-utils";

// Create a list endpoint with comprehensive query support
const userOps = standard.zod(userSchema, "user");

const listUsers = userOps.list({
  pagination: { defaultLimit: 20, maxLimit: 100 },
  sorting: ["createdAt", "name", "email"],
  filtering: {
    fields: {
      name: { schema: z.string(), operators: ["eq", "like", "ilike"] },
      active: z.boolean(),
      createdAt: { schema: z.string().datetime(), operators: ["gt", "gte", "lt", "lte"] }
    }
  }
}).build();

// Input type is automatically inferred:
// {
//   limit: number (default 20, max 100)
//   offset: number (default 0)
//   sortBy?: "createdAt" | "name" | "email"
//   sortDirection: "asc" | "desc" (default "asc")
//   name?: string
//   name_like?: string
//   name_ilike?: string
//   active?: boolean
//   createdAt_gt?: string
//   createdAt_gte?: string
//   createdAt_lt?: string
//   createdAt_lte?: string
// }
```

## Pagination

### Basic Pagination

```typescript
import { createPaginationSchema } from "@repo/orpc-utils/query";

const paginationSchema = createPaginationSchema({
  defaultLimit: 20,
  maxLimit: 100,
  minLimit: 1,
  includeOffset: true
});

// Type: { limit: number, offset: number }
```

### Pagination Modes

#### Offset-Based (Traditional)
```typescript
const offsetPagination = createPaginationSchema({
  includeOffset: true,
  includeCursor: false,
  includePage: false
});

// Input: { limit: 10, offset: 0 }
// Output meta: { total, limit, offset, hasMore }
```

#### Page-Based
```typescript
const pagePagination = createPaginationSchema({
  includeOffset: false,
  includePage: true
});

// Input: { limit: 10, page: 1 }
// Output meta: { total, limit, page, totalPages, hasMore }
```

#### Cursor-Based (Infinite Scroll)
```typescript
const cursorPagination = createPaginationSchema({
  includeOffset: false,
  includeCursor: true
});

// Input: { limit: 10, cursor?: string, cursorDirection?: "forward" | "backward" }
// Output meta: { total, limit, hasMore, nextCursor, prevCursor }
```

### Pagination Response

```typescript
import { createPaginatedResponseSchema } from "@repo/orpc-utils/query";

const responseSchema = createPaginatedResponseSchema(userSchema, {
  includeOffset: true
});

// Type:
// {
//   data: User[]
//   meta: { total: number, limit: number, offset: number, hasMore: boolean }
// }
```

## Sorting

### Simple Sorting

```typescript
import { createSimpleSortSchema } from "@repo/orpc-utils/query";

const sortSchema = createSimpleSortSchema(
  ["createdAt", "name", "price"] as const,
  "createdAt" // default field
);

// Type: { sortBy?: "createdAt" | "name" | "price", sortDirection: "asc" | "desc" }
```

### Multi-Field Sorting

```typescript
import { createMultiSortSchema } from "@repo/orpc-utils/query";

const multiSortSchema = createMultiSortSchema(
  ["createdAt", "name", "price"] as const
);

// Type: {
//   sortBy?: Array<{ field: "createdAt" | "name" | "price", direction: "asc" | "desc" }>
// }
```

### Advanced Sorting with Nulls Handling

```typescript
import { createSortingSchema } from "@repo/orpc-utils/query";

const advancedSortSchema = createSortingSchema({
  fields: ["createdAt", "name", "price"] as const,
  defaultField: "createdAt",
  defaultDirection: "desc",
  allowNullsHandling: true
});

// Type: {
//   sortBy?: "createdAt" | "name" | "price"
//   sortDirection: "asc" | "desc"
//   nullsHandling?: "first" | "last"
// }
```

## Filtering

### Simple Filters (Equality Only)

```typescript
import { createSimpleFilterSchema } from "@repo/orpc-utils/query";

const filterSchema = createSimpleFilterSchema({
  categoryId: z.string().uuid(),
  inStock: z.boolean(),
  status: z.enum(["active", "inactive"])
});

// Type: { categoryId?: string, inStock?: boolean, status?: "active" | "inactive" }
```

### Advanced Filters with Operators

```typescript
import { createFilteringSchema } from "@repo/orpc-utils/query";

const advancedFilters = createFilteringSchema({
  fields: {
    name: {
      schema: z.string(),
      operators: ["eq", "like", "ilike", "startsWith", "endsWith"],
      description: "Filter by product name"
    },
    price: {
      schema: z.number(),
      operators: ["eq", "gt", "gte", "lt", "lte", "between"],
      description: "Filter by price"
    },
    tags: {
      schema: z.string(),
      operators: ["in", "nin"]
    },
    createdAt: {
      schema: z.string().datetime(),
      operators: ["gt", "gte", "lt", "lte", "between"]
    }
  }
});

// Generated fields:
// name, name_like, name_ilike, name_startsWith, name_endsWith
// price, price_gt, price_gte, price_lt, price_lte, price_between
// tags_in, tags_nin
// createdAt_gt, createdAt_gte, createdAt_lt, createdAt_lte, createdAt_between
```

### Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `name=John` |
| `ne` | Not equals | `status_ne=deleted` |
| `gt` | Greater than | `price_gt=100` |
| `gte` | Greater than or equal | `age_gte=18` |
| `lt` | Less than | `price_lt=50` |
| `lte` | Less than or equal | `stock_lte=10` |
| `in` | In array | `status_in=["active","pending"]` |
| `nin` | Not in array | `tags_nin=["deprecated"]` |
| `like` | Contains (case-sensitive) | `name_like=john` |
| `ilike` | Contains (case-insensitive) | `name_ilike=JOHN` |
| `startsWith` | Starts with | `email_startsWith=admin@` |
| `endsWith` | Ends with | `domain_endsWith=.com` |
| `between` | Between two values | `price_between={from:10,to:100}` |
| `exists` | Field exists/not null | `deletedAt_exists=false` |

### Type-Specific Filters

```typescript
import {
  createStringFilterSchema,
  createNumberFilterSchema,
  createDateFilterSchema,
  createBooleanFilterSchema,
  createEnumFilterSchema
} from "@repo/orpc-utils/query";

// String filters
const stringFilters = createStringFilterSchema("name");
// Includes: name, name_like, name_ilike, name_startsWith, name_endsWith, name_in

// Number filters
const numberFilters = createNumberFilterSchema("price");
// Includes: price, price_gt, price_gte, price_lt, price_lte, price_between, price_in

// Date filters
const dateFilters = createDateFilterSchema("createdAt");
// Includes: createdAt, createdAt_gt, createdAt_gte, createdAt_lt, createdAt_lte, createdAt_between

// Boolean filters
const boolFilters = createBooleanFilterSchema("isActive");
// Includes: isActive

// Enum filters
const enumFilters = createEnumFilterSchema("status", ["active", "inactive", "pending"] as const);
// Includes: status, status_in, status_nin
```

## Search

### Simple Search

```typescript
import { createSimpleSearchSchema } from "@repo/orpc-utils/query";

const searchSchema = createSimpleSearchSchema(2); // min 2 characters

// Type: { query: string (min 2 chars) }
```

### Advanced Search

```typescript
import { createSearchSchema } from "@repo/orpc-utils/query";

const advancedSearch = createSearchSchema({
  searchableFields: ["name", "description", "sku"] as const,
  minQueryLength: 2,
  maxQueryLength: 200,
  allowFieldSelection: true,
  allowRegex: true
});

// Type: {
//   query: string (2-200 chars)
//   fields?: ("name" | "description" | "sku")[]
//   caseSensitive?: boolean
//   useRegex?: boolean
//   mode?: "contains" | "startsWith" | "endsWith" | "exact"
// }
```

### Full-Text Search

```typescript
import { createFullTextSearchSchema } from "@repo/orpc-utils/query";

const fullTextSearch = createFullTextSearchSchema(
  ["title", "body", "tags"] as const
);

// Type: {
//   query: string
//   fields?: ("title" | "body" | "tags")[]
//   operator?: "and" | "or"
//   highlight?: boolean
// }
```

## Query Builder

### Complete Query Configuration

```typescript
import { createQueryBuilder } from "@repo/orpc-utils/query";

const queryBuilder = createQueryBuilder({
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
    includeOffset: true
  },
  sorting: {
    fields: ["createdAt", "name", "price"] as const,
    defaultField: "createdAt",
    defaultDirection: "desc"
  },
  filtering: {
    fields: {
      name: { schema: z.string(), operators: ["eq", "like", "ilike"] },
      price: { schema: z.number(), operators: ["gt", "gte", "lt", "lte"] },
      inStock: z.boolean()
    }
  },
  search: {
    searchableFields: ["name", "description"] as const,
    minQueryLength: 2
  }
});

// Build schemas
const inputSchema = queryBuilder.buildInputSchema();
const outputSchema = queryBuilder.buildOutputSchema(productSchema);
```

### Fluent API

```typescript
const queryBuilder = createQueryBuilder()
  .withPagination({ defaultLimit: 25 })
  .withSorting({
    fields: ["createdAt", "name"] as const,
    defaultField: "createdAt"
  })
  .withFiltering({
    fields: {
      status: z.enum(["active", "inactive"])
    }
  })
  .withCustomFields({
    includeDeleted: z.boolean().default(false)
  });
```

### Helper Functions

```typescript
import {
  createListQuery,
  createSearchQuery,
  createAdvancedQuery
} from "@repo/orpc-utils/query";

// Simple list with pagination and sorting
const listQuery = createListQuery(
  ["createdAt", "name"] as const,
  { defaultLimit: 20 }
);

// Search with pagination
const searchQuery = createSearchQuery(
  ["name", "description"] as const
);

// Advanced query with everything
const advancedQuery = createAdvancedQuery({
  sortableFields: ["createdAt", "name", "price"] as const,
  filterableFields: {
    name: { schema: z.string(), operators: ["like"] },
    price: { schema: z.number(), operators: ["gt", "lt"] }
  },
  searchableFields: ["name", "description"] as const
});
```

## Integration with Standard Operations

### Enhanced List Operation

```typescript
import { standard } from "@repo/orpc-utils";

const productOps = standard.zod(productSchema, "product");

const listProducts = productOps.list({
  pagination: { defaultLimit: 20, maxLimit: 100 },
  sorting: ["createdAt", "name", "price"] as const,
  filtering: {
    fields: {
      name: { schema: z.string(), operators: ["like", "ilike"] },
      price: { schema: z.number(), operators: ["gt", "gte", "lt", "lte", "between"] },
      categoryId: z.string().uuid(),
      inStock: z.boolean()
    }
  }
}).build();

// Automatically generates input schema with all query parameters
// and output schema with pagination metadata
```

### Enhanced Search Operation

```typescript
const searchProducts = productOps.search({
  searchFields: ["name", "description", "sku"] as const,
  pagination: { defaultLimit: 50 }
}).build();

// Includes full-text search with field selection and pagination
```

## Real-World Examples

### E-commerce Product Listing

```typescript
const productListQuery = createAdvancedQuery({
  sortableFields: ["price", "name", "rating", "createdAt"] as const,
  filterableFields: {
    name: { schema: z.string(), operators: ["like", "ilike"] },
    price: { schema: z.number(), operators: ["gt", "gte", "lt", "lte", "between"] },
    categoryId: z.string().uuid(),
    brandId: z.string().uuid(),
    inStock: z.boolean(),
    rating: { schema: z.number(), operators: ["gte"] },
    tags: { schema: z.string(), operators: ["in"] }
  },
  searchableFields: ["name", "description", "sku"] as const,
  pagination: { defaultLimit: 24, maxLimit: 100 }
});

const productListContract = new RouteBuilder()
  .route({ method: "GET", path: "/products" })
  .input(productListQuery.buildInputSchema())
  .output(productListQuery.buildOutputSchema(productSchema))
  .build();
```

### User Management with Advanced Filters

```typescript
const userListQuery = createQueryBuilder({
  pagination: { defaultLimit: 50, maxLimit: 200 },
  sorting: {
    fields: ["createdAt", "lastLoginAt", "name", "email"] as const,
    defaultField: "createdAt",
    defaultDirection: "desc"
  },
  filtering: {
    fields: {
      name: { schema: z.string(), operators: ["like", "ilike"] },
      email: { schema: z.string().email(), operators: ["like", "ilike"] },
      role: { schema: z.enum(["admin", "user", "guest"] as const), operators: ["in"] },
      active: z.boolean(),
      verified: z.boolean(),
      createdAt: { schema: z.string().datetime(), operators: ["gt", "gte", "lt", "lte"] },
      lastLoginAt: { schema: z.string().datetime(), operators: ["gt", "gte", "lt", "lte"] }
    }
  },
  customFields: {
    includeDeleted: z.boolean().default(false),
    includeStats: z.boolean().default(false)
  }
});
```

### Order History with Date Range

```typescript
const orderListQuery = createQueryBuilder({
  pagination: { defaultLimit: 20 },
  sorting: {
    fields: ["createdAt", "total", "status"] as const,
    defaultField: "createdAt",
    defaultDirection: "desc"
  },
  filtering: {
    fields: {
      status: {
        schema: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"] as const),
        operators: ["in"]
      },
      total: {
        schema: z.number(),
        operators: ["gt", "gte", "lt", "lte", "between"]
      },
      createdAt: {
        schema: z.string().datetime(),
        operators: ["between", "gt", "gte"]
      },
      userId: z.string().uuid()
    }
  }
});
```

## Best Practices

### 1. Define Sortable Fields Explicitly

```typescript
// Good: Explicit const assertion for type safety
const sortableFields = ["createdAt", "name", "price"] as const;

// Bad: Plain array loses type information
const sortableFields = ["createdAt", "name", "price"];
```

### 2. Choose Appropriate Operators

```typescript
// Good: Specific operators for the field type
filtering: {
  fields: {
    price: { schema: z.number(), operators: ["gt", "lt", "between"] },
    name: { schema: z.string(), operators: ["like", "ilike"] }
  }
}

// Bad: Too many operators or wrong operators
filtering: {
  fields: {
    price: { schema: z.number(), operators: ["eq", "ne", "like", "regex"] }, // like/regex don't make sense for numbers
  }
}
```

### 3. Set Reasonable Limits

```typescript
// Good: Reasonable pagination limits
pagination: { defaultLimit: 20, maxLimit: 100, minLimit: 1 }

// Bad: Too large limits that could impact performance
pagination: { defaultLimit: 1000, maxLimit: 10000 }
```

### 4. Use Type-Specific Helpers

```typescript
// Good: Use helper for common patterns
const nameFilter = createStringFilterSchema("name");
const priceFilter = createNumberFilterSchema("price");

// Less ideal: Manual configuration (more verbose)
const nameFilter = createFilteringSchema({
  fields: {
    name: { schema: z.string(), operators: ["eq", "like", "ilike", "startsWith", "endsWith", "in"] }
  }
});
```

## Performance Considerations

1. **Limit Filter Complexity**: Too many filter options can complicate queries and slow down responses
2. **Index Filtered Fields**: Ensure database indexes exist for frequently filtered fields
3. **Validate Pagination Limits**: Always set `maxLimit` to prevent excessive data transfer
4. **Consider Cursor Pagination**: For large datasets, cursor-based pagination is more efficient than offset

## Type Safety Benefits

```typescript
const query = createAdvancedQuery({
  sortableFields: ["name", "price"] as const,
  filterableFields: {
    price: { schema: z.number(), operators: ["gt", "lt"] }
  }
});

const inputSchema = query.buildInputSchema();

// TypeScript knows exact type:
type QueryInput = z.infer<typeof inputSchema>;
// {
//   limit: number
//   offset: number
//   sortBy?: "name" | "price"
//   sortDirection: "asc" | "desc"
//   price_gt?: number
//   price_lt?: number
// }

// Autocomplete works perfectly!
const params: QueryInput = {
  limit: 20,
  offset: 0,
  sortBy: "price", // ✅ Autocomplete suggests "name" | "price"
  price_gt: 100,   // ✅ Type-checked as number
};
```

## Related Documentation

- [ORPC Builder Pattern](./12-ORPC-BUILDER-PATTERN.md) - Main builder documentation
- [ORPC Implementation Pattern](./09-ORPC-IMPLEMENTATION-PATTERN.md) - ORPC usage patterns

## Summary

ORPC Query Utilities provide **comprehensive, type-safe** query parameter handling:

✅ **Pagination**: Offset, page, and cursor-based  
✅ **Sorting**: Single and multi-field with nulls handling  
✅ **Filtering**: 15+ operators for any field type  
✅ **Search**: Simple to full-text with field selection  
✅ **Type Safety**: Full TypeScript inference throughout  
✅ **Integration**: Seamless with standard operations  
✅ **Flexibility**: Combine any features as needed  

Use these utilities for all list, search, and filter operations to ensure consistency and type safety across your API!
