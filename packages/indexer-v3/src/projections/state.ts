import { and, eq, inArray } from 'drizzle-orm';
import {
  createDeterministicId,
  createRelationshipId,
  createTokenEntityId,
} from '../db/identity.js';
import {
  chillwhalesNfts,
  controllers,
  creators,
  digitalAssets,
  followerEdges,
  issuedAssets,
  nfts,
  ownedAssets,
  ownedTokens,
  universalProfiles,
} from '../db/schema.js';
import type { PersistenceHandlerContext } from '../db/target.js';
import type { EventFactRecord } from '../events/decode.js';
import { collectEventVerificationCandidates } from './candidates.js';
import type { ClaimStatusUpdate } from './extensions.js';
import { CHILLWHALES_EXTENSION, DATA_KEYS, ZERO_ADDRESS, isNullAddress } from './standards.js';

export type UniversalProfileRow = typeof universalProfiles.$inferSelect;
export type DigitalAssetRow = typeof digitalAssets.$inferSelect;
export type NftRow = typeof nfts.$inferSelect;
export type OwnedAssetRow = typeof ownedAssets.$inferSelect;
export type OwnedTokenRow = typeof ownedTokens.$inferSelect;
export type FollowerEdgeRow = typeof followerEdges.$inferSelect;
export type CreatorRow = typeof creators.$inferSelect;
export type IssuedAssetRow = typeof issuedAssets.$inferSelect;
export type ControllerRow = typeof controllers.$inferSelect;
export type ChillwhalesNftRow = typeof chillwhalesNfts.$inferSelect;

// Leaves ample bind-parameter headroom for the chain predicate and future scoped filters.
const PROJECTION_STATE_LOOKUP_CHUNK_SIZE = 10_000;

export interface ProjectionState {
  universalProfiles: Map<string, UniversalProfileRow>;
  digitalAssets: Map<string, DigitalAssetRow>;
  nfts: Map<string, NftRow>;
  ownedAssets: Map<string, OwnedAssetRow>;
  ownedTokens: Map<string, OwnedTokenRow>;
  followerEdges: Map<string, FollowerEdgeRow>;
  creators: Map<string, CreatorRow>;
  issuedAssets: Map<string, IssuedAssetRow>;
  controllers: Map<string, ControllerRow>;
  chillwhalesNfts: Map<string, ChillwhalesNftRow>;
}

interface ProjectionScope {
  profileAddresses: Set<string>;
  assetAddresses: Set<string>;
  nftIds: Set<string>;
  nftCollectionAddresses: Set<string>;
  ownedAssetIds: Set<string>;
  ownedTokenIds: Set<string>;
  followerEdgeIds: Set<string>;
  creatorAssets: Set<string>;
  creatorProfiles: Set<string>;
  issuerProfiles: Set<string>;
  controllerProfiles: Set<string>;
  extensionIds: Set<string>;
}

function readString(event: EventFactRecord, key: string): string | null {
  const value = event.decoded?.[key];
  return typeof value === 'string' ? value : null;
}

export function tokenKey(address: string, tokenId: string): string {
  return `${address}:${tokenId}`;
}

export function pairKey(left: string, right: string): string {
  return `${left}:${right}`;
}

export function ownedTokenKey(owner: string, address: string, tokenId: string): string {
  return `${owner}:${address}:${tokenId}`;
}

function createProjectionScope(
  chainId: number,
  events: readonly EventFactRecord[],
): ProjectionScope {
  const scope: ProjectionScope = {
    profileAddresses: new Set(),
    assetAddresses: new Set(),
    nftIds: new Set(),
    nftCollectionAddresses: new Set(),
    ownedAssetIds: new Set(),
    ownedTokenIds: new Set(),
    followerEdgeIds: new Set(),
    creatorAssets: new Set(),
    creatorProfiles: new Set(),
    issuerProfiles: new Set(),
    controllerProfiles: new Set(),
    extensionIds: new Set(),
  };

  for (const event of events) {
    for (const candidate of collectEventVerificationCandidates(event)) {
      if (candidate.category === 'universalProfile') {
        scope.profileAddresses.add(candidate.address);
        scope.creatorProfiles.add(candidate.address);
      } else {
        scope.assetAddresses.add(candidate.address);
      }
    }
    if (event.decoded == null) continue;

    if (event.eventName === 'Transfer') {
      for (const key of ['from', 'to']) {
        const address = readString(event, key);
        if (address == null || isNullAddress(address)) continue;
        scope.ownedAssetIds.add(
          createRelationshipId('owned-asset', chainId, [address, event.address]),
        );
      }
      if (event.eventDomain === 'lsp8') {
        const tokenId = readString(event, 'tokenId');
        if (tokenId == null) continue;
        scope.nftIds.add(createTokenEntityId(chainId, event.address, tokenId));
        for (const key of ['from', 'to']) {
          const ownerAddress = readString(event, key);
          if (ownerAddress == null || isNullAddress(ownerAddress)) continue;
          scope.ownedTokenIds.add(
            createDeterministicId('owned-token', chainId, [ownerAddress, event.address, tokenId]),
          );
        }
        const from = readString(event, 'from');
        if (
          from === ZERO_ADDRESS &&
          (event.address === CHILLWHALES_EXTENSION.collectionAddress ||
            event.address === CHILLWHALES_EXTENSION.orbsAddress)
        ) {
          scope.extensionIds.add(
            createDeterministicId('chillwhales-nft', chainId, [event.address, tokenId]),
          );
        }
      }
    } else if (event.eventName === 'TokenIdDataChanged') {
      const tokenId = readString(event, 'tokenId');
      if (tokenId == null) continue;
      scope.nftIds.add(createTokenEntityId(chainId, event.address, tokenId));
      if (event.address === CHILLWHALES_EXTENSION.orbsAddress) {
        scope.extensionIds.add(
          createDeterministicId('chillwhales-nft', chainId, [event.address, tokenId]),
        );
      }
    } else if (event.eventName === 'Follow') {
      const follower = readString(event, 'followerAddress');
      const followed = readString(event, 'followedAddress');
      if (follower != null && followed != null) {
        scope.followerEdgeIds.add(createRelationshipId('follower', chainId, [follower, followed]));
      }
    } else if (event.eventName === 'Unfollow') {
      const follower = readString(event, 'followerAddress');
      const followed = readString(event, 'unfollowedAddress');
      if (follower != null && followed != null) {
        scope.followerEdgeIds.add(createRelationshipId('follower', chainId, [follower, followed]));
      }
    } else if (event.eventName === 'DataChanged') {
      const dataKey = readString(event, 'dataKey');
      if (dataKey == null) continue;
      if (
        dataKey === DATA_KEYS.lsp4CreatorsLength ||
        dataKey.startsWith(DATA_KEYS.lsp4CreatorsIndex) ||
        dataKey.startsWith(DATA_KEYS.lsp4CreatorsMap)
      ) {
        scope.creatorAssets.add(event.address);
      }
      if (
        dataKey === DATA_KEYS.lsp12IssuedAssetsLength ||
        dataKey.startsWith(DATA_KEYS.lsp12IssuedAssetsIndex) ||
        dataKey.startsWith(DATA_KEYS.lsp12IssuedAssetsMap)
      ) {
        scope.issuerProfiles.add(event.address);
      }
      if (
        dataKey === DATA_KEYS.lsp6ControllersLength ||
        dataKey.startsWith(DATA_KEYS.lsp6ControllersIndex) ||
        dataKey.startsWith(DATA_KEYS.lsp6Permissions) ||
        dataKey.startsWith(DATA_KEYS.lsp6AllowedCalls) ||
        dataKey.startsWith(DATA_KEYS.lsp6AllowedDataKeys)
      ) {
        scope.controllerProfiles.add(event.address);
      }
      if (dataKey === DATA_KEYS.lsp8TokenIdFormat || dataKey === DATA_KEYS.lsp8MetadataBaseUri) {
        scope.nftCollectionAddresses.add(event.address);
      }
    }
  }
  return scope;
}

function rowsByAddress<T extends { address: string }>(rows: readonly T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.address, row]));
}

function createStateLookupChunks(values: readonly string[]): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < values.length; index += PROJECTION_STATE_LOOKUP_CHUNK_SIZE) {
    chunks.push(values.slice(index, index + PROJECTION_STATE_LOOKUP_CHUNK_SIZE));
  }
  return chunks;
}

async function loadInChunks<T>(
  values: readonly string[],
  load: (chunk: string[]) => Promise<T[]>,
): Promise<T[]> {
  const rows: T[] = [];
  for (const chunk of createStateLookupChunks(values)) rows.push(...(await load(chunk)));
  return rows;
}

async function loadNftRows(
  tx: PersistenceHandlerContext['tx'],
  chainId: number,
  ids: readonly string[],
  collectionAddresses: readonly string[],
): Promise<NftRow[]> {
  const [byId, byCollection] = await Promise.all([
    loadInChunks(ids, async (chunk) =>
      tx
        .select()
        .from(nfts)
        .where(and(eq(nfts.chainId, chainId), inArray(nfts.id, chunk))),
    ),
    loadInChunks(collectionAddresses, async (chunk) =>
      tx
        .select()
        .from(nfts)
        .where(and(eq(nfts.chainId, chainId), inArray(nfts.address, chunk))),
    ),
  ]);
  return [...new Map([...byId, ...byCollection].map((row) => [row.id, row])).values()];
}

async function loadCreatorRows(
  tx: PersistenceHandlerContext['tx'],
  chainId: number,
  assetAddresses: readonly string[],
  creatorAddresses: readonly string[],
): Promise<CreatorRow[]> {
  const [byAsset, byCreator] = await Promise.all([
    loadInChunks(assetAddresses, async (chunk) =>
      tx
        .select()
        .from(creators)
        .where(and(eq(creators.chainId, chainId), inArray(creators.assetAddress, chunk))),
    ),
    loadInChunks(creatorAddresses, async (chunk) =>
      tx
        .select()
        .from(creators)
        .where(and(eq(creators.chainId, chainId), inArray(creators.creatorAddress, chunk))),
    ),
  ]);
  return [...new Map([...byAsset, ...byCreator].map((row) => [row.id, row])).values()];
}

/** Load only the current rows that can be touched by this canonical event subset. */
export async function loadProjectionState(
  tx: PersistenceHandlerContext['tx'],
  chainId: number,
  events: readonly EventFactRecord[],
  claimStatusUpdates: readonly ClaimStatusUpdate[] = [],
): Promise<ProjectionState> {
  const scope = createProjectionScope(chainId, events);
  for (const update of claimStatusUpdates) {
    scope.assetAddresses.add(update.address);
    scope.extensionIds.add(
      createDeterministicId('chillwhales-nft', chainId, [update.address, update.tokenId]),
    );
  }
  const [
    profileRows,
    assetRows,
    nftRows,
    ownedAssetRows,
    ownedTokenRows,
    followerRows,
    creatorRows,
    issuedRows,
    controllerRows,
    extensionRows,
  ] = await Promise.all([
    loadInChunks([...scope.profileAddresses], async (chunk) =>
      tx
        .select()
        .from(universalProfiles)
        .where(
          and(eq(universalProfiles.chainId, chainId), inArray(universalProfiles.address, chunk)),
        ),
    ),
    loadInChunks([...scope.assetAddresses], async (chunk) =>
      tx
        .select()
        .from(digitalAssets)
        .where(and(eq(digitalAssets.chainId, chainId), inArray(digitalAssets.address, chunk))),
    ),
    loadNftRows(tx, chainId, [...scope.nftIds], [...scope.nftCollectionAddresses]),
    loadInChunks([...scope.ownedAssetIds], async (chunk) =>
      tx
        .select()
        .from(ownedAssets)
        .where(and(eq(ownedAssets.chainId, chainId), inArray(ownedAssets.id, chunk))),
    ),
    loadInChunks([...scope.ownedTokenIds], async (chunk) =>
      tx
        .select()
        .from(ownedTokens)
        .where(and(eq(ownedTokens.chainId, chainId), inArray(ownedTokens.id, chunk))),
    ),
    loadInChunks([...scope.followerEdgeIds], async (chunk) =>
      tx
        .select()
        .from(followerEdges)
        .where(and(eq(followerEdges.chainId, chainId), inArray(followerEdges.id, chunk))),
    ),
    loadCreatorRows(tx, chainId, [...scope.creatorAssets], [...scope.creatorProfiles]),
    loadInChunks([...scope.issuerProfiles], async (chunk) =>
      tx
        .select()
        .from(issuedAssets)
        .where(and(eq(issuedAssets.chainId, chainId), inArray(issuedAssets.issuerAddress, chunk))),
    ),
    loadInChunks([...scope.controllerProfiles], async (chunk) =>
      tx
        .select()
        .from(controllers)
        .where(and(eq(controllers.chainId, chainId), inArray(controllers.profileAddress, chunk))),
    ),
    loadInChunks([...scope.extensionIds], async (chunk) =>
      tx
        .select()
        .from(chillwhalesNfts)
        .where(and(eq(chillwhalesNfts.chainId, chainId), inArray(chillwhalesNfts.id, chunk))),
    ),
  ]);

  return {
    universalProfiles: rowsByAddress(profileRows),
    digitalAssets: rowsByAddress(assetRows),
    nfts: new Map(nftRows.map((row) => [tokenKey(row.address, row.tokenId), row])),
    ownedAssets: new Map(
      ownedAssetRows.map((row) => [pairKey(row.ownerAddress, row.assetAddress), row]),
    ),
    ownedTokens: new Map(
      ownedTokenRows.map((row) => [
        ownedTokenKey(row.ownerAddress, row.assetAddress, row.tokenId),
        row,
      ]),
    ),
    followerEdges: new Map(
      followerRows.map((row) => [pairKey(row.followerAddress, row.followedAddress), row]),
    ),
    creators: new Map(
      creatorRows.map((row) => [pairKey(row.assetAddress, row.creatorAddress), row]),
    ),
    issuedAssets: new Map(
      issuedRows.map((row) => [pairKey(row.issuerAddress, row.assetAddress), row]),
    ),
    controllers: new Map(
      controllerRows.map((row) => [pairKey(row.profileAddress, row.controllerAddress), row]),
    ),
    chillwhalesNfts: new Map(extensionRows.map((row) => [tokenKey(row.address, row.tokenId), row])),
  };
}
