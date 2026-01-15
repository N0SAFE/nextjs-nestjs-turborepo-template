import { FeatureErrorBoundary } from '@/components/error'
import type { ReactNode } from 'react'

/**
 * Admin Panel Layout with Error Boundaries
 * 
 * Wraps admin-specific routes with FeatureErrorBoundary to provide
 * granular error handling for admin operations. Admin errors are logged
 * with feature context for better debugging.
 * 
 * Admin routes:
 * - /dashboard/admin/users - User management
 * - /dashboard/admin/organizations - Organization management  
 * - /dashboard/admin/system - System settings
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <FeatureErrorBoundary
      feature="AdminPanel"
      metadata={{ section: 'admin' }}
    >
      {/* Admin-specific header could go here if needed */}
      <div className="space-y-6">
        {children}
      </div>
    </FeatureErrorBoundary>
  )
}
