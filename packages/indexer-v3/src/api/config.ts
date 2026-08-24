export interface HasuraApiConfig {
  metadataEndpoint: string;
  graphqlEndpoint: string;
  adminSecret: string;
  timeoutMs: number;
}

function readEndpoint(value: string | undefined): { metadata: string; graphql: string } {
  const trimmed = value?.trim();
  if (!trimmed) throw new Error('HASURA_GRAPHQL_ENDPOINT is required');
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error('HASURA_GRAPHQL_ENDPOINT must be an absolute HTTP(S) URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('HASURA_GRAPHQL_ENDPOINT must use HTTP or HTTPS');
  }
  if (url.username !== '' || url.password !== '') {
    throw new Error('HASURA_GRAPHQL_ENDPOINT must not contain credentials');
  }
  if (url.search !== '' || url.hash !== '') {
    throw new Error('HASURA_GRAPHQL_ENDPOINT must not contain a query or fragment');
  }
  if (url.pathname === '/v1/graphql/' || url.pathname === '/v1/metadata/') {
    url.pathname = url.pathname.slice(0, -1);
  }
  if (url.pathname === '/v1/graphql' || url.pathname === '/v1/metadata') url.pathname = '/';
  if (url.pathname !== '/' && url.pathname !== '') {
    throw new Error('HASURA_GRAPHQL_ENDPOINT must be the server origin or a v1 endpoint');
  }
  return {
    metadata: new URL('/v1/metadata', url).toString(),
    graphql: new URL('/v1/graphql', url).toString(),
  };
}

function readSecret(value: string | undefined): string {
  const secret = value?.trim();
  if (!secret) throw new Error('HASURA_GRAPHQL_ADMIN_SECRET is required');
  return secret;
}

/** Load the deterministic metadata/schema-management connection. */
export function loadHasuraApiConfig(env: NodeJS.ProcessEnv = process.env): HasuraApiConfig {
  const endpoints = readEndpoint(env.HASURA_GRAPHQL_ENDPOINT);
  return {
    metadataEndpoint: endpoints.metadata,
    graphqlEndpoint: endpoints.graphql,
    adminSecret: readSecret(env.HASURA_GRAPHQL_ADMIN_SECRET),
    timeoutMs: 30_000,
  };
}
