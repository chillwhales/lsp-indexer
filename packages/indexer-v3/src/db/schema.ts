import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { SHARED_ENUMS } from './names.js';

export const verificationStatus = pgEnum('verification_status', SHARED_ENUMS.verification_status);

export const assetStandard = pgEnum('asset_standard', SHARED_ENUMS.asset_standard);

export const metadataKind = pgEnum('metadata_kind', SHARED_ENUMS.metadata_kind);

export const metadataJobStatus = pgEnum('metadata_job_status', SHARED_ENUMS.metadata_job_status);

export const networkConfig = pgTable(
  'network_config',
  {
    network: text('network').notNull(),
    chainId: bigint('chain_id', { mode: 'number' }).notNull(),
    schemaVersion: integer('schema_version').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.network, table.chainId], name: 'network_config_pk' }),
    uniqueIndex('network_config_chain_id_uidx').on(table.chainId),
    check('network_config_network_check', sql`${table.network} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    check('network_config_chain_id_check', sql`${table.chainId} > 0`),
    check('network_config_schema_version_check', sql`${table.schemaVersion} > 0`),
  ],
);

/** Pipes cursor history. Managed atomically by the official Drizzle target, not snapshotted. */
export const sqdCursor = pgTable(
  'sqd_cursor',
  {
    id: text('id').notNull(),
    currentNumber: numeric('current_number').notNull(),
    currentHash: text('current_hash').notNull(),
    currentTimestamp: timestamp('current_timestamp', { withTimezone: true, mode: 'date' }),
    finalized: jsonb('finalized').$type<{ number?: number; hash?: string }>(),
    rollbackChain:
      jsonb('rollback_chain').$type<{ number: number; hash?: string; timestamp?: number }[]>(),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.currentNumber], name: 'sqd_cursor_pk' }),
    index('sqd_cursor_latest_idx').on(table.id, table.currentNumber),
  ],
);

export const blocks = pgTable(
  'blocks',
  {
    id: text('id').notNull(),
    network: text('network').notNull(),
    chainId: bigint('chain_id', { mode: 'number' }).notNull(),
    number: bigint('number', { mode: 'number' }).notNull(),
    hash: varchar('hash', { length: 66 }).notNull(),
    parentHash: varchar('parent_hash', { length: 66 }).notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.chainId, table.number], name: 'blocks_pk' }),
    uniqueIndex('blocks_id_uidx').on(table.id),
    uniqueIndex('blocks_chain_hash_uidx').on(table.chainId, table.hash),
    uniqueIndex('blocks_chain_number_hash_uidx').on(table.chainId, table.number, table.hash),
    foreignKey({
      columns: [table.network, table.chainId],
      foreignColumns: [networkConfig.network, networkConfig.chainId],
      name: 'blocks_network_fk',
    }).onDelete('restrict'),
    check('blocks_number_check', sql`${table.number} >= 0`),
    check('blocks_hash_check', sql`${table.hash} ~ '^0x[0-9a-f]{64}$'`),
    check('blocks_parent_hash_check', sql`${table.parentHash} ~ '^0x[0-9a-f]{64}$'`),
  ],
);

export const eventFacts = pgTable(
  'event_facts',
  {
    id: text('id').primaryKey(),
    network: text('network').notNull(),
    chainId: bigint('chain_id', { mode: 'number' }).notNull(),
    blockNumber: bigint('block_number', { mode: 'number' }).notNull(),
    blockHash: varchar('block_hash', { length: 66 }).notNull(),
    parentHash: varchar('parent_hash', { length: 66 }).notNull(),
    blockTimestamp: timestamp('block_timestamp', { withTimezone: true, mode: 'date' }).notNull(),
    transactionHash: varchar('transaction_hash', { length: 66 }).notNull(),
    transactionIndex: integer('transaction_index').notNull(),
    logIndex: integer('log_index').notNull(),
    address: varchar('address', { length: 42 }).notNull(),
    topic0: varchar('topic0', { length: 66 }).notNull(),
    topics: text('topics').array().notNull(),
    data: text('data').notNull(),
    eventName: text('event_name'),
    eventDomain: text('event_domain'),
    decoded: jsonb('decoded').$type<Record<string, unknown>>(),
  },
  (table) => [
    uniqueIndex('event_facts_position_uidx').on(
      table.chainId,
      table.blockNumber,
      table.transactionIndex,
      table.logIndex,
    ),
    uniqueIndex('event_facts_transaction_log_uidx').on(
      table.chainId,
      table.transactionHash,
      table.logIndex,
    ),
    index('event_facts_address_block_idx').on(table.address, table.blockNumber),
    index('event_facts_topic0_block_idx').on(table.topic0, table.blockNumber),
    foreignKey({
      columns: [table.network, table.chainId],
      foreignColumns: [networkConfig.network, networkConfig.chainId],
      name: 'event_facts_network_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.chainId, table.blockNumber, table.blockHash],
      foreignColumns: [blocks.chainId, blocks.number, blocks.hash],
      name: 'event_facts_block_fk',
    }).onDelete('cascade'),
    check('event_facts_block_number_check', sql`${table.blockNumber} >= 0`),
    check('event_facts_transaction_index_check', sql`${table.transactionIndex} >= 0`),
    check('event_facts_log_index_check', sql`${table.logIndex} >= 0`),
    check('event_facts_block_hash_check', sql`${table.blockHash} ~ '^0x[0-9a-f]{64}$'`),
    check('event_facts_parent_hash_check', sql`${table.parentHash} ~ '^0x[0-9a-f]{64}$'`),
    check('event_facts_transaction_hash_check', sql`${table.transactionHash} ~ '^0x[0-9a-f]{64}$'`),
    check('event_facts_address_check', sql`${table.address} ~ '^0x[0-9a-f]{40}$'`),
    check('event_facts_topic0_check', sql`${table.topic0} ~ '^0x[0-9a-f]{64}$'`),
    check(
      'event_facts_topics_check',
      sql`array_ndims(${table.topics}) = 1
        AND array_lower(${table.topics}, 1) = 1
        AND cardinality(${table.topics}) > 0
        AND ${table.topics}[1] = ${table.topic0}
        AND array_position(${table.topics}, NULL) IS NULL
        AND array_to_string(${table.topics}, ',') ~ '^0x[0-9a-f]{64}(,0x[0-9a-f]{64})*$'`,
    ),
    check('event_facts_data_check', sql`${table.data} ~ '^0x([0-9a-f]{2})*$'`),
  ],
);

export const universalProfiles = pgTable(
  'universal_profiles',
  {
    id: text('id').notNull(),
    network: text('network').notNull(),
    chainId: bigint('chain_id', { mode: 'number' }).notNull(),
    address: varchar('address', { length: 42 }).notNull(),
    ownerAddress: varchar('owner_address', { length: 42 }),
    verification: verificationStatus('verification').notNull().default('unknown'),
    lastBlockNumber: bigint('last_block_number', { mode: 'number' }).notNull(),
    lastBlockHash: varchar('last_block_hash', { length: 66 }).notNull(),
    lastTransactionHash: varchar('last_transaction_hash', { length: 66 }),
    lastTransactionIndex: integer('last_transaction_index'),
    lastLogIndex: integer('last_log_index'),
  },
  (table) => [
    primaryKey({ columns: [table.chainId, table.address], name: 'universal_profiles_pk' }),
    uniqueIndex('universal_profiles_id_uidx').on(table.id),
    index('universal_profiles_owner_idx').on(table.ownerAddress),
    foreignKey({
      columns: [table.network, table.chainId],
      foreignColumns: [networkConfig.network, networkConfig.chainId],
      name: 'universal_profiles_network_fk',
    }).onDelete('restrict'),
    check('universal_profiles_address_check', sql`${table.address} ~ '^0x[0-9a-f]{40}$'`),
    check(
      'universal_profiles_owner_address_check',
      sql`${table.ownerAddress} IS NULL OR ${table.ownerAddress} ~ '^0x[0-9a-f]{40}$'`,
    ),
    check('universal_profiles_block_check', sql`${table.lastBlockNumber} >= 0`),
    check('universal_profiles_block_hash_check', sql`${table.lastBlockHash} ~ '^0x[0-9a-f]{64}$'`),
  ],
);

export const digitalAssets = pgTable(
  'digital_assets',
  {
    id: text('id').notNull(),
    network: text('network').notNull(),
    chainId: bigint('chain_id', { mode: 'number' }).notNull(),
    address: varchar('address', { length: 42 }).notNull(),
    ownerAddress: varchar('owner_address', { length: 42 }),
    standard: assetStandard('standard').notNull().default('unknown'),
    tokenType: integer('token_type'),
    name: text('name'),
    symbol: text('symbol'),
    decimals: integer('decimals'),
    totalSupply: numeric('total_supply', { precision: 78, scale: 0 }),
    tokenIdFormat: integer('token_id_format'),
    tokenIdReferenceContract: varchar('token_id_reference_contract', { length: 42 }),
    baseUri: text('base_uri'),
    verification: verificationStatus('verification').notNull().default('unknown'),
    lastBlockNumber: bigint('last_block_number', { mode: 'number' }).notNull(),
    lastBlockHash: varchar('last_block_hash', { length: 66 }).notNull(),
    lastTransactionHash: varchar('last_transaction_hash', { length: 66 }),
    lastTransactionIndex: integer('last_transaction_index'),
    lastLogIndex: integer('last_log_index'),
  },
  (table) => [
    primaryKey({ columns: [table.chainId, table.address], name: 'digital_assets_pk' }),
    uniqueIndex('digital_assets_id_uidx').on(table.id),
    index('digital_assets_owner_idx').on(table.ownerAddress),
    index('digital_assets_standard_idx').on(table.standard),
    foreignKey({
      columns: [table.network, table.chainId],
      foreignColumns: [networkConfig.network, networkConfig.chainId],
      name: 'digital_assets_network_fk',
    }).onDelete('restrict'),
    check('digital_assets_address_check', sql`${table.address} ~ '^0x[0-9a-f]{40}$'`),
    check(
      'digital_assets_owner_address_check',
      sql`${table.ownerAddress} IS NULL OR ${table.ownerAddress} ~ '^0x[0-9a-f]{40}$'`,
    ),
    check(
      'digital_assets_reference_contract_check',
      sql`${table.tokenIdReferenceContract} IS NULL OR ${table.tokenIdReferenceContract} ~ '^0x[0-9a-f]{40}$'`,
    ),
    check(
      'digital_assets_decimals_check',
      sql`${table.decimals} IS NULL OR (${table.decimals} >= 0 AND ${table.decimals} <= 255)`,
    ),
    check(
      'digital_assets_total_supply_check',
      sql`${table.totalSupply} IS NULL OR ${table.totalSupply} >= 0`,
    ),
    check('digital_assets_block_check', sql`${table.lastBlockNumber} >= 0`),
    check('digital_assets_block_hash_check', sql`${table.lastBlockHash} ~ '^0x[0-9a-f]{64}$'`),
  ],
);

export const nfts = pgTable(
  'nfts',
  {
    id: text('id').notNull(),
    network: text('network').notNull(),
    chainId: bigint('chain_id', { mode: 'number' }).notNull(),
    address: varchar('address', { length: 42 }).notNull(),
    tokenId: varchar('token_id', { length: 66 }).notNull(),
    formattedTokenId: text('formatted_token_id'),
    isMinted: boolean('is_minted').notNull().default(false),
    isBurned: boolean('is_burned').notNull().default(false),
    ownerAddress: varchar('owner_address', { length: 42 }),
    tokenUri: text('token_uri'),
    verification: verificationStatus('verification').notNull().default('unknown'),
    lastBlockNumber: bigint('last_block_number', { mode: 'number' }).notNull(),
    lastBlockHash: varchar('last_block_hash', { length: 66 }).notNull(),
    lastTransactionHash: varchar('last_transaction_hash', { length: 66 }),
    lastTransactionIndex: integer('last_transaction_index'),
    lastLogIndex: integer('last_log_index'),
  },
  (table) => [
    primaryKey({ columns: [table.chainId, table.address, table.tokenId], name: 'nfts_pk' }),
    uniqueIndex('nfts_id_uidx').on(table.id),
    index('nfts_owner_idx').on(table.ownerAddress),
    foreignKey({
      columns: [table.network, table.chainId],
      foreignColumns: [networkConfig.network, networkConfig.chainId],
      name: 'nfts_network_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.chainId, table.address],
      foreignColumns: [digitalAssets.chainId, digitalAssets.address],
      name: 'nfts_asset_fk',
    }).onDelete('cascade'),
    check('nfts_address_check', sql`${table.address} ~ '^0x[0-9a-f]{40}$'`),
    check('nfts_token_id_check', sql`${table.tokenId} ~ '^0x[0-9a-f]{64}$'`),
    check(
      'nfts_owner_address_check',
      sql`${table.ownerAddress} IS NULL OR ${table.ownerAddress} ~ '^0x[0-9a-f]{40}$'`,
    ),
    check('nfts_block_check', sql`${table.lastBlockNumber} >= 0`),
    check('nfts_block_hash_check', sql`${table.lastBlockHash} ~ '^0x[0-9a-f]{64}$'`),
  ],
);

export const ownedAssets = pgTable(
  'owned_assets',
  {
    id: text('id').notNull(),
    network: text('network').notNull(),
    chainId: bigint('chain_id', { mode: 'number' }).notNull(),
    ownerAddress: varchar('owner_address', { length: 42 }).notNull(),
    assetAddress: varchar('asset_address', { length: 42 }).notNull(),
    balance: numeric('balance', { precision: 78, scale: 0 }).notNull(),
    lastBlockNumber: bigint('last_block_number', { mode: 'number' }).notNull(),
    lastBlockHash: varchar('last_block_hash', { length: 66 }).notNull(),
    lastTransactionHash: varchar('last_transaction_hash', { length: 66 }),
    lastTransactionIndex: integer('last_transaction_index'),
    lastLogIndex: integer('last_log_index'),
  },
  (table) => [
    primaryKey({
      columns: [table.chainId, table.ownerAddress, table.assetAddress],
      name: 'owned_assets_pk',
    }),
    uniqueIndex('owned_assets_id_uidx').on(table.id),
    index('owned_assets_asset_idx').on(table.assetAddress),
    foreignKey({
      columns: [table.network, table.chainId],
      foreignColumns: [networkConfig.network, networkConfig.chainId],
      name: 'owned_assets_network_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.chainId, table.ownerAddress],
      foreignColumns: [universalProfiles.chainId, universalProfiles.address],
      name: 'owned_assets_owner_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.chainId, table.assetAddress],
      foreignColumns: [digitalAssets.chainId, digitalAssets.address],
      name: 'owned_assets_asset_fk',
    }).onDelete('cascade'),
    check('owned_assets_owner_check', sql`${table.ownerAddress} ~ '^0x[0-9a-f]{40}$'`),
    check('owned_assets_asset_check', sql`${table.assetAddress} ~ '^0x[0-9a-f]{40}$'`),
    check('owned_assets_balance_check', sql`${table.balance} >= 0`),
    check('owned_assets_block_check', sql`${table.lastBlockNumber} >= 0`),
    check('owned_assets_block_hash_check', sql`${table.lastBlockHash} ~ '^0x[0-9a-f]{64}$'`),
  ],
);

export const ownedTokens = pgTable(
  'owned_tokens',
  {
    id: text('id').notNull(),
    network: text('network').notNull(),
    chainId: bigint('chain_id', { mode: 'number' }).notNull(),
    ownerAddress: varchar('owner_address', { length: 42 }).notNull(),
    assetAddress: varchar('asset_address', { length: 42 }).notNull(),
    tokenId: varchar('token_id', { length: 66 }).notNull(),
    balance: numeric('balance', { precision: 78, scale: 0 }).notNull(),
    lastBlockNumber: bigint('last_block_number', { mode: 'number' }).notNull(),
    lastBlockHash: varchar('last_block_hash', { length: 66 }).notNull(),
    lastTransactionHash: varchar('last_transaction_hash', { length: 66 }),
    lastTransactionIndex: integer('last_transaction_index'),
    lastLogIndex: integer('last_log_index'),
  },
  (table) => [
    primaryKey({
      columns: [table.chainId, table.ownerAddress, table.assetAddress, table.tokenId],
      name: 'owned_tokens_pk',
    }),
    uniqueIndex('owned_tokens_id_uidx').on(table.id),
    index('owned_tokens_asset_token_idx').on(table.assetAddress, table.tokenId),
    foreignKey({
      columns: [table.network, table.chainId],
      foreignColumns: [networkConfig.network, networkConfig.chainId],
      name: 'owned_tokens_network_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.chainId, table.ownerAddress],
      foreignColumns: [universalProfiles.chainId, universalProfiles.address],
      name: 'owned_tokens_owner_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.chainId, table.assetAddress, table.tokenId],
      foreignColumns: [nfts.chainId, nfts.address, nfts.tokenId],
      name: 'owned_tokens_nft_fk',
    }).onDelete('cascade'),
    check('owned_tokens_owner_check', sql`${table.ownerAddress} ~ '^0x[0-9a-f]{40}$'`),
    check('owned_tokens_asset_check', sql`${table.assetAddress} ~ '^0x[0-9a-f]{40}$'`),
    check('owned_tokens_token_id_check', sql`${table.tokenId} ~ '^0x[0-9a-f]{64}$'`),
    check('owned_tokens_balance_check', sql`${table.balance} >= 0`),
    check('owned_tokens_block_check', sql`${table.lastBlockNumber} >= 0`),
    check('owned_tokens_block_hash_check', sql`${table.lastBlockHash} ~ '^0x[0-9a-f]{64}$'`),
  ],
);

export const followerEdges = pgTable(
  'follower_edges',
  {
    id: text('id').notNull(),
    network: text('network').notNull(),
    chainId: bigint('chain_id', { mode: 'number' }).notNull(),
    followerAddress: varchar('follower_address', { length: 42 }).notNull(),
    followedAddress: varchar('followed_address', { length: 42 }).notNull(),
    isFollowing: boolean('is_following').notNull(),
    followedAt: timestamp('followed_at', { withTimezone: true, mode: 'date' }),
    unfollowedAt: timestamp('unfollowed_at', { withTimezone: true, mode: 'date' }),
    lastBlockNumber: bigint('last_block_number', { mode: 'number' }).notNull(),
    lastBlockHash: varchar('last_block_hash', { length: 66 }).notNull(),
    lastTransactionHash: varchar('last_transaction_hash', { length: 66 }),
    lastTransactionIndex: integer('last_transaction_index'),
    lastLogIndex: integer('last_log_index'),
  },
  (table) => [
    primaryKey({
      columns: [table.chainId, table.followerAddress, table.followedAddress],
      name: 'follower_edges_pk',
    }),
    uniqueIndex('follower_edges_id_uidx').on(table.id),
    index('follower_edges_followed_idx').on(table.followedAddress, table.isFollowing),
    foreignKey({
      columns: [table.network, table.chainId],
      foreignColumns: [networkConfig.network, networkConfig.chainId],
      name: 'follower_edges_network_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.chainId, table.followerAddress],
      foreignColumns: [universalProfiles.chainId, universalProfiles.address],
      name: 'follower_edges_follower_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.chainId, table.followedAddress],
      foreignColumns: [universalProfiles.chainId, universalProfiles.address],
      name: 'follower_edges_followed_fk',
    }).onDelete('cascade'),
    check('follower_edges_follower_check', sql`${table.followerAddress} ~ '^0x[0-9a-f]{40}$'`),
    check('follower_edges_followed_check', sql`${table.followedAddress} ~ '^0x[0-9a-f]{40}$'`),
    check(
      'follower_edges_distinct_check',
      sql`${table.followerAddress} <> ${table.followedAddress}`,
    ),
    check('follower_edges_block_check', sql`${table.lastBlockNumber} >= 0`),
    check('follower_edges_block_hash_check', sql`${table.lastBlockHash} ~ '^0x[0-9a-f]{64}$'`),
  ],
);

export const creators = pgTable(
  'creators',
  {
    id: text('id').notNull(),
    network: text('network').notNull(),
    chainId: bigint('chain_id', { mode: 'number' }).notNull(),
    assetAddress: varchar('asset_address', { length: 42 }).notNull(),
    creatorAddress: varchar('creator_address', { length: 42 }).notNull(),
    arrayIndex: numeric('array_index', { precision: 39, scale: 0, mode: 'bigint' }).notNull(),
    interfaceId: varchar('interface_id', { length: 10 }),
    verified: boolean('verified').notNull().default(false),
    lastBlockNumber: bigint('last_block_number', { mode: 'number' }).notNull(),
    lastBlockHash: varchar('last_block_hash', { length: 66 }).notNull(),
    lastTransactionHash: varchar('last_transaction_hash', { length: 66 }),
    lastTransactionIndex: integer('last_transaction_index'),
    lastLogIndex: integer('last_log_index'),
  },
  (table) => [
    primaryKey({
      columns: [table.chainId, table.assetAddress, table.creatorAddress],
      name: 'creators_pk',
    }),
    uniqueIndex('creators_id_uidx').on(table.id),
    uniqueIndex('creators_array_index_uidx').on(
      table.chainId,
      table.assetAddress,
      table.arrayIndex,
    ),
    index('creators_creator_idx').on(table.creatorAddress),
    foreignKey({
      columns: [table.network, table.chainId],
      foreignColumns: [networkConfig.network, networkConfig.chainId],
      name: 'creators_network_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.chainId, table.assetAddress],
      foreignColumns: [digitalAssets.chainId, digitalAssets.address],
      name: 'creators_asset_fk',
    }).onDelete('cascade'),
    check('creators_asset_check', sql`${table.assetAddress} ~ '^0x[0-9a-f]{40}$'`),
    check('creators_creator_check', sql`${table.creatorAddress} ~ '^0x[0-9a-f]{40}$'`),
    check('creators_array_index_check', sql`${table.arrayIndex} >= 0`),
    check(
      'creators_interface_id_check',
      sql`${table.interfaceId} IS NULL OR ${table.interfaceId} ~ '^0x[0-9a-f]{8}$'`,
    ),
    check('creators_block_check', sql`${table.lastBlockNumber} >= 0`),
    check('creators_block_hash_check', sql`${table.lastBlockHash} ~ '^0x[0-9a-f]{64}$'`),
  ],
);

export const issuedAssets = pgTable(
  'issued_assets',
  {
    id: text('id').notNull(),
    network: text('network').notNull(),
    chainId: bigint('chain_id', { mode: 'number' }).notNull(),
    issuerAddress: varchar('issuer_address', { length: 42 }).notNull(),
    assetAddress: varchar('asset_address', { length: 42 }).notNull(),
    arrayIndex: numeric('array_index', { precision: 39, scale: 0, mode: 'bigint' }).notNull(),
    interfaceId: varchar('interface_id', { length: 10 }),
    lastBlockNumber: bigint('last_block_number', { mode: 'number' }).notNull(),
    lastBlockHash: varchar('last_block_hash', { length: 66 }).notNull(),
    lastTransactionHash: varchar('last_transaction_hash', { length: 66 }),
    lastTransactionIndex: integer('last_transaction_index'),
    lastLogIndex: integer('last_log_index'),
  },
  (table) => [
    primaryKey({
      columns: [table.chainId, table.issuerAddress, table.assetAddress],
      name: 'issued_assets_pk',
    }),
    uniqueIndex('issued_assets_id_uidx').on(table.id),
    uniqueIndex('issued_assets_array_index_uidx').on(
      table.chainId,
      table.issuerAddress,
      table.arrayIndex,
    ),
    index('issued_assets_asset_idx').on(table.assetAddress),
    foreignKey({
      columns: [table.network, table.chainId],
      foreignColumns: [networkConfig.network, networkConfig.chainId],
      name: 'issued_assets_network_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.chainId, table.issuerAddress],
      foreignColumns: [universalProfiles.chainId, universalProfiles.address],
      name: 'issued_assets_issuer_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.chainId, table.assetAddress],
      foreignColumns: [digitalAssets.chainId, digitalAssets.address],
      name: 'issued_assets_asset_fk',
    }).onDelete('cascade'),
    check('issued_assets_issuer_check', sql`${table.issuerAddress} ~ '^0x[0-9a-f]{40}$'`),
    check('issued_assets_asset_check', sql`${table.assetAddress} ~ '^0x[0-9a-f]{40}$'`),
    check('issued_assets_array_index_check', sql`${table.arrayIndex} >= 0`),
    check(
      'issued_assets_interface_id_check',
      sql`${table.interfaceId} IS NULL OR ${table.interfaceId} ~ '^0x[0-9a-f]{8}$'`,
    ),
    check('issued_assets_block_check', sql`${table.lastBlockNumber} >= 0`),
    check('issued_assets_block_hash_check', sql`${table.lastBlockHash} ~ '^0x[0-9a-f]{64}$'`),
  ],
);

export const controllers = pgTable(
  'controllers',
  {
    id: text('id').notNull(),
    network: text('network').notNull(),
    chainId: bigint('chain_id', { mode: 'number' }).notNull(),
    profileAddress: varchar('profile_address', { length: 42 }).notNull(),
    controllerAddress: varchar('controller_address', { length: 42 }).notNull(),
    arrayIndex: integer('array_index'),
    permissions: varchar('permissions', { length: 66 }),
    allowedCalls: jsonb('allowed_calls').$type<string[]>(),
    allowedDataKeys: jsonb('allowed_data_keys').$type<string[]>(),
    lastBlockNumber: bigint('last_block_number', { mode: 'number' }).notNull(),
    lastBlockHash: varchar('last_block_hash', { length: 66 }).notNull(),
    lastTransactionHash: varchar('last_transaction_hash', { length: 66 }),
    lastTransactionIndex: integer('last_transaction_index'),
    lastLogIndex: integer('last_log_index'),
  },
  (table) => [
    primaryKey({
      columns: [table.chainId, table.profileAddress, table.controllerAddress],
      name: 'controllers_pk',
    }),
    uniqueIndex('controllers_id_uidx').on(table.id),
    uniqueIndex('controllers_array_index_uidx').on(
      table.chainId,
      table.profileAddress,
      table.arrayIndex,
    ),
    index('controllers_controller_idx').on(table.controllerAddress),
    foreignKey({
      columns: [table.network, table.chainId],
      foreignColumns: [networkConfig.network, networkConfig.chainId],
      name: 'controllers_network_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.chainId, table.profileAddress],
      foreignColumns: [universalProfiles.chainId, universalProfiles.address],
      name: 'controllers_profile_fk',
    }).onDelete('cascade'),
    check('controllers_profile_check', sql`${table.profileAddress} ~ '^0x[0-9a-f]{40}$'`),
    check('controllers_controller_check', sql`${table.controllerAddress} ~ '^0x[0-9a-f]{40}$'`),
    check(
      'controllers_array_index_check',
      sql`${table.arrayIndex} IS NULL OR ${table.arrayIndex} >= 0`,
    ),
    check(
      'controllers_permissions_check',
      sql`${table.permissions} IS NULL OR ${table.permissions} ~ '^0x[0-9a-f]{64}$'`,
    ),
    check('controllers_block_check', sql`${table.lastBlockNumber} >= 0`),
    check('controllers_block_hash_check', sql`${table.lastBlockHash} ~ '^0x[0-9a-f]{64}$'`),
  ],
);

export const chillwhalesNfts = pgTable(
  'chillwhales_nfts',
  {
    id: text('id').notNull(),
    network: text('network').notNull(),
    chainId: bigint('chain_id', { mode: 'number' }).notNull(),
    address: varchar('address', { length: 42 }).notNull(),
    tokenId: varchar('token_id', { length: 66 }).notNull(),
    chillClaimed: boolean('chill_claimed').notNull().default(false),
    orbsClaimed: boolean('orbs_claimed').notNull().default(false),
    level: integer('level'),
    cooldownExpiry: bigint('cooldown_expiry', { mode: 'number' }),
    faction: text('faction'),
    lastBlockNumber: bigint('last_block_number', { mode: 'number' }).notNull(),
    lastBlockHash: varchar('last_block_hash', { length: 66 }).notNull(),
    lastTransactionHash: varchar('last_transaction_hash', { length: 66 }),
    lastTransactionIndex: integer('last_transaction_index'),
    lastLogIndex: integer('last_log_index'),
  },
  (table) => [
    primaryKey({
      columns: [table.chainId, table.address, table.tokenId],
      name: 'chillwhales_nfts_pk',
    }),
    uniqueIndex('chillwhales_nfts_id_uidx').on(table.id),
    index('chillwhales_nfts_game_idx').on(table.address, table.level, table.cooldownExpiry),
    foreignKey({
      columns: [table.network, table.chainId],
      foreignColumns: [networkConfig.network, networkConfig.chainId],
      name: 'chillwhales_nfts_network_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.chainId, table.address, table.tokenId],
      foreignColumns: [nfts.chainId, nfts.address, nfts.tokenId],
      name: 'chillwhales_nfts_nft_fk',
    }).onDelete('cascade'),
    check('chillwhales_nfts_address_check', sql`${table.address} ~ '^0x[0-9a-f]{40}$'`),
    check('chillwhales_nfts_token_id_check', sql`${table.tokenId} ~ '^0x[0-9a-f]{64}$'`),
    check('chillwhales_nfts_level_check', sql`${table.level} IS NULL OR ${table.level} >= 0`),
    check(
      'chillwhales_nfts_cooldown_check',
      sql`${table.cooldownExpiry} IS NULL OR ${table.cooldownExpiry} >= 0`,
    ),
    check('chillwhales_nfts_block_check', sql`${table.lastBlockNumber} >= 0`),
    check('chillwhales_nfts_block_hash_check', sql`${table.lastBlockHash} ~ '^0x[0-9a-f]{64}$'`),
  ],
);

export const dataValues = pgTable(
  'data_values',
  {
    id: text('id').primaryKey(),
    network: text('network').notNull(),
    chainId: bigint('chain_id', { mode: 'number' }).notNull(),
    address: varchar('address', { length: 42 }).notNull(),
    tokenId: varchar('token_id', { length: 66 }),
    dataKey: varchar('data_key', { length: 66 }).notNull(),
    dataValue: text('data_value').notNull(),
    lastBlockNumber: bigint('last_block_number', { mode: 'number' }).notNull(),
    lastBlockHash: varchar('last_block_hash', { length: 66 }).notNull(),
    lastTransactionHash: varchar('last_transaction_hash', { length: 66 }),
    lastTransactionIndex: integer('last_transaction_index'),
    lastLogIndex: integer('last_log_index'),
  },
  (table) => [
    unique('data_values_scope_uidx')
      .on(table.chainId, table.address, table.tokenId, table.dataKey)
      .nullsNotDistinct(),
    index('data_values_address_key_idx').on(table.address, table.dataKey),
    foreignKey({
      columns: [table.network, table.chainId],
      foreignColumns: [networkConfig.network, networkConfig.chainId],
      name: 'data_values_network_fk',
    }).onDelete('restrict'),
    check('data_values_address_check', sql`${table.address} ~ '^0x[0-9a-f]{40}$'`),
    check(
      'data_values_token_id_check',
      sql`${table.tokenId} IS NULL OR ${table.tokenId} ~ '^0x[0-9a-f]{64}$'`,
    ),
    check('data_values_data_key_check', sql`${table.dataKey} ~ '^0x[0-9a-f]{64}$'`),
    check('data_values_data_value_check', sql`${table.dataValue} ~ '^0x([0-9a-f]{2})*$'`),
    check('data_values_block_check', sql`${table.lastBlockNumber} >= 0`),
    check('data_values_block_hash_check', sql`${table.lastBlockHash} ~ '^0x[0-9a-f]{64}$'`),
  ],
);

export const metadataRevisions = pgTable(
  'metadata_revisions',
  {
    id: text('id').primaryKey(),
    network: text('network').notNull(),
    chainId: bigint('chain_id', { mode: 'number' }).notNull(),
    kind: metadataKind('kind').notNull(),
    address: varchar('address', { length: 42 }).notNull(),
    tokenId: varchar('token_id', { length: 66 }),
    dataKey: varchar('data_key', { length: 66 }).notNull(),
    sourceRevision: text('source_revision').notNull(),
    contentUri: text('content_uri').notNull(),
    contentHash: text('content_hash'),
    content: jsonb('content').$type<Record<string, unknown>>(),
    contentType: text('content_type'),
    contentLength: integer('content_length'),
    fetchedAt: timestamp('fetched_at', { withTimezone: true, mode: 'date' }),
    lastBlockNumber: bigint('last_block_number', { mode: 'number' }).notNull(),
    lastBlockHash: varchar('last_block_hash', { length: 66 }).notNull(),
    lastTransactionHash: varchar('last_transaction_hash', { length: 66 }),
    lastTransactionIndex: integer('last_transaction_index'),
    lastLogIndex: integer('last_log_index'),
  },
  (table) => [
    unique('metadata_revisions_natural_uidx')
      .on(table.chainId, table.address, table.tokenId, table.dataKey, table.sourceRevision)
      .nullsNotDistinct(),
    index('metadata_revisions_current_idx').on(
      table.chainId,
      table.address,
      table.tokenId,
      table.dataKey,
      table.lastBlockNumber,
    ),
    foreignKey({
      columns: [table.network, table.chainId],
      foreignColumns: [networkConfig.network, networkConfig.chainId],
      name: 'metadata_revisions_network_fk',
    }).onDelete('restrict'),
    check('metadata_revisions_address_check', sql`${table.address} ~ '^0x[0-9a-f]{40}$'`),
    check(
      'metadata_revisions_token_id_check',
      sql`${table.tokenId} IS NULL OR ${table.tokenId} ~ '^0x[0-9a-f]{64}$'`,
    ),
    check('metadata_revisions_data_key_check', sql`${table.dataKey} ~ '^0x[0-9a-f]{64}$'`),
    check(
      'metadata_revisions_content_length_check',
      sql`${table.contentLength} IS NULL OR ${table.contentLength} >= 0`,
    ),
    check('metadata_revisions_block_check', sql`${table.lastBlockNumber} >= 0`),
    check('metadata_revisions_block_hash_check', sql`${table.lastBlockHash} ~ '^0x[0-9a-f]{64}$'`),
  ],
);

export const metadataJobs = pgTable(
  'metadata_jobs',
  {
    id: text('id').primaryKey(),
    network: text('network').notNull(),
    chainId: bigint('chain_id', { mode: 'number' }).notNull(),
    kind: metadataKind('kind').notNull(),
    status: metadataJobStatus('status').notNull().default('pending'),
    address: varchar('address', { length: 42 }).notNull(),
    tokenId: varchar('token_id', { length: 66 }),
    dataKey: varchar('data_key', { length: 66 }).notNull(),
    sourceRevision: text('source_revision').notNull(),
    contentUri: text('content_uri').notNull(),
    contentHash: text('content_hash'),
    sourceBlockNumber: bigint('source_block_number', { mode: 'number' }).notNull(),
    sourceBlockHash: varchar('source_block_hash', { length: 66 }).notNull(),
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    claimedAt: timestamp('claimed_at', { withTimezone: true, mode: 'date' }),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    unique('metadata_jobs_revision_uidx')
      .on(table.chainId, table.address, table.tokenId, table.dataKey, table.sourceRevision)
      .nullsNotDistinct(),
    index('metadata_jobs_claim_idx').on(table.status, table.nextAttemptAt, table.sourceBlockNumber),
    foreignKey({
      columns: [table.network, table.chainId],
      foreignColumns: [networkConfig.network, networkConfig.chainId],
      name: 'metadata_jobs_network_fk',
    }).onDelete('restrict'),
    check('metadata_jobs_address_check', sql`${table.address} ~ '^0x[0-9a-f]{40}$'`),
    check(
      'metadata_jobs_token_id_check',
      sql`${table.tokenId} IS NULL OR ${table.tokenId} ~ '^0x[0-9a-f]{64}$'`,
    ),
    check('metadata_jobs_data_key_check', sql`${table.dataKey} ~ '^0x[0-9a-f]{64}$'`),
    check('metadata_jobs_source_block_check', sql`${table.sourceBlockNumber} >= 0`),
    check('metadata_jobs_source_hash_check', sql`${table.sourceBlockHash} ~ '^0x[0-9a-f]{64}$'`),
    check('metadata_jobs_attempts_check', sql`${table.attempts} >= 0`),
  ],
);

export const indexedHeads = pgTable(
  'indexed_heads',
  {
    network: text('network').notNull(),
    chainId: bigint('chain_id', { mode: 'number' }).notNull(),
    blockNumber: bigint('block_number', { mode: 'number' }).notNull(),
    blockHash: varchar('block_hash', { length: 66 }).notNull(),
    blockTimestamp: timestamp('block_timestamp', { withTimezone: true, mode: 'date' }).notNull(),
    finalizedBlockNumber: bigint('finalized_block_number', { mode: 'number' }),
    finalizedBlockHash: varchar('finalized_block_hash', { length: 66 }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.network, table.chainId], name: 'indexed_heads_pk' }),
    foreignKey({
      columns: [table.network, table.chainId],
      foreignColumns: [networkConfig.network, networkConfig.chainId],
      name: 'indexed_heads_network_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.chainId, table.blockNumber, table.blockHash],
      foreignColumns: [blocks.chainId, blocks.number, blocks.hash],
      name: 'indexed_heads_block_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.chainId, table.finalizedBlockNumber, table.finalizedBlockHash],
      foreignColumns: [blocks.chainId, blocks.number, blocks.hash],
      name: 'indexed_heads_finalized_block_fk',
    }).onDelete('cascade'),
    check('indexed_heads_block_number_check', sql`${table.blockNumber} >= 0`),
    check('indexed_heads_block_hash_check', sql`${table.blockHash} ~ '^0x[0-9a-f]{64}$'`),
    check(
      'indexed_heads_finalized_number_check',
      sql`${table.finalizedBlockNumber} IS NULL OR (${table.finalizedBlockNumber} >= 0 AND ${table.finalizedBlockNumber} <= ${table.blockNumber})`,
    ),
    check(
      'indexed_heads_finalized_hash_check',
      sql`${table.finalizedBlockHash} IS NULL OR ${table.finalizedBlockHash} ~ '^0x[0-9a-f]{64}$'`,
    ),
    check(
      'indexed_heads_finalized_pair_check',
      sql`(${table.finalizedBlockNumber} IS NULL) = (${table.finalizedBlockHash} IS NULL)`,
    ),
  ],
);

export const networkConfigRelations = relations(networkConfig, ({ many }) => ({
  blocks: many(blocks),
  eventFacts: many(eventFacts),
  universalProfiles: many(universalProfiles),
  digitalAssets: many(digitalAssets),
}));

export const blocksRelations = relations(blocks, ({ one, many }) => ({
  networkConfig: one(networkConfig, {
    fields: [blocks.network, blocks.chainId],
    references: [networkConfig.network, networkConfig.chainId],
  }),
  events: many(eventFacts),
}));

export const eventFactsRelations = relations(eventFacts, ({ one }) => ({
  block: one(blocks, {
    fields: [eventFacts.chainId, eventFacts.blockNumber],
    references: [blocks.chainId, blocks.number],
  }),
}));

export const universalProfilesRelations = relations(universalProfiles, ({ many }) => ({
  ownedAssets: many(ownedAssets),
  ownedTokens: many(ownedTokens),
  controllers: many(controllers),
  issuedAssets: many(issuedAssets),
}));

export const digitalAssetsRelations = relations(digitalAssets, ({ many }) => ({
  nfts: many(nfts),
  owners: many(ownedAssets),
  creators: many(creators),
  issuers: many(issuedAssets),
}));

export const nftsRelations = relations(nfts, ({ one, many }) => ({
  asset: one(digitalAssets, {
    fields: [nfts.chainId, nfts.address],
    references: [digitalAssets.chainId, digitalAssets.address],
  }),
  owners: many(ownedTokens),
  chillwhales: one(chillwhalesNfts, {
    fields: [nfts.chainId, nfts.address, nfts.tokenId],
    references: [chillwhalesNfts.chainId, chillwhalesNfts.address, chillwhalesNfts.tokenId],
  }),
}));

/** Every table changed in a Pipes batch and therefore registered for rollback snapshots. */
export const rollbackTables = [
  blocks,
  eventFacts,
  universalProfiles,
  digitalAssets,
  nfts,
  ownedAssets,
  ownedTokens,
  followerEdges,
  creators,
  issuedAssets,
  controllers,
  chillwhalesNfts,
  dataValues,
  metadataRevisions,
  metadataJobs,
  indexedHeads,
];

/** Public read models exposed through cross-network `api` views. */
export const publicTables = [
  blocks,
  eventFacts,
  universalProfiles,
  digitalAssets,
  nfts,
  ownedAssets,
  ownedTokens,
  followerEdges,
  creators,
  issuedAssets,
  controllers,
  chillwhalesNfts,
  dataValues,
  metadataRevisions,
  indexedHeads,
];
