import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // ---- Global ignores --------------------------------------------------------
  {
    ignores: [
      '**/node_modules/',
      '**/lib/',
      '**/dist/',
      '**/.pnpm-store/',

      // Codegen output — not checked into git
      'packages/abi/src/',
      'packages/typeorm/src/',
      'packages/typeorm/db/',

      // Legacy v1 indexer — read-only reference, not actively maintained
      'packages/indexer/',
    ],
  },

  // ---- Base configs -----------------------------------------------------------
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // ---- Shared settings --------------------------------------------------------
  {
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // -- TypeScript rules matching AGENTS.md conventions ----------------------

      // Prefer unknown over any — allow eslint-disable for TypeORM constructors
      '@typescript-eslint/no-explicit-any': 'warn',

      // Require explicit return types on exported functions
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],

      // No unused variables (allow underscore-prefixed)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Allow void expressions for fire-and-forget patterns (common in indexers)
      '@typescript-eslint/no-confusing-void-expression': 'off',

      // Allow non-null assertions — common with TypeORM entity field access
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Floating promises — critical for async indexer code
      '@typescript-eslint/no-floating-promises': 'error',

      // No misused promises
      '@typescript-eslint/no-misused-promises': 'error',

      // Allow empty functions (common in interface stubs)
      '@typescript-eslint/no-empty-function': 'off',

      // Allow require() for dynamic plugin loading in registry
      '@typescript-eslint/no-require-imports': 'warn',

      // Codegen enums from @chillwhales/typeorm resolve as error types in CI,
      // causing false positives on union types like `LSP4TokenTypeEnum | null`
      '@typescript-eslint/no-redundant-type-constituents': 'off',

      // Unsafe any access — warn for now, tighten later as codebase improves
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',

      // -- General quality rules ------------------------------------------------
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      eqeqeq: ['error', 'always'],
      'no-duplicate-imports': 'error',
      'prefer-const': 'error',
    },
  },
);
