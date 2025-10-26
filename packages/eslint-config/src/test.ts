import { resolve } from "node:path";
import type { Linter } from "eslint";

const project = resolve(process.cwd(), "tsconfig.test.json");

const config: Linter.Config = {
    plugins: ["@typescript-eslint", "only-warn"],
    extends: ["eslint:recommended", "plugin:@typescript-eslint/eslint-recommended", "plugin:@typescript-eslint/recommended"],
    parser: "@typescript-eslint/parser",
    env: {
        browser: true,
        node: true,
        es2021: true
    },
    settings: {
        "import/resolver": {
            typescript: {
                project
            }
        }
    },
    rules: {
        "@next/next/no-html-link-for-pages": "off",
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["warn"],
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "typescript-eslint/no-namespace": "off",
    },
    ignorePatterns: [
        "node_modules/",
        "dist/"
    ],
    overrides: [
        {
            files: ["**/__tests__/**/*.{test,spec}.{ts,tsx,js,jsx}"],
            env: {
                jest: true
            }
        }
    ]
} as any;

export default config;
