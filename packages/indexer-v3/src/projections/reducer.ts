import { bytesToNumber, hexToBytes, isHex } from 'viem';
import type { RuntimeConfig } from '../config/index.js';
import {
  createAddressId,
  createDataValueId,
  createDeterministicId,
  createRelationshipId,
  createTokenEntityId,
} from '../db/identity.js';
import { dataValues } from '../db/schema.js';
import type { EventFactRecord } from '../events/decode.js';
import { collectEventVerificationCandidates } from './candidates.js';
import type { ClaimStatusUpdate } from './extensions.js';
import { verificationKey, type ProjectionVerification } from './rpc.js';
import {
  CHILLWHALES_EXTENSION,
  DATA_KEYS,
  ZERO_ADDRESS,
  decodeAddressKey,
  decodeAddressValue,
  decodeArrayIndex,
  decodeArrayLength,
  decodeBoundedInteger,
  decodeCompactBytesArray,
  decodeLsp8BaseUri,
  decodeRegistryValue,
  decodeUtf8,
  deriveTokenUri,
  formatTokenId,
  isNullAddress,
} from './standards.js';
import {
  ownedTokenKey,
  pairKey,
  tokenKey,
  type ChillwhalesNftRow,
  type ControllerRow,
  type CreatorRow,
  type DigitalAssetRow,
  type FollowerEdgeRow,
  type IssuedAssetRow,
  type NftRow,
  type OwnedAssetRow,
  type OwnedTokenRow,
  type ProjectionState,
  type UniversalProfileRow,
} from './state.js';

type DataValueRow = typeof dataValues.$inferSelect;

export interface ProjectionMutations {
  universalProfiles: UniversalProfileRow[];
  digitalAssets: DigitalAssetRow[];
  nfts: NftRow[];
  ownedAssets: OwnedAssetRow[];
  ownedTokens: OwnedTokenRow[];
  followerEdges: FollowerEdgeRow[];
  creators: CreatorRow[];
  issuedAssets: IssuedAssetRow[];
  controllers: ControllerRow[];
  chillwhalesNfts: ChillwhalesNftRow[];
  dataValues: DataValueRow[];
  deletedOwnedAssetIds: string[];
  deletedOwnedTokenIds: string[];
  deletedCreatorIds: string[];
  deletedIssuedAssetIds: string[];
  deletedControllerIds: string[];
}

interface ChangeTracker {
  universalProfiles: Set<string>;
  digitalAssets: Set<string>;
  nfts: Set<string>;
  ownedAssets: Set<string>;
  ownedTokens: Set<string>;
  followerEdges: Set<string>;
  creators: Set<string>;
  issuedAssets: Set<string>;
  controllers: Set<string>;
  chillwhalesNfts: Set<string>;
  dataValues: Map<string, DataValueRow>;
  deletedOwnedAssetIds: Set<string>;
  deletedOwnedTokenIds: Set<string>;
  deletedCreatorIds: Set<string>;
  deletedIssuedAssetIds: Set<string>;
  deletedControllerIds: Set<string>;
}

interface ReducerContext {
  runtime: RuntimeConfig;
  state: ProjectionState;
  changes: ChangeTracker;
  verifications: Map<string, ProjectionVerification>;
}

interface Provenance {
  lastBlockNumber: number;
  lastBlockHash: string;
  lastTransactionHash: string;
  lastTransactionIndex: number;
  lastLogIndex: number;
}

function createChangeTracker(): ChangeTracker {
  return {
    universalProfiles: new Set(),
    digitalAssets: new Set(),
    nfts: new Set(),
    ownedAssets: new Set(),
    ownedTokens: new Set(),
    followerEdges: new Set(),
    creators: new Set(),
    issuedAssets: new Set(),
    controllers: new Set(),
    chillwhalesNfts: new Set(),
    dataValues: new Map(),
    deletedOwnedAssetIds: new Set(),
    deletedOwnedTokenIds: new Set(),
    deletedCreatorIds: new Set(),
    deletedIssuedAssetIds: new Set(),
    deletedControllerIds: new Set(),
  };
}

function provenance(event: EventFactRecord): Provenance {
  return {
    lastBlockNumber: event.blockNumber,
    lastBlockHash: event.blockHash,
    lastTransactionHash: event.transactionHash,
    lastTransactionIndex: event.transactionIndex,
    lastLogIndex: event.logIndex,
  };
}

function readString(event: EventFactRecord, key: string): string | null {
  const value = event.decoded?.[key];
  return typeof value === 'string' ? value : null;
}

function readUnsigned(value: string | null): bigint | null {
  if (value == null || !/^(0|[1-9][0-9]*)$/.test(value)) return null;
  return BigInt(value);
}

function hasExtension(runtime: RuntimeConfig, name: string): boolean {
  return runtime.network.extensions.includes(name);
}

function ensureCoreCandidates(context: ReducerContext, event: EventFactRecord): void {
  for (const candidate of collectEventVerificationCandidates(event)) {
    const verification = context.verifications.get(
      verificationKey(candidate.blockNumber, candidate.category, candidate.address),
    );
    if (verification?.status !== 'verified') continue;

    if (candidate.category === 'universalProfile') {
      const existing = context.state.universalProfiles.get(candidate.address);
      if (existing == null) {
        context.state.universalProfiles.set(candidate.address, {
          id: createAddressId('profile', context.runtime.network.chainId, candidate.address),
          network: context.runtime.network.key,
          chainId: context.runtime.network.chainId,
          address: candidate.address,
          ownerAddress: null,
          verification: 'verified',
          ...provenance(event),
        });
        context.changes.universalProfiles.add(candidate.address);
      } else if (existing.verification !== 'verified') {
        context.state.universalProfiles.set(candidate.address, {
          ...existing,
          verification: 'verified',
        });
        context.changes.universalProfiles.add(candidate.address);
      }
    } else {
      const existing = context.state.digitalAssets.get(candidate.address);
      if (existing == null) {
        context.state.digitalAssets.set(candidate.address, {
          id: createAddressId('digital-asset', context.runtime.network.chainId, candidate.address),
          network: context.runtime.network.key,
          chainId: context.runtime.network.chainId,
          address: candidate.address,
          ownerAddress: null,
          standard: verification.standard ?? 'unknown',
          tokenType: null,
          name: null,
          symbol: null,
          decimals: verification.decimals,
          totalSupply: null,
          tokenIdFormat: null,
          tokenIdReferenceContract: null,
          baseUri: null,
          verification: 'verified',
          ...provenance(event),
        });
        context.changes.digitalAssets.add(candidate.address);
      } else if (
        existing.verification !== 'verified' ||
        (existing.standard === 'unknown' && verification.standard != null) ||
        (existing.decimals == null && verification.decimals != null)
      ) {
        context.state.digitalAssets.set(candidate.address, {
          ...existing,
          verification: 'verified',
          standard:
            existing.standard === 'unknown'
              ? (verification.standard ?? 'unknown')
              : existing.standard,
          decimals: existing.decimals ?? verification.decimals,
        });
        context.changes.digitalAssets.add(candidate.address);
      }
    }
  }
}

function setProfileOwner(
  context: ReducerContext,
  event: EventFactRecord,
  ownerAddress: string,
): void {
  const existing = context.state.universalProfiles.get(event.address);
  if (existing == null) return;
  context.state.universalProfiles.set(event.address, {
    ...existing,
    ownerAddress,
    ...provenance(event),
  });
  context.changes.universalProfiles.add(event.address);
}

function updateAsset(
  context: ReducerContext,
  event: EventFactRecord,
  updates: Partial<DigitalAssetRow>,
): void {
  const existing = context.state.digitalAssets.get(event.address);
  if (existing == null) return;
  context.state.digitalAssets.set(event.address, {
    ...existing,
    ...updates,
    ...provenance(event),
  });
  context.changes.digitalAssets.add(event.address);
}

function persistDataValue(context: ReducerContext, event: EventFactRecord): void {
  if (event.eventName !== 'DataChanged' && event.eventName !== 'TokenIdDataChanged') return;
  const dataKey = readString(event, 'dataKey');
  const dataValue = readString(event, 'dataValue');
  const tokenId = event.eventName === 'TokenIdDataChanged' ? readString(event, 'tokenId') : null;
  if (
    dataKey == null ||
    dataValue == null ||
    (event.eventName === 'TokenIdDataChanged' && tokenId == null)
  ) {
    return;
  }
  const id = createDataValueId(
    context.runtime.network.chainId,
    event.address,
    dataKey,
    tokenId ?? undefined,
  );
  context.changes.dataValues.set(id, {
    id,
    network: context.runtime.network.key,
    chainId: context.runtime.network.chainId,
    address: event.address,
    tokenId,
    dataKey,
    dataValue,
    ...provenance(event),
  });
}

function reformatNfts(context: ReducerContext, address: string): void {
  const asset = context.state.digitalAssets.get(address);
  if (asset == null) return;
  for (const [key, nft] of context.state.nfts) {
    if (nft.address !== address) continue;
    const formattedTokenId = formatTokenId(nft.tokenId, asset.tokenIdFormat);
    const tokenUri = deriveTokenUri(asset.baseUri, formattedTokenId ?? nft.tokenId);
    context.state.nfts.set(key, { ...nft, formattedTokenId, tokenUri });
    context.changes.nfts.add(key);
  }
}

function reduceAssetScalar(context: ReducerContext, event: EventFactRecord): void {
  const dataKey = readString(event, 'dataKey');
  const dataValue = readString(event, 'dataValue');
  if (dataKey == null || dataValue == null) return;

  if (dataKey === DATA_KEYS.lsp4TokenName) {
    updateAsset(context, event, { name: decodeUtf8(dataValue) });
  } else if (dataKey === DATA_KEYS.lsp4TokenSymbol) {
    updateAsset(context, event, { symbol: decodeUtf8(dataValue) });
  } else if (dataKey === DATA_KEYS.lsp4TokenType) {
    updateAsset(context, event, { tokenType: decodeBoundedInteger(dataValue, 2) });
  } else if (dataKey === DATA_KEYS.lsp8TokenIdFormat) {
    const decoded = decodeBoundedInteger(dataValue, 104);
    const tokenIdFormat =
      decoded != null && [0, 1, 2, 3, 4, 100, 101, 102, 103, 104].includes(decoded)
        ? decoded
        : null;
    updateAsset(context, event, { tokenIdFormat });
    reformatNfts(context, event.address);
  } else if (dataKey === DATA_KEYS.lsp8ReferenceContract) {
    updateAsset(context, event, { tokenIdReferenceContract: decodeAddressValue(dataValue) });
  } else if (dataKey === DATA_KEYS.lsp8MetadataBaseUri) {
    updateAsset(context, event, { baseUri: decodeLsp8BaseUri(dataValue) });
    reformatNfts(context, event.address);
  }
}

function deleteCreator(context: ReducerContext, key: string): void {
  const row = context.state.creators.get(key);
  if (row == null) return;
  context.state.creators.delete(key);
  context.changes.creators.delete(key);
  context.changes.deletedCreatorIds.add(row.id);
}

function deleteCreatorsAtOrAfter(
  context: ReducerContext,
  assetAddress: string,
  minimumIndex: number,
): void {
  for (const [key, row] of context.state.creators) {
    if (row.assetAddress === assetAddress && row.arrayIndex >= minimumIndex)
      deleteCreator(context, key);
  }
}

function deleteCreatorAtIndex(
  context: ReducerContext,
  assetAddress: string,
  arrayIndex: number,
  exceptAddress?: string,
): void {
  for (const [key, row] of context.state.creators) {
    if (
      row.assetAddress === assetAddress &&
      row.arrayIndex === arrayIndex &&
      row.creatorAddress !== exceptAddress
    ) {
      deleteCreator(context, key);
    }
  }
}

function upsertCreator(
  context: ReducerContext,
  event: EventFactRecord,
  creatorAddress: string,
  arrayIndex: number,
  interfaceId: string | null,
): void {
  if (!context.state.digitalAssets.has(event.address)) return;
  deleteCreatorAtIndex(context, event.address, arrayIndex, creatorAddress);
  const key = pairKey(event.address, creatorAddress);
  const existing = context.state.creators.get(key);
  context.state.creators.set(key, {
    id:
      existing?.id ??
      createRelationshipId('creator', context.runtime.network.chainId, [
        event.address,
        creatorAddress,
      ]),
    network: context.runtime.network.key,
    chainId: context.runtime.network.chainId,
    assetAddress: event.address,
    creatorAddress,
    arrayIndex,
    interfaceId: interfaceId ?? existing?.interfaceId ?? null,
    verified: context.state.universalProfiles.has(creatorAddress),
    ...provenance(event),
  });
  context.changes.deletedCreatorIds.delete(existing?.id ?? '');
  context.changes.creators.add(key);
}

function reduceCreators(context: ReducerContext, event: EventFactRecord): void {
  if (!context.state.digitalAssets.has(event.address)) return;
  const dataKey = readString(event, 'dataKey');
  const dataValue = readString(event, 'dataValue');
  if (dataKey == null || dataValue == null) return;

  if (dataKey === DATA_KEYS.lsp4CreatorsLength) {
    const length = decodeArrayLength(dataValue);
    if (length != null) deleteCreatorsAtOrAfter(context, event.address, length);
  } else if (dataKey.startsWith(DATA_KEYS.lsp4CreatorsIndex)) {
    const arrayIndex = decodeArrayIndex(dataKey);
    if (arrayIndex == null) return;
    const creatorAddress = decodeAddressValue(dataValue);
    if (creatorAddress == null) deleteCreatorAtIndex(context, event.address, arrayIndex);
    else upsertCreator(context, event, creatorAddress, arrayIndex, null);
  } else if (dataKey.startsWith(DATA_KEYS.lsp4CreatorsMap)) {
    const creatorAddress = decodeAddressKey(dataKey);
    if (creatorAddress == null) return;
    const registry = decodeRegistryValue(dataValue);
    if (registry == null) deleteCreator(context, pairKey(event.address, creatorAddress));
    else {
      upsertCreator(context, event, creatorAddress, registry.arrayIndex, registry.interfaceId);
    }
  }
}

function deleteIssuedAsset(context: ReducerContext, key: string): void {
  const row = context.state.issuedAssets.get(key);
  if (row == null) return;
  context.state.issuedAssets.delete(key);
  context.changes.issuedAssets.delete(key);
  context.changes.deletedIssuedAssetIds.add(row.id);
}

function deleteIssuedAtOrAfter(
  context: ReducerContext,
  issuerAddress: string,
  minimumIndex: number,
): void {
  for (const [key, row] of context.state.issuedAssets) {
    if (row.issuerAddress === issuerAddress && row.arrayIndex >= minimumIndex) {
      deleteIssuedAsset(context, key);
    }
  }
}

function deleteIssuedAtIndex(
  context: ReducerContext,
  issuerAddress: string,
  arrayIndex: number,
  exceptAddress?: string,
): void {
  for (const [key, row] of context.state.issuedAssets) {
    if (
      row.issuerAddress === issuerAddress &&
      row.arrayIndex === arrayIndex &&
      row.assetAddress !== exceptAddress
    ) {
      deleteIssuedAsset(context, key);
    }
  }
}

function upsertIssuedAsset(
  context: ReducerContext,
  event: EventFactRecord,
  assetAddress: string,
  arrayIndex: number,
  interfaceId: string | null,
): void {
  deleteIssuedAtIndex(context, event.address, arrayIndex, assetAddress);
  if (
    !context.state.universalProfiles.has(event.address) ||
    !context.state.digitalAssets.has(assetAddress)
  ) {
    return;
  }
  const key = pairKey(event.address, assetAddress);
  const existing = context.state.issuedAssets.get(key);
  context.state.issuedAssets.set(key, {
    id:
      existing?.id ??
      createRelationshipId('issued-asset', context.runtime.network.chainId, [
        event.address,
        assetAddress,
      ]),
    network: context.runtime.network.key,
    chainId: context.runtime.network.chainId,
    issuerAddress: event.address,
    assetAddress,
    arrayIndex,
    interfaceId: interfaceId ?? existing?.interfaceId ?? null,
    ...provenance(event),
  });
  context.changes.deletedIssuedAssetIds.delete(existing?.id ?? '');
  context.changes.issuedAssets.add(key);
}

function reduceIssuedAssets(context: ReducerContext, event: EventFactRecord): void {
  if (!context.state.universalProfiles.has(event.address)) return;
  const dataKey = readString(event, 'dataKey');
  const dataValue = readString(event, 'dataValue');
  if (dataKey == null || dataValue == null) return;

  if (dataKey === DATA_KEYS.lsp12IssuedAssetsLength) {
    const length = decodeArrayLength(dataValue);
    if (length != null) deleteIssuedAtOrAfter(context, event.address, length);
  } else if (dataKey.startsWith(DATA_KEYS.lsp12IssuedAssetsIndex)) {
    const arrayIndex = decodeArrayIndex(dataKey);
    if (arrayIndex == null) return;
    const assetAddress = decodeAddressValue(dataValue);
    if (assetAddress == null) deleteIssuedAtIndex(context, event.address, arrayIndex);
    else upsertIssuedAsset(context, event, assetAddress, arrayIndex, null);
  } else if (dataKey.startsWith(DATA_KEYS.lsp12IssuedAssetsMap)) {
    const assetAddress = decodeAddressKey(dataKey);
    if (assetAddress == null) return;
    const registry = decodeRegistryValue(dataValue);
    if (registry == null) deleteIssuedAsset(context, pairKey(event.address, assetAddress));
    else {
      upsertIssuedAsset(context, event, assetAddress, registry.arrayIndex, registry.interfaceId);
    }
  }
}

function deleteController(context: ReducerContext, key: string): void {
  const row = context.state.controllers.get(key);
  if (row == null) return;
  context.state.controllers.delete(key);
  context.changes.controllers.delete(key);
  context.changes.deletedControllerIds.add(row.id);
}

function deleteControllersAtOrAfter(
  context: ReducerContext,
  profileAddress: string,
  minimumIndex: number,
): void {
  for (const [key, row] of context.state.controllers) {
    if (
      row.profileAddress === profileAddress &&
      row.arrayIndex != null &&
      row.arrayIndex >= minimumIndex
    ) {
      deleteController(context, key);
    }
  }
}

function deleteControllerAtIndex(
  context: ReducerContext,
  profileAddress: string,
  arrayIndex: number,
  exceptAddress?: string,
): void {
  for (const [key, row] of context.state.controllers) {
    if (
      row.profileAddress === profileAddress &&
      row.arrayIndex === arrayIndex &&
      row.controllerAddress !== exceptAddress
    ) {
      deleteController(context, key);
    }
  }
}

function upsertController(
  context: ReducerContext,
  event: EventFactRecord,
  controllerAddress: string,
  updates: Partial<
    Pick<ControllerRow, 'arrayIndex' | 'permissions' | 'allowedCalls' | 'allowedDataKeys'>
  >,
): void {
  if (!context.state.universalProfiles.has(event.address)) return;
  const key = pairKey(event.address, controllerAddress);
  const existing = context.state.controllers.get(key);
  context.state.controllers.set(key, {
    id:
      existing?.id ??
      createRelationshipId('controller', context.runtime.network.chainId, [
        event.address,
        controllerAddress,
      ]),
    network: context.runtime.network.key,
    chainId: context.runtime.network.chainId,
    profileAddress: event.address,
    controllerAddress,
    arrayIndex: existing?.arrayIndex ?? null,
    permissions: existing?.permissions ?? null,
    allowedCalls: existing?.allowedCalls ?? null,
    allowedDataKeys: existing?.allowedDataKeys ?? null,
    ...updates,
    ...provenance(event),
  });
  context.changes.deletedControllerIds.delete(existing?.id ?? '');
  context.changes.controllers.add(key);
}

function reduceControllers(context: ReducerContext, event: EventFactRecord): void {
  if (!context.state.universalProfiles.has(event.address)) return;
  const dataKey = readString(event, 'dataKey');
  const dataValue = readString(event, 'dataValue');
  if (dataKey == null || dataValue == null) return;

  if (dataKey === DATA_KEYS.lsp6ControllersLength) {
    const length = decodeArrayLength(dataValue);
    if (length != null) deleteControllersAtOrAfter(context, event.address, length);
  } else if (dataKey.startsWith(DATA_KEYS.lsp6ControllersIndex)) {
    const arrayIndex = decodeArrayIndex(dataKey);
    if (arrayIndex == null) return;
    const controllerAddress = decodeAddressValue(dataValue);
    if (controllerAddress == null) {
      deleteControllerAtIndex(context, event.address, arrayIndex);
    } else {
      deleteControllerAtIndex(context, event.address, arrayIndex, controllerAddress);
      upsertController(context, event, controllerAddress, { arrayIndex });
    }
  } else if (dataKey.startsWith(DATA_KEYS.lsp6Permissions)) {
    const controllerAddress = decodeAddressKey(dataKey);
    if (controllerAddress == null) return;
    const permissions = isHex(dataValue) && hexToBytes(dataValue).length === 32 ? dataValue : null;
    upsertController(context, event, controllerAddress, { permissions });
  } else if (dataKey.startsWith(DATA_KEYS.lsp6AllowedCalls)) {
    const controllerAddress = decodeAddressKey(dataKey);
    if (controllerAddress == null) return;
    const decoded = decodeCompactBytesArray(dataValue);
    const allowedCalls =
      decoded != null && decoded.every((entry) => isHex(entry) && hexToBytes(entry).length === 32)
        ? decoded
        : null;
    upsertController(context, event, controllerAddress, { allowedCalls });
  } else if (dataKey.startsWith(DATA_KEYS.lsp6AllowedDataKeys)) {
    const controllerAddress = decodeAddressKey(dataKey);
    if (controllerAddress == null) return;
    upsertController(context, event, controllerAddress, {
      allowedDataKeys: decodeCompactBytesArray(dataValue),
    });
  }
}

function reduceDataChanged(context: ReducerContext, event: EventFactRecord): void {
  persistDataValue(context, event);
  reduceAssetScalar(context, event);
  reduceCreators(context, event);
  reduceIssuedAssets(context, event);
  reduceControllers(context, event);
}

function deleteOwnedAsset(context: ReducerContext, key: string): void {
  const row = context.state.ownedAssets.get(key);
  if (row == null) return;
  context.state.ownedAssets.delete(key);
  context.changes.ownedAssets.delete(key);
  context.changes.deletedOwnedAssetIds.add(row.id);
}

function subtractOwnedAsset(
  context: ReducerContext,
  event: EventFactRecord,
  ownerAddress: string,
  amount: bigint,
): void {
  const key = pairKey(ownerAddress, event.address);
  const existing = context.state.ownedAssets.get(key);
  if (existing == null) return;
  const balance = BigInt(existing.balance);
  if (balance <= amount) {
    deleteOwnedAsset(context, key);
  } else {
    context.state.ownedAssets.set(key, {
      ...existing,
      balance: (balance - amount).toString(),
      ...provenance(event),
    });
    context.changes.ownedAssets.add(key);
  }
}

function addOwnedAsset(
  context: ReducerContext,
  event: EventFactRecord,
  ownerAddress: string,
  amount: bigint,
): void {
  if (
    amount === 0n ||
    !context.state.universalProfiles.has(ownerAddress) ||
    !context.state.digitalAssets.has(event.address)
  ) {
    return;
  }
  const key = pairKey(ownerAddress, event.address);
  const existing = context.state.ownedAssets.get(key);
  context.state.ownedAssets.set(key, {
    id:
      existing?.id ??
      createRelationshipId('owned-asset', context.runtime.network.chainId, [
        ownerAddress,
        event.address,
      ]),
    network: context.runtime.network.key,
    chainId: context.runtime.network.chainId,
    ownerAddress,
    assetAddress: event.address,
    balance: ((existing == null ? 0n : BigInt(existing.balance)) + amount).toString(),
    ...provenance(event),
  });
  context.changes.deletedOwnedAssetIds.delete(existing?.id ?? '');
  context.changes.ownedAssets.add(key);
}

function deleteOwnedToken(
  context: ReducerContext,
  ownerAddress: string,
  assetAddress: string,
  tokenId: string,
): void {
  const key = ownedTokenKey(ownerAddress, assetAddress, tokenId);
  const row = context.state.ownedTokens.get(key);
  if (row == null) return;
  context.state.ownedTokens.delete(key);
  context.changes.ownedTokens.delete(key);
  context.changes.deletedOwnedTokenIds.add(row.id);
}

function addOwnedToken(
  context: ReducerContext,
  event: EventFactRecord,
  ownerAddress: string,
  tokenId: string,
): void {
  if (
    !context.state.universalProfiles.has(ownerAddress) ||
    !context.state.nfts.has(tokenKey(event.address, tokenId))
  ) {
    return;
  }
  const key = ownedTokenKey(ownerAddress, event.address, tokenId);
  const existing = context.state.ownedTokens.get(key);
  context.state.ownedTokens.set(key, {
    id:
      existing?.id ??
      createDeterministicId('owned-token', context.runtime.network.chainId, [
        ownerAddress,
        event.address,
        tokenId,
      ]),
    network: context.runtime.network.key,
    chainId: context.runtime.network.chainId,
    ownerAddress,
    assetAddress: event.address,
    tokenId,
    balance: '1',
    ...provenance(event),
  });
  context.changes.deletedOwnedTokenIds.delete(existing?.id ?? '');
  context.changes.ownedTokens.add(key);
}

function upsertNft(
  context: ReducerContext,
  event: EventFactRecord,
  tokenId: string,
  ownerAddress?: string | null,
): void {
  const asset = context.state.digitalAssets.get(event.address);
  if (asset == null || asset.standard !== 'lsp8') return;
  const key = tokenKey(event.address, tokenId);
  const existing = context.state.nfts.get(key);
  const from = readString(event, 'from');
  const to = readString(event, 'to');
  const minted = from === ZERO_ADDRESS;
  const burned = !minted && to === ZERO_ADDRESS;
  const formattedTokenId =
    existing?.formattedTokenId ?? formatTokenId(tokenId, asset.tokenIdFormat);
  context.state.nfts.set(key, {
    id:
      existing?.id ?? createTokenEntityId(context.runtime.network.chainId, event.address, tokenId),
    network: context.runtime.network.key,
    chainId: context.runtime.network.chainId,
    address: event.address,
    tokenId,
    formattedTokenId,
    isMinted: minted ? true : burned ? false : (existing?.isMinted ?? false),
    isBurned: minted ? false : burned ? true : (existing?.isBurned ?? false),
    ownerAddress: ownerAddress === undefined ? (existing?.ownerAddress ?? null) : ownerAddress,
    tokenUri: deriveTokenUri(asset.baseUri, formattedTokenId ?? tokenId),
    verification: 'verified',
    ...provenance(event),
  });
  context.changes.nfts.add(key);
}

function upsertChillwhalesExtension(
  context: ReducerContext,
  event: EventFactRecord,
  tokenId: string,
  updates: Partial<
    Pick<ChillwhalesNftRow, 'chillClaimed' | 'orbsClaimed' | 'level' | 'cooldownExpiry' | 'faction'>
  >,
): void {
  if (!hasExtension(context.runtime, 'chillwhales')) return;
  const key = tokenKey(event.address, tokenId);
  if (!context.state.nfts.has(key)) return;
  const existing = context.state.chillwhalesNfts.get(key);
  context.state.chillwhalesNfts.set(key, {
    id:
      existing?.id ??
      createDeterministicId('chillwhales-nft', context.runtime.network.chainId, [
        event.address,
        tokenId,
      ]),
    network: context.runtime.network.key,
    chainId: context.runtime.network.chainId,
    address: event.address,
    tokenId,
    chillClaimed: existing?.chillClaimed ?? false,
    orbsClaimed: existing?.orbsClaimed ?? false,
    level: existing?.level ?? null,
    cooldownExpiry: existing?.cooldownExpiry ?? null,
    faction: existing?.faction ?? null,
    ...updates,
    ...provenance(event),
  });
  context.changes.chillwhalesNfts.add(key);
}

function reduceTransfer(context: ReducerContext, event: EventFactRecord): void {
  const from = readString(event, 'from');
  const to = readString(event, 'to');
  const amount = readUnsigned(readString(event, 'amount'));
  if (
    from == null ||
    to == null ||
    amount == null ||
    !context.state.digitalAssets.has(event.address)
  ) {
    return;
  }

  const asset = context.state.digitalAssets.get(event.address);
  if (asset == null) return;
  if (from === ZERO_ADDRESS || to === ZERO_ADDRESS) {
    const currentSupply = asset.totalSupply == null ? 0n : BigInt(asset.totalSupply);
    const withMint = from === ZERO_ADDRESS ? currentSupply + amount : currentSupply;
    const totalSupply =
      to === ZERO_ADDRESS && withMint > amount
        ? withMint - amount
        : to === ZERO_ADDRESS
          ? 0n
          : withMint;
    updateAsset(context, event, { totalSupply: totalSupply.toString() });
  }

  if (!isNullAddress(from)) subtractOwnedAsset(context, event, from, amount);
  if (!isNullAddress(to)) addOwnedAsset(context, event, to, amount);

  if (event.eventDomain !== 'lsp8') return;
  const tokenId = readString(event, 'tokenId');
  if (tokenId == null) return;
  upsertNft(context, event, tokenId, to === ZERO_ADDRESS ? null : to);
  if (!isNullAddress(from)) deleteOwnedToken(context, from, event.address, tokenId);
  if (!isNullAddress(to)) addOwnedToken(context, event, to, tokenId);

  if (from === ZERO_ADDRESS && event.address === CHILLWHALES_EXTENSION.collectionAddress) {
    upsertChillwhalesExtension(context, event, tokenId, {
      chillClaimed: false,
      orbsClaimed: false,
    });
  } else if (from === ZERO_ADDRESS && event.address === CHILLWHALES_EXTENSION.orbsAddress) {
    upsertChillwhalesExtension(context, event, tokenId, {
      level: 0,
      cooldownExpiry: 0,
      faction: 'Neutral',
    });
  }
}

function reduceTokenIdDataChanged(context: ReducerContext, event: EventFactRecord): void {
  persistDataValue(context, event);
  const tokenId = readString(event, 'tokenId');
  const dataKey = readString(event, 'dataKey');
  const dataValue = readString(event, 'dataValue');
  if (tokenId == null || dataKey == null || dataValue == null) return;
  upsertNft(context, event, tokenId);

  if (
    !hasExtension(context.runtime, 'chillwhales') ||
    event.address !== CHILLWHALES_EXTENSION.orbsAddress
  ) {
    return;
  }
  if (dataKey === CHILLWHALES_EXTENSION.orbLevelKey && isHex(dataValue)) {
    const bytes = hexToBytes(dataValue);
    if (bytes.length >= 8) {
      upsertChillwhalesExtension(context, event, tokenId, {
        level: bytesToNumber(bytes.slice(0, 4)),
        cooldownExpiry: bytesToNumber(bytes.slice(4, 8)),
      });
    }
  } else if (dataKey === CHILLWHALES_EXTENSION.orbFactionKey) {
    upsertChillwhalesExtension(context, event, tokenId, { faction: decodeUtf8(dataValue) });
  }
}

function reduceOwnershipTransferred(context: ReducerContext, event: EventFactRecord): void {
  const ownerAddress = readString(event, 'newOwner');
  if (ownerAddress == null) return;
  setProfileOwner(context, event, ownerAddress);
  updateAsset(context, event, { ownerAddress });
}

function reduceFollower(context: ReducerContext, event: EventFactRecord): void {
  const followerAddress = readString(event, 'followerAddress');
  const followedAddress = readString(
    event,
    event.eventName === 'Follow' ? 'followedAddress' : 'unfollowedAddress',
  );
  if (
    followerAddress == null ||
    followedAddress == null ||
    followerAddress === followedAddress ||
    !context.state.universalProfiles.has(followerAddress) ||
    !context.state.universalProfiles.has(followedAddress)
  ) {
    return;
  }
  const key = pairKey(followerAddress, followedAddress);
  const existing = context.state.followerEdges.get(key);
  const isFollowing = event.eventName === 'Follow';
  context.state.followerEdges.set(key, {
    id:
      existing?.id ??
      createRelationshipId('follower', context.runtime.network.chainId, [
        followerAddress,
        followedAddress,
      ]),
    network: context.runtime.network.key,
    chainId: context.runtime.network.chainId,
    followerAddress,
    followedAddress,
    isFollowing,
    followedAt: isFollowing ? event.blockTimestamp : (existing?.followedAt ?? null),
    unfollowedAt: isFollowing ? null : event.blockTimestamp,
    ...provenance(event),
  });
  context.changes.followerEdges.add(key);
}

function applyClaimStatusUpdate(context: ReducerContext, update: ClaimStatusUpdate): void {
  const key = tokenKey(update.address, update.tokenId);
  const existing = context.state.chillwhalesNfts.get(key);
  if (existing == null) return;
  context.state.chillwhalesNfts.set(key, {
    ...existing,
    chillClaimed: existing.chillClaimed || update.chillClaimed,
    orbsClaimed: existing.orbsClaimed || update.orbsClaimed,
    lastBlockNumber: update.blockNumber,
    lastBlockHash: update.blockHash,
    lastTransactionHash: null,
    lastTransactionIndex: null,
    lastLogIndex: null,
  });
  context.changes.chillwhalesNfts.add(key);
}

function compareEvents(left: EventFactRecord, right: EventFactRecord): number {
  return (
    left.blockNumber - right.blockNumber ||
    left.transactionIndex - right.transactionIndex ||
    left.logIndex - right.logIndex
  );
}

function changedRows<T>(keys: Set<string>, rows: Map<string, T>): T[] {
  return [...keys].flatMap((key) => {
    const row = rows.get(key);
    return row == null ? [] : [row];
  });
}

/** Reduce only newly inserted facts into current state in canonical chain order. */
export function reduceProjectionEvents(
  runtime: RuntimeConfig,
  state: ProjectionState,
  events: readonly EventFactRecord[],
  verifications: readonly ProjectionVerification[],
  claimStatusUpdates: readonly ClaimStatusUpdate[] = [],
): ProjectionMutations {
  const changes = createChangeTracker();
  const context: ReducerContext = {
    runtime,
    state,
    changes,
    verifications: new Map(
      verifications.map((verification) => [
        verificationKey(verification.blockNumber, verification.category, verification.address),
        verification,
      ]),
    ),
  };

  for (const event of [...events].sort(compareEvents)) {
    if (event.decoded == null) continue;
    ensureCoreCandidates(context, event);
    switch (event.eventName) {
      case 'DataChanged':
        reduceDataChanged(context, event);
        break;
      case 'Transfer':
        reduceTransfer(context, event);
        break;
      case 'TokenIdDataChanged':
        reduceTokenIdDataChanged(context, event);
        break;
      case 'OwnershipTransferred':
        reduceOwnershipTransferred(context, event);
        break;
      case 'Follow':
      case 'Unfollow':
        reduceFollower(context, event);
        break;
    }
  }
  for (const update of claimStatusUpdates) applyClaimStatusUpdate(context, update);

  return {
    universalProfiles: changedRows(changes.universalProfiles, state.universalProfiles),
    digitalAssets: changedRows(changes.digitalAssets, state.digitalAssets),
    nfts: changedRows(changes.nfts, state.nfts),
    ownedAssets: changedRows(changes.ownedAssets, state.ownedAssets),
    ownedTokens: changedRows(changes.ownedTokens, state.ownedTokens),
    followerEdges: changedRows(changes.followerEdges, state.followerEdges),
    creators: changedRows(changes.creators, state.creators),
    issuedAssets: changedRows(changes.issuedAssets, state.issuedAssets),
    controllers: changedRows(changes.controllers, state.controllers),
    chillwhalesNfts: changedRows(changes.chillwhalesNfts, state.chillwhalesNfts),
    dataValues: [...changes.dataValues.values()],
    deletedOwnedAssetIds: [...changes.deletedOwnedAssetIds],
    deletedOwnedTokenIds: [...changes.deletedOwnedTokenIds],
    deletedCreatorIds: [...changes.deletedCreatorIds],
    deletedIssuedAssetIds: [...changes.deletedIssuedAssetIds],
    deletedControllerIds: [...changes.deletedControllerIds],
  };
}
