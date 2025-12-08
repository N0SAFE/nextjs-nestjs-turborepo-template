/**
 * CLI Module
 *
 * Provides CLI command execution functionality for scaffold operations.
 * Includes builder-ui integration for config conversion and command generation.
 */

import { Module } from "@nestjs/common";
import { CLICommandRunnerService } from "./cli-command-runner.service";
import { BuilderUiAdapterService } from "./builder-ui-adapter.service";
import { GuardModule } from "../guard/guard.module";

@Module({
  imports: [GuardModule],
  providers: [CLICommandRunnerService, BuilderUiAdapterService],
  exports: [CLICommandRunnerService, BuilderUiAdapterService],
})
export class CLIModule {}
