/**
 * Builder adapter registry implementation
 */

import { Injectable } from '@nestjs/common';
import {
  BuilderAdapter,
  BuilderAdapterRegistry,
} from './adapter.interface';

@Injectable()
export class AdapterRegistry implements BuilderAdapterRegistry {
  private adapters = new Map<string, BuilderAdapter>();
  private adapterPriority = ['bun', 'esbuild', 'tsc', 'rollup', 'custom'];

  register(adapter: BuilderAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  get(name: string): BuilderAdapter | undefined {
    return this.adapters.get(name);
  }

  async getBest(): Promise<BuilderAdapter | undefined> {
    for (const name of this.adapterPriority) {
      const adapter = this.adapters.get(name);
      if (adapter && (await adapter.isAvailable())) {
        return adapter;
      }
    }
    return undefined;
  }

  list(): BuilderAdapter[] {
    return Array.from(this.adapters.values());
  }
}
