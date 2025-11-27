import libraryConfig from "@repo-configs/eslint/library";
import { defineConfig } from "@repo-configs/eslint";

export default defineConfig([
    {
        extends: [libraryConfig.configs.base],
        files: ["**/*.{ts,tsx}"],
        rules: {
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-confusing-void-expression": "off",
            "@typescript-eslint/require-await": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/use-unknown-in-catch-callback-variable": "off",
        },
    },
    {
        extends: [libraryConfig.configs.test],
        files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    },
]);
