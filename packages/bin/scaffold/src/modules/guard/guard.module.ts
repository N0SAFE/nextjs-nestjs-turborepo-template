/**
 * Guard Module
 *
 * Provides guard checking functionality for scaffold operations.
 */

import { Module } from "@nestjs/common";
import { GuardService } from "./guard.service";

@Module({
  providers: [GuardService],
  exports: [GuardService],
})
export class GuardModule {}
