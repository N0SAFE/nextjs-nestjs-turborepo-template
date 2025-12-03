/**
 * Auth utilities module exports
 * 
 * This module provides utilities for authentication and access control:
 * - Context utilities for extracting request information
 * - Access control utilities for flexible role and permission checks
 * - AuthUtils class for programmatic auth operations
 */

// Context utilities
export * from './context';

// Access control utilities
export * from './access-control.utils';

// Auth utilities class (can be used in ORPC and NestJS)
export * from './auth-utils';
