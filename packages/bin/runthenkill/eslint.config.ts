import libraryConfig from "@repo-configs/eslint/library";
import { defineConfig } from "@repo-configs/eslint";

export default defineConfig([
    {
        extends: [libraryConfig.configs.base],
        files: ["*.ts", "src/**/*.{ts,tsx}"],
        rules: {
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/no-confusing-void-expression": "off",
            "@typescript-eslint/consistent-type-definitions": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-misused-promises": "off",
            "@typescript-eslint/prefer-optional-chain": "off",
            "@typescript-eslint/restrict-plus-operands": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
        },
    },
    {
        extends: [libraryConfig.configs.test],
        files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    },
]);
