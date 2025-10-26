import { resolve } from "node:path";
import type { Linter } from "eslint";

const project = resolve(process.cwd(), "tsconfig.json");

const config: Linter.Config = {
    extends: ["plugin:@tanstack/eslint-plugin-query/recommended", "eslint:recommended", "prettier", require.resolve("@vercel/style-guide/eslint/next"), "eslint-config-turbo", "next/core-web-vitals"],
    globals: {
        React: true,
        JSX: true
    },
    env: {
        node: true,
        browser: true
    },
    plugins: ["only-warn", "@typescript-eslint"],
    settings: {
        "import/resolver": {
            typescript: {
                project
            }
        }
    },
    ignorePatterns: [
        // Ignore dotfiles
        ".*.js",
        "node_modules/"
    ],
    rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["error"]
    },
    overrides: [{ files: ["*.js?(x)", "*.ts?(x)"] }]
} as any;

export default config;
