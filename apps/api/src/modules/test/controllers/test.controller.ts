import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
import { requireAuth } from "@/core/modules/auth/orpc/middlewares";
import { oc } from "@orpc/contract";
import { implement, Implement } from "@orpc/nest";
import * as z from "zod/v4";
import { AuthGuard } from "@/core/modules/auth/guards/auth.guard";
import { ArcjetService } from "@/core/services/arcjet.service";

const testContracts = oc.prefix("/test/orpc").router({
    testNonAuthenticatedOrpc: oc.route({
        method: "GET",
        path: "/non-authenticated",
    }).input(z.object({})).output(
        z.object({
            ok: z.boolean(),
        })
    ),
    testAuthenticatedOrpc: oc.route({
        method: "GET",
        path: "/authenticated",
    }).input(z.object({})).output(
        z.object({
            ok: z.boolean(),
        })
    ),
    testArcjetRateLimit: oc.route({
        method: "POST",
        path: "/arcjet/rate-limit",
    }).input(z.object({
        message: z.string(),
    })).output(
        z.object({
            ok: z.boolean(),
            message: z.string(),
        })
    ),
    testArcjetShield: oc.route({
        method: "POST",
        path: "/arcjet/shield",
    }).input(z.object({
        data: z.string(),
    })).output(
        z.object({
            ok: z.boolean(),
            protected: z.boolean(),
        })
    ),
});

@Controller()
export class TestController {
    constructor(private readonly arcjetService: ArcjetService) {}
    @Get("test/non-authenticated")
    @ApiResponse({
        status: 200,
        description: "A non-authenticated test endpoint",
    })
    testNonAuthenticated() {
        return {
            message: "This is a non-authenticated test endpoint.",
        };
    }

    @Implement(testContracts.testNonAuthenticatedOrpc)
    testNonAuthenticatedOrpc() {
        return implement(testContracts.testNonAuthenticatedOrpc).handler(() => {
            return {
                ok: true,
            };
        });
    }

    @Get("test/authenticated")
    @ApiResponse({
        status: 200,
        description: "An authenticated test endpoint (legacy - use ORPC route instead)",
    })
    @UseGuards(AuthGuard)
    testAuthenticated() {
        return {
            message: "This is an authenticated test endpoint.",
        };
    }
    
    @Implement(testContracts.testAuthenticatedOrpc)
    testAuthenticatedOrpc() {
        return implement(testContracts.testAuthenticatedOrpc).use(requireAuth()).handler(({context}) => {
            console.log(!!context.auth.user)
            return {
                ok: true,
            };
        });
    }

    /**
     * Example: Rate limiting with Arcjet
     * This endpoint is rate-limited to 10 requests per minute
     */
    @Implement(testContracts.testArcjetRateLimit)
    testArcjetRateLimit() {
        return implement(testContracts.testArcjetRateLimit)
            .use(this.arcjetService.rateLimitMiddleware({
                refillRate: 10,
                interval: '1m',
                capacity: 100,
            }))
            .handler(({ input }) => {
                return {
                    ok: true,
                    message: `Received: ${input.message}`,
                };
            });
    }

    /**
     * Example: Shield protection with Arcjet
     * This endpoint is protected against common attacks
     */
    @Implement(testContracts.testArcjetShield)
    testArcjetShield() {
        return implement(testContracts.testArcjetShield)
            .use(this.arcjetService.shieldMiddleware())
            .handler(({ input }) => {
                return {
                    ok: true,
                    protected: true,
                };
            });
    }
}
