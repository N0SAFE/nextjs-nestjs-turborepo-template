import libraryConfig from "@repo-configs/eslint/library";
import { defineConfig } from "@repo-configs/eslint";

export default defineConfig([
    {
        extends: [libraryConfig.configs.base],
        files: ["src/**/*.{ts,tsx}"],
        ignores: ["src/__tests__/**/*"],
        rules: {
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/prefer-nullish-coalescing": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-deprecated": "warn",
        },
    },
    {
        extends: [libraryConfig.configs.test],
        files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
        },
    },
]);
