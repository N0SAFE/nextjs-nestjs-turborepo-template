/**
 * DEFINELAYOUT PATTERN
 * 
 * defineLayout should return:
 * - The UI directly if { noUiRender: true } is NOT in params
 * - The config object if { noUiRender: true } IS in params
 * 
 * The config will be used by makeLayout and other functions
 */

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type LayoutState<TData, TInnerState> = {
  ui: (children: (innerState: TInnerState) => ReactNode) => ReactNode
  data: TData
  innerState: () => TInnerState
}

type LayoutParams = {
  children: ReactNode
}

type NoUiRenderParams = LayoutParams & {
  noUiRender: true
}

// The return type depends on whether noUiRender is passed
type DefineLayoutReturn<TData, TInnerState> = {
  // When called normally: returns ReactNode
  (params: LayoutParams): ReactNode
  // When called with noUiRender: returns config
  (params: NoUiRenderParams): LayoutState<TData, TInnerState>
  // Expose the config type for type inference
  __config: LayoutState<TData, TInnerState>
}

// ============================================================================
// DEFINELAYOUT FUNCTION
// ============================================================================

/**
 * defineLayout wraps a layout state function and returns:
 * - UI (ReactNode) when called normally
 * - Config object when called with { noUiRender: true }
 */
function defineLayout<TData, TInnerState>(
  layoutStateFn: (params: LayoutParams) => LayoutState<TData, TInnerState>
): DefineLayoutReturn<TData, TInnerState> {
  const layoutFunction = ((params: LayoutParams | NoUiRenderParams) => {
    const state = layoutStateFn(params)

    // Check if noUiRender flag is set
    if ('noUiRender' in params && params.noUiRender === true) {
      // Return the config object for use by makeLayout, etc.
      return state
    }

    // Normal call: return the rendered UI
    // The ui function expects a render function, so provide default behavior
    return state.ui((innerState) => {
      // Default: just render children without exposing innerState
      return params.children
    })
  }) as DefineLayoutReturn<TData, TInnerState>

  // Expose config type for type inference (not used at runtime)
  layoutFunction.__config = undefined as any

  return layoutFunction
}

// ============================================================================
// EXAMPLE LAYOUTS
// ============================================================================

// Context for Dashboard
const DashboardContext = createContext<{
  sidebarOpen: boolean
  toggleSidebar: () => void
} | null>(null)

/**
 * Dashboard Layout
 */
export const DashboardLayout = defineLayout(function layoutState({ children }: LayoutParams) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return {
    ui: (renderChildren) => {
      const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

      return (
        <DashboardContext.Provider value={{ sidebarOpen, toggleSidebar }}>
          <div className="dashboard-layout">
            <header>
              <h1>Dashboard</h1>
              <button onClick={toggleSidebar}>Toggle Sidebar</button>
            </header>
            <div className="layout-container">
              {sidebarOpen && (
                <nav className="sidebar">
                  <ul>
                    <li>Menu 1</li>
                    <li>Menu 2</li>
                  </ul>
                </nav>
              )}
              <main>{renderChildren({ sidebarOpen, toggleSidebar })}</main>
            </div>
          </div>
        </DashboardContext.Provider>
      )
    },

    data: {
      title: 'Dashboard',
      requiresAuth: true,
      theme: 'dark'
    },

    innerState: () => {
      const ctx = useContext(DashboardContext)
      if (!ctx) throw new Error('DashboardContext not found')
      return {
        sidebarOpen: ctx.sidebarOpen,
        toggleSidebar: ctx.toggleSidebar
      }
    }
  }
})

// Context for App
const AppContext = createContext<{
  locale: string
  setLocale: (locale: string) => void
} | null>(null)

/**
 * App Layout
 */
export const AppLayout = defineLayout(function layoutState({ children }: LayoutParams) {
  const [locale, setLocale] = useState('en')

  return {
    ui: (renderChildren) => {
      return (
        <AppContext.Provider value={{ locale, setLocale }}>
          <div className="app-layout">
            <header>
              <select value={locale} onChange={(e) => setLocale(e.target.value)}>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </header>
            <div className="app-content">
              {renderChildren({ locale, setLocale })}
            </div>
          </div>
        </AppContext.Provider>
      )
    },

    data: {
      title: 'App',
      supportedLocales: ['en', 'fr']
    },

    innerState: () => {
      const ctx = useContext(AppContext)
      if (!ctx) throw new Error('AppContext not found')
      return {
        locale: ctx.locale,
        setLocale: ctx.setLocale
      }
    }
  }
})

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Normal usage (returns UI)
 */
function Example1() {
  return (
    <div>
      {/* Returns ReactNode - the rendered UI */}
      {DashboardLayout({ children: <div>Page content</div> })}
    </div>
  )
}

/**
 * Example 2: Get config (for makeLayout, etc.)
 */
function Example2() {
  // Returns config object
  const config = DashboardLayout({ children: null, noUiRender: true })

  console.log(config.data) // { title: 'Dashboard', requiresAuth: true, theme: 'dark' }
  console.log(config.ui) // Function
  console.log(config.innerState) // Function

  return null
}

/**
 * Example 3: Use in Next.js layout file
 */
export default function Layout({ children }: { children: ReactNode }) {
  // Normal call returns UI
  return DashboardLayout({ children })
}

/**
 * Type extraction examples for makeLayout
 */

// Extract data type
type DashboardData = ReturnType<
  typeof DashboardLayout extends (params: NoUiRenderParams) => infer R
    ? R extends { data: infer D }
      ? () => D
      : never
    : never
>

// Extract innerState type
type DashboardInnerState = ReturnType<
  typeof DashboardLayout extends (params: NoUiRenderParams) => infer R
    ? R extends { innerState: infer I }
      ? I extends () => infer S
        ? () => S
        : never
      : never
    : never
>
