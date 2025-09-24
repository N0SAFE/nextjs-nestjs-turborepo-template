import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { appContract } from "@repo/api-contracts";
import { userSchema } from "@repo/api-contracts/common/user";

export function generateSpec() {
    const generator = new OpenAPIGenerator({
        schemaConverters: [new ZodToJsonSchemaConverter()],
    });

    return generator.generate(appContract, {
        info: {
            title: "API",
            version: "1.0.0",
        },
        servers: [{ url: "/" }],
        commonSchemas: {
            User: { schema: userSchema }
        }
    });
}
