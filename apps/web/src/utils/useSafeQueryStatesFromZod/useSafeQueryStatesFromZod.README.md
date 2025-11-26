# Enhanced useSafeQueryStatesFromZod

A powerful React hook that provides type-safe query parameter management using Zod schemas and nuqs's `useQueryStates` for automatic batching.

## Features

- 🔒 **Type-safe**: Full TypeScript support with perfect type inference from Zod schemas
- 📦 **Batched updates**: Uses nuqs's `useQueryStates` for efficient URL updates
- ⏱️ **Debouncing**: Built-in debouncing support for performance optimization
- 🎯 **Comprehensive type support**: Handles strings, numbers, booleans, enums, arrays, and nested objects
- 🔄 **Default values**: Automatic handling of Zod default values
- 🌐 **URL sync**: Perfect synchronization between component state and URL parameters

## Installation

Make sure you have the required dependencies:

```bash
npm install nuqs zod
```

## Basic Usage

```tsx
import { z } from 'zod'
import { useSafeQueryStatesFromZod } from '@/utils/useSafeQueryStatesFromZod'

// Define your schema
const FilterSchema = z.object({
  search: z.string().default(''),
  category: z.enum(['all', 'electronics', 'clothing']).default('all'),
  page: z.number().int().min(1).default(1),
  onSale: z.boolean().default(false)
})

function MyComponent() {
  const [filters, setFilters] = useSafeQueryStatesFromZod(FilterSchema)

  // Update single field
  const handleSearch = (search: string) => {
    setFilters({ search, page: 1 }) // Type-safe and batched
  }

  // Reset to defaults
  const handleReset = () => {
    setFilters(null)
  }

  return (
    <div>
      <input 
        value={filters.search} 
        onChange={(e) => handleSearch(e.target.value)} 
      />
      {/* filters.search, filters.category, etc. are all type-safe */}
    </div>
  )
}
```

## Advanced Usage

### Complex Schema with Nested Objects

```tsx
const AdvancedSchema = z.object({
  // Basic fields
  query: z.string().default(''),
  category: z.enum(['electronics', 'clothing', 'books']).default('electronics'),
  
  // Numbers with validation
  page: z.number().int().min(1).default(1),
  priceMin: z.number().min(0).default(0),
  priceMax: z.number().min(0).default(1000),
  
  // Arrays
  tags: z.array(z.string()).default([]),
  
  // Nested objects
  filters: z.object({
    brand: z.string().default(''),
    rating: z.number().min(1).max(5).default(1),
    inStock: z.boolean().default(true)
  }).default({
    brand: '',
    rating: 1,
    inStock: true
  })
})

function AdvancedComponent() {
  const [state, setState] = useSafeQueryStatesFromZod(AdvancedSchema, {
    delay: 300, // Debounce updates by 300ms
    history: 'push' // Use pushState for navigation
  })

  // Update nested objects
  const updateNestedFilter = (key: keyof typeof state.filters, value: any) => {
    setState({
      filters: {
        ...state.filters,
        [key]: value
      }
    })
  }

  // Add to array
  const addTag = (tag: string) => {
    setState({ tags: [...state.tags, tag] })
  }

  return (
    <div>
      {/* Your UI here */}
    </div>
  )
}
```

### With Debouncing

```tsx
const [filters, setFilters] = useSafeQueryStatesFromZod(Schema, {
  delay: 500, // Debounce URL updates by 500ms
  history: 'replace' // Use replaceState instead of pushState
})
```

## Supported Zod Types

| Zod Type | nuqs Parser | Notes |
|----------|-------------|-------|
| `z.string()` | `parseAsString` | Direct mapping |
| `z.number()` | `parseAsFloat` | Default for numbers |
| `z.number().int()` | `parseAsInteger` | When `.int()` constraint is used |
| `z.boolean()` | `parseAsBoolean` | Direct mapping |
| `z.enum([...])` | `parseAsStringLiteral` | Type-safe enum handling |
| `z.array(T)` | `parseAsArrayOf(parser)` | Recursive type handling |
| `z.object({...})` | `parseAsJson` | For nested objects |
| `z.literal(value)` | `parseAsStringLiteral` or `parseAsNumberLiteral` | Based on literal type |
| `z.union([...])` | `parseAsString` | Fallback to string |
| `z.string().default(...)` | `parser.withDefault(...)` | Automatic default handling |

## API Reference

### `useSafeQueryStatesFromZod(schema, options?)`

#### Parameters

- `schema` - A Zod object schema (`z.object({...})`)
- `options` - Optional configuration object

#### Options

```tsx
type Options = {
  delay?: number          // Debounce delay in milliseconds
  resetKeys?: string[]    // Keys to reset when updating (limited support)
  history?: 'push' | 'replace' // Navigation history strategy
  // ... other nuqs options
}
```

#### Returns

```tsx
[
  state: z.infer<Schema>,                           // Current state (type-safe)
  setState: (updates: Partial<z.infer<Schema>> | null) => void  // State updater
]
```

## Example Page

Check out the comprehensive example at `/queryStateFromZodExample` which demonstrates:

- All supported Zod types
- Complex nested objects
- Array handling
- Debouncing in action
- URL synchronization
- State persistence across page refreshes

## Migration from Original Version

The enhanced version has breaking changes:

### Before (Single Parameter)
```tsx
const [value, setValue] = useSafeQueryStatesFromZod('key', z.string().default(''))
```

### After (Object Schema)
```tsx
const Schema = z.object({
  key: z.string().default('')
})
const [state, setState] = useSafeQueryStatesFromZod(Schema)
// Access via: state.key
// Update via: setState({ key: 'new value' })
```

## Benefits of the New Approach

1. **Batched Updates**: Multiple parameter changes are batched into a single URL update
2. **Better Type Safety**: Full object-level type inference and validation
3. **Cleaner API**: Single hook manages all related query parameters
4. **Better Performance**: Fewer individual `useQueryState` calls
5. **Complex State**: Support for nested objects and arrays

## Limitations

- **Reset Keys**: The `resetKeys` functionality is limited when using batched updates
- **Object Schema Only**: Only works with `z.object()` schemas (not primitive types)
- **URL Length**: Very complex objects may create long URLs

## Tips

1. **Group Related Parameters**: Design your schema to group logically related parameters
2. **Use Defaults Wisely**: Provide sensible defaults to keep URLs clean
3. **Consider URL Length**: Very complex nested objects can create long URLs
4. **Debounce User Input**: Use the `delay` option for search inputs and filters
5. **Handle Arrays Carefully**: Arrays in URLs can become unwieldy with many items

## Example Schema Patterns

### Search/Filter Form
```tsx
const SearchSchema = z.object({
  q: z.string().default(''),
  category: z.enum(['all', 'products', 'users']).default('all'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(5).max(100).default(10),
  sort: z.enum(['name', 'date', 'popularity']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc')
})
```

### Dashboard Filters
```tsx
const DashboardSchema = z.object({
  dateRange: z.enum(['7d', '30d', '90d', 'custom']).default('30d'),
  metrics: z.array(z.enum(['users', 'revenue', 'sessions'])).default(['users']),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  showComparison: z.boolean().default(false)
})
```

### User Preferences
```tsx
const PreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  language: z.string().default('en'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(false),
    sms: z.boolean().default(false)
  }).default({ email: true, push: false, sms: false })
})
```