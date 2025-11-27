import libraryConfig from "@repo-configs/eslint/library";
import { defineConfig } from "@repo-configs/eslint";

export default defineConfig([
    {
        extends: [libraryConfig.configs.base],
        files: ["src/**/*.{ts,tsx}"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/no-floating-promises": "off",
            "@typescript-eslint/no-confusing-void-expression": "off",
            "@typescript-eslint/require-await": "off",
            "@typescript-eslint/no-unnecessary-type-arguments": "off",
            "@typescript-eslint/no-dynamic-delete": "off",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-inferrable-types": "off",
            "@typescript-eslint/consistent-generic-constructors": "off",
            "@typescript-eslint/prefer-nullish-coalescing": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/prefer-string-starts-ends-with": "off",
            "@typescript-eslint/no-unnecessary-condition": "off",
            "@typescript-eslint/no-misused-promises": "off",
            "@typescript-eslint/await-thenable": "off",
            "@typescript-eslint/dot-notation": "off",
            "prefer-const": "warn",
        },
    },
    {
        extends: [libraryConfig.configs.test],
        files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    },
]);
