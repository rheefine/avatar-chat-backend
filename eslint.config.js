import { FlatCompat } from '@eslint/eslintrc';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlug from 'eslint-plugin-import';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const compat = new FlatCompat({
  baseDirectory: import.meta.url,
});

export default [
  ...compat.extends('airbnb-base', 'airbnb-typescript/base'),
  eslintPluginPrettierRecommended,
  { ignores: ['eslint.config.js'] },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: './tsconfig.json' },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlug,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
        },
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unused-vars': 'off',

      // Classes
      'class-methods-use-this': 'off',

      // import
      'import/prefer-default-export': 'off',
      'import/order': ['error', { groups: ['builtin', 'external', 'internal', 'type'] }],
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          ts: 'never',
          tsx: 'never',
          js: 'never',
          mjs: 'never',
          jsx: 'never',
        },
      ],

      // Variables
      'no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      'no-param-reassign': [
        'error',
        {
          props: true,
          ignorePropertyModificationsFor: [
            'acc', // for reduce accumulators
            'accumulator', // for reduce accumulators
            'e', // for e.returnvalue
            'ctx', // for Koa routing
            'context', // for Koa routing
            'req', // for Express requests
            'request', // for Express requests
            'res', // for Express responses
            'response', // for Express responses
            '$scope', // for Angular 1 scopes
            'staticContext', // for ReactRouter context
            'opts', // for fastify options
          ],
        },
      ],

      // Blocks
      'no-else-return': 'error',

      // Whitespace
      'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 1 }],
      'max-len': [
        'error',
        100,
        2,
        {
          ignoreUrls: true,
          ignoreComments: false,
          ignoreRegExpLiterals: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
        },
      ],

      // Naming Conventions
      camelcase: ['error', { properties: 'never', ignoreDestructuring: true }],
      'no-underscore-dangle': [
        'error',
        { allowAfterThis: true, allowAfterSuper: true, enforceInMethodNames: true },
      ],
    },
  },
];
