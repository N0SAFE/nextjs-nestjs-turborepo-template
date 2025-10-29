import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintNestJs from "@darraghor/eslint-plugin-nestjs-typed";
import { defineConfig } from "eslint/config";
import { Linter } from "eslint"
import coreConfig from "./base";
const coreBase = coreConfig.configs.base;
const coreTest = coreConfig.configs.test;

const sharedRules: Partial<Linter.RulesRecord> = {
            "@typescript-eslint/interface-name-prefix": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-extraneous-class": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            "no-unused-vars": "off",
            "@typescript-eslint/consistent-type-imports": [
                "error",
                {
                    prefer: "type-imports",
                },
            ],
            "@darraghor/nestjs-typed/param-decorator-name-matches-route-param": "off",
            "@darraghor/nestjs-typed/controllers-should-supply-api-tags": "off",
        }

const base = defineConfig([
    coreBase,
    eslintNestJs.configs.flatRecommended,
    {
        rules: sharedRules
    },
]);

const test = defineConfig([
    coreTest,
    eslintNestJs.configs.flatRecommended,
    {
        rules: sharedRules
    },
    // Relaxed rules for test files
    {
        files: ["**/*.spec.ts", "**/*.test.ts", "**/*.mock.ts"],
        rules: {
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/no-empty-function": "off",
            "@typescript-eslint/no-unnecessary-condition": "off",
            "@typescript-eslint/no-extraneous-class": "off",
            "@darraghor/nestjs-typed/injectable-should-be-provided": "off",
        },
    },
]);

const all = defineConfig([
    base,
    test,
]);

export default {
    meta: {
        name: "@repo/eslint-config/nestjs",
        version: "0.0.0",
    },
    configs: {
        base,
        test,
        all,
    },
} as const;
