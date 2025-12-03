import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
import { requireAuth } from "@/core/modules/auth/orpc/middlewares";
import { oc } from "@orpc/contract";
import { implement, Implement } from "@orpc/nest";
import * as z from "zod/v4";
import { AuthGuard } from "@/core/modules/auth/guards/auth.guard";

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
});

@Controller()
export class TestController {
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
}
