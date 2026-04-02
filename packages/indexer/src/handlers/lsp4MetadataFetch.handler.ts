/**
 * LSP4 Digital Asset metadata fetch handler.
 *
 * Subscribes to LSP4Metadata entities (created by lsp4Metadata base handler),
 * fetches metadata from IPFS/HTTP URLs, and parses into 10 sub-entity types:
 *   1. LSP4MetadataName
 *   2. LSP4MetadataDescription
 *   3. LSP4MetadataCategory
 *   4. LSP4MetadataLink
 *   5. LSP4MetadataImage
 *   6. LSP4MetadataIcon
 *   7. LSP4MetadataAsset
 *   8. LSP4MetadataAttribute (with score + rarity fields)
 *   9. LSP4MetadataScore (derived from Attribute with key === 'Score')
 *  10. LSP4MetadataRank (derived from Attribute with key === 'Rank')
 *
 * Two paths:
 *   - Empty value (url === null): queueClear all sub-entities (every batch)
 *   - Head-only fetch: query DB backlog → worker pool → parse → sub-entities
 */
import { createComponentLogger } from '@/core/logger';
import { EntityHandler, HandlerContext } from '@/core/types';
import {
  LSP4Metadata,
  LSP4MetadataAsset,
  LSP4MetadataAttribute,
  LSP4MetadataCategory,
  LSP4MetadataDescription,
  LSP4MetadataIcon,
  LSP4MetadataImage,
  LSP4MetadataLink,
  LSP4MetadataName,
  LSP4MetadataRank,
  LSP4MetadataScore,
} from '@/model';
import {
  getAttributeType,
  isAttribute,
  isFileAsset,
  isFileImage,
  isLink,
  parseAttributeRarity,
  parseAttributeScore,
} from '@/utils';
import {
  handleMetadataFetch,
  MetadataFetchConfig,
  SubEntityDescriptor,
} from '@/utils/metadataFetch';
import { isNumeric } from '@chillwhales/utils';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Sub-entity descriptors for queueClear — all 10 types, FK to 'lsp4Metadata'
// ---------------------------------------------------------------------------

const subEntityDescriptors: SubEntityDescriptor[] = [
  { subEntityClass: LSP4MetadataName, fkField: 'lsp4Metadata' },
  { subEntityClass: LSP4MetadataDescription, fkField: 'lsp4Metadata' },
  { subEntityClass: LSP4MetadataCategory, fkField: 'lsp4Metadata' },
  { subEntityClass: LSP4MetadataLink, fkField: 'lsp4Metadata' },
  { subEntityClass: LSP4MetadataImage, fkField: 'lsp4Metadata' },
  { subEntityClass: LSP4MetadataIcon, fkField: 'lsp4Metadata' },
  { subEntityClass: LSP4MetadataAsset, fkField: 'lsp4Metadata' },
  { subEntityClass: LSP4MetadataAttribute, fkField: 'lsp4Metadata' },
  { subEntityClass: LSP4MetadataScore, fkField: 'lsp4Metadata' },
  { subEntityClass: LSP4MetadataRank, fkField: 'lsp4Metadata' },
];

// ---------------------------------------------------------------------------
// Parse fetched JSON into sub-entities
// ---------------------------------------------------------------------------

/**
 * Parse LSP4 metadata JSON and add all sub-entities to the BatchContext.
 *
 * Creates 10 sub-entity types from the parsed data. Score and Rank are
 * derived from Attribute entities where key === 'Score' or 'Rank' and the
 * value is numeric.
 * @param entity - The LSP4Metadata entity being fetched
 * @param data   - Raw JSON from worker pool
 * @param hctx   - Handler context for addEntity calls
 */
function parseAndAddSubEntities(
  entity: LSP4Metadata,
  json: unknown,
  hctx: HandlerContext,
): { success: true } | { success: false; fetchErrorMessage: string } {
  if (typeof json !== 'object' || json === null) {
    return { success: false, fetchErrorMessage: 'Error: Invalid data' };
  }

  if (!('LSP4Metadata' in json) || !json.LSP4Metadata || typeof json.LSP4Metadata !== 'object') {
    return { success: false, fetchErrorMessage: 'Error: Invalid LSP4Metadata' };
  }

  const { LSP4Metadata: lsp4Metadata } = json;

  const parentRef = new LSP4Metadata({ id: entity.id });

  // --- Name ---
  if ('name' in lsp4Metadata && typeof lsp4Metadata.name === 'string') {
    const nameEntity = new LSP4MetadataName({
      id: uuidv4(),
      network: hctx.batchCtx.network,
      lsp4Metadata: parentRef,
      blockNumber: entity.blockNumber,
      transactionIndex: entity.transactionIndex,
      logIndex: entity.logIndex,
      timestamp: entity.timestamp,
      value: lsp4Metadata.name,
    });
    hctx.batchCtx.addEntity('LSP4MetadataName', nameEntity.id, nameEntity);
  }

  // --- Description ---
  if ('description' in lsp4Metadata && typeof lsp4Metadata.description === 'string') {
    const descEntity = new LSP4MetadataDescription({
      id: uuidv4(),
      network: hctx.batchCtx.network,
      lsp4Metadata: parentRef,
      blockNumber: entity.blockNumber,
      transactionIndex: entity.transactionIndex,
      logIndex: entity.logIndex,
      timestamp: entity.timestamp,
      value: lsp4Metadata.description,
    });
    hctx.batchCtx.addEntity('LSP4MetadataDescription', descEntity.id, descEntity);
  }

  // --- Category (only created if present) ---
  if ('category' in lsp4Metadata && typeof lsp4Metadata.category === 'string') {
    const catEntity = new LSP4MetadataCategory({
      id: uuidv4(),
      network: hctx.batchCtx.network,
      lsp4Metadata: parentRef,
      blockNumber: entity.blockNumber,
      transactionIndex: entity.transactionIndex,
      logIndex: entity.logIndex,
      timestamp: entity.timestamp,
      value: lsp4Metadata.category,
    });
    hctx.batchCtx.addEntity('LSP4MetadataCategory', catEntity.id, catEntity);
  }

  // --- Links ---
  if ('links' in lsp4Metadata && lsp4Metadata.links && Array.isArray(lsp4Metadata.links)) {
    for (const link of lsp4Metadata.links) {
      if (!isLink(link)) continue;
      const linkEntity = new LSP4MetadataLink({
        id: uuidv4(),
        network: hctx.batchCtx.network,
        lsp4Metadata: parentRef,
        blockNumber: entity.blockNumber,
        transactionIndex: entity.transactionIndex,
        logIndex: entity.logIndex,
        timestamp: entity.timestamp,
        title: link.title,
        url: link.url,
      });
      hctx.batchCtx.addEntity('LSP4MetadataLink', linkEntity.id, linkEntity);
    }
  }

  // --- Images (Array<Array<ImageMetadata>> with imageIndex) ---
  if ('images' in lsp4Metadata && lsp4Metadata.images && Array.isArray(lsp4Metadata.images)) {
    lsp4Metadata.images
      .filter((imageSet): imageSet is Array<unknown> => Array.isArray(imageSet))
      .forEach((imageSet, index) => {
        imageSet.filter(isFileImage).forEach((img) => {
          const imgEntity = new LSP4MetadataImage({
            id: uuidv4(),
            network: hctx.batchCtx.network,
            lsp4Metadata: parentRef,
            blockNumber: entity.blockNumber,
            transactionIndex: entity.transactionIndex,
            logIndex: entity.logIndex,
            timestamp: entity.timestamp,
            url: img.url,
            width: img.width,
            height: img.height,
            verificationMethod: img.verification.method,
            verificationData: img.verification.data,
            verificationSource: img.verification.source,
            imageIndex: index,
          });
          hctx.batchCtx.addEntity('LSP4MetadataImage', imgEntity.id, imgEntity);
        });
      });
  }

  // --- Icons (flat array — use isFileImage for validation) ---
  if ('icon' in lsp4Metadata && lsp4Metadata.icon && Array.isArray(lsp4Metadata.icon)) {
    for (const iconItem of lsp4Metadata.icon) {
      if (!isFileImage(iconItem)) continue;
      const iconEntity = new LSP4MetadataIcon({
        id: uuidv4(),
        network: hctx.batchCtx.network,
        lsp4Metadata: parentRef,
        blockNumber: entity.blockNumber,
        transactionIndex: entity.transactionIndex,
        logIndex: entity.logIndex,
        timestamp: entity.timestamp,
        url: iconItem.url,
        width: iconItem.width,
        height: iconItem.height,
        verificationMethod: iconItem.verification.method,
        verificationData: iconItem.verification.data,
        verificationSource: iconItem.verification.source,
      });
      hctx.batchCtx.addEntity('LSP4MetadataIcon', iconEntity.id, iconEntity);
    }
  }

  // --- Assets ---
  if ('assets' in lsp4Metadata && lsp4Metadata.assets && Array.isArray(lsp4Metadata.assets)) {
    for (const asset of lsp4Metadata.assets) {
      if (!isFileAsset(asset)) continue;
      const { url, fileType, verification } = asset;
      const assetEntity = new LSP4MetadataAsset({
        id: uuidv4(),
        network: hctx.batchCtx.network,
        lsp4Metadata: parentRef,
        blockNumber: entity.blockNumber,
        transactionIndex: entity.transactionIndex,
        logIndex: entity.logIndex,
        timestamp: entity.timestamp,
        url: url,
        fileType: fileType,
        verificationMethod: verification.method,
        verificationData: verification.data,
        verificationSource: verification.source,
      });
      hctx.batchCtx.addEntity('LSP4MetadataAsset', assetEntity.id, assetEntity);
    }
  }

  // --- Attributes (with score + rarity extraction) ---
  const attributeEntities: LSP4MetadataAttribute[] = [];

  if (
    'attributes' in lsp4Metadata &&
    lsp4Metadata.attributes &&
    Array.isArray(lsp4Metadata.attributes)
  ) {
    for (const attribute of lsp4Metadata.attributes) {
      if (!isAttribute(attribute)) continue;

      const attrEntity = new LSP4MetadataAttribute({
        id: uuidv4(),
        network: hctx.batchCtx.network,
        lsp4Metadata: parentRef,
        blockNumber: entity.blockNumber,
        transactionIndex: entity.transactionIndex,
        logIndex: entity.logIndex,
        timestamp: entity.timestamp,
        key: attribute.key,
        value: attribute.value,
        type: getAttributeType(attribute),
        score: parseAttributeScore(attribute),
        rarity: parseAttributeRarity(attribute),
      });
      hctx.batchCtx.addEntity('LSP4MetadataAttribute', attrEntity.id, attrEntity);
      attributeEntities.push(attrEntity);
    }
  }

  // --- Score (derived from attributes where key === 'Score' and value is numeric) ---
  for (const attr of attributeEntities) {
    if (attr.key === 'Score' && attr.value && isNumeric(attr.value)) {
      const scoreEntity = new LSP4MetadataScore({
        id: uuidv4(),
        network: hctx.batchCtx.network,
        lsp4Metadata: parentRef,
        blockNumber: entity.blockNumber,
        transactionIndex: entity.transactionIndex,
        logIndex: entity.logIndex,
        timestamp: entity.timestamp,
        value: parseInt(attr.value),
      });
      hctx.batchCtx.addEntity('LSP4MetadataScore', scoreEntity.id, scoreEntity);
    }
  }

  // --- Rank (derived from attributes where key === 'Rank' and value is numeric) ---
  for (const attr of attributeEntities) {
    if (attr.key === 'Rank' && attr.value && isNumeric(attr.value)) {
      const rankEntity = new LSP4MetadataRank({
        id: uuidv4(),
        network: hctx.batchCtx.network,
        lsp4Metadata: parentRef,
        blockNumber: entity.blockNumber,
        transactionIndex: entity.transactionIndex,
        logIndex: entity.logIndex,
        timestamp: entity.timestamp,
        value: parseInt(attr.value),
      });
      hctx.batchCtx.addEntity('LSP4MetadataRank', rankEntity.id, rankEntity);
    }
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Handler configuration and definition
// ---------------------------------------------------------------------------

const ENTITY_KEY = 'LSP4Metadata';

const config: MetadataFetchConfig<'LSP4Metadata'> = {
  entityKey: ENTITY_KEY,
  subEntityDescriptors,
  parseAndAddSubEntities,
  getUrl: (entity) => entity.url ?? null,
  getId: (entity) => entity.id,
};

const LSP4MetadataFetchHandler: EntityHandler = {
  name: 'lsp4MetadataFetch',
  supportedChains: ['lukso', 'ethereum', 'ethereum-sepolia'],
  listensToBag: ['LSP4Metadata'],
  dependsOn: ['lsp4Metadata'],
  drainAtHead: true,

  async handle(hctx, triggeredBy): Promise<void> {
    const unfetchedEntities = Array.from(hctx.batchCtx.getEntities(ENTITY_KEY).values());

    if (hctx.context.log.isDebug()) {
      const logger = createComponentLogger(hctx.context.log, 'metadata_fetch');
      logger.debug(
        {
          handler: 'LSP4MetadataFetchHandler',
          triggeredBy,
          unfetchedCount: unfetchedEntities.length,
        },
        'Starting LSP4 metadata fetch',
      );
      const startTime = Date.now();
      await handleMetadataFetch(hctx, config, ENTITY_KEY);
      const duration = Date.now() - startTime;
      logger.debug(
        {
          handler: 'LSP4MetadataFetchHandler',
          durationMs: duration,
          processedCount: unfetchedEntities.length,
        },
        'LSP4 metadata fetch complete',
      );
    } else {
      await handleMetadataFetch(hctx, config, ENTITY_KEY);
    }
  },
};

export default LSP4MetadataFetchHandler;
