# Pattern Comparison: Before vs After

## Side-by-Side Comparison

### ❌ OLD PATTERN (Initial Plan - REJECTED)

```typescript
// OLD: Configuration object pattern
export const MyLayout = defineLayout({
  metadata: {
    title: 'My Layout',
    requiresAuth: true
  },
  render: ({ children }) => {
    return <div>{children}</div>
  }
})

// Extraction required special flag
const info = MyLayout({ __extractInfo: true })
console.log(info.metadata)
```

**Problems:**
- Can't use hooks in the config object
- Children is just passed through
- Special `__extractInfo` flag feels hacky
- Metadata is separate from layout logic

---

### ✅ NEW PATTERN (Current - APPROVED)

```typescript
// NEW: Function that returns structured object
export const MyLayout = defineLayout(function layoutState(params) {
  // ✅ Can use hooks here!
  const [open, setOpen] = useState(true)

  return {
    // UI wrapper with render function
    ui: (renderChildren) => {
      return (
        <Context.Provider value={{ open, setOpen }}>
          <div>
            {/* renderChildren receives the state */}
            {renderChildren({ open, setOpen })}
          </div>
        </Context.Provider>
      )
    },

    // Static data - direct access, no flags needed
    data: {
      title: 'My Layout',
      requiresAuth: true
    },

    // Inner state for children to access
    innerState: () => {
      const ctx = useContext(Context)
      return { open: ctx.open, setOpen: ctx.setOpen }
    }
  }
})

// ✅ Extraction is clean - just access .data
const layout = MyLayout({ children: null })
console.log(layout.data) // No rendering happens!
```

**Benefits:**
- ✅ Hooks work naturally
- ✅ Children can access state via renderChildren
- ✅ No special flags needed
- ✅ Clean separation of concerns

---

## Your Requirements Implemented

### Requirement 1: Function receives real params ✅
```typescript
defineLayout(function layoutState(realLayoutParams) {
  // ✅ realLayoutParams = { children: ReactNode }
  console.log(realLayoutParams.children)
})
```

### Requirement 2: Can use hooks ✅
```typescript
defineLayout(function layoutState(params) {
  // ✅ Can use any hooks here
  const state = useState(...)
  const effect = useEffect(...)
  const context = useContext(...)
})
```

### Requirement 3: Returns ui function ✅
```typescript
return {
  // ✅ ui receives a render function for children
  ui: (renderChildren) => {
    return <Context>{renderChildren(stateToPass)}</Context>
  }
}
```

### Requirement 4: Returns data object ✅
```typescript
return {
  // ✅ Static data accessible without rendering
  data: { test: 'iu', requiresAuth: true }
}
```

### Requirement 5: Returns innerState function ✅
```typescript
return {
  // ✅ Function that can use hooks and return state
  innerState: () => {
    const contextState = useContext(MyContext)
    return { contextState }
  }
}
```

### Requirement 6: Children renders with innerState ✅
```typescript
ui: (renderChildren) => {
  const innerState = { /* state to pass */ }
  // ✅ renderChildren is called with innerState
  return <div>{renderChildren(innerState)}</div>
}
```

---

## Complete Flow Example

### 1. Define Layout
```typescript
export const DashboardLayout = defineLayout(function layoutState({ children }) {
  // Step 1: Setup state with hooks
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return {
    // Step 2: UI wraps children with context
    ui: (renderChildren) => (
      <Context.Provider value={{ sidebarOpen, setSidebarOpen }}>
        <div className="layout">
          <Sidebar isOpen={sidebarOpen} />
          <main>
            {/* Step 3: Pass state to children via renderChildren */}
            {renderChildren({ sidebarOpen, toggleSidebar: () => setSidebarOpen(!sidebarOpen) })}
          </main>
        </div>
      </Context.Provider>
    ),

    // Step 4: Static data for routing
    data: {
      title: 'Dashboard',
      requiresAuth: true
    },

    // Step 5: Inner state for children components
    innerState: () => {
      const ctx = useContext(Context)
      return {
        sidebarOpen: ctx.sidebarOpen,
        toggleSidebar: () => ctx.setSidebarOpen(!ctx.sidebarOpen)
      }
    }
  }
})
```

### 2. Build System Generates Info File
```typescript
// ✅ Generated automatically
import { DashboardLayout } from './layout'

const layoutState = DashboardLayout({ children: null })

export const Layouts = {
  Dashboard: {
    name: 'Dashboard',
    data: layoutState.data, // ✅ Extracted without rendering!
    innerStateType: {} as ReturnType<typeof layoutState.innerState>
  }
}
```

### 3. Use in Middleware (No Rendering)
```typescript
import { Layouts } from './layout.info'

// ✅ Access data without any rendering
if (Layouts.Dashboard.data.requiresAuth && !session) {
  redirect('/login')
}
```

### 4. Use in Next.js Layout File
```typescript
export default function Layout({ children }) {
  const layout = DashboardLayout({ children })
  
  // ✅ Render using ui function
  return layout.ui((innerState) => {
    // innerState = { sidebarOpen, toggleSidebar }
    return children
  })
}
```

### 5. Use in Page Component
```typescript
export default function DashboardPage() {
  const layout = DashboardLayout({ children: null })
  const state = layout.innerState()
  
  // ✅ Access and use layout state
  return (
    <div>
      <p>Sidebar: {state.sidebarOpen ? 'open' : 'closed'}</p>
      <button onClick={state.toggleSidebar}>Toggle</button>
    </div>
  )
}
```

---

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ defineLayout(function layoutState(params) {                 │
│   const [state, setState] = useState(...)  ← Hooks work!   │
│                                                              │
│   return {                                                   │
│     ui: (renderChildren) => (                               │
│       <Context>                                             │
│         {renderChildren({ state, setState })}  ← Pass state │
│       </Context>                                            │
│     ),                                                       │
│                                                              │
│     data: { /* metadata */ },  ← Extract without render    │
│                                                              │
│     innerState: () => {        ← Children access this      │
│       const ctx = useContext(Context)                       │
│       return { state: ctx.state }                           │
│     }                                                        │
│   }                                                          │
│ })                                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
┌─────────────────────┐         ┌──────────────────────┐
│  layout.info.ts     │         │  Next.js Usage       │
│  (Generated)        │         │                      │
│                     │         │  const layout =      │
│  const state =      │         │    MyLayout({...})   │
│    MyLayout({...})  │         │                      │
│                     │         │  // Access data      │
│  export const       │         │  layout.data         │
│  Layouts = {        │         │                      │
│    My: {            │         │  // Use state        │
│      data:          │         │  layout.innerState() │
│        state.data   │         │                      │
│    }                │         │  // Render           │
│  }                  │         │  layout.ui(...)      │
└─────────────────────┘         └──────────────────────┘
```

---

## Key Takeaways

| Feature | Status |
|---------|--------|
| Function receives real params | ✅ Yes |
| Can use hooks in layoutState | ✅ Yes |
| Returns ui function | ✅ Yes |
| ui receives renderChildren | ✅ Yes |
| Returns data object | ✅ Yes |
| Returns innerState function | ✅ Yes |
| innerState can use hooks | ✅ Yes |
| No rendering for data access | ✅ Yes |
| Type-safe | ✅ Yes |
| Works with Next.js | ✅ Yes |

## This Pattern Matches Your Requirements EXACTLY! 🎯
