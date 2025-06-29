import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      // Build output
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',

      // Dependencies
      'node_modules/**',

      // Supabase functions
      'supabase/functions/**',

      // Cache
      '.cache/**',
      '.vercel/**',
    ],
  },
  ...compat.extends(
    'next/core-web-vitals',
    'next/typescript',
    'plugin:jsx-a11y/recommended',
    'prettier',
  ),
  {
    // Base configuration for all files
    files: ['**/*.{js,jsx,ts,tsx}'],
    // Ignore .d.ts files in the base config too
    ignores: ['**/*.d.ts'],
    plugins: {
      'jsx-a11y': jsxA11y,
      '@typescript-eslint': typescriptEslint,
    },
    languageOptions: {
      parser: typescriptParser,
    },
    rules: {
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/await-thenable': 'off',
      // JSX accessibility rules
      'jsx-a11y/alt-text': [
        'error',
        {
          elements: ['img', 'object', 'area', 'input[type="image"]'],
          img: ['Image'],
        },
      ],
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': [
        'error',
        {
          ignoreNonDOM: true,
        },
      ],
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',
    },
  },
  {
    // TypeScript-specific configuration with type checking
    // Exclude declaration files (.d.ts) to avoid parsing errors
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['**/*.d.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Enable TypeScript type checking rules
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-plus-operands': 'error',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/unbound-method': 'error',
    },
  },
  {
    files: ['**/*.tsx', '**/*.jsx'],
    rules: {
      'max-lines': [
        'error',
        {
          max: 200,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  {
    // Temporary override for large files that need refactoring
    files: [
      'src/components/shared/FolderDocumentList.tsx',
      'src/components/shared/WorkshopFilesList.tsx',
      'src/components/shared/confreres/ConfreresTable.tsx',
      'src/components/shared/formation-personnel/FormationPersonnelTable.tsx',
      'src/components/ui/GalleryManager.tsx',
    ],
    rules: {
      'max-lines': 'off',
    },
  },
];

export default eslintConfig;
