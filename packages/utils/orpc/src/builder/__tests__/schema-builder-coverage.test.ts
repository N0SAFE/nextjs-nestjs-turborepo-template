import { describe, it, expect } from "vitest";
import { z } from "zod/v4";
import { SchemaBuilder, schema } from "../schema-builder";

/**
 * Additional tests for schema-builder.ts coverage
 * Targets uncovered methods: merge, nullable, optional, default, describe, custom
 */

describe("SchemaBuilder - Coverage Tests", () => {
    describe("merge method", () => {
        it("should merge two object schemas", () => {
            const schema1 = z.object({ id: z.uuid() });
            const schema2 = z.object({ name: z.string() });

            const builder = new SchemaBuilder(schema1);
            const merged = builder.merge(schema2).build();

            expect(merged._zod.def.shape.id).toBeDefined();
            expect(merged._zod.def.shape.name).toBeDefined();
        });

        it("should throw when merging non-object schema", () => {
            const builder = new SchemaBuilder(z.string());

            expect(() => {
                // @ts-expect-error - testing runtime error for non-object schema
                builder.merge(z.object({ extra: z.string() }));
            }).toThrow("merge() can only be called on object schemas");
        });
    });

    describe("nullable method", () => {
        it("should make schema nullable", () => {
            const builder = new SchemaBuilder(z.string());
            const result = builder.nullable().build();

            const result1 = result.safeParse(null);
            const result2 = result.safeParse("hello");

            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
        });

        it("should make object schema nullable", () => {
            const builder = new SchemaBuilder(z.object({ id: z.uuid() }));
            const result = builder.nullable().build();

            const parseResult = result.safeParse(null);
            expect(parseResult.success).toBe(true);
        });
    });

    describe("optional method", () => {
        it("should make schema optional", () => {
            const builder = new SchemaBuilder(z.string());
            const result = builder.optional().build();

            const parseResult = result.safeParse(undefined);
            expect(parseResult.success).toBe(true);
        });

        it("should keep schema required for defined values", () => {
            const builder = new SchemaBuilder(z.number());
            const result = builder.optional().build();

            expect(result.safeParse(42).success).toBe(true);
            expect(result.safeParse("not a number").success).toBe(false);
        });
    });

    describe("default method", () => {
        it("should set default value for primitive", () => {
            const builder = new SchemaBuilder(z.string());
            const result = builder.default("default value").build();

            const parseResult = result.parse(undefined);
            expect(parseResult).toBe("default value");
        });

        it("should set default value for number", () => {
            const builder = new SchemaBuilder(z.number());
            const result = builder.default(42).build();

            expect(result.parse(undefined)).toBe(42);
        });

        it("should use provided value over default", () => {
            const builder = new SchemaBuilder(z.string());
            const result = builder.default("default").build();

            expect(result.parse("provided")).toBe("provided");
        });
    });

    describe("describe method", () => {
        it("should add description to schema", () => {
            const builder = new SchemaBuilder(z.string());
            const result = builder.describe("A user identifier").build();

            expect(result.description).toBe("A user identifier");
        });

        it("should add description to object schema", () => {
            const builder = new SchemaBuilder(z.object({ id: z.uuid() }));
            const result = builder.describe("User object").build();

            expect(result.description).toBe("User object");
        });
    });

    describe("custom method", () => {
        it("should apply custom transformation", () => {
            const builder = new SchemaBuilder(z.string());
            const result = builder
                .custom((s) => s.transform((val) => val.toUpperCase()))
                .build();

            const parseResult = result.parse("hello");
            expect(parseResult).toBe("HELLO");
        });

        it("should apply custom refinement", () => {
            const builder = new SchemaBuilder(z.string());
            const result = builder
                .custom((s) =>
                    s.refine((val) => val.length >= 3, {
                        message: "Must be at least 3 characters",
                    }),
                )
                .build();

            expect(result.safeParse("ab").success).toBe(false);
            expect(result.safeParse("abc").success).toBe(true);
        });

        it("should chain multiple custom transformations", () => {
            const builder = new SchemaBuilder(z.string());
            const result = builder
                .custom((s) => s.transform((val) => val.trim()))
                .custom((s) => s.transform((val) => val.toLowerCase()))
                .build();

            const parseResult = result.parse("  HELLO WORLD  ");
            expect(parseResult).toBe("hello world");
        });
    });

    describe("pick method", () => {
        it("should pick fields from object schema", () => {
            const builder = new SchemaBuilder(z.object({ id: z.uuid(), name: z.string(), email: z.email() }));
            const result = builder.pick(["id", "name"]).build();

            expect(result._zod.def.shape.id).toBeDefined();
            expect(result._zod.def.shape.name).toBeDefined();
            // email field should not exist after pick
            expect((result._zod.def.shape as Record<string, unknown>).email).toBeUndefined();
        });

        it("should throw when picking from non-object", () => {
            const builder = new SchemaBuilder(z.string());

            expect(() => {
                // @ts-expect-error - testing runtime error for non-object schema
                builder.pick(["length" as never]);
            }).toThrow("pick() can only be called on object schemas");
        });
    });

    describe("omit method", () => {
        it("should omit fields from object schema", () => {
            const builder = new SchemaBuilder(z.object({ id: z.uuid(), password: z.string() }));
            const result = builder.omit(["password"]).build();

            expect(result._zod.def.shape.id).toBeDefined();
            // password field should not exist after omit
            expect((result._zod.def.shape as Record<string, unknown>).password).toBeUndefined();
        });

        it("should throw when omitting from non-object", () => {
            const builder = new SchemaBuilder(z.number());

            expect(() => {
                // @ts-expect-error - testing runtime error for non-object schema
                builder.omit(["toFixed" as never]);
            }).toThrow("omit() can only be called on object schemas");
        });
    });

    describe("partial method", () => {
        it("should make all fields optional", () => {
            const builder = new SchemaBuilder(z.object({ id: z.uuid(), name: z.string() }));
            const result = builder.partial().build();

            expect(result.safeParse({}).success).toBe(true);
            expect(result.safeParse({ id: "123e4567-e89b-12d3-a456-426614174000" }).success).toBe(true);
        });

        it("should make specific fields optional", () => {
            const builder = new SchemaBuilder(z.object({ id: z.uuid(), name: z.string(), email: z.email() }));
            const result = builder.partial(["name"]).build();

            expect(result.safeParse({ id: "123e4567-e89b-12d3-a456-426614174000", email: "test@example.com" }).success).toBe(true);
        });

        it("should throw when partial on non-object", () => {
            const builder = new SchemaBuilder(z.array(z.string()));

            expect(() => {
                // @ts-expect-error - testing runtime error for non-object schema
                builder.partial();
            }).toThrow("partial() can only be called on object schemas");
        });
    });

    describe("required method", () => {
        it("should make all optional fields required", () => {
            const builder = new SchemaBuilder(z.object({ id: z.uuid(), name: z.string().optional() }));
            const result = builder.required().build();

            expect(result.safeParse({ id: "123e4567-e89b-12d3-a456-426614174000" }).success).toBe(false);
        });

        it("should make specific fields required", () => {
            const builder = new SchemaBuilder(z.object({ 
                id: z.uuid(), 
                name: z.string().optional(), 
                email: z.email().optional() 
            }));
            const result = builder.required(["name"]).build();

            // name should be required now
            expect(result.safeParse({ id: "123e4567-e89b-12d3-a456-426614174000", name: "John" }).success).toBe(true);
        });
    });

    describe("extend method", () => {
        it("should extend object schema with additional fields", () => {
            const builder = new SchemaBuilder(z.object({ id: z.uuid() }));
            const result = builder.extend({ name: z.string() }).build();

            expect(result._zod.def.shape.id).toBeDefined();
            expect(result._zod.def.shape.name).toBeDefined();
        });

        it("should throw when extending non-object", () => {
            const builder = new SchemaBuilder(z.boolean());

            expect(() => {
                // @ts-expect-error - testing runtime error for non-object schema
                builder.extend({ extra: z.string() });
            }).toThrow("extend() can only be called on object schemas");
        });
    });

    describe("getSchema method", () => {
        it("should return current schema without building", () => {
            const original = z.string();
            const builder = new SchemaBuilder(original);

            expect(builder.getSchema()).toBe(original);
        });
    });

    describe("build method", () => {
        it("should return final schema", () => {
            const builder = new SchemaBuilder(z.string());
            const result = builder.build();

            expect(result.safeParse("hello").success).toBe(true);
        });
    });
});

describe("schema() helper function", () => {
    it("should create builder from existing schema", () => {
        const original = z.string();
        const builder = schema(original);

        expect(builder).toBeInstanceOf(SchemaBuilder);
        expect(builder.build()).toBe(original);
    });

    it("should allow chaining from schema()", () => {
        const result = schema(z.string()).nullable().build();

        expect(result.safeParse(null).success).toBe(true);
    });
});

describe("SchemaBuilder - Complex chains", () => {
    it("should chain multiple operations", () => {
        const result = new SchemaBuilder(z.object({ id: z.uuid(), name: z.string() }))
            .pick(["name"])
            .describe("User object")
            .build();

        expect(result.description).toBe("User object");
        expect(result._zod.def.shape.name).toBeDefined();
        // id field should not exist after pick
        expect((result._zod.def.shape as Record<string, unknown>).id).toBeUndefined();
    });

    it("should handle nullable with describe at end", () => {
        const result = new SchemaBuilder(z.object({ id: z.uuid() }))
            .nullable()
            .describe("User identifier")
            .build();

        expect(result.description).toBe("User identifier");
        expect(result.safeParse(null).success).toBe(true);
    });
});
