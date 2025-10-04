/**
 * EXAMPLE TARGET LAYOUT FILE
 * 
 * This demonstrates how a layout should be structured to work with the new
 * declarative routing system that generates layout.info.ts files.
 * 
 * The layout uses defineLayout wrapper that:
 * 1. Receives real layout params
 * 2. Returns an object with:
 *    - ui: Function that receives a children renderer (which can access innerState)
 *    - data: Static metadata that can be extracted without rendering
 *    - innerState: Function that uses React hooks and returns state to children
 */

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

// Example context for dashboard
const DashboardContext = createContext<{
  sidebarOpen: boolean
  toggleSidebar: () => void
} | null>(null)

/**
 * Type definitions for the layout system
 */
type LayoutState<TData, TInnerState> = {
  ui: (children: (innerState: TInnerState) => ReactNode) => ReactNode
  data: TData
  innerState: () => TInnerState
}

type LayoutParams = {
  children: ReactNode
}

/**
 * defineLayout wrapper function
 * 
 * This wraps a layout state function that returns ui, data, and innerState
 */
function defineLayout<TData, TInnerState>(
  layoutStateFn: (params: LayoutParams) => LayoutState<TData, TInnerState>
) {
  return layoutStateFn
}

/**
 * EXAMPLE LAYOUT 1: Dashboard layout with authentication requirement
 * 
 * This layout demonstrates:
 * - Creating context providers in the ui function
 * - Using hooks in innerState to provide state to children
 * - Static metadata in data for routing system
 */
export const DashboardLayout = defineLayout(function layoutState(params: LayoutParams) {
  // You can use hooks here at the top level of the layout state
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return {
    // UI function: wraps children with context and receives a renderer
    ui: (renderChildren) => {
      const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
      
      return (
        <DashboardContext.Provider value={{ sidebarOpen, toggleSidebar }}>
          <div className="dashboard-layout">
            <header>
              <h1>Dashboard</h1>
              <button onClick={toggleSidebar}>
                {sidebarOpen ? 'Hide' : 'Show'} Sidebar
              </button>
            </header>
            <div className="layout-container">
              {sidebarOpen && (
                <nav className="sidebar">
                  <ul>
                    <li>Menu Item 1</li>
                    <li>Menu Item 2</li>
                  </ul>
                </nav>
              )}
              <main className="content">
                {/* Call renderChildren with innerState */}
                {renderChildren(
                  // This is what innerState returns
                  {
                    sidebarOpen,
                    toggleSidebar,
                  }
                )}
              </main>
            </div>
          </div>
        </DashboardContext.Provider>
      )
    },

    // Static data: can be extracted without rendering
    data: {
      title: 'Dashboard',
      description: 'User dashboard area',
      requiresAuth: true,
    },

    // Inner state: children can call this to access context/state
    innerState: () => {
      const contextState = useContext(DashboardContext)
      
      if (!contextState) {
        throw new Error('DashboardLayout innerState must be used within DashboardLayout')
      }

      return {
        sidebarOpen: contextState.sidebarOpen,
        toggleSidebar: contextState.toggleSidebar,
      }
    },
  }
})

/**
 * EXAMPLE LAYOUT 2: Public layout without authentication
 * 
 * Simpler layout without context, but following the same pattern
 */
export const PublicLayout = defineLayout(function layoutState(params: LayoutParams) {
  const [bannerVisible, setBannerVisible] = useState(true)

  return {
    ui: (renderChildren) => {
      return (
        <div className="public-layout">
          {bannerVisible && (
            <div className="banner">
              <p>Welcome to our site!</p>
              <button onClick={() => setBannerVisible(false)}>Close</button>
            </div>
          )}
          <header>
            <h1>Welcome</h1>
          </header>
          <main>
            {/* Children can access innerState which has banner state */}
            {renderChildren({
              bannerVisible,
              closeBanner: () => setBannerVisible(false),
            })}
          </main>
          <footer>
            <p>© 2024 My App</p>
          </footer>
        </div>
      )
    },

    data: {
      title: 'Public Area',
      description: 'Publicly accessible pages',
      requiresAuth: false,
    },

    innerState: () => {
      // Simple inner state without context
      return {
        bannerVisible,
        closeBanner: () => setBannerVisible(false),
      }
    },
  }
})

/**
 * USAGE EXAMPLE:
 * 
 * In a page that uses this layout:
 * 
 * export default function MyPage() {
 *   // Access layout's inner state
 *   const layoutState = DashboardLayout({ children: null }).innerState()
 *   
 *   return (
 *     <div>
 *       <p>Sidebar is {layoutState.sidebarOpen ? 'open' : 'closed'}</p>
 *       <button onClick={layoutState.toggleSidebar}>Toggle Sidebar</button>
 *     </div>
 *   )
 * }
 * 
 * Or the layout handles it automatically:
 * 
 * const layout = DashboardLayout({ children: <MyPage /> })
 * layout.ui((innerState) => {
 *   return <div>Sidebar: {innerState.sidebarOpen}</div>
 * })
 */

/**
 * Default export - Next.js expects default export for layout files
 * 
 * For Next.js, we need to adapt the pattern to work with their layout system
 */
export default function Layout({ children }: { children: ReactNode }) {
  const layout = DashboardLayout({ children })
  
  // Render using the ui function with a children renderer
  return layout.ui((innerState) => {
    // Children can optionally use innerState
    // For now, just render children as-is
    return children
  })
}
