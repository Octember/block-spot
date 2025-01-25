import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import globals from "globals";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {ignores: ["**/.wasp/**"]},
  {files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"], },
  {languageOptions: { globals: {...globals.browser, ...globals.node} }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'], // Add this if you are using React 17+

  {rules: {
    // ... any rules you want
    '@typescript-eslint/no-unused-vars': 'warn',
    // 'react/jsx-uses-vars': 'error',
   },}
];