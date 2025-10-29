import { defineConfig } from "eslint/config";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import pluginQuery from "@tanstack/eslint-plugin-query";
import globals from "globals";
import tsEslint from "typescript-eslint";
import coreConfig from "./base";
const coreBase = coreConfig.configs.base;
const coreTest = coreConfig.configs.test;

const tsconfigRootDir = process.cwd();

const base = defineConfig([
    coreBase,
    {
        files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
        ...reactPlugin.configs.flat.recommended,
        languageOptions: {
            parser: tsEslint.parser,
            ...reactPlugin.configs.flat.all!.languageOptions,
            parserOptions: {
                ...reactPlugin.configs.flat.all!.languageOptions?.parserOptions,
                tsconfigRootDir,
            },
            globals: {
                ...globals.serviceworker,
                ...globals.browser,
            },
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        rules: {
            "react/react-in-jsx-scope": "off", // Not needed with React 17+ JSX transform
        },
    },
    reactHooks.configs.flat['recommended-latest']!,
    ...pluginQuery.configs["flat/recommended"],
]);

const test = defineConfig([
    coreTest,
    {
        files: ["**/*.{test,spec}.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
        ...reactPlugin.configs.flat.recommended,
        languageOptions: {
            parser: tsEslint.parser,
            ...reactPlugin.configs.flat.all!.languageOptions,
            parserOptions: {
                ...reactPlugin.configs.flat.all!.languageOptions?.parserOptions,
                tsconfigRootDir,
            },
            globals: {
                ...globals.serviceworker,
                ...globals.browser,
            },
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        rules: {
            "react/react-in-jsx-scope": "off", // Not needed with React 17+ JSX transform
            "@typescript-eslint/no-empty-function": "off",
        },
    },
    reactHooks.configs.flat['recommended-latest']!,
    ...pluginQuery.configs["flat/recommended"],
]);

const all = defineConfig([
    base,
    test,
]);

export default {
    meta: {
        name: "@repo/eslint-config/react-internal",
        version: "0.0.0",
    },
    configs: {
        base,
        test,
        all,
    },
} as const;
