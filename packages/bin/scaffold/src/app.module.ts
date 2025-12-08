/**
 * Root Application Module
 *
 * This module imports all feature modules and commands for the scaffold CLI.
 */
import { Module } from "@nestjs/common";

// Core Modules
import { IoModule } from "./modules/io/io.module";
import { ConfigModule } from "./modules/config/config.module";
import { PluginModule } from "./modules/plugin/plugin.module";
import { GeneratorModule } from "./modules/generator/generator.module";
import { ProjectModule } from "./modules/project/project.module";
import { TemplateModule } from "./modules/template/template.module";

// CLI Commands
import { CreateCommand } from "./commands/create.command";
import { AddCommand } from "./commands/add.command";
import { RemoveCommand } from "./commands/remove.command";
import {
  ListCommand,
  ListPluginsSubCommand,
  ListTemplatesSubCommand,
  ListCategoriesSubCommand,
} from "./commands/list.command";
import { ValidateCommand } from "./commands/validate.command";
import {
  InfoCommand,
  InfoVersionSubCommand,
  InfoEnvSubCommand,
  InfoProjectSubCommand,
  InfoStatsSubCommand,
} from "./commands/info.command";

@Module({
  imports: [
    // Core modules providing services
    IoModule,
    ConfigModule,
    PluginModule,
    GeneratorModule,
    ProjectModule,
    TemplateModule,
  ],
  providers: [
    // CLI Commands
    CreateCommand,
    AddCommand,
    RemoveCommand,
    ListCommand,
    ListPluginsSubCommand,
    ListTemplatesSubCommand,
    ListCategoriesSubCommand,
    ValidateCommand,
    InfoCommand,
    InfoVersionSubCommand,
    InfoEnvSubCommand,
    InfoProjectSubCommand,
    InfoStatsSubCommand,
  ],
})
export class AppModule {}
