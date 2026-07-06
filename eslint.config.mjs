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
    "out/**",
    "build/**",
    "next-env.d.ts",
    // This project's actual static-export output dir (see next.config.ts /
    // .gitignore) — wasn't covered by the defaults above, so `npm run lint`
    // was scanning generated/minified chunks after every `npm run build`.
    "dist/**",
  ]),
]);

export default eslintConfig;
