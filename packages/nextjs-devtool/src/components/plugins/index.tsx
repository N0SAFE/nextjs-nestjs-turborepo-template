/**
 * Plugin Components - Export File
 * 
 * Exports all plugin-specific UI components.
 * These are the actual implementation components that plugins can use.
 */

import React from 'react'
import type { PluginComponentContext } from '../../types'

// Routes Plugin Components
export { RoutesOverview } from '../../core/routes/client/components/RoutesOverview'
export { RouteExplorer } from '../../core/routes/client/components/RouteExplorer'
export { RouteTree } from '../../core/routes/client/components/RouteTree'
export { RouteDetail } from '../../core/routes/client/components/RouteDetail'

// Bundle Inspector Components (placeholder - will be implemented)
export const BundleInspector: React.ComponentType<{ context: PluginComponentContext }> = () => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-2">Bundle Inspector</h3>
      <p className="text-gray-600">Bundle analysis will be implemented here.</p>
    </div>
  )
}

// Log Viewer Components (placeholder - will be implemented)
export const LogViewer: React.ComponentType<{ context: PluginComponentContext }> = () => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-2">Log Viewer</h3>
      <p className="text-gray-600">Log streaming will be implemented here.</p>
    </div>
  )
}

// Performance Monitor Components (placeholder - will be implemented)
export const PerformanceMonitor: React.ComponentType<{ context: PluginComponentContext }> = () => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-2">Performance Monitor</h3>
      <p className="text-gray-600">Performance metrics will be implemented here.</p>
    </div>
  )
}
