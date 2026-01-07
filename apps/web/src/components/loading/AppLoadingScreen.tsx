/**
 * App Loading Screen
 * 
 * A beautiful, branded loading screen for the entire application.
 * Used as the default loading state during navigation and initial page loads.
 * 
 * Features:
 * - Animated logo with pulse effect
 * - Smooth progress indicator
 * - Professional branding
 * - Responsive design
 * - Dark/light mode compatible
 * 
 * IMPORTANT: This is rendered in Suspense fallbacks, so it MUST NOT:
 * - Use any React hooks
 * - Import 'use client' components that use hooks
 * 
 * Pure server component with CSS animations only.
 */

import { cn } from '@repo/ui/lib/utils'

// ============================================================================
// Logo Component
// ============================================================================

/**
 * Animated logo mark with gradient and glow effects
 */
function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {/* Glow effect behind logo */}
      <div className="absolute inset-0 animate-pulse rounded-2xl bg-primary/20 blur-xl" />
      
      {/* Main logo container */}
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary/80 shadow-2xl shadow-primary/25">
        {/* Lightning bolt icon */}
        <svg
          className="h-10 w-10 text-primary-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>
    </div>
  )
}

// ============================================================================
// Loading Indicators
// ============================================================================

/**
 * Animated dots loading indicator
 */
function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="sr-only">Loading</span>
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-full bg-primary"
          style={{
            animation: 'bounce 1.4s ease-in-out infinite',
            animationDelay: `${String(i * 0.16)}s`,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Smooth progress bar with shimmer effect
 */
function ProgressBar() {
  return (
    <div className="h-1 w-48 overflow-hidden rounded-full bg-muted">
      <div 
        className="h-full w-full rounded-full bg-linear-to-r from-primary via-primary/60 to-primary"
        style={{
          animation: 'progress 2s ease-in-out infinite',
        }}
      />
    </div>
  )
}

/**
 * Spinning ring loader
 */
function SpinnerRing({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {/* Background ring */}
      <div className="h-12 w-12 rounded-full border-4 border-muted" />
      {/* Spinning segment */}
      <div 
        className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-primary"
        style={{ animation: 'spin 1s linear infinite' }}
      />
    </div>
  )
}

// ============================================================================
// Main Loading Screen Variants
// ============================================================================

/**
 * Full-page branded loading screen with logo
 * Use this as the main app loading state
 */
export function AppLoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
      
      {/* Content */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Logo */}
        <LogoMark />
        
        {/* Brand name */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Your App
          </h1>
          <p className="text-sm text-muted-foreground">
            Loading your experience...
          </p>
        </div>
        
        {/* Progress indicator */}
        <ProgressBar />
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

/**
 * Minimal loading screen - just logo and spinner
 * Good for faster perceived loading
 */
export function AppLoadingMinimal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <LogoMark />
        <SpinnerRing />
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

/**
 * Elegant loading screen with dots animation
 */
export function AppLoadingElegant() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent" />
      
      <div className="relative flex flex-col items-center gap-8">
        {/* Animated logo */}
        <div className="relative">
          {/* Outer ring */}
          <div 
            className="absolute -inset-4 rounded-3xl border-2 border-primary/20"
            style={{ animation: 'pulse 2s ease-in-out infinite' }}
          />
          <LogoMark />
        </div>
        
        {/* Loading text with dots */}
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="text-sm font-medium">Loading</span>
          <LoadingDots />
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}

/**
 * Centered loading card - for inline loading states
 */
export function AppLoadingCard() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex flex-col items-center gap-6 rounded-2xl border bg-card p-8 shadow-lg">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
          <svg
            className="h-8 w-8 text-primary"
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
        
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-semibold">Loading</h2>
          <p className="text-sm text-muted-foreground">
            Please wait a moment...
          </p>
        </div>
        
        <SpinnerRing />
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

/**
 * Simple centered spinner - for quick loading states
 */
export function AppLoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <SpinnerRing />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
