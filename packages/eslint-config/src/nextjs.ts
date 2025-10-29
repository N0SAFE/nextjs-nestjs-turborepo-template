import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from 'eslint-config-next/core-web-vitals'
import turboConfig from 'eslint-config-turbo/flat';
import pluginQuery from '@tanstack/eslint-plugin-query';
import reactHooks from 'eslint-plugin-react-hooks';
import reactConfig from './react';
import tailwind from "eslint-plugin-tailwindcss";
const reactBase = reactConfig.configs.base;
const reactTest = reactConfig.configs.test;

const base = defineConfig([
    reactBase,
    ...nextVitals,
    // Override default ignores of eslint-config-next.
    globalIgnores([
        // Default ignores of eslint-config-next:
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),
]);

const test = defineConfig([
    reactTest,
    ...nextVitals,
    // Override default ignores of eslint-config-next.
    globalIgnores([
        // Default ignores of eslint-config-next:
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),
]);

const all = defineConfig([
    base,
    test,
]);

export default {
    meta: {
        name: "@repo/eslint-config/nextjs",
        version: "0.0.0",
    },
    configs: {
        base,
        test,
        all,
    },
} as const;