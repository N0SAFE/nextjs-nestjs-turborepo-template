/**
 * Bundle Inspector Components
 * 
 * Exports all components for the Bundle Inspector plugin.
 */

export { BundleInspector as default } from './BundleInspector';
export { BundleInspector } from './BundleInspector';

// Re-export types for convenience
export type {
  BundleChunk,
  BundleModule,
  BundleAnalysis,
  BundleFilter,
  BundleComparison,
} from '../contract';
