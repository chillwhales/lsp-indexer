import {
  buildClientSchema,
  getIntrospectionQuery,
  type GraphQLSchema,
  type IntrospectionQuery,
} from 'graphql';
import type { HasuraApiConfig } from './config.js';
import { HASURA_PUBLIC_ROLE, HASURA_SOURCE_NAME } from './contract.js';
import { createHasuraMetadata } from './metadata.js';

interface NamedMetadataSource extends Record<string, unknown> {
  name: string;
}

interface ExportedHasuraMetadata {
  resourceVersion: number;
  metadata: Record<string, unknown>;
  sources: NamedMetadataSource[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

function errorMessage(value: unknown): string {
  if (typeof value !== 'object' || value == null) return String(value);
  const message =
    'message' in value && typeof value.message === 'string' ? value.message : JSON.stringify(value);
  const extensions =
    'extensions' in value && typeof value.extensions === 'object' && value.extensions != null
      ? value.extensions
      : null;
  const code =
    extensions != null && 'code' in extensions && typeof extensions.code === 'string'
      ? ` (${extensions.code})`
      : '';
  return `${message}${code}`;
}

async function postJson(
  endpoint: string,
  config: HasuraApiConfig,
  body: unknown,
  role?: string,
): Promise<unknown> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hasura-admin-secret': config.adminSecret,
      ...(role == null ? {} : { 'x-hasura-role': role }),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error(`Hasura returned a non-JSON response with HTTP ${response.status}`);
  }
  if (!response.ok) {
    throw new Error(`Hasura request failed with HTTP ${response.status}: ${errorMessage(result)}`);
  }
  return result;
}

function readMetadataExport(value: unknown): ExportedHasuraMetadata {
  if (!isRecord(value)) throw new Error('Hasura returned an invalid metadata export');
  const resourceVersion = value.resource_version;
  const metadata = value.metadata;
  if (!Number.isSafeInteger(resourceVersion) || Number(resourceVersion) < 1) {
    throw new Error('Hasura metadata export omitted a valid resource version');
  }
  if (!isRecord(metadata) || metadata.version !== 3 || !Array.isArray(metadata.sources)) {
    throw new Error('Hasura metadata export is not a version 3 metadata document');
  }
  const sources: NamedMetadataSource[] = [];
  for (const source of metadata.sources) {
    if (!isRecord(source) || typeof source.name !== 'string') {
      throw new Error('Hasura metadata export contains an invalid source');
    }
    sources.push({ ...source, name: source.name });
  }
  return { resourceVersion: Number(resourceVersion), metadata, sources };
}

function replaceV3Source(
  exported: ExportedHasuraMetadata,
  generatedSource: NamedMetadataSource,
): Record<string, unknown> {
  let replaced = false;
  const sources = exported.sources.map((source) => {
    if (source.name !== HASURA_SOURCE_NAME) return source;
    if (replaced)
      throw new Error(`Hasura metadata contains duplicate ${HASURA_SOURCE_NAME} sources`);
    replaced = true;
    return generatedSource;
  });
  if (!replaced) sources.push(generatedSource);
  return { ...exported.metadata, version: 3, sources };
}

/** Replace only the v3 source while preserving unrelated metadata with optimistic concurrency. */
export async function applyHasuraMetadata(config: HasuraApiConfig): Promise<void> {
  const generated = createHasuraMetadata();
  const [generatedSource] = generated.metadata.sources;
  if (generatedSource == null) throw new Error('Generated Hasura metadata has no v3 source');
  const exported = readMetadataExport(
    await postJson(config.metadataEndpoint, config, {
      type: 'export_metadata',
      version: 2,
      args: {},
    }),
  );
  await postJson(config.metadataEndpoint, config, {
    type: 'replace_metadata',
    version: 2,
    resource_version: exported.resourceVersion,
    args: {
      allow_inconsistent_metadata: false,
      metadata: replaceV3Source(exported, generatedSource),
    },
  });
}

/** Assert that Hasura accepted every tracked v3 view and relationship. */
export async function assertHasuraMetadataConsistent(config: HasuraApiConfig): Promise<void> {
  const result = await postJson(config.metadataEndpoint, config, {
    type: 'get_inconsistent_metadata',
    args: {},
  });
  if (typeof result !== 'object' || result == null || !('is_consistent' in result)) {
    throw new Error('Hasura returned an invalid metadata-consistency response');
  }
  if (result.is_consistent !== true) {
    const details =
      'inconsistent_objects' in result ? JSON.stringify(result.inconsistent_objects) : '';
    throw new Error(`Hasura v3 metadata is inconsistent${details === '' ? '' : `: ${details}`}`);
  }
}

/** Fetch the schema exactly as the unauthenticated public role sees it. */
export async function fetchPublicHasuraSchema(config: HasuraApiConfig): Promise<GraphQLSchema> {
  const result = await postJson(
    config.graphqlEndpoint,
    config,
    { query: getIntrospectionQuery({ descriptions: true }) },
    HASURA_PUBLIC_ROLE,
  );
  if (typeof result !== 'object' || result == null) {
    throw new Error('Hasura returned an invalid GraphQL introspection response');
  }
  if ('errors' in result && Array.isArray(result.errors) && result.errors.length > 0) {
    throw new Error(`Hasura introspection failed: ${result.errors.map(errorMessage).join('; ')}`);
  }
  if (!('data' in result) || typeof result.data !== 'object' || result.data == null) {
    throw new Error('Hasura introspection response omitted data');
  }
  // Introspection is a service boundary; buildClientSchema performs the structural validation.
  return buildClientSchema(result.data as IntrospectionQuery);
}
