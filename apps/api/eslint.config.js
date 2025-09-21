const eslintConfigNestjs = require("@repo/eslint-config/nestjs");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  eslintConfigNestjs,
  {
    files: ["src/**/*.ts", "src/**/*.js"],
    ignores: ["dist/**", "node_modules/**"],
  },
];
