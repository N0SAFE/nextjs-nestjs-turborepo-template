/**
 * Better Auth Plugin Utilities
 * 
 * Export all plugin utility classes and factory functions
 */

// Export the new factory-based wrappers (preferred)
export * from './plugin-wrapper-factory';

// Export factory for decorators and middlewares
export * from './plugin-factory';

// Keep old exports for backward compatibility (deprecated)
export * from './context-aware-plugins';
