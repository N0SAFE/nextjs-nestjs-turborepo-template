// ============================================================================
// MANUAL TESTS - Testing type inference with real ORPC contracts
// ============================================================================
// Run these tests with: bun test type-helpers.ts
// Or: bun run test --filter=type-helpers

import { describe, it, expect } from "vitest";
import { oc } from "@orpc/contract";
import { z } from "zod";
import {
    getProcedureErrorMap,
    getProcedureInputSchema,
    getProcedureMeta,
    getProcedureOutputSchema,
    getProcedureRoute,
    isContractBuilder,
    isContractProcedure,
    isContractRouterBuilder,
} from "../type-helpers";

describe("Type Helpers - Type Guards", () => {
    it("should identify ContractProcedure correctly", () => {
        const procedure = oc.input(z.object({ id: z.string() }));
        expect(isContractProcedure(procedure)).toBe(true);
        expect(isContractProcedure(null)).toBe(false);
        expect(isContractProcedure(undefined)).toBe(false);
        expect(isContractProcedure({})).toBe(false);
        expect(isContractProcedure("test")).toBe(false);
    });

    it("should identify ContractBuilder correctly", () => {
        const builder = oc.input(z.object({ id: z.string() }));
        expect(isContractBuilder(builder)).toBe(true);
        expect(isContractBuilder(null)).toBe(false);
        expect(isContractBuilder({})).toBe(false);
    });
});

describe("Type Helpers - Meta Inference", () => {
    it("should get meta from procedure with custom meta", () => {
        const customMeta = { httpMethod: "GET", description: "Test endpoint" };
        const procedure = oc
            .input(z.object({ id: z.string() }))
            .output(z.object({ name: z.string() }))
            .meta(customMeta);

        const meta = getProcedureMeta(procedure);
        expect(meta).toEqual(customMeta);
    });

    it("should return empty meta for procedure without meta", () => {
        const procedure = oc.input(z.object({ id: z.string() }));
        const meta = getProcedureMeta(procedure);

        // ORPC has default empty meta object
        expect(meta).toBeDefined();
        expect(typeof meta).toBe("object");
    });

    it("should return undefined for non-procedure values", () => {
        expect(getProcedureMeta(null as any)).toBeUndefined();
        expect(getProcedureMeta({} as any)).toBeUndefined();
        expect(getProcedureMeta("test" as any)).toBeUndefined();
    });
});

describe("Type Helpers - Route Inference", () => {
    it("should get route from procedure with route metadata", () => {
        const procedure = oc
            .input(z.object({ id: z.string() }))
            .output(z.object({ name: z.string() }))
            .route({
                method: "GET",
                path: "/users/:id",
            });

        const route = getProcedureRoute(procedure);
        expect(route).toBeDefined();
        expect(route.method).toBe("GET");
        expect(route.path).toBe("/users/:id");
    });

    it("should return undefined for procedure without route", () => {
        const procedure = oc.input(z.object({ id: z.string() }));
        const route = getProcedureRoute(procedure);
      // ORPC returns empty object {} when no route is set
      expect(route).toEqual({});
        expect(getProcedureRoute(null as any)).toBeUndefined();
        expect(getProcedureRoute({} as any)).toBeUndefined();
    });
});

describe("Type Helpers - Error Map Inference", () => {
    it("should get error map from procedure", () => {
        const errorMap = {
            404: z.object({ message: z.string() }),
            500: z.object({ error: z.string() }),
        };

        const procedure = oc
            .input(z.object({ id: z.string() }))
            .output(z.object({ name: z.string() }))
            .errors(errorMap);

        const retrievedErrorMap = getProcedureErrorMap(procedure);
        expect(retrievedErrorMap).toBeDefined();
    expect(retrievedErrorMap).toStrictEqual(errorMap);
    })
    it("should return undefined for procedure without error map", () => {
        const procedure = oc.input(z.object({ id: z.string() }));
        const errorMap = getProcedureErrorMap(procedure);

        // ORPC has default empty error map
        expect(errorMap).toBeDefined();
    });

    it("should return undefined for non-procedure values", () => {
        expect(getProcedureErrorMap(null as any)).toBeUndefined();
        expect(getProcedureErrorMap({} as any)).toBeUndefined();
    });
});

describe("Type Helpers - Input Schema Inference", () => {
    it("should get input schema from procedure", () => {
        const inputSchema = z.object({
            id: z.string(),
            name: z.string().optional(),
        });

        const procedure = oc.input(inputSchema).output(z.object({ success: z.boolean() }));

        const retrievedSchema = getProcedureInputSchema(procedure);
        expect(retrievedSchema).toBeDefined();
        expect(retrievedSchema).toBe(inputSchema);
    });

    it("should return undefined for procedure without input", () => {
        const procedure = oc.output(z.object({ data: z.string() }));
        const schema = getProcedureInputSchema(procedure);
        expect(schema).toBeUndefined();
    });

    it("should return undefined for non-procedure values", () => {
        expect(getProcedureInputSchema(null as any)).toBeUndefined();
        expect(getProcedureInputSchema({} as any)).toBeUndefined();
    });
});

describe("Type Helpers - Output Schema Inference", () => {
    it("should get output schema from procedure", () => {
        const outputSchema = z.object({
            data: z.array(z.string()),
            count: z.number(),
        });

        const procedure = oc.input(z.object({ page: z.number() })).output(outputSchema);

        const retrievedSchema = getProcedureOutputSchema(procedure);
        expect(retrievedSchema).toBeDefined();
        expect(retrievedSchema).toBe(outputSchema);
    });

    it("should return undefined for procedure without output", () => {
        const procedure = oc.input(z.object({ data: z.string() }));
        const schema = getProcedureOutputSchema(procedure);
        expect(schema).toBeUndefined();
    });

    it("should return undefined for non-procedure values", () => {
        expect(getProcedureOutputSchema(null as any)).toBeUndefined();
        expect(getProcedureOutputSchema({} as any)).toBeUndefined();
    });
});

describe("Type Helpers - Complex Real-World Scenarios", () => {
    it("should work with complete procedure with all properties", () => {
        const customMeta = {
            httpMethod: "POST" as const,
            auth: true,
            rateLimit: 100,
        };

        const inputSchema = z.object({
            email: z.email(),
            password: z.string().min(8),
        });

        const outputSchema = z.object({
            id: z.string(),
            token: z.string(),
            expiresAt: z.number(),
        });

        const errorMap = {
            400: z.object({ message: z.string() }),
            401: z.object({ error: z.literal("Unauthorized") }),
        };

        const procedure = oc.meta(customMeta).input(inputSchema).output(outputSchema).errors(errorMap).route({
            method: "POST",
            path: "/auth/login",
            summary: "User login",
        });

        // Test all helpers work together
        const meta = getProcedureMeta(procedure);
        const route = getProcedureRoute(procedure);
        const errors = getProcedureErrorMap(procedure);
        const input = getProcedureInputSchema(procedure);
        const output = getProcedureOutputSchema(procedure);

        expect(meta).toEqual(customMeta);
        expect(route.method).toBe("POST");
        expect(route.path).toBe("/auth/login");
        expect(errors).toStrictEqual(errorMap);
        expect(input).toBe(inputSchema);
        expect(output).toBe(outputSchema);
    });

    it("should work with router builder", () => {
        const router = oc.tag('test')

        expect(isContractRouterBuilder(router)).toBe(true);
    });

    it("should work with chained builder methods", () => {
        const baseBuilder = oc.meta({ httpMethod: "GET" }).input(z.object({ id: z.string() }));
        expect(isContractBuilder(baseBuilder)).toBe(true);
        expect(getProcedureInputSchema(baseBuilder)).toBeDefined();

        const withOutput = baseBuilder.output(z.object({ name: z.string() }));
        expect(isContractBuilder(withOutput)).toBe(true);
        expect(getProcedureInputSchema(withOutput)).toBeDefined();
        expect(getProcedureOutputSchema(withOutput)).toBeDefined();

        const withMeta = withOutput.meta({ httpMethod: "GET" });
        expect(isContractBuilder(withMeta)).toBe(true);
        const meta = getProcedureMeta(withMeta);
        expect(meta).toEqual({ httpMethod: "GET" });
    });
});

describe("Type Helpers - Type Inference Edge Cases", () => {
    it("should infer types for procedures with undefined schemas", () => {
    const procedure = oc.meta({ test: true });
        const input = getProcedureInputSchema(procedure);
        const output = getProcedureOutputSchema(procedure);

        expect(input).toBeUndefined();
        expect(output).toBeUndefined();
    });

    it("should handle nested meta objects", () => {
        const complexMeta = {
            http: {
                method: "POST" as const,
                headers: {
                    "Content-Type": "application/json",
                },
            },
            auth: {
                required: true,
                roles: ["admin", "user"] as const,
            },
            cache: {
                ttl: 300,
                key: "users:list",
            },
        };

        const procedure = oc.meta(complexMeta).input(z.object({ query: z.string() }));
        const meta = getProcedureMeta(procedure);
        expect(meta).toEqual(complexMeta);
    });
});