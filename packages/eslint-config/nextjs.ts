import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import turboConfig from 'eslint-config-turbo/flat';
import pluginQuery from '@tanstack/eslint-plugin-query';
import reactHooks from 'eslint-plugin-react-hooks';

const tsconfigRootDir = process.cwd();

export default defineConfig([
    ...nextVitals,
    ...nextTs,
    ...turboConfig,
    ...pluginQuery.configs['flat/recommended'],
    reactHooks.configs.flat['recommended-latest']!,
    {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
    },
  },
    // Override default ignores of eslint-config-next.
    globalIgnores([
        // Default ignores of eslint-config-next:
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),
]);