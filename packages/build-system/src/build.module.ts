/**
 * Build module - wires together all build system components
 */

import { Module } from '@nestjs/common';
import { BuildService } from './services/build.service';
import { AdapterRegistry } from './adapters/adapter.registry';
import { BunAdapter } from './adapters/bun.adapter';
import { EsbuildAdapter } from './adapters/esbuild.adapter';
import { TscAdapter } from './adapters/tsc.adapter';
import { RollupAdapter } from './adapters/rollup.adapter';
import { PackageLock } from './lock/package-lock';
import { BuildCommand } from './commands/build.command';
import { ListCommand } from './commands/list.command';
import { CleanCommand } from './commands/clean.command';

@Module({
  providers: [
    BuildService,
    AdapterRegistry,
    BunAdapter,
    EsbuildAdapter,
    TscAdapter,
    RollupAdapter,
    {
      provide: PackageLock,
      useFactory: () => new PackageLock(),
    },
    BuildCommand,
    ListCommand,
    CleanCommand,
  ],
  exports: [BuildService, AdapterRegistry],
})
export class BuildModule {
  constructor(
    private readonly adapterRegistry: AdapterRegistry,
    private readonly bunAdapter: BunAdapter,
    private readonly esbuildAdapter: EsbuildAdapter,
    private readonly tscAdapter: TscAdapter,
    private readonly rollupAdapter: RollupAdapter,
  ) {
    // Register available adapters in priority order
    this.adapterRegistry.register(this.bunAdapter);
    this.adapterRegistry.register(this.esbuildAdapter);
    this.adapterRegistry.register(this.tscAdapter);
    this.adapterRegistry.register(this.rollupAdapter);
  }
}
