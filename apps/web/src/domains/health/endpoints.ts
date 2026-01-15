import { orpc } from '@/lib/orpc'

/**
 * Health domain endpoints
 * 
 * All health endpoints use ORPC contracts directly (no custom contracts needed).
 * Health checks are simple stateless operations.
 */
export const healthEndpoints = {
  /**
   * Basic health check - quick endpoint for monitoring
   */
  check: orpc.health.check,
  
  /**
   * Detailed health check with all subsystem status
   */
  detailed: orpc.health.detailed,
} as const

export type HealthEndpoints = typeof healthEndpoints
