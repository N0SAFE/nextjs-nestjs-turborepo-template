import nextjsConfig from '@repo-configs/eslint/nextjs'
import { defineConfig } from "@repo-configs/eslint";

export default defineConfig([
    {
        extends: [nextjsConfig.configs.base],
        files: ["src/**/*.{ts,tsx,js,jsx}"],
        rules: {
            // Disable this rule to prevent stack overflow on complex recursive types
            "@typescript-eslint/no-unnecessary-type-parameters": "off",
        },
    },
    {extends: [nextjsConfig.configs.test],
        files: ["**/__tests__/**/*.{ts,tsx,js,jsx}", "**/*.test.{ts,tsx,js,jsx}", "**/*.spec.{ts,tsx,js,jsx}"],
    },
])