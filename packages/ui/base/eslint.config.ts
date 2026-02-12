import reactConfig from "@repo/config-eslint/react";
import { defineConfig } from "@repo/config-eslint";

export default defineConfig([
    { extends: [reactConfig.configs.base()], files: ["src/**/*.{ts,tsx}"] },
    {
        extends: [reactConfig.configs.test()],
        files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
        rules: {
            "@typescript-eslint/no-empty-function": "off",
        },
    },
]);
