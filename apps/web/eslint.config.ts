import nextjsConfig from '@repo-configs/eslint/nextjs'
import { defineConfig } from "@repo-configs/eslint";

export default defineConfig([
    {
        extends: [nextjsConfig.configs.base()],
        files: ["src/**/*.{ts,tsx,js,jsx}"],
        ignores: [
            // Ignore node_modules and external packages for type-checking
            "**/node_modules/**",
            "**/.next/**",
            // Ignore auto-generated declarative-routing files
            "src/routes/index.ts",
            "src/routes/openapi.ts",
        ],
        rules: {
            // Disable this rule to prevent stack overflow on complex recursive types
            "@typescript-eslint/no-unnecessary-type-parameters": "off",
        },
    },
    {extends: [nextjsConfig.configs.test()],
        files: ["**/__tests__/**/*.{ts,tsx,js,jsx}", "**/*.test.{ts,tsx,js,jsx}", "**/*.spec.{ts,tsx,js,jsx}"],
    },
])