/**
 * Config Module
 *
 * Provides services for configuration parsing and validation.
 */
import { Module } from "@nestjs/common";
import { ConfigParserService } from "./config-parser.service";
import { ConfigValidatorService } from "./config-validator.service";

@Module({
  providers: [ConfigParserService, ConfigValidatorService],
  exports: [ConfigParserService, ConfigValidatorService],
})
export class ConfigModule {}
