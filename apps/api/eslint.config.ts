import { defineConfig } from "@repo/eslint-config";
import nestjsConfig from "@repo/eslint-config/nestjs";

export default defineConfig([
    { extends: [nestjsConfig.configs.base], files: ["src/**/*"], ignores: ["**/*.spec.ts", "**/*.test.ts", "**/*.mock.ts", "**/__tests__/**/*", "**/*.test.*"] },
    {
        extends: [nestjsConfig.configs.test],
        files: ["**/*.spec.ts", "**/*.test.ts", "**/*.mock.ts", "**/__tests__/**/*", "**/*.test.*"],
    },
]);
