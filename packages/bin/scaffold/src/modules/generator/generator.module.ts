/**
 * Generator Module
 *
 * Provides template processing and file generation services.
 * Includes file merging for multi-plugin contributions.
 * Includes Global Context Registry for inter-generator communication.
 */
import { Module } from "@nestjs/common";
import { IoModule } from "../io";
import { ConfigModule } from "../config";
import { PluginModule } from "../plugin";
import { GuardModule } from "../guard";
import { CLIModule } from "../cli";
import { TemplateService } from "./template.service";
import { GeneratorOrchestratorService } from "./generator-orchestrator.service";
import { BaseGenerator } from "./base/base.generator";
import { FileMergerService } from "./file-merger.service";
import { GlobalContextRegistryService } from "./global-context-registry.service";

@Module({
  imports: [IoModule, ConfigModule, PluginModule, GuardModule, CLIModule],
  providers: [
    TemplateService,
    GeneratorOrchestratorService,
    BaseGenerator,
    FileMergerService,
    GlobalContextRegistryService,
  ],
  exports: [
    TemplateService,
    GeneratorOrchestratorService,
    BaseGenerator,
    FileMergerService,
    GlobalContextRegistryService,
  ],
})
export class GeneratorModule {}
