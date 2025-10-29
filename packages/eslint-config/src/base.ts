import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import turboConfig from 'eslint-config-turbo/flat';

const tsconfigRootDir = process.cwd();

export const ignoresConfig = defineConfig([
    {
        ignores: ["dist/**/*", "build/**/*", "node_modules/**/*"],
    },
]);

export const baseConfig = defineConfig([
    ...ignoresConfig,
    ...turboConfig,
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir,
            },
        },
    },
]);

export const testConfig = defineConfig([
    ...ignoresConfig,
    eslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir,
            },
        },
    },
    {
        rules: {
            "@typescript-eslint/no-unused-vars": ["warn"],
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "no-unused-vars": "off",
            "@typescript-eslint/unbound-method": "off",
        },
    },
]);

export const allConfig = defineConfig([
    testConfig,
    baseConfig,
]);

export default {
    meta: {
        name: "@repo/eslint-config",
        version: "0.0.0",
    },
    configs: {
        ignores: ignoresConfig,
        base: baseConfig,
        test: testConfig,
        all: allConfig,
    },
} as const;
