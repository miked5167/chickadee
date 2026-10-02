import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    // Local validation builds use alternate Next.js output directories.
    ".next-*/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Historical copies are kept for reference but are not application source.
    "**/*-old-backup.tsx",
  ]),
  {
    // Maintenance scripts and tests deliberately exercise loosely shaped
    // external data. Keep application code strict while allowing those files
    // to validate data at runtime instead of pretending every payload is typed.
    files: ["scripts/**/*.{js,ts,tsx}", "tests/**/*.{js,ts,tsx}", "*.js", "test-postgis.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
