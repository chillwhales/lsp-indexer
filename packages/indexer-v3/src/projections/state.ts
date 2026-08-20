import { and, eq, inArray } from 'drizzle-orm';
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
import { CHILLWHALES_EXTENSION, DATA_KEYS } from './standards.js';

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
  nftAssetAddresses: Set<string>;
  balanceOwners: Set<string>;
  balanceAssets: Set<string>;
  followerAddresses: Set<string>;
  creatorAssets: Set<string>;
  issuerProfiles: Set<string>;
  controllerProfiles: Set<string>;
  extensionAssets: Set<string>;
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

function createProjectionScope(events: readonly EventFactRecord[]): ProjectionScope {
  const scope: ProjectionScope = {
    profileAddresses: new Set(),
    assetAddresses: new Set(),
    nftAssetAddresses: new Set(),
    balanceOwners: new Set(),
    balanceAssets: new Set(),
    followerAddresses: new Set(),
    creatorAssets: new Set(),
    issuerProfiles: new Set(),
    controllerProfiles: new Set(),
    extensionAssets: new Set(),
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
      scope.balanceAssets.add(event.address);
      for (const key of ['from', 'to']) {
        const address = readString(event, key);
        if (address != null) scope.balanceOwners.add(address);
      }
      if (event.eventDomain === 'lsp8') {
        scope.nftAssetAddresses.add(event.address);
        if (
          event.address === CHILLWHALES_EXTENSION.collectionAddress ||
          event.address === CHILLWHALES_EXTENSION.orbsAddress
        ) {
          scope.extensionAssets.add(event.address);
        }
      }
    } else if (event.eventName === 'TokenIdDataChanged') {
      scope.nftAssetAddresses.add(event.address);
      if (event.address === CHILLWHALES_EXTENSION.orbsAddress) {
        scope.extensionAssets.add(event.address);
      }
    } else if (event.eventName === 'Follow') {
      const follower = readString(event, 'followerAddress');
      const followed = readString(event, 'followedAddress');
      if (follower != null) scope.followerAddresses.add(follower);
      if (followed != null) scope.followerAddresses.add(followed);
    } else if (event.eventName === 'Unfollow') {
      const follower = readString(event, 'followerAddress');
      const followed = readString(event, 'unfollowedAddress');
      if (follower != null) scope.followerAddresses.add(follower);
      if (followed != null) scope.followerAddresses.add(followed);
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
        scope.nftAssetAddresses.add(event.address);
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
  const scope = createProjectionScope(events);
  for (const update of claimStatusUpdates) scope.extensionAssets.add(update.address);
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
    scope.nftAssetAddresses.size === 0
      ? Promise.resolve([])
      : tx
          .select()
          .from(nfts)
          .where(
            and(eq(nfts.chainId, chainId), inArray(nfts.address, [...scope.nftAssetAddresses])),
          ),
    scope.balanceOwners.size === 0 || scope.balanceAssets.size === 0
      ? Promise.resolve([])
      : tx
          .select()
          .from(ownedAssets)
          .where(
            and(
              eq(ownedAssets.chainId, chainId),
              inArray(ownedAssets.ownerAddress, [...scope.balanceOwners]),
              inArray(ownedAssets.assetAddress, [...scope.balanceAssets]),
            ),
          ),
    scope.balanceOwners.size === 0 || scope.nftAssetAddresses.size === 0
      ? Promise.resolve([])
      : tx
          .select()
          .from(ownedTokens)
          .where(
            and(
              eq(ownedTokens.chainId, chainId),
              inArray(ownedTokens.ownerAddress, [...scope.balanceOwners]),
              inArray(ownedTokens.assetAddress, [...scope.nftAssetAddresses]),
            ),
          ),
    scope.followerAddresses.size === 0
      ? Promise.resolve([])
      : tx
          .select()
          .from(followerEdges)
          .where(
            and(
              eq(followerEdges.chainId, chainId),
              inArray(followerEdges.followerAddress, [...scope.followerAddresses]),
              inArray(followerEdges.followedAddress, [...scope.followerAddresses]),
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
    scope.extensionAssets.size === 0
      ? Promise.resolve([])
      : tx
          .select()
          .from(chillwhalesNfts)
          .where(
            and(
              eq(chillwhalesNfts.chainId, chainId),
              inArray(chillwhalesNfts.address, [...scope.extensionAssets]),
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
