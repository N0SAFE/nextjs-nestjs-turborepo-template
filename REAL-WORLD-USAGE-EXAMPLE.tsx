/**
 * REAL WORLD USAGE EXAMPLE
 * 
 * This shows how the new layout pattern would be used in a real Next.js app
 */

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

// ============================================================================
// 1. DEFINE LAYOUT WRAPPER (provided by declarative-routing)
// ============================================================================

type LayoutState<TData, TInnerState> = {
  ui: (children: (innerState: TInnerState) => ReactNode) => ReactNode
  data: TData
  innerState: () => TInnerState
}

type LayoutParams = {
  children: ReactNode
}

function defineLayout<TData, TInnerState>(
  layoutStateFn: (params: LayoutParams) => LayoutState<TData, TInnerState>
) {
  return layoutStateFn
}

// ============================================================================
// 2. CREATE CONTEXT FOR LAYOUT STATE
// ============================================================================

type DashboardContextValue = {
  sidebarOpen: boolean
  currentTab: string
  notifications: number
  toggleSidebar: () => void
  setCurrentTab: (tab: string) => void
  clearNotifications: () => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

// ============================================================================
// 3. DEFINE THE LAYOUT
// ============================================================================

export const DashboardLayout = defineLayout(function layoutState({ children }: LayoutParams) {
  // Top-level hooks - these run when layout is created
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentTab, setCurrentTab] = useState('home')
  const [notifications, setNotifications] = useState(5)

  return {
    // UI: Wraps everything with context and structure
    ui: (renderChildren) => {
      const contextValue: DashboardContextValue = {
        sidebarOpen,
        currentTab,
        notifications,
        toggleSidebar: () => setSidebarOpen(!sidebarOpen),
        setCurrentTab,
        clearNotifications: () => setNotifications(0)
      }

      return (
        <DashboardContext.Provider value={contextValue}>
          <div className="dashboard-layout">
            {/* Header with controls */}
            <header className="header">
              <h1>My App Dashboard</h1>
              <button onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? '☰ Hide' : '☰ Show'} Menu
              </button>
              <div className="notifications">
                🔔 {notifications}
                {notifications > 0 && (
                  <button onClick={() => setNotifications(0)}>Clear</button>
                )}
              </div>
            </header>

            <div className="layout-container">
              {/* Sidebar */}
              {sidebarOpen && (
                <nav className="sidebar">
                  <ul>
                    <li className={currentTab === 'home' ? 'active' : ''}>
                      <button onClick={() => setCurrentTab('home')}>Home</button>
                    </li>
                    <li className={currentTab === 'settings' ? 'active' : ''}>
                      <button onClick={() => setCurrentTab('settings')}>Settings</button>
                    </li>
                    <li className={currentTab === 'profile' ? 'active' : ''}>
                      <button onClick={() => setCurrentTab('profile')}>Profile</button>
                    </li>
                  </ul>
                </nav>
              )}

              {/* Main content area */}
              <main className="content">
                {/* 
                  Call renderChildren with the inner state
                  Children can now access all the layout state
                */}
                {renderChildren({
                  sidebarOpen,
                  currentTab,
                  notifications,
                  toggleSidebar: () => setSidebarOpen(!sidebarOpen),
                  setCurrentTab,
                  clearNotifications: () => setNotifications(0)
                })}
              </main>
            </div>
          </div>
        </DashboardContext.Provider>
      )
    },

    // Static data: can be extracted without rendering
    data: {
      title: 'Dashboard',
      description: 'User dashboard with navigation and notifications',
      requiresAuth: true,
      allowedRoles: ['user', 'admin'],
      theme: 'dark'
    },

    // Inner state: provides access to layout state for children
    innerState: () => {
      const context = useContext(DashboardContext)
      
      if (!context) {
        throw new Error('DashboardLayout.innerState must be used within DashboardLayout')
      }

      return context
    }
  }
})

// ============================================================================
// 4. USE IN NEXT.JS LAYOUT FILE
// ============================================================================

// File: app/dashboard/layout.tsx
export default function Layout({ children }: { children: ReactNode }) {
  const layout = DashboardLayout({ children })
  
  // Render using the ui function
  // The children renderer receives the inner state
  return layout.ui((innerState) => {
    // We can use innerState here if needed, or just pass children through
    return children
  })
}

// ============================================================================
// 5. USE IN PAGE COMPONENTS
// ============================================================================

// File: app/dashboard/page.tsx
export function DashboardPage() {
  // Access layout state using innerState
  const layout = DashboardLayout({ children: null })
  const state = layout.innerState()

  return (
    <div>
      <h2>Welcome to Dashboard</h2>
      
      {/* Use layout state in your page */}
      <div className="stats">
        <p>Sidebar: {state.sidebarOpen ? 'Open' : 'Closed'}</p>
        <p>Current Tab: {state.currentTab}</p>
        <p>Notifications: {state.notifications}</p>
      </div>

      {/* Interact with layout state */}
      <div className="actions">
        <button onClick={state.toggleSidebar}>
          Toggle Sidebar
        </button>
        <button onClick={() => state.setCurrentTab('settings')}>
          Go to Settings
        </button>
        <button onClick={state.clearNotifications}>
          Clear Notifications
        </button>
      </div>

      <div className="content">
        <p>Your dashboard content here...</p>
      </div>
    </div>
  )
}

// ============================================================================
// 6. USE IN MIDDLEWARE / ROUTING
// ============================================================================

// File: middleware.ts
export function middleware(request: Request) {
  const pathname = request.nextUrl.pathname

  // Check if route uses dashboard layout
  if (pathname.startsWith('/dashboard')) {
    // Extract static data WITHOUT rendering
    const layout = DashboardLayout({ children: null })
    const { data } = layout

    // Check auth requirement
    if (data.requiresAuth && !hasSession(request)) {
      return Response.redirect('/login')
    }

    // Check role permissions
    const userRole = getUserRole(request)
    if (!data.allowedRoles.includes(userRole)) {
      return Response.redirect('/unauthorized')
    }

    // Set theme based on layout data
    const response = NextResponse.next()
    response.cookies.set('theme', data.theme)
    return response
  }

  return NextResponse.next()
}

// ============================================================================
// 7. GENERATED layout.info.ts FILE
// ============================================================================

// File: app/dashboard/layout.info.ts (AUTO-GENERATED)
/*
import { DashboardLayout } from './layout'

const dashboardState = DashboardLayout({ children: null })

export const Layouts = {
  Dashboard: {
    name: 'Dashboard',
    data: dashboardState.data,
    dataSchema: z.object({
      title: z.string(),
      description: z.string(),
      requiresAuth: z.boolean(),
      allowedRoles: z.array(z.string()),
      theme: z.string()
    }),
    innerStateType: {} as ReturnType<typeof dashboardState.innerState>
  }
}

export type DashboardInnerState = {
  sidebarOpen: boolean
  currentTab: string
  notifications: number
  toggleSidebar: () => void
  setCurrentTab: (tab: string) => void
  clearNotifications: () => void
}
*/

// ============================================================================
// 8. ADVANCED: NESTED LAYOUTS WITH SHARED STATE
// ============================================================================

// Child layout can access parent layout state
export const SettingsLayout = defineLayout(function layoutState({ children }: LayoutParams) {
  // Access parent dashboard layout state
  const parentLayout = DashboardLayout({ children: null })
  const parentState = parentLayout.innerState()

  const [activeSection, setActiveSection] = useState('general')

  return {
    ui: (renderChildren) => {
      return (
        <div className="settings-layout">
          <aside>
            <h3>Settings</h3>
            <ul>
              <li onClick={() => setActiveSection('general')}>General</li>
              <li onClick={() => setActiveSection('privacy')}>Privacy</li>
              <li onClick={() => setActiveSection('notifications')}>Notifications</li>
            </ul>
          </aside>
          <div className="settings-content">
            {renderChildren({
              activeSection,
              setActiveSection,
              // Also expose parent state
              parentSidebarOpen: parentState.sidebarOpen,
              parentNotifications: parentState.notifications
            })}
          </div>
        </div>
      )
    },

    data: {
      title: 'Settings',
      requiresAuth: true,
      parentLayout: 'Dashboard'
    },

    innerState: () => {
      // Could use context here too
      return {
        activeSection,
        setActiveSection,
        parentState
      }
    }
  }
})

// ============================================================================
// KEY BENEFITS DEMONSTRATED
// ============================================================================

/*
1. ✅ State Management: Hooks work naturally in layoutState function
2. ✅ Context: Clean integration with React Context API
3. ✅ Type Safety: Full TypeScript support for state and data
4. ✅ No Rendering: Data extractable without executing UI/hooks
5. ✅ Children Access: Pages can access layout state via innerState()
6. ✅ Middleware: Static data accessible in routing/middleware
7. ✅ Nested Layouts: Child layouts can access parent state
8. ✅ Clean API: Simple, intuitive pattern for developers
*/
