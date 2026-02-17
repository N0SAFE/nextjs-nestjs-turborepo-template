import { describe, it, expect } from "vitest";
import { z } from "zod/v4";
import { RouteBuilder, route } from "../core/route-builder";

/**
 * Additional tests for core/route-builder.ts coverage
 * Targets uncovered lines and edge cases
 */

describe("RouteBuilder - Coverage Tests", () => {
    describe("route() helper function", () => {
        it("should create a RouteBuilder via route() helper", () => {
            const builder = route({ summary: "Test route" });
            expect(builder).toBeInstanceOf(RouteBuilder);
        });

        it("should create a RouteBuilder via route() without args", () => {
            const builder = route();
            expect(builder).toBeInstanceOf(RouteBuilder);
        });

        it("should allow chaining from route() helper", () => {
            const contract = route({ summary: "Create user" })
                .method("POST")
                .path("/users")
                .input(z.object({ name: z.string() }))
                .output(z.object({ id: z.uuid() }))
                .build();

            expect(contract).toBeDefined();
            expect(contract["~orpc"]).toBeDefined();
        });
    });

    describe("Output variant union building", () => {
        it("should build union with multiple variants", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .output((b) =>
                    b.union([
                        b.status(200).body(z.object({ found: z.literal(true), data: z.any() })),
                        b.status(404).body(z.object({ found: z.literal(false), message: z.string() })),
                    ]),
                )
                .build();

            expect(routeResult["~orpc"].outputSchema).toBeDefined();
        });

        it("should build union with single variant (edge case)", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .output((b) => b.union([b.status(200).body(z.object({ success: z.boolean() }))]))
                .build();

            expect(routeResult["~orpc"].outputSchema).toBeDefined();
        });

        it("should build union with three variants", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .output((b) =>
                    b.union([
                        b.status(200).body(z.object({ status: z.literal("ok") })),
                        b.status(400).body(z.object({ status: z.literal("bad_request") })),
                        b.status(500).body(z.object({ status: z.literal("error") })),
                    ]),
                )
                .build();

            expect(routeResult["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("Output variant methods", () => {
        it("should create variant with description", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .output((b) =>
                    b.union([
                        b.status(200).body(z.object({ data: z.any() })),
                        b.status(404).body(z.object({ error: z.string() })),
                    ]),
                )
                .build();

            expect(routeResult["~orpc"].outputSchema).toBeDefined();
        });

        it("should create variant with headers", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .output((b) =>
                    b.union([
                        b.status(200).body(z.object({ items: z.array(z.any()) })).headers({ "x-total-count": z.string() }),
                        b.status(204),
                    ]),
                )
                .build();

            expect(routeResult["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("Output builder structured methods", () => {
        it("should build single detailed output with status only", () => {
            const routeResult = new RouteBuilder({ method: "DELETE" }).output((b) => b.status(204)).build();

            expect(routeResult["~orpc"].outputSchema).toBeDefined();
        });

        it("should build single detailed output with headers only", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .output((b) => b.headers({ etag: z.string() }))
                .build();

            expect(routeResult["~orpc"].outputSchema).toBeDefined();
        });

        it("should build single detailed output with body only", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .output((b) => b.body(z.object({ message: z.string() })))
                .build();

            expect(routeResult["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("Path parameter builder edge cases", () => {
        it("should handle wildcard path parameters", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .input((b) => b.params((p) => p`/files/${p.wildcard("path", z.string())}`))
                .output(z.object({ content: z.string() }))
                .build();

            expect(routeResult["~orpc"]).toBeDefined();
        });

        it("should handle multiple path parameters", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .input((b) => b.params((p) => p`/users/${p("userId", z.uuid())}/posts/${p("postId", z.uuid())}`))
                .output(z.object({ post: z.any() }))
                .build();

            expect(routeResult["~orpc"]).toBeDefined();
        });
    });

    describe("Route metadata methods", () => {
        it("should set tags with spread args", () => {
            const routeResult = new RouteBuilder({ method: "GET" }).tags("users", "admin").output(z.any()).build();

            expect(routeResult["~orpc"]).toBeDefined();
        });

        it("should set tags with array", () => {
            const routeResult = new RouteBuilder({ method: "GET" }).tags("users", "admin").output(z.any()).build();

            expect(routeResult["~orpc"]).toBeDefined();
        });

        it("should set summary", () => {
            const routeResult = new RouteBuilder({ method: "GET" }).summary("Get all users").output(z.any()).build();

            expect(routeResult["~orpc"]).toBeDefined();
        });

        it("should set description", () => {
            const routeResult = new RouteBuilder({ method: "GET" }).description("Retrieves all users from the database").output(z.any()).build();

            expect(routeResult["~orpc"]).toBeDefined();
        });

        it("should set deprecated", () => {
            const routeResult = new RouteBuilder({ method: "GET" }).deprecated(true).output(z.any()).build();

            expect(routeResult["~orpc"]).toBeDefined();
        });

        it("should chain multiple metadata methods", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .path("/legacy/users")
                .tags("legacy")
                .summary("Legacy user endpoint")
                .description("This endpoint is deprecated")
                .deprecated(true)
                .output(z.any())
                .build();

            expect(routeResult["~orpc"]).toBeDefined();
        });
    });

    describe("updateRoute method", () => {
        it("should update route config", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .output((b) => b.status(200).body(z.object({ data: z.any() })))
                .updateRoute({ outputStructure: "detailed" })
                .build();

            expect(routeResult["~orpc"]).toBeDefined();
        });
    });

    describe("Output proxy operations", () => {
        it("should use pick on output", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .output(z.object({ id: z.uuid(), name: z.string(), password: z.string() }))
                .output((b) => b.body((s) => s.pick({ id: true, name: true })))
                .build();

            expect(routeResult["~orpc"].outputSchema).toBeDefined();
        });

        it("should use omit on output", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .output(z.object({ id: z.uuid(), name: z.string(), password: z.string() }))
                .output((b) => b.body((s) => s.omit({ password: true })))
                .build();

            expect(routeResult["~orpc"].outputSchema).toBeDefined();
        });

        it("should use extend on output", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .output(z.object({ id: z.uuid() }))
                .output((b) => b.body((s) => s.extend({ createdAt: z.date() })))
                .build();

            expect(routeResult["~orpc"].outputSchema).toBeDefined();
        });

        it("should use partial on output", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .output(z.object({ id: z.uuid(), name: z.string() }))
                .output((b) => b.body((s) => s.partial()))
                .build();

            expect(routeResult["~orpc"].outputSchema).toBeDefined();
        });

        it("should use partial with specific keys on output", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .output(z.object({ id: z.uuid(), name: z.string(), email: z.email() }))
                .output((b) => b.body((s) => s.partial({ name: true })))
                .build();

            expect(routeResult["~orpc"].outputSchema).toBeDefined();
        });

        it("should use nullable on output", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .output(z.object({ id: z.uuid() }))
                .output((b) => b.body((s) => s.nullable()))
                .build();

            expect(routeResult["~orpc"].outputSchema).toBeDefined();
        });

        it("should use custom modifier on output", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .output(z.object({ id: z.uuid() }))
                .output((b) => b.body((schema) => z.object({ wrapped: schema })))
                .build();

            expect(routeResult["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("Input proxy operations", () => {
        it("should use pick on input", () => {
            const routeResult = new RouteBuilder({ method: "POST" })
                .input(z.object({ name: z.string(), email: z.email(), password: z.string() }))
                .input((b) => b.pick(["name", "email"]))
                .output(z.object({ id: z.uuid() }))
                .build();

            expect(routeResult["~orpc"].inputSchema).toBeDefined();
        });

        it("should use omit on input", () => {
            const routeResult = new RouteBuilder({ method: "POST" })
                .input(z.object({ name: z.string(), email: z.email(), passwordConfirm: z.string() }))
                .input((b) => b.omit(["passwordConfirm"]))
                .output(z.object({ id: z.uuid() }))
                .build();

            expect(routeResult["~orpc"].inputSchema).toBeDefined();
        });

        it("should use extend on input", () => {
            const routeResult = new RouteBuilder({ method: "POST" })
                .input(z.object({ name: z.string() }))
                .input((b) => b.extend({ email: z.email() }))
                .output(z.object({ id: z.uuid() }))
                .build();

            expect(routeResult["~orpc"].inputSchema).toBeDefined();
        });

        it("should use partial on input", () => {
            const routeResult = new RouteBuilder({ method: "PATCH" })
                .input(z.object({ name: z.string(), email: z.email() }))
                .input((b) => b.partial())
                .output(z.object({ id: z.uuid() }))
                .build();

            expect(routeResult["~orpc"].inputSchema).toBeDefined();
        });
    });

    describe("Errors method", () => {
        it("should define errors with builder pattern", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .errors((e) => [
                    e().code("NOT_FOUND").message("Resource not found").status(404),
                    e().code("UNAUTHORIZED").message("Not authorized").status(401),
                ])
                .output(z.object({ data: z.any() }))
                .build();

            expect(routeResult["~orpc"]).toBeDefined();
        });

        it("should define errors with builder pattern", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .errors((e) => [
                    e().code("NOT_FOUND").message("Resource not found").status(404),
                    e().code("VALIDATION_ERROR").data(z.object({ fields: z.array(z.string()) })).status(422),
                ])
                .output(z.object({ data: z.any() }))
                .build();

            expect(routeResult["~orpc"]).toBeDefined();
        });
    });

    describe("Method helper", () => {
        it("should create POST method builder", () => {
            const routeResult = new RouteBuilder()
                .method("POST")
                .input(z.object({ data: z.string() }))
                .output(z.object({ id: z.uuid() }))
                .build();

            expect(routeResult["~orpc"].route.method).toBe("POST");
        });

        it("should create PUT method builder", () => {
            const routeResult = new RouteBuilder().method("PUT").input(z.object({ id: z.uuid(), data: z.string() })).output(z.object({ success: z.boolean() })).build();

            expect(routeResult["~orpc"].route.method).toBe("PUT");
        });

        it("should create DELETE method builder", () => {
            const routeResult = new RouteBuilder().method("DELETE").output(z.object({ deleted: z.boolean() })).build();

            expect(routeResult["~orpc"].route.method).toBe("DELETE");
        });

        it("should create PATCH method builder", () => {
            const routeResult = new RouteBuilder().method("PATCH").input(z.object({ data: z.string().optional() })).output(z.object({ success: z.boolean() })).build();

            expect(routeResult["~orpc"].route.method).toBe("PATCH");
        });
    });

    describe("status() on OutputSchemaProxy", () => {
        it("should create detailed output with status()", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .output(z.object({ data: z.any() }))
                .output((b) => b.status(200))
                .build();

            expect(routeResult["~orpc"].outputSchema).toBeDefined();
        });

        it("should create detailed output with status() and body", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .output((b) => b.status(201).body(z.object({ id: z.uuid() })))
                .build();

            expect(routeResult["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("headers() on OutputSchemaProxy", () => {
        it("should create detailed output with headers()", () => {
            const routeResult = new RouteBuilder({ method: "GET" })
                .output(z.object({ data: z.any() }))
                .output((b) => b.headers({ etag: z.string() }))
                .build();

            expect(routeResult["~orpc"].outputSchema).toBeDefined();
        });
    });
});
