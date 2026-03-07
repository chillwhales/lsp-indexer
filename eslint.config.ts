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

      // Codegen output — auto-generated, don't lint
      'packages/node/src/graphql/',

      // Config files — not source code
      '**/vitest.config.ts',
      '**/vitest.setup.ts',
      '**/tsup.config.ts',
      '**/codegen.ts',

      // Next.js build output — generated code, not source
      '**/.next/',

      // GSD planning docs — not source code
      '**/.planning/',

      // PostCSS config — not in any tsconfig project
      '**/postcss.config.mjs',
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
        project: [
          './tsconfig.json',
          './packages/*/tsconfig.json',
          './packages/indexer/tsconfig.eslint.json',
          './apps/*/tsconfig.json',
        ],
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

      // No misused promises — allow Promise-returning functions in React event handler props
      // and object properties (e.g., { fetchNextPage } passed to component props)
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false, properties: false } },
      ],

      // Allow {} in conditional types (common in packages/types/src/ for type algebra)
      '@typescript-eslint/no-empty-object-type': ['error', { allowObjectTypes: 'always' }],

      // Demote to warning — String(error) pattern in subscription error normalization is intentional
      '@typescript-eslint/no-base-to-string': 'warn',

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
      eqeqeq: ['error', 'smart'],
      // Disabled — doesn't understand TypeScript `import type` vs `import` from same module.
      // prettier-plugin-organize-imports handles import organization.
      'no-duplicate-imports': 'off',
      'prefer-const': 'error',
    },
  },

  // ---- Next.js server actions — 'use server' requires async ------------------
  {
    files: ['packages/next/src/actions/**/*.ts'],
    rules: {
      // Server actions MUST be async (Next.js 'use server' requirement), but they
      // return promises from @lsp-indexer/node without await. require-await is a
      // false positive here — the async keyword is mandatory, not a mistake.
      '@typescript-eslint/require-await': 'off',
    },
  },

  // ---- Test file overrides ----------------------------------------------------
  {
    files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      // Passing mock methods to expect() triggers unbound-method false positives
      '@typescript-eslint/unbound-method': 'off',
    },
  },
);
