import { and, eq, inArray, or } from 'drizzle-orm';
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
    issuerProfiles: new Set(),
    controllerProfiles: new Set(),
    extensionIds: new Set(),
  };

  for (const event of events) {
    for (const candidate of collectEventVerificationCandidates(event)) {
      if (candidate.category === 'universalProfile') {
        scope.profileAddresses.add(candidate.address);
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
  const nftCondition =
    scope.nftIds.size > 0 && scope.nftCollectionAddresses.size > 0
      ? or(
          inArray(nfts.id, [...scope.nftIds]),
          inArray(nfts.address, [...scope.nftCollectionAddresses]),
        )
      : scope.nftIds.size > 0
        ? inArray(nfts.id, [...scope.nftIds])
        : scope.nftCollectionAddresses.size > 0
          ? inArray(nfts.address, [...scope.nftCollectionAddresses])
          : null;
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
    scope.profileAddresses.size === 0
      ? Promise.resolve([])
      : tx
          .select()
          .from(universalProfiles)
          .where(
            and(
              eq(universalProfiles.chainId, chainId),
              inArray(universalProfiles.address, [...scope.profileAddresses]),
            ),
          ),
    scope.assetAddresses.size === 0
      ? Promise.resolve([])
      : tx
          .select()
          .from(digitalAssets)
          .where(
            and(
              eq(digitalAssets.chainId, chainId),
              inArray(digitalAssets.address, [...scope.assetAddresses]),
            ),
          ),
    nftCondition == null
      ? Promise.resolve([])
      : tx
          .select()
          .from(nfts)
          .where(and(eq(nfts.chainId, chainId), nftCondition)),
    scope.ownedAssetIds.size === 0
      ? Promise.resolve([])
      : tx
          .select()
          .from(ownedAssets)
          .where(
            and(
              eq(ownedAssets.chainId, chainId),
              inArray(ownedAssets.id, [...scope.ownedAssetIds]),
            ),
          ),
    scope.ownedTokenIds.size === 0
      ? Promise.resolve([])
      : tx
          .select()
          .from(ownedTokens)
          .where(
            and(
              eq(ownedTokens.chainId, chainId),
              inArray(ownedTokens.id, [...scope.ownedTokenIds]),
            ),
          ),
    scope.followerEdgeIds.size === 0
      ? Promise.resolve([])
      : tx
          .select()
          .from(followerEdges)
          .where(
            and(
              eq(followerEdges.chainId, chainId),
              inArray(followerEdges.id, [...scope.followerEdgeIds]),
            ),
          ),
    scope.creatorAssets.size === 0
      ? Promise.resolve([])
      : tx
          .select()
          .from(creators)
          .where(
            and(
              eq(creators.chainId, chainId),
              inArray(creators.assetAddress, [...scope.creatorAssets]),
            ),
          ),
    scope.issuerProfiles.size === 0
      ? Promise.resolve([])
      : tx
          .select()
          .from(issuedAssets)
          .where(
            and(
              eq(issuedAssets.chainId, chainId),
              inArray(issuedAssets.issuerAddress, [...scope.issuerProfiles]),
            ),
          ),
    scope.controllerProfiles.size === 0
      ? Promise.resolve([])
      : tx
          .select()
          .from(controllers)
          .where(
            and(
              eq(controllers.chainId, chainId),
              inArray(controllers.profileAddress, [...scope.controllerProfiles]),
            ),
          ),
    scope.extensionIds.size === 0
      ? Promise.resolve([])
      : tx
          .select()
          .from(chillwhalesNfts)
          .where(
            and(
              eq(chillwhalesNfts.chainId, chainId),
              inArray(chillwhalesNfts.id, [...scope.extensionIds]),
            ),
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
