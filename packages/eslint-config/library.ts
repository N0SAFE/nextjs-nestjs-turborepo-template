import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config} */
export default defineConfig([
    eslint.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
    },
    {
        rules: {
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["error"],
            "typescript-eslint/no-namespace": "off",
        },
    },
]);
