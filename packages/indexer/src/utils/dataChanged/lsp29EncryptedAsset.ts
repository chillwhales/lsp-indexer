import { Context, ExtractParams } from '@/types';
import * as Utils from '@/utils';
import { ERC725Y } from '@chillwhales/abi';
import {
  LSP29AccessControlCondition,
  LSP29EncryptedAsset,
  LSP29EncryptedAssetChunks,
  LSP29EncryptedAssetDescription,
  LSP29EncryptedAssetEncryption,
  LSP29EncryptedAssetFile,
  LSP29EncryptedAssetTitle,
  UniversalProfile,
} from '@chillwhales/typeorm';
import { In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { bytesToBigInt, Hex, hexToBytes } from 'viem';

/**
 * LSP29 Encrypted Asset JSON Schema
 */
export interface LSP29EncryptedAssetJSON {
  LSP29EncryptedAsset: {
    version?: string;
    id?: string;
    title?: string;
    description?: string;
    revision?: number;
    createdAt?: string;
    file?: {
      type?: string;
      name?: string;
      size?: number;
      lastModified?: number;
      hash?: string;
    };
    encryption?: {
      method?: string;
      ciphertext?: string;
      dataToEncryptHash?: string;
      accessControlConditions?: AccessControlCondition[];
      decryptionCode?: string;
      decryptionParams?: Record<string, unknown>;
    };
    chunks?: {
      cids?: string[];
      iv?: string;
      totalSize?: number;
    };
  };
}

export interface AccessControlCondition {
  contractAddress?: string;
  chain?: string;
  method?: string;
  standardContractType?: string;
  comparator?: string;
  returnValueTest?: {
    comparator?: string;
    value?: string;
  };
  parameters?: string[];
  [key: string]: unknown;
}

export function extract({ block, log }: ExtractParams): LSP29EncryptedAsset {
  const timestamp = new Date(block.header.timestamp);
  const { address } = log;
  const { dataKey, dataValue } = ERC725Y.events.DataChanged.decode(log);
  const { value: url, decodeError } = Utils.decodeVerifiableUri(dataValue);

  // Extract array index from the data key (last 16 bytes)
  const dataKeyBytes = hexToBytes(dataKey as Hex);
  const arrayIndex = dataKeyBytes.length >= 32 ? bytesToBigInt(dataKeyBytes.slice(16)) : null;

  return new LSP29EncryptedAsset({
    id: `${address} - ${dataKey}`,
    address,
    timestamp,
    arrayIndex,
    url,
    rawValue: dataValue,
    decodeError,
    isDataFetched: false,
    retryCount: 0,
  });
}

export function populate({
  lsp29EncryptedAssetEntities,
  validUniversalProfiles,
}: {
  lsp29EncryptedAssetEntities: LSP29EncryptedAsset[];
  validUniversalProfiles: Map<string, UniversalProfile>;
}) {
  return lsp29EncryptedAssetEntities.map(
    (entity) =>
      new LSP29EncryptedAsset({
        ...entity,
        universalProfile: validUniversalProfiles.has(entity.address)
          ? new UniversalProfile({ id: entity.address })
          : null,
      }),
  );
}

export async function extractSubEntities(lsp29EncryptedAsset: LSP29EncryptedAsset) {
  if (!lsp29EncryptedAsset.url)
    return {
      fetchErrorMessage: 'Error: Missing URL',
      fetchErrorCode: null,
      fetchErrorStatus: null,
    };

  const data = await Utils.getDataFromURL<LSP29EncryptedAssetJSON>(lsp29EncryptedAsset.url);

  if (typeof data !== 'object')
    return {
      fetchErrorMessage: 'Error: Invalid data',
      fetchErrorCode: null,
      fetchErrorStatus: null,
    };
  if ('fetchErrorMessage' in data) return data;
  if (!data.LSP29EncryptedAsset)
    return {
      fetchErrorMessage: 'Error: Invalid LSP29EncryptedAsset',
      fetchErrorCode: null,
      fetchErrorStatus: null,
    };

  const {
    version,
    id: contentId,
    title,
    description,
    revision,
    createdAt,
    file,
    encryption,
    chunks,
  } = data.LSP29EncryptedAsset;

  // Title entity
  const lsp29EncryptedAssetTitle = new LSP29EncryptedAssetTitle({
    id: uuidv4(),
    lsp29EncryptedAsset,
    value: title,
  });

  // Description entity
  const lsp29EncryptedAssetDescription = new LSP29EncryptedAssetDescription({
    id: uuidv4(),
    lsp29EncryptedAsset,
    value: description,
  });

  // File entity
  const lsp29EncryptedAssetFile = file
    ? new LSP29EncryptedAssetFile({
        id: uuidv4(),
        lsp29EncryptedAsset,
        type: file.type,
        name: file.name,
        size: file.size !== undefined ? BigInt(file.size) : null,
        lastModified: file.lastModified !== undefined ? BigInt(file.lastModified) : null,
        hash: file.hash,
      })
    : null;

  // Encryption entity
  const lsp29EncryptedAssetEncryption = encryption
    ? new LSP29EncryptedAssetEncryption({
        id: uuidv4(),
        lsp29EncryptedAsset,
        method: encryption.method,
        ciphertext: encryption.ciphertext,
        dataToEncryptHash: encryption.dataToEncryptHash,
        decryptionCode: encryption.decryptionCode,
        decryptionParams: encryption.decryptionParams
          ? JSON.stringify(encryption.decryptionParams)
          : null,
      })
    : null;

  // Access control conditions entities
  const lsp29AccessControlConditions: LSP29AccessControlCondition[] =
    encryption?.accessControlConditions && Array.isArray(encryption.accessControlConditions)
      ? encryption.accessControlConditions.map(
          (condition, index) =>
            new LSP29AccessControlCondition({
              id: uuidv4(),
              encryption: lsp29EncryptedAssetEncryption,
              conditionIndex: index,
              contractAddress: condition.contractAddress,
              chain: condition.chain,
              method: condition.method,
              standardContractType: condition.standardContractType,
              comparator: condition.comparator || condition.returnValueTest?.comparator,
              value: condition.returnValueTest?.value,
              tokenId:
                condition.parameters && condition.parameters.length > 0
                  ? condition.parameters.find((p) => p.startsWith('0x') && p.length === 66) || null
                  : null,
              followerAddress:
                condition.method === 'isFollowing' && condition.parameters
                  ? condition.parameters[0]
                  : null,
              rawCondition: JSON.stringify(condition),
            }),
        )
      : [];

  // Chunks entity
  const lsp29EncryptedAssetChunks = chunks
    ? new LSP29EncryptedAssetChunks({
        id: uuidv4(),
        lsp29EncryptedAsset,
        cids: chunks.cids || [],
        iv: chunks.iv,
        totalSize: chunks.totalSize !== undefined ? BigInt(chunks.totalSize) : null,
      })
    : null;

  return {
    version,
    contentId,
    revision,
    createdAt: createdAt ? new Date(createdAt) : null,
    lsp29EncryptedAssetTitle,
    lsp29EncryptedAssetDescription,
    lsp29EncryptedAssetFile,
    lsp29EncryptedAssetEncryption,
    lsp29AccessControlConditions,
    lsp29EncryptedAssetChunks,
  };
}

export async function clearSubEntities({
  context,
  lsp29EncryptedAssetEntities,
}: {
  context: Context;
  lsp29EncryptedAssetEntities: LSP29EncryptedAsset[];
}) {
  const entitiesFilter = {
    lsp29EncryptedAsset: {
      id: In(lsp29EncryptedAssetEntities.map(({ id }) => id)),
    },
  };

  const [existingTitles, existingDescriptions, existingFiles, existingEncryptions, existingChunks] =
    await Promise.all([
      context.store.findBy(LSP29EncryptedAssetTitle, entitiesFilter),
      context.store.findBy(LSP29EncryptedAssetDescription, entitiesFilter),
      context.store.findBy(LSP29EncryptedAssetFile, entitiesFilter),
      context.store.findBy(LSP29EncryptedAssetEncryption, entitiesFilter),
      context.store.findBy(LSP29EncryptedAssetChunks, entitiesFilter),
    ]);

  // Clear access control conditions for existing encryptions
  const encryptionFilter = {
    encryption: {
      id: In(existingEncryptions.map(({ id }) => id)),
    },
  };
  const existingConditions = await context.store.findBy(
    LSP29AccessControlCondition,
    encryptionFilter,
  );

  await context.store.remove(existingConditions);
  await Promise.all([
    context.store.remove(existingTitles),
    context.store.remove(existingDescriptions),
    context.store.remove(existingFiles),
    context.store.remove(existingEncryptions),
    context.store.remove(existingChunks),
  ]);
}
