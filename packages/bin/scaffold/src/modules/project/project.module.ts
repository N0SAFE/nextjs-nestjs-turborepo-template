/**
 * Project Module
 *
 * Provides project management services including dependency and command execution.
 */
import { Module } from "@nestjs/common";
import { IoModule } from "../io";
import { ConfigModule } from "../config";
import { PluginModule } from "../plugin";
import { GeneratorModule } from "../generator";
import { ProjectService } from "./project.service";
import { DependencyService } from "./dependency.service";
import { CommandExecutorService } from "./command-executor.service";

@Module({
  imports: [IoModule, ConfigModule, PluginModule, GeneratorModule],
  providers: [ProjectService, DependencyService, CommandExecutorService],
  exports: [ProjectService, DependencyService, CommandExecutorService],
})
export class ProjectModule {}
