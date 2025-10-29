import { defineConfig } from "@repo/eslint-config";
import nestjsConfig from "@repo/eslint-config/nestjs";

export default defineConfig([
    { extends: [nestjsConfig.configs.base], files: ["src/**/*"] },
    {
        extends: [nestjsConfig.configs.test],
        files: ["**/__tests__/**/*", "**/*.test.*", "**/*.spec.*"],
    },
]);
