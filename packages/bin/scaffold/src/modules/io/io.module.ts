/**
 * IO Module
 *
 * Provides services for file system operations, logging, spinners, and user prompts.
 */
import { Module, Global } from "@nestjs/common";
import { FileSystemService } from "./file-system.service";
import { LoggerService } from "./logger.service";
import { SpinnerService } from "./spinner.service";
import { PromptService } from "./prompt.service";

@Global()
@Module({
  providers: [FileSystemService, LoggerService, SpinnerService, PromptService],
  exports: [FileSystemService, LoggerService, SpinnerService, PromptService],
})
export class IoModule {}
