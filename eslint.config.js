// eslint.config.js
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['dist/**', 'build/**', 'node_modules/**'],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json', // giữ nếu bạn có tsconfig.json
      },
    },

    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
    },

    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
      },
    },

    rules: {
      'import/no-unused-modules': ['warn', { unusedExports: true, missingExports: true }],
      'import/order': ['warn', { 'newlines-between': 'always' }],
    },
  },
];
