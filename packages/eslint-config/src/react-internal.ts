import { resolve } from "node:path";
import type { Linter } from "eslint";

const project = resolve(process.cwd(), "tsconfig.json");

/*
 * This is a custom ESLint configuration for use with
 * internal (bundled by their consumer) libraries
 * that utilize React.
 */

const config: Linter.Config = {
    env: { browser: true, es2020: true },
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:react-hooks/recommended"],
    ignorePatterns: ["dist", ".eslintrc.cjs", "node_modules/"],
    parser: "@typescript-eslint/parser",
    plugins: ["react-refresh"],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error"]
    },
    overrides: [
        // Force ESLint to detect .tsx files
        { files: ["*.js?(x)", "*.ts?(x)"] }
    ]
} as any;

export default config;
