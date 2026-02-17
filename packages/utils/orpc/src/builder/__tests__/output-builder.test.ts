import { describe, it, expect } from "vitest";
import { z } from "zod/v4";
import { RouteBuilder } from "../core/route-builder";

describe("OutputBuilder - Status Codes", () => {
    describe("Simple output (200 status)", () => {
        it("should create route with simple output schema", () => {
            const route = new RouteBuilder({ method: "GET" }).output(z.object({ id: z.string(), name: z.string() })).build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });

        it("should create route with array output", () => {
            const route = new RouteBuilder({ method: "GET" }).output(z.array(z.object({ id: z.string() }))).build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });

        it("should create route with primitive output", () => {
            const route = new RouteBuilder({ method: "GET" }).output(z.string()).build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("Detailed output with status codes", () => {
        it("should create 200 status with detailed builder", () => {
            const route = new RouteBuilder({ method: "GET" }).output((b) => b.status(200, z.object({ data: z.string() }))).build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });

        it("should create 201 status for creation", () => {
            const route = new RouteBuilder({ method: "POST" }).output((b) => b.status(201, z.object({ id: z.uuid(), created: z.boolean() }))).build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });

        it("should create 204 no content status", () => {
            const route = new RouteBuilder({ method: "DELETE" }).output((b) => b.status(204)).build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });

        it("should create multiple status codes", () => {
            const route = new RouteBuilder({ method: "GET" }).output((b) => b.status(200, z.object({ found: z.literal(true), data: z.any() })).status(204)).build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("HTTP status code categories", () => {
        it("should handle 2xx success codes", () => {
            const route = new RouteBuilder({ method: "POST" })
                .output((b) =>
                    b
                        .status(200, z.object({ data: z.any() }))
                        .status(201, z.object({ created: z.any() }))
                        .status(202, z.object({ accepted: z.any() }))
                        .status(204),
                )
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });

        it("should handle redirect codes", () => {
            const route = new RouteBuilder({ method: "GET" }).output((b) => b.status(301, z.object({ location: z.string() })).status(302, z.object({ location: z.string() }))).build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("Output with headers", () => {
        it("should create output with response headers", () => {
            const route = new RouteBuilder({ method: "GET" })
                .output((b) =>
                    b
                        .headers(
                            z.object({
                                "x-total-count": z.string(),
                                "x-page": z.string(),
                            }),
                        )
                        .status(200, z.object({ items: z.array(z.any()) })),
                )
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });
});

describe("OutputBuilder - Schema Transformations", () => {
    const baseOutputSchema = z.object({
        id: z.uuid(),
        name: z.string(),
        email: z.email(),
        createdAt: z.date(),
        updatedAt: z.date(),
        deletedAt: z.date().nullable(),
    });

    describe("Pick transformation", () => {
        it("should pick specific fields from output", () => {
            const route = new RouteBuilder({ method: "GET" }).output(baseOutputSchema.pick({ id: true, name: true })).build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });

        it("should pick single field", () => {
            const route = new RouteBuilder({ method: "GET" }).output(baseOutputSchema.pick({ id: true })).build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("Omit transformation", () => {
        it("should omit specific fields from output", () => {
            const route = new RouteBuilder({ method: "GET" }).output(baseOutputSchema.omit({ deletedAt: true })).build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });

        it("should omit multiple fields", () => {
            const route = new RouteBuilder({ method: "GET" }).output(baseOutputSchema.omit({ createdAt: true, updatedAt: true, deletedAt: true })).build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("Partial transformation", () => {
        it("should make all fields optional", () => {
            const route = new RouteBuilder({ method: "PATCH" }).output(baseOutputSchema.partial()).build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("Extend transformation", () => {
        it("should extend output with additional fields", () => {
            const route = new RouteBuilder({ method: "GET" })
                .output(
                    baseOutputSchema.extend({
                        _links: z.object({
                            self: z.url(),
                            next: z.url().optional(),
                        }),
                    }),
                )
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("Chained transformations", () => {
        it("should chain pick and extend", () => {
            const route = new RouteBuilder({ method: "GET" }).output(baseOutputSchema.pick({ id: true, name: true }).extend({ score: z.number() })).build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });

        it("should chain omit and partial", () => {
            const route = new RouteBuilder({ method: "PATCH" }).output(baseOutputSchema.omit({ id: true, createdAt: true }).partial()).build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });
});

describe("OutputBuilder - Complex Schemas", () => {
    describe("Nested objects", () => {
        it("should handle deeply nested output", () => {
            const route = new RouteBuilder({ method: "GET" })
                .output(
                    z.object({
                        user: z.object({
                            profile: z.object({
                                avatar: z.object({
                                    url: z.url(),
                                    size: z.number(),
                                }),
                            }),
                        }),
                    }),
                )
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("Arrays and collections", () => {
        it("should handle array of objects", () => {
            const route = new RouteBuilder({ method: "GET" })
                .output(
                    z.object({
                        items: z.array(
                            z.object({
                                id: z.uuid(),
                                name: z.string(),
                            }),
                        ),
                        total: z.number(),
                    }),
                )
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });

        it("should handle tuple output", () => {
            const route = new RouteBuilder({ method: "GET" }).output(z.tuple([z.string(), z.number(), z.boolean()])).build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("Union and discriminated unions", () => {
        it("should handle union output", () => {
            const route = new RouteBuilder({ method: "GET" })
                .output(z.union([z.object({ type: z.literal("user"), name: z.string() }), z.object({ type: z.literal("org"), title: z.string() })]))
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });

        it("should handle discriminated union", () => {
            const route = new RouteBuilder({ method: "GET" })
                .output(
                    z.discriminatedUnion("status", [
                        z.object({ status: z.literal("pending"), eta: z.date() }),
                        z.object({ status: z.literal("complete"), result: z.any() }),
                        z.object({ status: z.literal("failed"), error: z.string() }),
                    ]),
                )
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("Optional and nullable", () => {
        it("should handle optional fields", () => {
            const route = new RouteBuilder({ method: "GET" })
                .output(
                    z.object({
                        required: z.string(),
                        optional: z.string().optional(),
                    }),
                )
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });

        it("should handle nullable fields", () => {
            const route = new RouteBuilder({ method: "GET" })
                .output(
                    z.object({
                        required: z.string(),
                        nullable: z.string().nullable(),
                    }),
                )
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });

        it("should handle nullish fields", () => {
            const route = new RouteBuilder({ method: "GET" })
                .output(
                    z.object({
                        required: z.string(),
                        nullish: z.string().nullish(),
                    }),
                )
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });
});

describe("OutputBuilder - Metadata", () => {
    describe("Description and examples", () => {
        it("should allow description on output schema", () => {
            const route = new RouteBuilder({ method: "GET" }).output(z.object({ id: z.string() }).describe("User information response")).build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });
});

describe("DetailedOutputChainProxy - Full Coverage", () => {
    describe("body() method chaining", () => {
        it("should chain status().body()", () => {
            const route = new RouteBuilder({ method: "GET" })
                .output((b) => b.status(200).body(z.object({ id: z.uuid(), name: z.string() })))
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });

        it("should chain status().body().headers()", () => {
            const route = new RouteBuilder({ method: "POST" })
                .output((b) =>
                    b
                        .status(201)
                        .body(z.object({ id: z.uuid(), created: z.boolean() }))
                        .headers({ "x-request-id": z.string() }),
                )
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });

        it("should chain status().headers().body()", () => {
            const route = new RouteBuilder({ method: "GET" })
                .output((b) =>
                    b
                        .status(200)
                        .headers({ etag: z.string(), "cache-control": z.string() })
                        .body(z.object({ data: z.array(z.any()) })),
                )
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("headers() with ZodObject", () => {
        it("should accept headers as ZodObject directly", () => {
            const headersSchema = z.object({
                "x-total-count": z.string(),
                "x-pagination": z.string(),
            });

            const route = new RouteBuilder({ method: "GET" })
                .output((b) => b.status(200, z.array(z.any())).headers(headersSchema))
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });

        it("should work with headers() as entry point with ZodObject", () => {
            const headersSchema = z.object({
                etag: z.string(),
            });

            const route = new RouteBuilder({ method: "GET" })
                .output((b) => b.headers(headersSchema).status(200, z.object({ items: z.array(z.any()) })))
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("Multiple status() calls", () => {
        it("should allow changing status code mid-chain", () => {
            const route = new RouteBuilder({ method: "GET" })
                .output((b) =>
                    b
                        .status(200)
                        .body(z.object({ found: z.boolean() }))
                        .status(201), // Change status
                )
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });

        it("should allow status with body after headers", () => {
            const route = new RouteBuilder({ method: "POST" })
                .output((b) => b.headers({ "x-trace-id": z.string() }).status(201, z.object({ id: z.uuid() })))
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("build() method direct call", () => {
        it("should build directly from DetailedOutputChainProxy", () => {
            const route = new RouteBuilder({ method: "GET" })
                .output((b) => {
                    const proxy = b.status(200).body(z.object({ success: z.boolean() }));
                    return proxy;
                })
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });

    describe("Complex chaining scenarios", () => {
        it("should handle full chain: status → headers → body", () => {
            const route = new RouteBuilder({ method: "GET" })
                .output((b) =>
                    b
                        .status(200)
                        .headers({
                            "x-total": z.string(),
                            "x-page": z.string(),
                            "x-per-page": z.string(),
                        })
                        .body(
                            z.object({
                                items: z.array(z.object({ id: z.uuid() })),
                                meta: z.object({ total: z.number() }),
                            }),
                        ),
                )
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });

        it("should handle headers → status → body chain", () => {
            const route = new RouteBuilder({ method: "POST" })
                .output((b) =>
                    b
                        .headers({ "x-request-id": z.string() })
                        .status(201)
                        .body(z.object({ id: z.uuid(), created: z.literal(true) })),
                )
                .build();

            expect(route["~orpc"].outputSchema).toBeDefined();
        });
    });
});
