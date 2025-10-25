/**
 * Build system - Programmatic API exports
 */

// Export types
export * from './types';
export * from './builders/types';

// Export config helpers
export * from './builders/config-helpers';

// Export services
export { BuildService } from './services/build.service';

// Export adapters
export { BuilderAdapter, BuilderAdapterRegistry } from './adapters/adapter.interface';
export { AdapterRegistry } from './adapters/adapter.registry';
export { BunAdapter } from './adapters/bun.adapter';
export { EsbuildAdapter } from './adapters/esbuild.adapter';
export { TscAdapter } from './adapters/tsc.adapter';
export { RollupAdapter } from './adapters/rollup.adapter';

// Export module
export { BuildModule } from './build.module';

// Export lock
export { PackageLock } from './lock/package-lock';
