import { Module } from "@nestjs/common";
import { TestController } from "./controllers/test.controller";

/**
 * TestModule demonstrates auth middleware usage in ORPC procedures
 * 
 * ## Pattern: ORPC Middleware-based Authorization
 * 
 * Authorization is handled through ORPC middleware chains.
 * 
 * ## Example Usage in Controller:
 * 
 * ```typescript
 * // Use middleware in ORPC procedures
 * baseProcedure
 *     .use(this.authService.middleware.admin.hasPermission({ user: ['create'] }))
 *     .handler(async (input, ctx) => { ... })
 * 
 * // Organization-based checks
 * baseProcedure
 *     .use(this.authService.middleware.org.isMemberOf(ctx => ctx.input.organizationId))
 *     .handler(async (input, ctx) => { ... })
 * ```
 */
@Module({
	controllers: [TestController],
})
export class TestModule {}