/**
 * Auth utilities module exports
 * 
 * This module provides utilities for authentication and access control:
 * - Context utilities for extracting request information
 * - AuthUtils class for programmatic auth operations
 * - RequestWithSession type for NestJS guards/controllers
 */

// Context utilities
export * from './context';

// Auth utilities class (can be used in ORPC and NestJS)
export * from './auth-utils';
