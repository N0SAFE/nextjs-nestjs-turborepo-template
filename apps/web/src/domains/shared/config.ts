/**
 * Shared Query Configuration
 * 
 * Base timing and retry configuration used across all domains
 */

// ============================================================================
// STALE TIME - How long data is considered fresh
// ============================================================================

export const STALE_TIME = {
  FAST: 30_000,        // 30 seconds - Frequently changing data
  DEFAULT: 120_000,    // 2 minutes - Normal data
  SLOW: 300_000,       // 5 minutes - Rarely changing data
  STATIC: 1_800_000,   // 30 minutes - Almost never changes
} as const

// ============================================================================
// GARBAGE COLLECTION TIME - How long unused data stays in cache
// ============================================================================

export const GC_TIME = {
  SHORT: 300_000,      // 5 minutes
  DEFAULT: 600_000,    // 10 minutes
  LONG: 1_800_000,     // 30 minutes
} as const

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

export const RETRY_CONFIG = {
  attempts: 3,
  delay: 1000,         // 1 second
  backoff: 2,          // Exponential: 1s, 2s, 4s
} as const

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(attempt: number): number {
  return RETRY_CONFIG.delay * Math.pow(RETRY_CONFIG.backoff, attempt - 1)
}
