import type { CodegenConfig } from '@graphql-codegen/cli';

// The v3 Hasura snapshot is frozen and drift-checked by the indexer-v3 package.
// Keeping one source of truth prevents the SDK from silently generating against v2.
const config: CodegenConfig = {
  schema: '../indexer-v3/hasura/schema.graphql',
  documents: ['src/v3/documents.ts', 'src/v3/operations.ts'],
  ignoreNoDocuments: true,
  generates: {
    './src/graphql/': {
      preset: 'client',
      config: {
        documentMode: 'string',
        useTypeImports: true,
        enumsAsTypes: true,
        scalars: {
          bigint: 'string',
          timestamptz: 'string',
          numeric: 'string',
          jsonb: 'unknown',
        },
      },
    },
  },
};

export default config;
