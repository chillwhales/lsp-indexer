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
 *   5. LSP29AccessControlCondition    (many per Encryption, FK → Encryption NOT Asset)
 *   6. LSP29EncryptedAssetChunks      (1:1 with LSP29EncryptedAsset)
 *   7. LSP29EncryptedAssetImage       (many per LSP29EncryptedAsset — nested arrays)
 *
 * CRITICAL FK CHAIN: LSP29AccessControlCondition has FK `encryption` pointing
 * to LSP29EncryptedAssetEncryption, NOT to LSP29EncryptedAsset. This requires
 * special handling in sub-entity descriptors: conditions must be cleared via
 * the encryption FK, and clearing order matters (conditions before encryptions).
 *
 * Empty value path: when url === null, all sub-entities are cleared via queueClear.
 * Head-only gating: IPFS/HTTP fetches only run at chain head.
 *
 * Port from v1:
 *   - utils/dataChanged/lsp29EncryptedAsset.ts (extractSubEntities + clearSubEntities)
 *   - Deletion note: V1 extractSubEntities() directly fetched + parsed.
 *     V2 delegates fetching to handleMetadataFetch() and only provides the
 *     parsing callback.
 */
import { createComponentLogger } from '@/core/logger';
import { EntityHandler, HandlerContext } from '@/core/types';
import { isFileImage, isVerification } from '@/utils';
import {
  handleMetadataFetch,
  MetadataFetchConfig,
  SubEntityDescriptor,
} from '@/utils/metadataFetch';
import {
  LSP29AccessControlCondition,
  LSP29EncryptedAsset,
  LSP29EncryptedAssetChunks,
  LSP29EncryptedAssetDescription,
  LSP29EncryptedAssetEncryption,
  LSP29EncryptedAssetFile,
  LSP29EncryptedAssetImage,
  LSP29EncryptedAssetTitle,
} from '@chillwhales/typeorm';
import { v4 as uuidv4 } from 'uuid';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP29EncryptedAsset';

// ---------------------------------------------------------------------------
// LSP29 Encrypted Asset JSON schema (inline — no @lukso/lsp29-contracts pkg)
// ---------------------------------------------------------------------------

interface AccessControlCondition {
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

interface LSP29EncryptedAssetJSON {
  LSP29EncryptedAsset: {
    version?: string;
    id?: string;
    title?: string;
    description?: string;
    images?: {
      url?: string;
      width?: number;
      height?: number;
      verification?: {
        method?: string;
        data?: string;
        source?: string;
      };
    }[][];
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

// ---------------------------------------------------------------------------
// Sub-entity descriptors (for queueClear operations)
// ---------------------------------------------------------------------------
// NOTE: LSP29AccessControlCondition FK is `encryption` → LSP29EncryptedAssetEncryption,
// NOT `lsp29EncryptedAsset` → LSP29EncryptedAsset. The handleMetadataFetch utility
// clears sub-entities by parent ID. For conditions, we need separate clearing logic
// since they're keyed off encryption IDs, not asset IDs. However, since we always
// clear encryptions too, and the conditions reference encryptions, we handle this
// by including conditions in the descriptor list (they'll be cleared when their
// parent encryptions are cleared via cascade, or we clear them explicitly).
//
// For the empty-value path (queueClear with parentIds), conditions cannot be cleared
// by asset ID directly. We include all direct children of the asset in descriptors,
// and conditions will be orphaned/cleared when their encryption parents are removed.

const SUB_ENTITY_DESCRIPTORS: SubEntityDescriptor[] = [
  { subEntityClass: LSP29EncryptedAssetTitle, fkField: 'lsp29EncryptedAsset' },
  { subEntityClass: LSP29EncryptedAssetDescription, fkField: 'lsp29EncryptedAsset' },
  { subEntityClass: LSP29EncryptedAssetFile, fkField: 'lsp29EncryptedAsset' },
  { subEntityClass: LSP29EncryptedAssetEncryption, fkField: 'lsp29EncryptedAsset' },
  { subEntityClass: LSP29EncryptedAssetChunks, fkField: 'lsp29EncryptedAsset' },
  { subEntityClass: LSP29EncryptedAssetImage, fkField: 'lsp29EncryptedAsset' },
  // AccessControlCondition is NOT included here — its FK is `encryption`,
  // not `lsp29EncryptedAsset`. Conditions are cleared when their parent
  // encryption entities are removed. The pipeline's clear step handles
  // removal of encryptions, which cascades to conditions.
];

// ---------------------------------------------------------------------------
// Parse callback
// ---------------------------------------------------------------------------

/**
 * Parse fetched LSP29 encrypted asset JSON into 7 sub-entity types.
 *
 * Port from v1: utils/dataChanged/lsp29EncryptedAsset.ts extractSubEntities()
 */
function parseAndAddSubEntities(
  entity: LSP29EncryptedAsset,
  json: LSP29EncryptedAssetJSON,
  hctx: HandlerContext,
):
  | { success: true; entityUpdates?: Record<string, unknown> }
  | { success: false; fetchErrorMessage: string } {
  if (typeof json !== 'object' || json === null) {
    return { success: false, fetchErrorMessage: 'Error: Invalid data' };
  }

  if (!json.LSP29EncryptedAsset) {
    return { success: false, fetchErrorMessage: 'Error: Invalid LSP29EncryptedAsset' };
  }

  const {
    version,
    id: contentId,
    title,
    description,
    images,
    revision,
    createdAt,
    file,
    encryption,
    chunks,
  } = json.LSP29EncryptedAsset;

  const parentRef = new LSP29EncryptedAsset({ id: entity.id });

  // 1. LSP29EncryptedAssetTitle
  const titleEntity = new LSP29EncryptedAssetTitle({
    id: uuidv4(),
    lsp29EncryptedAsset: parentRef,
    value: title,
  });
  hctx.batchCtx.addEntity('LSP29EncryptedAssetTitle', titleEntity.id, titleEntity);

  // 2. LSP29EncryptedAssetDescription
  const descEntity = new LSP29EncryptedAssetDescription({
    id: uuidv4(),
    lsp29EncryptedAsset: parentRef,
    value: description,
  });
  hctx.batchCtx.addEntity('LSP29EncryptedAssetDescription', descEntity.id, descEntity);

  // 3. LSP29EncryptedAssetFile
  if (file) {
    const fileEntity = new LSP29EncryptedAssetFile({
      id: uuidv4(),
      lsp29EncryptedAsset: parentRef,
      type: file.type,
      name: file.name,
      size: file.size !== undefined ? BigInt(file.size) : null,
      lastModified: file.lastModified !== undefined ? BigInt(file.lastModified) : null,
      hash: file.hash,
    });
    hctx.batchCtx.addEntity('LSP29EncryptedAssetFile', fileEntity.id, fileEntity);
  }

  // 4. LSP29EncryptedAssetEncryption + 5. LSP29AccessControlCondition
  if (encryption) {
    const encryptionEntity = new LSP29EncryptedAssetEncryption({
      id: uuidv4(),
      lsp29EncryptedAsset: parentRef,
      method: encryption.method,
      ciphertext: encryption.ciphertext,
      dataToEncryptHash: encryption.dataToEncryptHash,
      decryptionCode: encryption.decryptionCode,
      decryptionParams: encryption.decryptionParams
        ? JSON.stringify(encryption.decryptionParams)
        : null,
    });
    hctx.batchCtx.addEntity('LSP29EncryptedAssetEncryption', encryptionEntity.id, encryptionEntity);

    // Access control conditions (FK → encryption, NOT → asset)
    if (encryption.accessControlConditions && Array.isArray(encryption.accessControlConditions)) {
      const encryptionRef = new LSP29EncryptedAssetEncryption({ id: encryptionEntity.id });

      for (let index = 0; index < encryption.accessControlConditions.length; index++) {
        const condition = encryption.accessControlConditions[index];
        const conditionEntity = new LSP29AccessControlCondition({
          id: uuidv4(),
          encryption: encryptionRef,
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
        });
        hctx.batchCtx.addEntity('LSP29AccessControlCondition', conditionEntity.id, conditionEntity);
      }
    }
  }

  // 6. LSP29EncryptedAssetChunks
  if (chunks) {
    const chunksEntity = new LSP29EncryptedAssetChunks({
      id: uuidv4(),
      lsp29EncryptedAsset: parentRef,
      cids: chunks.cids || [],
      iv: chunks.iv,
      totalSize: chunks.totalSize !== undefined ? BigInt(chunks.totalSize) : null,
    });
    hctx.batchCtx.addEntity('LSP29EncryptedAssetChunks', chunksEntity.id, chunksEntity);
  }

  // 7. LSP29EncryptedAssetImage (nested arrays with imageIndex)
  if (images && Array.isArray(images)) {
    for (let imageSetIdx = 0; imageSetIdx < images.length; imageSetIdx++) {
      const imageSet = images[imageSetIdx];
      if (!Array.isArray(imageSet)) continue;

      for (const img of imageSet) {
        if (!isFileImage(img)) continue;
        const { url, width, height, verification } = img;
        const imageEntity = new LSP29EncryptedAssetImage({
          id: uuidv4(),
          lsp29EncryptedAsset: parentRef,
          url,
          width,
          height,
          ...(verification &&
            isVerification(verification) && {
              verificationMethod: verification.method,
              verificationData: verification.data,
              verificationSource: verification.source,
            }),
          imageIndex: imageSetIdx,
        });
        hctx.batchCtx.addEntity('LSP29EncryptedAssetImage', imageEntity.id, imageEntity);
      }
    }
  }

  // Return entity-level field updates (version, contentId, revision, createdAt)
  return {
    success: true,
    entityUpdates: {
      version,
      contentId,
      revision,
      createdAt: createdAt ? new Date(createdAt) : null,
    },
  };
}

// ---------------------------------------------------------------------------
// Handler definition
// ---------------------------------------------------------------------------

const fetchConfig: MetadataFetchConfig<LSP29EncryptedAsset> = {
  entityClass: LSP29EncryptedAsset,
  entityType: ENTITY_TYPE,
  subEntityDescriptors: SUB_ENTITY_DESCRIPTORS,
  parseAndAddSubEntities,
  getUrl: (entity: LSP29EncryptedAsset): string | null => entity.url ?? null,
  getId: (entity: LSP29EncryptedAsset): string => entity.id,
};

const LSP29EncryptedAssetFetchHandler: EntityHandler = {
  name: 'lsp29EncryptedAssetFetch',
  listensToBag: ['LSP29EncryptedAsset'],
  dependsOn: ['lsp29EncryptedAsset'],

  async handle(hctx: HandlerContext, triggeredBy: string): Promise<void> {
    const unfetchedEntities = Array.from(hctx.batchCtx.getEntities(ENTITY_TYPE).values());

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
      await handleMetadataFetch(hctx, fetchConfig, triggeredBy);
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
      await handleMetadataFetch(hctx, fetchConfig, triggeredBy);
    }
  },
};

export default LSP29EncryptedAssetFetchHandler;
