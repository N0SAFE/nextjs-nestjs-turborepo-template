/**
 * Dashboard Loading Skeleton
 * 
 * A beautiful loading state that mimics the dashboard layout structure.
 * Used as the Suspense fallback during initial dashboard load.
 * 
 * IMPORTANT: This is rendered in a Suspense fallback, so it MUST NOT:
 * - Use any React hooks (useState, useEffect, useContext, etc.)
 * - Use any client-side only APIs
 * - Import 'use client' components that use hooks
 * 
 * Pure server component with CSS animations only.
 */

import { cn } from '@repo/ui/lib/utils'

// Skeleton primitive - animated pulse effect
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

// Sidebar skeleton
function SidebarSkeleton() {
  return (
    <div className="flex h-screen w-64 flex-col border-r bg-sidebar">
      {/* Header with logo */}
      <div className="flex h-14 items-center gap-3 border-b px-4">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-28" />
      </div>
      
      {/* User section */}
      <div className="flex items-center gap-3 border-b p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      
      {/* Navigation items */}
      <div className="flex-1 space-y-1 p-3">
        {/* Main section */}
        <Skeleton className="mb-3 h-3 w-16" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
        
        {/* Second section */}
        <Skeleton className="mb-3 mt-6 h-3 w-20" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Header skeleton
function HeaderSkeleton() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      {/* Sidebar trigger */}
      <Skeleton className="h-7 w-7 rounded-md" />
      
      {/* Separator */}
      <div className="mx-2 h-4 w-px bg-border" />
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <span className="text-muted-foreground">/</span>
        <Skeleton className="h-4 w-16" />
      </div>
    </header>
  )
}

// Content skeleton - dashboard overview style
function ContentSkeleton() {
  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-6">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-6 shadow-sm"
          >
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Main content card */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b p-6">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-4 p-6">
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
      </div>
    </div>
  )
}

/**
 * Full dashboard loading skeleton
 * Renders a complete dashboard layout skeleton with sidebar, header, and content
 */
export function DashboardLoadingSkeleton() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <SidebarSkeleton />
      
      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <HeaderSkeleton />
        <main className="flex-1 overflow-y-auto">
          <ContentSkeleton />
        </main>
      </div>
    </div>
  )
}

/**
 * Minimal loading spinner for smaller contexts
 */
export function DashboardLoadingSpinner() {
  return (
    <div className="flex h-full min-h-100 w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Outer ring */}
          <div className="h-12 w-12 rounded-full border-4 border-muted" />
          {/* Spinning segment */}
          <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-primary" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Loading your dashboard...
        </p>
      </div>
    </div>
  )
}

/**
 * Branded loading with logo placeholder
 */
export function DashboardLoadingBranded() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-8 bg-background">
      {/* Logo placeholder */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <svg
            className="h-7 w-7 text-primary-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <span className="text-2xl font-bold">Dashboard</span>
      </div>
      
      {/* Loading indicator */}
      <div className="flex flex-col items-center gap-4">
        {/* Progress bar */}
        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          Preparing your workspace...
        </p>
      </div>
      
      {/* Shimmer animation keyframes via inline style */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}
