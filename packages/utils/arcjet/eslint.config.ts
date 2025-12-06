import baseConfig from "@repo-configs/eslint/base";

export default [
  ...baseConfig,
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];
