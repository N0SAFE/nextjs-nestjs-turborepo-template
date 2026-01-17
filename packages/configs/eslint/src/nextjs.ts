import { defineConfig, globalIgnores } from "eslint/config";
// import nextVitals from 'eslint-config-next/core-web-vitals'
import reactConfig, { type ReactConfig } from './react';

export type NextJSConfig = Omit<ReactConfig, 'disableTseslint'>;

const reactBaseFactory = reactConfig.configs.base;
const reactTestFactory = reactConfig.configs.test;

const base = (options: NextJSConfig = {}) => {
    // Next.js provides its own TypeScript config, so disable ours to avoid conflicts
    const reactOptions = { ...options };
    
    return defineConfig([
        reactBaseFactory(reactOptions),
        // ...nextVitals, // actually nextVitals import itself tseslint but use the default version instead of the strict version and it make a duplicate definition of the tseslint package.
        // Override default ignores of eslint-config-next.
        globalIgnores([
            // Default ignores of eslint-config-next:
            ".next/**",
            "out/**",
            "build/**",
            "next-env.d.ts",
        ]),
    ]);
};

const test = (options: NextJSConfig = {}) => {
    // Next.js provides its own TypeScript config, so disable ours to avoid conflicts
    const reactOptions = { ...options, disableTseslint: true };
    
    return defineConfig([
        reactTestFactory(reactOptions),
        // ...nextVitals,
        // Override default ignores of eslint-config-next.
        globalIgnores([
            // Default ignores of eslint-config-next:
            ".next/**",
            "out/**",
            "build/**",
            "next-env.d.ts",
        ]),
    ]);
};

const all = (options: NextJSConfig = {}) => defineConfig([
    base(options),
    test(options),
]);

export default {
    meta: {
        name: "@repo-configs/eslint/nextjs",
        version: "0.0.0",
    },
    configs: {
        base,
        test,
        all,
    },
} as const;