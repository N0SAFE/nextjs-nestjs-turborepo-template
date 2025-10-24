/**
 * Build system - Programmatic API exports
 */

// Export types
export * from './types';

// Export services
export { BuildService } from './services/build.service';

// Export adapters
export { BuilderAdapter, BuilderAdapterRegistry } from './adapters/adapter.interface';
export { AdapterRegistry } from './adapters/adapter.registry';
export { BunAdapter } from './adapters/bun.adapter';

// Export module
export { BuildModule } from './build.module';

// Export lock
export { PackageLock } from './lock/package-lock';
