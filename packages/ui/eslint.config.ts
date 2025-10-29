import reactConfig from "@repo/eslint-config/react";
import { defineConfig } from "@repo/eslint-config";

export default defineConfig([
    { extends: [reactConfig.configs.base], files: ["src/**/*.{ts,tsx}"] },
    {
        extends: [reactConfig.configs.test],
        files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
        rules: {
            "@typescript-eslint/no-empty-function": "off",
        },
    },
]);
