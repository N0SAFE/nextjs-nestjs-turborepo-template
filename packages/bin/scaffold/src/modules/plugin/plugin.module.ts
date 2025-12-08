/**
 * Plugin Module
 *
 * Provides services for plugin registry and dependency resolution.
 */
import { Module } from "@nestjs/common";
import { PluginRegistryService } from "./plugin-registry.service";
import { PluginResolverService } from "./plugin-resolver.service";

@Module({
  providers: [PluginRegistryService, PluginResolverService],
  exports: [PluginRegistryService, PluginResolverService],
})
export class PluginModule {}
