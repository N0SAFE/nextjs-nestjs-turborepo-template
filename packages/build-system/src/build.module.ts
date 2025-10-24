/**
 * Build module - wires together all build system components
 */

import { Module } from '@nestjs/common';
import { BuildService } from './services/build.service';
import { AdapterRegistry } from './adapters/adapter.registry';
import { BunAdapter } from './adapters/bun.adapter';
import { PackageLock } from './lock/package-lock';
import { BuildCommand } from './commands/build.command';
import { ListCommand } from './commands/list.command';
import { CleanCommand } from './commands/clean.command';

@Module({
  providers: [
    BuildService,
    AdapterRegistry,
    BunAdapter,
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
  ) {
    // Register available adapters
    this.adapterRegistry.register(this.bunAdapter);
  }
}
