import globals from "globals";
import esLintjs from "@eslint/js";
import tseslint from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";

// Only run tseslint on the files that we have included for TypeScript.
const tsconfigTsFiles = ["**/*.{ts,mts}"]; // match "include" in tsconfig.ts.json;
const tsconfigJsFiles = ["*.{js,mjs}", "lib/**/*.{js,mjs}"]; // match "include" in tsconfig.js.json

// Using tseslint.config adds some type safety and `extends` to simplify customising config array.
export default tseslint.config(
  // Add recommended rules.
  esLintjs.configs.recommended,
  // tseslint with different setup for js/ts
  {
    files: tsconfigJsFiles,
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parserOptions: { project: "./tsconfig.js.json" },
    },
    rules: {
      "@typescript-eslint/no-var-requires": "off", // keeping for backward compatibility
      "@typescript-eslint/no-require-imports": "off", // keeping for backward compatibility
    },
  },
  {
    files: tsconfigTsFiles,
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      parserOptions: { project: "./tsconfig.ts.json" },
    },
  },
  // Customise rules.
  {
    files: ["**/*.{js,mjs,cjs}", "**/*.{ts,mts,cts}"],
    rules: {
      "no-else-return": ["error", { allowElseIf: false }],
    },
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.test.{js,mjs,cjs}"],
    plugins: {
      vitest,
    },
    rules: {
      "no-unused-vars": "off", // lots in tests, minimise churn for now
      ...vitest.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        suite: true,
        test: true,
        describe: true,
        it: true,
        expectTypeOf: true,
        assertType: true,
        expect: true,
        assert: true,
        vitest: true,
        vi: true,
        beforeAll: true,
        afterAll: true,
        beforeEach: true,
        afterEach: true,
        onTestFailed: true,
        onTestFinished: true,
      },
    },
  },
  {
    files: [...tsconfigTsFiles, ...tsconfigJsFiles],
    rules: {
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": "allow-with-description",
          "ts-nocheck": true,
          "ts-check": true,
        },
      ],
    },
  },
);
