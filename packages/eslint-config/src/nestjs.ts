import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import nestjsConfig from "eslint-config-nestjs";
import type { Linter } from "eslint";

const config: Linter.Config = {
  languageOptions: {
    parser: typescriptParser as any,
    parserOptions: {
      project: "./tsconfig.json",
      sourceType: "module",
    },
  },
  plugins: {
    "@typescript-eslint": typescript as any,
  },
  rules: {
    ...(nestjsConfig as any).rules,
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "no-unused-vars": "off",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        prefer: "type-imports",
      },
    ],
  },
} as any;

export default config;
