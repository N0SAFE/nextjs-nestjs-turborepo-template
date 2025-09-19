const typescript = require("@typescript-eslint/eslint-plugin");
const typescriptParser = require("@typescript-eslint/parser");
const nestjsConfig = require("eslint-config-nestjs");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  languageOptions: {
    parser: typescriptParser,
    parserOptions: {
      project: "./tsconfig.json",
      sourceType: "module",
    },
  },
  plugins: {
    "@typescript-eslint": typescript,
  },
  rules: {
    ...nestjsConfig.rules,
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
};
