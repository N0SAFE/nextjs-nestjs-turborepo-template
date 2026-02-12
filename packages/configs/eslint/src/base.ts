import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import turboConfig from 'eslint-config-turbo/flat';

const tsconfigRootDir = process.cwd();

export interface BaseConfigOptions {
    disableTseslint?: boolean;
}

export const ignoresConfig = defineConfig([
    {
        ignores: ["dist/**/*", "build/**/*", "node_modules/**/*"],
    },
]);

export const baseConfig = (options: BaseConfigOptions = {}) => {
    const { disableTseslint = false } = options;
    
    return defineConfig([
        ...ignoresConfig,
        ...turboConfig,
        eslint.configs.recommended,
        ...(disableTseslint ? [] : [
            tseslint.configs.strictTypeChecked,
            tseslint.configs.stylisticTypeChecked,
        ]),
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
                "@typescript-eslint/unified-signatures": "off",
                "@typescript-eslint/no-unnecessary-type-parameters": "off",
            }
        }
    ]);
};

export const testConfig = (options: BaseConfigOptions = {}) => {
    const { disableTseslint = false } = options;
    
    return defineConfig([
        ...ignoresConfig,
        eslint.configs.recommended,
        ...(disableTseslint ? [] : [
            tseslint.configs.recommendedTypeChecked,
        ]),
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
                "@typescript-eslint/unified-signatures": "off",
            },
        },
    ]);
};

export const allConfig = (options: BaseConfigOptions = {}) => {
    return defineConfig([
        testConfig(options),
        baseConfig(options),
    ]);
};

export default {
    meta: {
        name: "@repo/config-eslint",
        version: "0.0.0",
    },
    configs: {
        ignores: ignoresConfig,
        base: baseConfig,
        test: testConfig,
        all: allConfig,
    },
} as const;
