import type { CodegenConfig } from '@graphql-codegen/cli';

// schema.graphql is auto-generated from Hasura introspection via `pnpm schema:dump`.
// It contains the full Hasura schema (all types, filters, aggregates, ordering).
// To refresh it: HASURA_GRAPHQL_ENDPOINT=http://... pnpm schema:dump
const config: CodegenConfig = {
  schema: 'schema.graphql',
  documents: ['src/documents/**/*.ts'],
  ignoreNoDocuments: true,
  generates: {
    './src/graphql/': {
      preset: 'client',
      config: {
        documentMode: 'string',
        useTypeImports: true,
        enumsAsTypes: true,
        scalars: {
          DateTime: 'string',
          BigInt: 'string',
          numeric: 'string',
        },
      },
    },
  },
};

export default config;
