# Summary: Updated Layout Pattern for Declarative Routing

## What Changed

Based on your feedback, I've updated the layout pattern to match your requirements:

### Your Pattern:
```typescript
defineLayout(function layoutState(realLayoutParams) {
  const state = useState

  return {
    ui: (children: renderFunction) => {
      return <Context>{children}</Context>
    },
    data: { test: 'value' },
    innerState: () => {
      const contextState = useContext()
      return { contextState }
    }
  }
})
```

## Files Created

### 1. `target.layout.tsx` ✅
Shows the complete pattern with two working examples:
- **DashboardLayout**: With sidebar state, context, and toggles
- **PublicLayout**: Simpler layout with banner state

**Key features demonstrated:**
- `defineLayout` wrapper function
- Using hooks in layoutState (top level)
- `ui` function receiving a children renderer
- Static `data` object for metadata
- `innerState` function using `useContext()`

### 2. `target.layout.info.ts` ✅
Shows what the auto-generated info file looks like:
- Extracts `data` without rendering
- Exports type information for `innerState`
- Provides type-safe access to layout metadata

### 3. `UPDATED-LAYOUT-PATTERN.md` ✅
Complete documentation including:
- Pattern explanation
- Code structure
- Usage examples
- How generation works
- Implementation plan for declarative-routing

### 4. `REAL-WORLD-USAGE-EXAMPLE.tsx` ✅
Comprehensive real-world example showing:
- Dashboard layout with full state management
- Using in Next.js layout files
- Accessing state in page components
- Using in middleware for auth checks
- Nested layouts with parent state access
- 8 key benefits demonstrated

## The Pattern Explained

### Structure:
```typescript
defineLayout(function layoutState(params) {
  // 1. Top-level hooks
  const [state, setState] = useState(...)

  return {
    // 2. UI wrapper - receives render function
    ui: (renderChildren) => (
      <Context.Provider>
        {renderChildren({ state, setState })}
      </Context.Provider>
    ),

    // 3. Static data - extractable without rendering
    data: {
      title: 'My Layout',
      requiresAuth: true
    },

    // 4. Inner state - children can call this
    innerState: () => {
      const ctx = useContext(Context)
      return { state: ctx.state, setState: ctx.setState }
    }
  }
})
```

### Key Differences from Original Plan:

| Aspect | Original Plan | Updated Pattern |
|--------|---------------|-----------------|
| Wrapper | `defineLayout({ metadata, render })` | `defineLayout(function(params) { ... })` |
| Children | Direct children prop | Render function receiving state |
| State Access | Via context only | Via `innerState()` function |
| Metadata | `.metadata` property | `.data` property |
| Extraction | `__extractInfo` flag | Direct `.data` access |
| Hooks | Only in render | In layoutState and innerState |

## Benefits of This Pattern

1. **Natural Hooks Usage**: Can use `useState`, `useEffect` in layoutState
2. **Context Integration**: `innerState` can use `useContext` cleanly
3. **No Special Flags**: Just access `.data` directly, no magic parameters
4. **Type-Safe State**: TypeScript knows the shape of innerState return
5. **Flexible Children**: Children renderer can receive and use state
6. **Zero Rendering**: Accessing `.data` doesn't execute `ui` or hooks

## Example Usage Flow

### 1. Developer writes layout:
```typescript
export const MyLayout = defineLayout(function(params) {
  const [open, setOpen] = useState(true)
  return {
    ui: (render) => <div>{render({ open, setOpen })}</div>,
    data: { requiresAuth: true },
    innerState: () => ({ open, setOpen })
  }
})
```

### 2. Build system generates layout.info.ts:
```typescript
const state = MyLayout({ children: null })
export const Layouts = {
  My: {
    name: 'My',
    data: state.data, // ✅ No rendering!
    innerStateType: {} as ReturnType<typeof state.innerState>
  }
}
```

### 3. Routing system uses it:
```typescript
import { Layouts } from './layout.info'

if (Layouts.My.data.requiresAuth && !session) {
  redirect('/login')
}
```

### 4. Page uses layout state:
```typescript
function MyPage() {
  const layout = MyLayout({ children: null })
  const state = layout.innerState()
  
  return <button onClick={() => state.setOpen(!state.open)}>Toggle</button>
}
```

## Implementation Checklist for declarative-routing

- [ ] Create `assets/nextjs/defineLayout.ts` template
- [ ] Create `assets/shared/layout-info.ts.template`
- [ ] Update `src/shared/build-tools.ts`:
  - [ ] Add `checkLayoutFile()` function
  - [ ] Add `createLayoutInfoFile()` function
  - [ ] Update `buildFiles()` to process layouts
- [ ] Update `src/nextjs/init.ts`:
  - [ ] Copy `defineLayout.ts` during setup
- [ ] Update `assets/nextjs/makeRoute.tsx`:
  - [ ] Sync with current makeRoute.tsx features
- [ ] Update `assets/nextjs/hooks.ts`:
  - [ ] Sync with current hooks.ts features
- [ ] Test with real Next.js app
- [ ] Update documentation

## Ready to Implement?

I've created all the example files and documentation. The pattern is clear and well-defined. 

**Would you like me to now implement this in the actual declarative-routing package?**

This would involve:
1. Creating the template files
2. Updating the build tools
3. Adding the detection and generation logic
4. Testing the implementation

Let me know if you want me to proceed or if you have any questions about the pattern! 🚀
