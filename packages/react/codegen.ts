import type { CodegenConfig } from '@graphql-codegen/cli';

const hasuraUrl = process.env.HASURA_GRAPHQL_ENDPOINT;
const hasuraSecret = process.env.HASURA_ADMIN_SECRET;

// Use Hasura introspection if endpoint is available, otherwise fall back to local schema.
// The local schema is a minimal valid GraphQL schema — the full Hasura schema
// (with filters, aggregates, ordering) is only available via introspection.
const schema = hasuraUrl
  ? [
      {
        [hasuraUrl]: {
          headers: {
            ...(hasuraSecret ? { 'x-hasura-admin-secret': hasuraSecret } : {}),
          },
        },
      },
    ]
  : 'schema.graphql';

const config: CodegenConfig = {
  schema,
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
