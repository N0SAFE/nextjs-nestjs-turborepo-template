import { defineConfig } from "eslint/config";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import pluginQuery from "@tanstack/eslint-plugin-query";
import globals from "globals";
import tsEslint from "typescript-eslint";

const tsconfigRootDir = process.cwd();

export default defineConfig([
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
