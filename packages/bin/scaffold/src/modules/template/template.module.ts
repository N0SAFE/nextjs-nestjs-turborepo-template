/**
 * Template Module
 *
 * Provides Handlebars template rendering services.
 */
import { Module } from "@nestjs/common";
import { TemplateService } from "./template.service";
import { TemplateRegistryService } from "./template-registry.service";
import { TemplateHelpersService } from "./template-helpers.service";

@Module({
  providers: [
    TemplateService,
    TemplateRegistryService,
    TemplateHelpersService,
  ],
  exports: [
    TemplateService,
    TemplateRegistryService,
    TemplateHelpersService,
  ],
})
export class TemplateModule {}
