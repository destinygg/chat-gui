const { defineConfig, globalIgnores } = require('eslint/config');

const globals = require('globals');
const jest = require('eslint-plugin-jest');
const js = require('@eslint/js');

const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },

      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {},
    },

    extends: [...compat.extends('eslint:recommended', 'prettier')],

    rules: {
      'class-methods-use-this': 'off',

      'no-plusplus': [
        'error',
        {
          allowForLoopAfterthoughts: true,
        },
      ],

      'no-param-reassign': [
        'error',
        {
          props: false,
        },
      ],

      'prefer-destructuring': [
        'error',
        {
          object: true,
          array: false,
        },
      ],

      'no-restricted-syntax': [
        'error',
        {
          selector: 'ForInStatement',
          message:
            'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
        },
        {
          selector: 'LabeledStatement',
          message:
            'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
        },
        {
          selector: 'WithStatement',
          message:
            '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
        },
      ],

      'no-continue': 'off',
      curly: ['error', 'all'],
    },

    settings: {
      'import/resolver': {
        node: true,
      },
    },

    plugins: {
      jest,
    },
  },
  {
    files: ['scripts/**/*.js', 'webpack.config.js', 'eslint.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  globalIgnores(['**/postcss.config.js']),
]);
