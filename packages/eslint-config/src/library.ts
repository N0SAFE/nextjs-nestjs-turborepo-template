import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import coreConfig from "./base";

const tsconfigRootDir = process.cwd();
const coreBase = coreConfig.configs.base;
const coreTest = coreConfig.configs.test;

const base = defineConfig([
    coreBase,
    {
        rules: {
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["error"],
            "typescript-eslint/no-namespace": "off",
            "@typescript-eslint/consistent-type-definitions": ["error", "type"],
        },
    },
]);

const test = defineConfig([
    coreTest,
    {
        rules: {
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["error"],
            "typescript-eslint/no-namespace": "off",
        },
    },
]);

const all = defineConfig([
    base,
    test,
]);

export default {
    meta: {
        name: "@repo/eslint-config/library",
        version: "0.0.0",
    },
    configs: {
        base,
        test,
        all,
    },
} as const;
