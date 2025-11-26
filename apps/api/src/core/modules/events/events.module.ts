import { Module, Global } from '@nestjs/common';

/**
 * Global Events Module
 * 
 * This module provides the base event infrastructure.
 * Feature-specific event services should be registered in their respective modules.
 */
@Global()
@Module({
  providers: [],
  exports: [],
})
export class EventsModule {}
