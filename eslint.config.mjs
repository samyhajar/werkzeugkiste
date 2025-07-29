import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      // Next.js recommended rules
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,

      // Disable problematic rules for development
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-spread': 'off',
      '@typescript-eslint/no-unsafe-array-destructuring': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      '@next/next/no-img-element': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-case-declarations': 'off',
      'no-unreachable': 'off',
      'no-redeclare': 'off',
      'prefer-const': 'off',
      'no-var': 'off',
      'no-console': 'off',
      'no-alert': 'off',
      'no-confusing-arrow': 'off',
      'no-constant-condition': 'off',
      'no-empty': 'off',
      'no-empty-function': 'off',
      'no-eval': 'off',
      'no-implied-eval': 'off',
      'no-new-func': 'off',
      'no-obj-calls': 'off',
      'no-self-compare': 'off',
      'no-sequences': 'off',
      'no-throw-literal': 'off',
      'no-unmodified-loop-condition': 'off',
      'no-unused-expressions': 'off',
      'no-useless-call': 'off',
      'no-useless-concat': 'off',
      'no-useless-return': 'off',
      'prefer-promise-reject-errors': 'off',
      'require-await': 'off',
      yoda: 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.config.{js,ts,mjs}'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
]
