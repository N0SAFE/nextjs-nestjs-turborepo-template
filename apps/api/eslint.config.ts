import { defineConfig } from "@repo-configs/eslint";
import nestjsConfig from "@repo-configs/eslint/nestjs";

export default defineConfig([
    { extends: [nestjsConfig.configs.base], files: ["src/**/*"], ignores: ["**/*.spec.ts", "**/*.test.ts", "**/*.mock.ts", "**/__tests__/**/*", "**/*.test.*"] },
    {
        extends: [nestjsConfig.configs.test],
        files: ["src/**/*.spec.ts", "src/**/*.test.ts", "src/**/*.mock.ts", "src/**/__tests__/**/*", "src/**/*.test.*"],
    },
]);
