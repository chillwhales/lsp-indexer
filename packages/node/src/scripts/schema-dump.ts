import { writeFileSync } from 'fs';
import {
  buildClientSchema,
  getIntrospectionQuery,
  type IntrospectionQuery,
  printSchema,
} from 'graphql';
import { request } from 'graphql-request';

function getEndpoint(): string {
  const endpoint = process.env.HASURA_GRAPHQL_ENDPOINT;

  if (!endpoint) {
    console.error(
      'Missing HASURA_GRAPHQL_ENDPOINT environment variable.\n\n' +
        'Set it to your Hasura GraphQL endpoint, e.g.:\n' +
        '  HASURA_GRAPHQL_ENDPOINT=http://localhost:8080/v1/graphql pnpm schema:dump\n\n' +
        'Or create a .env file in packages/node/ (see .env.example).',
    );
    process.exit(1);
  }

  return endpoint;
}

async function main(): Promise<void> {
  const endpoint = getEndpoint();
  console.log(`Introspecting ${endpoint} ...`);

  const result = await request<IntrospectionQuery>(endpoint, getIntrospectionQuery());

  const schema = printSchema(buildClientSchema(result));
  writeFileSync('schema.graphql', schema);
  console.log('schema.graphql updated successfully.');
}

main().catch((err: unknown) => {
  console.error('Schema dump failed:', err);
  process.exit(1);
});
