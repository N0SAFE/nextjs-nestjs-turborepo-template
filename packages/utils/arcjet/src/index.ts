/**
 * @repo/arcjet - Arcjet integration for ORPC middleware
 * 
 * This package provides:
 * - ArcjetService: Service wrapper for Arcjet SDK
 * - ORPC middleware factories for easy integration
 * - Generic ORPC utilities for creating custom middleware
 */

// Arcjet Service
export {
  ArcjetService,
  createArcjetService,
  type ArcjetRequestContext,
  // Re-export from Arcjet SDK
  shield,
  tokenBucket,
  fixedWindow,
  slidingWindow,
  detectBot,
  validateEmail,
  type ArcjetDecision,
} from './arcjet.service';

// ORPC Middleware
export {
  createArcjetMiddleware,
  rateLimitMiddleware,
  botProtectionMiddleware,
  shieldMiddleware,
  ArcjetDeniedError,
  type ORPCContextWithRequest,
  type ArcjetMiddlewareOptions,
} from './orpc-middleware';

// ORPC Utilities
export {
  ORPCUtils,
  createMiddleware,
  conditionalMiddleware,
  transformContext,
  validateInput,
  cacheResults,
  loggingMiddleware,
  composeMiddleware,
  type ORPCContext,
  type MiddlewareOptions,
} from './orpc-utils';
