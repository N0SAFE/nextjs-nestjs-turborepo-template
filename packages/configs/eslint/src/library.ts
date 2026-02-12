import { defineConfig } from "eslint/config";
import coreConfig, { type BaseConfigOptions } from "./base";

const tsconfigRootDir = process.cwd();
const coreBaseFactory = coreConfig.configs.base;
const coreTestFactory = coreConfig.configs.test;

const base = (options: BaseConfigOptions = {}) => defineConfig([
    coreBaseFactory(options),
    {
        rules: {
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["error"],
            "typescript-eslint/no-namespace": "off",
            "@typescript-eslint/consistent-type-definitions": ["error", "type"],
        },
    },
]);

const test = (options: BaseConfigOptions = {}) => defineConfig([
    coreTestFactory(options),
    {
        rules: {
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["error"],
            "typescript-eslint/no-namespace": "off",
        },
    },
]);

const all = (options: BaseConfigOptions = {}) => defineConfig([
    base(options),
    test(options),
]);

export default {
    meta: {
        name: "@repo/config-eslint/library",
        version: "0.0.0",
    },
    configs: {
        base,
        test,
        all,
    },
} as const;
