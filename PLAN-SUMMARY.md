# Declarative Routing Enhancement - Plan Summary

## What I've Created

I've analyzed your requirements and created a comprehensive plan for enhancing the declarative-routing package. Here are the files I've created to demonstrate the approach:

### 1. Example Target Files

#### `target.layout.tsx`
This demonstrates how a layout should be structured to work with the new system:

**Key Features**:
- Introduces `defineLayout()` wrapper function
- Layouts can return either UI (normal mode) or metadata + render function (info extraction mode)
- Uses a special `__extractInfo` parameter to switch between modes
- Prevents actual rendering when extracting metadata
- Shows two example layouts (Dashboard and Public)

**The Pattern**:
```typescript
const MyLayout = defineLayout({
  metadata: {
    title: 'My Layout',
    requiresAuth: true
  },
  render: ({ children }) => <div>{children}</div>
})
```

When called with `{ __extractInfo: true }`, it returns:
```typescript
{
  metadata: { title: 'My Layout', requiresAuth: true },
  render: () => ReactNode // function reference, not executed
}
```

#### `target.layout.info.ts`
This shows what the automatically generated layout.info.ts file would look like:

**Key Features**:
- Imports layouts from the actual layout file
- Calls them in info extraction mode
- Exports type-safe metadata without rendering anything
- Provides schemas for validation
- Can be used by routing system to check layout requirements

### 2. Comprehensive Plan Document

#### `DECLARATIVE-ROUTING-ENHANCEMENT-PLAN.md`
A detailed implementation plan covering:

**Phase 1: Update Template Files**
- Update `makeRoute.tsx` template with new features:
  - `Page` wrapper for type-safe page components
  - `validateParams` and `validateSearch` helpers
  - New TypeScript types
- Update `hooks.ts` template with:
  - New `useSearchParamState` hook
  - Proper imports and documentation

**Phase 2: Layout.info.ts Generation**
- Create `defineLayout.ts` template (the wrapper function)
- Create `layout-info.ts.template` (template for generated files)
- Update build tools to:
  - Detect layout files
  - Check if they use `defineLayout`
  - Generate corresponding `.info.ts` files
- Add functions:
  - `checkLayoutFile()` - detects if layout needs info file
  - `createLayoutInfoFile()` - generates the info file
  - Update `buildFiles()` - process layouts alongside routes

**Phase 3: Documentation**
- Update README with new features
- Create layout guide
- Document all new APIs

**Phase 4: Type Safety**
- Export all new types properly
- Ensure end-to-end type safety

## How It Works

### The defineLayout Pattern

1. **User writes a layout**:
```typescript
export const MyLayout = defineLayout({
  metadata: { requiresAuth: true },
  render: ({ children }) => <div>{children}</div>
})
```

2. **Build system detects it**:
- Scans for `layout.{ts,tsx,js,jsx}` files
- Checks if they use `defineLayout`
- If yes, generates `layout.info.ts`

3. **Generated layout.info.ts**:
```typescript
import { MyLayout } from './layout'

// Extract metadata WITHOUT rendering
const info = MyLayout({ __extractInfo: true })

export const Layouts = {
  My: {
    name: 'My',
    metadata: info.metadata,
    // render function reference kept private
  }
}
```

4. **Routing system can use it**:
```typescript
import { Layouts } from './layout.info'

if (Layouts.My.metadata.requiresAuth) {
  // redirect to login
}
```

### The Page Wrapper Pattern

Already in your `makeRoute.tsx`:
```typescript
const MyRoute = makeRoute('/path', { 
  name: 'MyRoute',
  params: z.object({}),
  search: z.object({})
})

// Wrap your page component
export default MyRoute.Page(({ params, searchParams, children }) => {
  // params and searchParams are automatically typed
  return <div>My Page</div>
})
```

### The useSearchParamState Hook

Already in your `hooks.ts`:
```typescript
function MyComponent() {
  const [searchParams, setSearchParams] = useSearchParamState(MyRoute)
  
  // searchParams is typed from route definition
  // setSearchParams accepts partial updates
  setSearchParams({ query: 'new value' })
}
```

## Implementation Steps

1. **Copy templates** from your actual `makeRoute.tsx` and `hooks.ts` into package assets
2. **Create new templates**:
   - `defineLayout.ts`
   - `useSafeQueryStatesFromZod.ts`
   - `layout-info.ts.template`
3. **Update build-tools.ts** to detect and process layouts
4. **Update init.ts** to copy new template files during setup
5. **Test** the full workflow

## Benefits

✅ **Type Safety**: Full TypeScript support for layouts and metadata
✅ **No Rendering**: Metadata extracted without executing React components
✅ **Opt-in**: Only layouts using `defineLayout` get info files
✅ **Backward Compatible**: Existing routes/layouts continue to work
✅ **Consistent Pattern**: Same approach as page.info.ts for routes

## Questions to Consider

Before implementation, please confirm:

1. **Metadata Schema**: Should layout metadata be customizable per project, or use a standard schema?
2. **Wrapper Name**: Is `defineLayout` a good name, or prefer something else?
3. **Info Mode Parameter**: Is `__extractInfo` clear enough, or prefer a different flag?
4. **Multiple Layouts**: Should one file support multiple layouts, or one per file?
5. **Nested Layouts**: How should parent/child layout relationships be represented?

## Next Steps

Once you approve this plan, I can proceed with implementation:
1. Update the template files in the declarative-routing package
2. Add the layout detection and generation logic
3. Update documentation
4. Test the implementation

Would you like me to proceed with the implementation, or would you like to discuss any adjustments to this plan first?
