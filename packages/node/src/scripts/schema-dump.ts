import { writeFileSync } from 'fs';
import {
  buildClientSchema,
  type ExecutionResult,
  getIntrospectionQuery,
  type IntrospectionQuery,
  printSchema,
} from 'graphql';

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

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: getIntrospectionQuery() }),
  });

  if (!response.ok) {
    console.error(`Hasura returned HTTP ${response.status}: ${response.statusText}`);
    process.exit(1);
  }

  const result: ExecutionResult<IntrospectionQuery> = await response.json();

  if (result.errors?.length) {
    console.error('GraphQL introspection errors:', JSON.stringify(result.errors, null, 2));
    process.exit(1);
  }

  if (!result.data) {
    console.error('No data returned from introspection query.');
    process.exit(1);
  }

  const schema = printSchema(buildClientSchema(result.data));
  writeFileSync('schema.graphql', schema);
  console.log('schema.graphql updated successfully.');
}

main().catch((err: unknown) => {
  console.error('Schema dump failed:', err);
  process.exit(1);
});
