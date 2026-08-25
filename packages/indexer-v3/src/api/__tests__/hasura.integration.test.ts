import { createIndexerClient, type IndexerClient } from '@lsp-indexer/node';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Pool, type PoolClient } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { quotePostgresIdentifier } from '../../db/names.js';
import { fetchPublicHasuraSchema } from '../client.js';
import { loadHasuraApiConfig } from '../config.js';
import { API_TABLE_CONTRACTS } from '../contract.js';
import { serializeApiSchema } from '../schema.js';

interface SeedNetwork {
  network: string;
  chainId: number;
  schema: string;
  ownerAddress: string;
}

const graphqlEndpoint = requiredEnvironment('TEST_HASURA_GRAPHQL_ENDPOINT');
const adminSecret = requiredEnvironment('TEST_HASURA_ADMIN_SECRET');
const databaseUrl = requiredEnvironment('TEST_DATABASE_URL');
const schemaSnapshotPath = fileURLToPath(
  new URL('../../../hasura/schema.graphql', import.meta.url),
);
const blockNumber = 987_654_321;
const profileAddress = addressFor(1001);
const assetAddress = addressFor(1002);
const tokenId = hashFor(1004);
const topic0 = hashFor(1003);
const networks: readonly SeedNetwork[] = [
  {
    network: 'ethereum-mainnet',
    chainId: 1,
    schema: 'chain_ethereum_mainnet',
    ownerAddress: addressFor(1010),
  },
  {
    network: 'lukso-mainnet',
    chainId: 42,
    schema: 'chain_lukso_mainnet',
    ownerAddress: addressFor(1042),
  },
];

let adminPool: Pool | undefined;

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for the Hasura integration suite`);
  return value;
}

function addressFor(value: number): string {
  return `0x${value.toString(16).padStart(40, '0')}`;
}

function hashFor(value: number): string {
  return `0x${value.toString(16).padStart(64, '0')}`;
}

function table(schema: string, name: string): string {
  return `${quotePostgresIdentifier(schema)}.${quotePostgresIdentifier(name)}`;
}

function seedId(kind: string, chainId: number): string {
  return `hasura-integration:${kind}:${chainId}`;
}

async function deleteSeed(client: PoolClient, network: SeedNetwork): Promise<void> {
  await client.query(
    `DELETE FROM ${table(network.schema, 'event_facts')} WHERE chain_id = $1 AND address = $2 AND block_number = $3`,
    [network.chainId, profileAddress, blockNumber],
  );
  await client.query(
    `DELETE FROM ${table(network.schema, 'owned_tokens')} WHERE chain_id = $1 AND owner_address = $2 AND asset_address = $3 AND token_id = $4`,
    [network.chainId, profileAddress, assetAddress, tokenId],
  );
  await client.query(
    `DELETE FROM ${table(network.schema, 'nfts')} WHERE chain_id = $1 AND address = $2 AND token_id = $3`,
    [network.chainId, assetAddress, tokenId],
  );
  await client.query(
    `DELETE FROM ${table(network.schema, 'owned_assets')} WHERE chain_id = $1 AND owner_address = $2 AND asset_address = $3`,
    [network.chainId, profileAddress, assetAddress],
  );
  await client.query(
    `DELETE FROM ${table(network.schema, 'digital_assets')} WHERE chain_id = $1 AND address = $2`,
    [network.chainId, assetAddress],
  );
  await client.query(
    `DELETE FROM ${table(network.schema, 'universal_profiles')} WHERE chain_id = $1 AND address = $2`,
    [network.chainId, profileAddress],
  );
  await client.query(
    `DELETE FROM ${table(network.schema, 'blocks')} WHERE chain_id = $1 AND number = $2`,
    [network.chainId, blockNumber],
  );
}

async function seedNetwork(client: PoolClient, network: SeedNetwork): Promise<void> {
  const blockHash = hashFor(2_000 + network.chainId);
  const transactionHash = hashFor(3_000 + network.chainId);
  await deleteSeed(client, network);
  await client.query(
    `INSERT INTO ${table(network.schema, 'blocks')}
       (id, network, chain_id, number, hash, parent_hash, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      seedId('block', network.chainId),
      network.network,
      network.chainId,
      blockNumber,
      blockHash,
      hashFor(1_999 + network.chainId),
      new Date('2026-01-01T00:00:00.000Z'),
    ],
  );
  await client.query(
    `INSERT INTO ${table(network.schema, 'universal_profiles')}
       (id, network, chain_id, address, owner_address, verification, last_block_number, last_block_hash)
     VALUES ($1, $2, $3, $4, $5, 'verified', $6, $7)`,
    [
      seedId('profile', network.chainId),
      network.network,
      network.chainId,
      profileAddress,
      network.ownerAddress,
      blockNumber,
      blockHash,
    ],
  );
  await client.query(
    `INSERT INTO ${table(network.schema, 'digital_assets')}
       (id, network, chain_id, address, standard, name, verification, last_block_number, last_block_hash)
     VALUES ($1, $2, $3, $4, 'lsp7', $5, 'verified', $6, $7)`,
    [
      seedId('asset', network.chainId),
      network.network,
      network.chainId,
      assetAddress,
      `Asset on ${network.network}`,
      blockNumber,
      blockHash,
    ],
  );
  await client.query(
    `INSERT INTO ${table(network.schema, 'owned_assets')}
       (id, network, chain_id, owner_address, asset_address, balance, last_block_number, last_block_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      seedId('owned-asset', network.chainId),
      network.network,
      network.chainId,
      profileAddress,
      assetAddress,
      network.chainId,
      blockNumber,
      blockHash,
    ],
  );
  await client.query(
    `INSERT INTO ${table(network.schema, 'nfts')}
       (id, network, chain_id, address, token_id, is_minted, owner_address, verification,
        last_block_number, last_block_hash)
     VALUES ($1, $2, $3, $4, $5, true, $6, 'verified', $7, $8)`,
    [
      seedId('nft', network.chainId),
      network.network,
      network.chainId,
      assetAddress,
      tokenId,
      profileAddress,
      blockNumber,
      blockHash,
    ],
  );
  await client.query(
    `INSERT INTO ${table(network.schema, 'owned_tokens')}
       (id, network, chain_id, owner_address, asset_address, token_id, balance,
        last_block_number, last_block_hash)
     VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8)`,
    [
      seedId('owned-token', network.chainId),
      network.network,
      network.chainId,
      profileAddress,
      assetAddress,
      tokenId,
      blockNumber,
      blockHash,
    ],
  );
  await client.query(
    `INSERT INTO ${table(network.schema, 'event_facts')}
       (id, network, chain_id, block_number, block_hash, parent_hash, block_timestamp,
        transaction_hash, transaction_index, log_index, address, topic0, topics, data,
        event_name, event_domain, decoded)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, $9, $10::text, ARRAY[$10::text], '0x',
       'HasuraIntegration', 'test', $11)`,
    [
      seedId('event', network.chainId),
      network.network,
      network.chainId,
      blockNumber,
      blockHash,
      hashFor(1_999 + network.chainId),
      new Date('2026-01-01T00:00:00.000Z'),
      transactionHash,
      profileAddress,
      topic0,
      { chainId: network.chainId },
    ],
  );
}

async function withTransaction(
  pool: Pool,
  operation: (client: PoolClient) => Promise<void>,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await operation(client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function postPublicGraphql(
  query: string,
  variables?: Record<string, unknown>,
): Promise<unknown> {
  const response = await fetch(graphqlEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, ...(variables == null ? {} : { variables }) }),
    signal: AbortSignal.timeout(10_000),
  });
  const result: unknown = await response.json();
  if (!response.ok) throw new Error(`Public GraphQL request failed with HTTP ${response.status}`);
  return result;
}

function allReadModelsQuery(): string {
  const selections = API_TABLE_CONTRACTS.flatMap((contract) => {
    const orderBy = contract.paginationOrder.map((column) => `{${column}: asc}`).join(', ');
    const fields = [...new Set(['network', ...contract.paginationOrder])].join(' ');
    return [
      `${contract.table}: ${contract.graphqlName}(
       where: {chain_id: {_in: [1, 42]}},
       distinct_on: chain_id,
       limit: 1,
       offset: 0,
       order_by: [${orderBy}]
     ) { ${fields} }`,
      `${contract.table}_aggregate: ${contract.graphqlName}_aggregate(
       where: {chain_id: {_in: [1, 42]}},
       distinct_on: chain_id,
       limit: 1,
       offset: 0,
       order_by: [${orderBy}]
     ) { aggregate { count } }`,
    ];
  });
  return `query PublicV3ReadModels { ${selections.join('\n')} }`;
}

function allRelationshipsQuery(): string {
  const selections = API_TABLE_CONTRACTS.map((contract) => {
    const relationships = [
      ...contract.objectRelationships.map(({ name, remoteTable }) => {
        const remote = API_TABLE_CONTRACTS.find(({ table }) => table === remoteTable);
        if (remote == null) throw new Error(`Unknown API relationship target ${remoteTable}`);
        return `${name} { ${remote.paginationOrder.join(' ')} }`;
      }),
      ...contract.arrayRelationships.flatMap(({ name, remoteTable }) => {
        const remote = API_TABLE_CONTRACTS.find(({ table }) => table === remoteTable);
        if (remote == null) throw new Error(`Unknown API relationship target ${remoteTable}`);
        const orderBy = remote.paginationOrder.map((column) => `{${column}: asc}`).join(', ');
        return [
          `${name}(limit: 1, order_by: [${orderBy}]) { ${remote.paginationOrder.join(' ')} }`,
          `${name}_aggregate { aggregate { count } }`,
        ];
      }),
    ];
    return `${contract.table}: ${contract.graphqlName}(limit: 1) {
      ${contract.paginationOrder.join('\n')}
      ${relationships.join('\n')}
    }`;
  });
  return `query PublicV3Relationships { ${selections.join('\n')} }`;
}

function websocketEndpoint(endpoint: string): string {
  const url = new URL(endpoint);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

async function firstSubscriptionResult(query: string): Promise<unknown> {
  return await new Promise<unknown>((resolve, reject) => {
    const socket = new WebSocket(websocketEndpoint(graphqlEndpoint), 'graphql-ws');
    let settled = false;
    const timeout = setTimeout(
      () => finish(new Error('Timed out waiting for Hasura subscription')),
      10_000,
    );

    function finish(error?: Error, value?: unknown): void {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.close();
      if (error == null) resolve(value);
      else reject(error);
    }

    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ type: 'connection_init', payload: {} }));
    });
    socket.addEventListener('error', () => finish(new Error('Hasura WebSocket failed')));
    socket.addEventListener('close', (event) => {
      if (!settled) {
        finish(
          new Error(
            `Hasura WebSocket closed before a result (code ${event.code}${event.reason === '' ? '' : `: ${event.reason}`})`,
          ),
        );
      }
    });
    socket.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return;
      let message: unknown;
      try {
        message = JSON.parse(event.data);
      } catch {
        finish(new Error('Hasura WebSocket returned a non-JSON message'));
        return;
      }
      if (typeof message !== 'object' || message == null || !('type' in message)) return;
      if (message.type === 'connection_ack') {
        socket.send(JSON.stringify({ id: 'v3-live-query', type: 'start', payload: { query } }));
        return;
      }
      if (message.type === 'data' && 'payload' in message) finish(undefined, message.payload);
      if (message.type === 'connection_error' || message.type === 'error') {
        finish(new Error(`Hasura subscription returned an error: ${JSON.stringify(message)}`));
      }
      if (message.type === 'complete') {
        finish(new Error('Hasura subscription completed before returning data'));
      }
    });
  });
}

async function firstSdkBlock(client: IndexerClient): Promise<{
  network: string;
  chainId: number;
  number: number;
}> {
  return await new Promise((resolve, reject) => {
    let settled = false;
    let unsubscribe: () => void = () => undefined;
    const subscription = client.subscribe('blocks', {
      filter: { number: { eq: blockNumber } },
      limit: 1,
    });
    const timeout = setTimeout(
      () => finish(new Error('Timed out waiting for the Node SDK subscription')),
      10_000,
    );
    unsubscribe = subscription.subscribe(() => {
      if (subscription.error != null) {
        finish(
          subscription.error instanceof Error
            ? subscription.error
            : new Error('Node SDK subscription failed with a non-Error value'),
        );
        return;
      }
      const block = subscription.data?.[0];
      if (block != null) finish(undefined, block);
    });

    function finish(
      error?: Error,
      block?: { network: string; chainId: number; number: number },
    ): void {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      unsubscribe();
      subscription.dispose();
      if (error == null && block != null) resolve(block);
      else reject(error ?? new Error('Node SDK subscription completed without a block'));
    }
  });
}

beforeAll(async (): Promise<void> => {
  adminPool = new Pool({ connectionString: databaseUrl, max: 1 });
  await withTransaction(adminPool, async (client): Promise<void> => {
    for (const network of networks) await seedNetwork(client, network);
  });
});

afterAll(async (): Promise<void> => {
  if (adminPool == null) return;
  await withTransaction(adminPool, async (client): Promise<void> => {
    for (const network of networks) await deleteSeed(client, network);
  });
  await adminPool.end();
});

describe.sequential('Hasura v3 public API', () => {
  it('matches the checked-in public schema snapshot', async () => {
    const config = loadHasuraApiConfig({
      HASURA_GRAPHQL_ENDPOINT: graphqlEndpoint,
      HASURA_GRAPHQL_ADMIN_SECRET: adminSecret,
    });
    const expected = await readFile(schemaSnapshotPath, 'utf8');
    expect(serializeApiSchema(await fetchPublicHasuraSchema(config))).toBe(expected);
  });

  it('exposes every chain-aware read, aggregate, pagination, and relationship primitive', async () => {
    const readModels = await postPublicGraphql(allReadModelsQuery());
    expect(readModels).not.toHaveProperty('errors');
    expect(readModels).toHaveProperty('data');

    const relationships = await postPublicGraphql(allRelationshipsQuery());
    expect(relationships).not.toHaveProperty('errors');
    expect(relationships).toHaveProperty('data');
  });

  it('keeps identical addresses isolated by chain in nested relationships', async () => {
    const result = await postPublicGraphql(
      `query MultiChainProfile($profile: String!, $asset: String!) {
        universal_profile(
          where: {address: {_eq: $profile}, verification: {_eq: "verified"}}
          order_by: [{chain_id: asc}, {id: asc}]
        ) {
          network
          chain_id
          owner_address
          ownedAssets(where: {asset_address: {_eq: $asset}}) {
            network
            chain_id
            digitalAsset { network chain_id address }
            tokenIds {
              network
              chain_id
              ownedAsset { network chain_id owner_address asset_address }
              nft {
                network
                chain_id
                ownedToken { network chain_id owner_address asset_address token_id }
              }
            }
          }
        }
      }`,
      { profile: profileAddress, asset: assetAddress },
    );
    expect(result).toEqual({
      data: {
        universal_profile: networks.map((network) => ({
          network: network.network,
          chain_id: network.chainId,
          owner_address: network.ownerAddress,
          ownedAssets: [
            {
              network: network.network,
              chain_id: network.chainId,
              digitalAsset: {
                network: network.network,
                chain_id: network.chainId,
                address: assetAddress,
              },
              tokenIds: [
                {
                  network: network.network,
                  chain_id: network.chainId,
                  ownedAsset: {
                    network: network.network,
                    chain_id: network.chainId,
                    owner_address: profileAddress,
                    asset_address: assetAddress,
                  },
                  nft: {
                    network: network.network,
                    chain_id: network.chainId,
                    ownedToken: {
                      network: network.network,
                      chain_id: network.chainId,
                      owner_address: profileAddress,
                      asset_address: assetAddress,
                      token_id: tokenId,
                    },
                  },
                },
              ],
            },
          ],
        })),
      },
    });
  });

  it('serves network-scoped HTTP and WebSocket results through the public Node SDK', async () => {
    const clients = networks.map((network) =>
      createIndexerClient({ url: graphqlEndpoint, network: network.network }),
    );
    try {
      const results = await Promise.all(
        clients.map((client) =>
          client.profiles({
            filter: { address: { eq: profileAddress } },
            limit: 1,
          }),
        ),
      );
      expect(results).toEqual(
        networks.map((network) => ({
          items: [
            expect.objectContaining({
              network: network.network,
              chainId: network.chainId,
              address: profileAddress,
              ownerAddress: network.ownerAddress,
            }),
          ],
          totalCount: 1,
        })),
      );

      const luksoClient = clients[1];
      if (luksoClient == null) throw new Error('Missing LUKSO SDK test client');
      await expect(firstSdkBlock(luksoClient)).resolves.toMatchObject({
        network: 'lukso-mainnet',
        chainId: 42,
        number: blockNumber,
        id: seedId('block', 42),
        hash: hashFor(2_042),
        parentHash: hashFor(2_041),
        timestamp: '2026-01-01T00:00:00.000Z',
      });
    } finally {
      for (const client of clients) client.dispose();
    }
  });

  it('delivers public live-query subscriptions over WebSocket', async () => {
    const result = await firstSubscriptionResult(`subscription MultiChainBlocks {
      block(
        where: {number: {_eq: ${blockNumber}}}
        distinct_on: chain_id
        limit: 2
        offset: 0
        order_by: [{chain_id: asc}, {id: asc}]
      ) { network chain_id number }
    }`);
    expect(result).toEqual({
      data: {
        block: networks.map((network) => ({
          network: network.network,
          chain_id: network.chainId,
          number: blockNumber,
        })),
      },
    });
  });

  it('does not expose mutations to the public role', async () => {
    const result = await postPublicGraphql(`mutation ForbiddenWrite {
      delete_universal_profile(where: {}) { affected_rows }
    }`);
    expect(result).toHaveProperty('errors');
    expect(result).not.toHaveProperty('data.delete_universal_profile');
  });
});
