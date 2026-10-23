import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
    "**/*.test.ts",
  ]),
  {
    rules: {
      // Query rows are loosely typed across the app. A full generic pass is separate from go-live.
      "@typescript-eslint/no-explicit-any": "off",
      // Data-loading effects set state when fetches resolve. The rule flags the common pattern.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
]);

export default eslintConfig;
