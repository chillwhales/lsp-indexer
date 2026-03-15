/**
 * LSP29 Encrypted Asset metadata fetch handler.
 *
 * Subscribes to the 'LSP29EncryptedAsset' entity bag (created by
 * lsp29EncryptedAsset.handler.ts), fetches JSON metadata from URLs via the
 * worker pool, and parses the response into 7 sub-entity types:
 *
 *   1. LSP29EncryptedAssetTitle       (1:1 with LSP29EncryptedAsset)
 *   2. LSP29EncryptedAssetDescription (1:1 with LSP29EncryptedAsset)
 *   3. LSP29EncryptedAssetFile        (1:1 with LSP29EncryptedAsset)
 *   4. LSP29EncryptedAssetEncryption  (1:1 with LSP29EncryptedAsset)
 *   5. LSP29EncryptedAssetChunks      (1:1 with LSP29EncryptedAsset)
 *   6. LSP29EncryptedAssetImage       (many per LSP29EncryptedAsset — nested arrays)
 *
 * NOTE: LSP29EncryptedAssetEncryptionParams (1:1 with Encryption) is also
 * created during parsing but is NOT in SUB_ENTITY_DESCRIPTORS — its FK
 * points to Encryption (not Asset), so it cannot be cleared by asset ID.
 * Params are cleared via DB cascade when their parent Encryption is removed.
 *
 * Additionally creates LSP29EncryptedAssetEncryptionParams (1:1 with Encryption),
 * but this entity is NOT in SUB_ENTITY_DESCRIPTORS — see note above.
 *
 * Uses `isLsp29Asset()` from @chillwhales/lsp29 for v2.0.0 schema validation
 * instead of hand-rolled type guards.
 *
 * Empty value path: when url === null, all sub-entities are cleared via queueClear.
 * Head-only gating: IPFS/HTTP fetches only run at chain head.
 */
import { createComponentLogger } from '@/core/logger';
import { EntityHandler, HandlerContext } from '@/core/types';
import { isFileImage } from '@/utils';
import {
  handleMetadataFetch,
  MetadataFetchConfig,
  SubEntityDescriptor,
} from '@/utils/metadataFetch';
import { isLsp29Asset } from '@chillwhales/lsp29';
import {
  LSP29EncryptedAsset,
  LSP29EncryptedAssetChunks,
  LSP29EncryptedAssetDescription,
  LSP29EncryptedAssetEncryption,
  LSP29EncryptedAssetEncryptionParams,
  LSP29EncryptedAssetFile,
  LSP29EncryptedAssetImage,
  LSP29EncryptedAssetTitle,
} from '@chillwhales/typeorm';
import { v4 as uuidv4 } from 'uuid';

// Entity type key used in the BatchContext entity bag
const ENTITY_KEY = 'LSP29EncryptedAsset';

// ---------------------------------------------------------------------------
// Sub-entity descriptors (for queueClear operations)
// ---------------------------------------------------------------------------
// LSP29EncryptedAssetEncryptionParams is NOT included here — its FK is `encryption`,
// not `lsp29EncryptedAsset`. Params are cleared when their parent encryption entities
// are removed. The pipeline's clear step handles removal of encryptions, which
// cascades to params via the @unique 1:1 FK constraint.

const SUB_ENTITY_DESCRIPTORS: SubEntityDescriptor[] = [
  { subEntityClass: LSP29EncryptedAssetTitle, fkField: 'lsp29EncryptedAsset' },
  { subEntityClass: LSP29EncryptedAssetDescription, fkField: 'lsp29EncryptedAsset' },
  { subEntityClass: LSP29EncryptedAssetFile, fkField: 'lsp29EncryptedAsset' },
  { subEntityClass: LSP29EncryptedAssetEncryption, fkField: 'lsp29EncryptedAsset' },
  { subEntityClass: LSP29EncryptedAssetChunks, fkField: 'lsp29EncryptedAsset' },
  { subEntityClass: LSP29EncryptedAssetImage, fkField: 'lsp29EncryptedAsset' },
];

// ---------------------------------------------------------------------------
// Parse callback
// ---------------------------------------------------------------------------

/**
 * Parse fetched LSP29 encrypted asset JSON into 7 sub-entity types.
 *
 * Uses `isLsp29Asset()` from @chillwhales/lsp29 for v2.0.0 schema validation.
 * After validation, typed fields are accessed directly — no hand-rolled guards.
 */
function parseAndAddSubEntities(
  entity: LSP29EncryptedAsset,
  json: unknown,
  hctx: HandlerContext,
):
  | { success: true; entityUpdates?: Record<string, unknown> }
  | { success: false; fetchErrorMessage: string } {
  // Validate against v2.0.0 schema using package type guard
  if (!isLsp29Asset(json)) {
    return {
      success: false,
      fetchErrorMessage: 'Error: Invalid LSP29EncryptedAsset (v2.0.0 validation failed)',
    };
  }

  const lsp29 = json.LSP29EncryptedAsset;
  const parentRef = new LSP29EncryptedAsset({ id: entity.id });

  // 1. Title (required in v2.0.0)
  const titleEntity = new LSP29EncryptedAssetTitle({
    id: uuidv4(),
    lsp29EncryptedAsset: parentRef,
    blockNumber: entity.blockNumber,
    transactionIndex: entity.transactionIndex,
    logIndex: entity.logIndex,
    timestamp: entity.timestamp,
    value: lsp29.title,
  });
  hctx.batchCtx.addEntity('LSP29EncryptedAssetTitle', titleEntity.id, titleEntity);

  // 2. Description (optional in v2.0.0)
  if (lsp29.description !== undefined) {
    const descEntity = new LSP29EncryptedAssetDescription({
      id: uuidv4(),
      lsp29EncryptedAsset: parentRef,
      blockNumber: entity.blockNumber,
      transactionIndex: entity.transactionIndex,
      logIndex: entity.logIndex,
      timestamp: entity.timestamp,
      value: lsp29.description,
    });
    hctx.batchCtx.addEntity('LSP29EncryptedAssetDescription', descEntity.id, descEntity);
  }

  // 3. File (required in v2.0.0)
  const fileEntity = new LSP29EncryptedAssetFile({
    id: uuidv4(),
    lsp29EncryptedAsset: parentRef,
    blockNumber: entity.blockNumber,
    transactionIndex: entity.transactionIndex,
    logIndex: entity.logIndex,
    timestamp: entity.timestamp,
    type: lsp29.file.type,
    name: lsp29.file.name,
    size: lsp29.file.size != null ? BigInt(lsp29.file.size) : null,
    lastModified: lsp29.file.lastModified != null ? BigInt(lsp29.file.lastModified) : null,
    hash: lsp29.file.hash,
  });
  hctx.batchCtx.addEntity('LSP29EncryptedAssetFile', fileEntity.id, fileEntity);

  // 4. Encryption (required in v2.0.0) — provider-first model
  const encryptionEntity = new LSP29EncryptedAssetEncryption({
    id: uuidv4(),
    lsp29EncryptedAsset: parentRef,
    blockNumber: entity.blockNumber,
    transactionIndex: entity.transactionIndex,
    logIndex: entity.logIndex,
    timestamp: entity.timestamp,
    provider: lsp29.encryption.provider,
    method: lsp29.encryption.method,
    condition:
      lsp29.encryption.condition != null ? JSON.stringify(lsp29.encryption.condition) : null,
    encryptedKey:
      lsp29.encryption.encryptedKey != null ? JSON.stringify(lsp29.encryption.encryptedKey) : null,
  });
  hctx.batchCtx.addEntity('LSP29EncryptedAssetEncryption', encryptionEntity.id, encryptionEntity);

  // 5. Encryption params (1:1 with encryption, replaces AccessControlCondition)
  // Guard: params is required in v2.0.0 (enforced by isLsp29Asset()), but defensive
  // null check protects against future spec changes or malformed data.
  // Params is a discriminated union on `method` — properties differ per variant,
  // so `'prop' in params` is required for safe access across union members.
  const params = lsp29.encryption.params;
  if (params) {
    const followedAddr = 'followedAddresses' in params ? params.followedAddresses : null;
    const paramsEntity = new LSP29EncryptedAssetEncryptionParams({
      id: uuidv4(),
      encryption: new LSP29EncryptedAssetEncryption({ id: encryptionEntity.id }),
      blockNumber: entity.blockNumber,
      transactionIndex: entity.transactionIndex,
      logIndex: entity.logIndex,
      timestamp: entity.timestamp,
      method: params.method,
      tokenAddress: 'tokenAddress' in params ? params.tokenAddress : null,
      requiredBalance: 'requiredBalance' in params ? params.requiredBalance : null,
      requiredTokenId: 'requiredTokenId' in params ? params.requiredTokenId : null,
      followedAddresses: Array.isArray(followedAddr) ? JSON.stringify(followedAddr) : null,
      unlockTimestamp: 'unlockTimestamp' in params ? params.unlockTimestamp : null,
    });
    hctx.batchCtx.addEntity('LSP29EncryptedAssetEncryptionParams', paramsEntity.id, paramsEntity);
  }

  // 6. Chunks (required in v2.0.0) — per-backend JSON columns
  const chunksEntity = new LSP29EncryptedAssetChunks({
    id: uuidv4(),
    lsp29EncryptedAsset: parentRef,
    blockNumber: entity.blockNumber,
    transactionIndex: entity.transactionIndex,
    logIndex: entity.logIndex,
    timestamp: entity.timestamp,
    iv: lsp29.chunks.iv,
    totalSize: lsp29.chunks.totalSize != null ? BigInt(lsp29.chunks.totalSize) : null,
    ipfsChunks: lsp29.chunks.ipfs ? JSON.stringify(lsp29.chunks.ipfs) : null,
    lumeraChunks: lsp29.chunks.lumera ? JSON.stringify(lsp29.chunks.lumera) : null,
    s3Chunks: lsp29.chunks.s3 ? JSON.stringify(lsp29.chunks.s3) : null,
    arweaveChunks: lsp29.chunks.arweave ? JSON.stringify(lsp29.chunks.arweave) : null,
  });
  hctx.batchCtx.addEntity('LSP29EncryptedAssetChunks', chunksEntity.id, chunksEntity);

  // 7. Images (same nested array structure)
  for (let imageSetIdx = 0; imageSetIdx < lsp29.images.length; imageSetIdx++) {
    const imageSet = lsp29.images[imageSetIdx];
    for (const img of imageSet) {
      if (!isFileImage(img)) continue;
      const imageEntity = new LSP29EncryptedAssetImage({
        id: uuidv4(),
        lsp29EncryptedAsset: parentRef,
        blockNumber: entity.blockNumber,
        transactionIndex: entity.transactionIndex,
        logIndex: entity.logIndex,
        timestamp: entity.timestamp,
        url: img.url,
        width: img.width,
        height: img.height,
        verificationMethod: img.verification.method,
        verificationData: img.verification.data,
        verificationSource: 'source' in img.verification ? img.verification.source : null,
        imageIndex: imageSetIdx,
      });
      hctx.batchCtx.addEntity('LSP29EncryptedAssetImage', imageEntity.id, imageEntity);
    }
  }

  return {
    success: true,
    entityUpdates: {
      version: lsp29.version, // Always "2.0.0"
      contentId: lsp29.id,
      revision: lsp29.revision,
    },
  };
}

// ---------------------------------------------------------------------------
// Handler definition
// ---------------------------------------------------------------------------

const fetchConfig: MetadataFetchConfig<'LSP29EncryptedAsset'> = {
  entityKey: ENTITY_KEY,
  subEntityDescriptors: SUB_ENTITY_DESCRIPTORS,
  parseAndAddSubEntities,
  getUrl: (entity): string | null => entity.url ?? null,
  getId: (entity): string => entity.id,
};

const LSP29EncryptedAssetFetchHandler: EntityHandler = {
  name: 'lsp29EncryptedAssetFetch',
  listensToBag: ['LSP29EncryptedAsset'],
  dependsOn: ['lsp29EncryptedAsset'],
  drainAtHead: true,

  async handle(hctx, triggeredBy): Promise<void> {
    const unfetchedEntities = Array.from(hctx.batchCtx.getEntities(ENTITY_KEY).values());

    if (hctx.context.log.isDebug()) {
      const logger = createComponentLogger(hctx.context.log, 'metadata_fetch');
      logger.debug(
        {
          handler: 'LSP29EncryptedAssetFetchHandler',
          triggeredBy,
          unfetchedCount: unfetchedEntities.length,
        },
        'Starting LSP29 encrypted asset metadata fetch',
      );
      const startTime = Date.now();
      await handleMetadataFetch(hctx, fetchConfig, ENTITY_KEY);
      const duration = Date.now() - startTime;
      logger.debug(
        {
          handler: 'LSP29EncryptedAssetFetchHandler',
          durationMs: duration,
          processedCount: unfetchedEntities.length,
        },
        'LSP29 encrypted asset metadata fetch complete',
      );
    } else {
      await handleMetadataFetch(hctx, fetchConfig, ENTITY_KEY);
    }
  },
};

export default LSP29EncryptedAssetFetchHandler;
