# Updated Layout Pattern Documentation

## The New Pattern

Based on your requirements, the layout pattern uses a `defineLayout` wrapper that receives a function which:

1. **Receives real layout params** (like `children`)
2. **Can use React hooks** at the top level (like `useState`)
3. **Returns an object** with three properties:
   - `ui`: Function that receives a children renderer
   - `data`: Static metadata (extractable without rendering)
   - `innerState`: Function that provides state to children (can use hooks)

## Code Structure

```typescript
export const MyLayout = defineLayout(function layoutState(params: LayoutParams) {
  // 1. Use hooks at the top level
  const [someState, setSomeState] = useState(initialValue)

  return {
    // 2. UI function: wraps children with providers/context
    ui: (renderChildren) => {
      return (
        <Context.Provider>
          <div>
            {/* Call renderChildren with what innerState provides */}
            {renderChildren({
              someState,
              setSomeState
            })}
          </div>
        </Context.Provider>
      )
    },

    // 3. Static data: can be extracted without rendering
    data: {
      title: 'My Layout',
      requiresAuth: true
    },

    // 4. Inner state: children can access this
    innerState: () => {
      const contextValue = useContext(Context)
      return {
        someState: contextValue.someState,
        setSomeState: contextValue.setSomeState
      }
    }
  }
})
```

## Key Features

### 1. UI Function with Children Renderer

The `ui` function receives a special `renderChildren` function instead of plain children:

```typescript
ui: (renderChildren) => {
  return (
    <div>
      {/* renderChildren accepts the inner state and returns ReactNode */}
      {renderChildren({
        // Pass whatever innerState provides
        ...innerState
      })}
    </div>
  )
}
```

### 2. Static Data Extraction

The `data` property contains static metadata that can be accessed without rendering:

```typescript
const layout = MyLayout({ children: null })
const metadata = layout.data // No rendering happens!

if (metadata.requiresAuth && !session) {
  redirect('/login')
}
```

### 3. Inner State with Hooks

The `innerState` function can use React hooks and context to provide state to children:

```typescript
innerState: () => {
  const contextState = useContext(MyContext)
  const [localState, setLocalState] = useState(...)
  
  return {
    contextState,
    localState,
    setLocalState
  }
}
```

## Usage Examples

### Example 1: Dashboard Layout with Sidebar

```typescript
const DashboardContext = createContext(null)

export const DashboardLayout = defineLayout(function layoutState(params) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return {
    ui: (renderChildren) => {
      return (
        <DashboardContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
          <div className="dashboard">
            <header>
              <button onClick={() => setSidebarOpen(!sidebarOpen)}>
                Toggle Sidebar
              </button>
            </header>
            <div className="layout">
              {sidebarOpen && <Sidebar />}
              <main>
                {/* Children can access sidebarOpen via innerState */}
                {renderChildren({ sidebarOpen, toggleSidebar: () => setSidebarOpen(!sidebarOpen) })}
              </main>
            </div>
          </div>
        </DashboardContext.Provider>
      )
    },

    data: {
      title: 'Dashboard',
      requiresAuth: true
    },

    innerState: () => {
      const context = useContext(DashboardContext)
      return {
        sidebarOpen: context.sidebarOpen,
        toggleSidebar: () => context.setSidebarOpen(!context.sidebarOpen)
      }
    }
  }
})
```

### Example 2: Using Layout in a Page

```typescript
// Option A: Access inner state directly in page
function MyPage() {
  const layout = DashboardLayout({ children: null })
  const state = layout.innerState()
  
  return (
    <div>
      <p>Sidebar is {state.sidebarOpen ? 'open' : 'closed'}</p>
      <button onClick={state.toggleSidebar}>Toggle</button>
    </div>
  )
}

// Option B: Layout handles rendering with state
export default function Layout({ children }) {
  const layout = DashboardLayout({ children })
  
  return layout.ui((innerState) => {
    // innerState = { sidebarOpen, toggleSidebar }
    return children // or use innerState here
  })
}
```

### Example 3: Extracting Data in Middleware

```typescript
// In middleware or routing logic
import { DashboardLayout } from './layouts/dashboard/layout'

function checkAuth(layoutPath: string) {
  const layout = DashboardLayout({ children: null })
  
  // Access data without any rendering!
  if (layout.data.requiresAuth && !session) {
    redirect('/login')
  }
}
```

## How layout.info.ts Generation Works

### Detection Phase

The build system scans for `layout.{ts,tsx,js,jsx}` files and checks if they:
1. Export functions wrapped with `defineLayout`
2. Follow the required pattern (return object with `ui`, `data`, `innerState`)

### Generation Phase

For each detected layout, generate a `layout.info.ts` file:

```typescript
// Generated: layout.info.ts
import { DashboardLayout, PublicLayout } from './layout'

// Extract data without rendering
const dashboardState = DashboardLayout({ children: null })
const publicState = PublicLayout({ children: null })

export const Layouts = {
  Dashboard: {
    name: 'Dashboard',
    data: dashboardState.data,
    innerStateType: {} as ReturnType<typeof dashboardState.innerState>
  },
  Public: {
    name: 'Public', 
    data: publicState.data,
    innerStateType: {} as ReturnType<typeof publicState.innerState>
  }
}
```

## Benefits of This Pattern

1. **No Rendering for Metadata**: Access `data` without executing `ui` or `innerState`
2. **Type-Safe State Access**: TypeScript knows the shape of `innerState`
3. **Context Integration**: `innerState` can use `useContext` for clean state access
4. **Flexible Children**: Children renderer can receive and use inner state
5. **Hooks Support**: Can use hooks in layoutState and innerState functions

## Implementation in declarative-routing Package

### Template Files to Create

1. **`assets/nextjs/defineLayout.ts`** - The wrapper function
2. **`assets/shared/layout-info.ts.template`** - Template for generated files
3. **Update `assets/nextjs/makeRoute.tsx`** - Add new Route properties
4. **Update `assets/nextjs/hooks.ts`** - Add useSearchParamState

### Build Tools Changes

1. **Add `checkLayoutFile()`** - Detect layouts using defineLayout
2. **Add `createLayoutInfoFile()`** - Generate layout.info.ts
3. **Update `buildFiles()`** - Process layouts alongside routes
4. **Parse exports** - Extract layout names and data structures

### Key Challenge: Detecting defineLayout Usage

Need to parse the layout file and check if exports use `defineLayout`:

```typescript
async function checkLayoutFile(layoutPath: string): Promise<boolean> {
  const code = fs.readFileSync(layoutPath).toString()
  
  // Simple check: does it use defineLayout?
  if (!code.includes('defineLayout')) {
    return false
  }
  
  // Parse with magicast or AST to find exports
  const mod = parseModule(code)
  
  // Check if exports are wrapped functions
  const hasWrappedLayouts = Object.values(mod.exports)
    .some(exp => {
      // Check if it's a function call to defineLayout
      return exp?.type === 'CallExpression' && 
             exp?.callee?.name === 'defineLayout'
    })
  
  if (hasWrappedLayouts) {
    await createLayoutInfoFile(layoutPath)
    return true
  }
  
  return false
}
```

## Next Steps for Implementation

1. ✅ Update target files to show the pattern (DONE)
2. Create `defineLayout.ts` template
3. Create `layout-info.ts.template` 
4. Update build tools to detect and generate
5. Update init to copy defineLayout template
6. Test with real Next.js app

Would you like me to proceed with implementing these changes in the declarative-routing package?
