/**
 * LSP3 Profile metadata fetch handler.
 *
 * Subscribes to the 'LSP3Profile' entity bag (created by lsp3Profile.handler.ts),
 * fetches JSON metadata from URLs via the worker pool, and parses the response
 * into 7 sub-entity types:
 *
 *   1. LSP3ProfileName        (1:1 with LSP3Profile)
 *   2. LSP3ProfileDescription (1:1 with LSP3Profile)
 *   3. LSP3ProfileTag         (many per LSP3Profile)
 *   4. LSP3ProfileLink        (many per LSP3Profile)
 *   5. LSP3ProfileAsset       (many per LSP3Profile — from `avatar` array)
 *   6. LSP3ProfileImage       (many per LSP3Profile — flat array of images)
 *   7. LSP3ProfileBackgroundImage (many per LSP3Profile — flat array)
 *
 * Empty value path: when url === null, all sub-entities are cleared via queueClear.
 * Head-only gating: IPFS/HTTP fetches only run at chain head to avoid
 * hammering external services during historical sync.
 */
import { createComponentLogger } from '@/core/logger';
import { EntityHandler, HandlerContext } from '@/core/types';
import { isFileAsset, isFileImage, isLink } from '@/utils';
import {
  handleMetadataFetch,
  MetadataFetchConfig,
  SubEntityDescriptor,
} from '@/utils/metadataFetch';
import {
  LSP3Profile,
  LSP3ProfileAsset,
  LSP3ProfileBackgroundImage,
  LSP3ProfileDescription,
  LSP3ProfileImage,
  LSP3ProfileLink,
  LSP3ProfileName,
  LSP3ProfileTag,
} from '@/model';
import { v4 as uuidv4 } from 'uuid';

// Entity type key used in the BatchContext entity bag
const ENTITY_KEY = 'LSP3Profile';

// ---------------------------------------------------------------------------
// Sub-entity descriptors (for queueClear operations)
// ---------------------------------------------------------------------------

const SUB_ENTITY_DESCRIPTORS: SubEntityDescriptor[] = [
  { subEntityClass: LSP3ProfileName, fkField: 'lsp3Profile' },
  { subEntityClass: LSP3ProfileDescription, fkField: 'lsp3Profile' },
  { subEntityClass: LSP3ProfileTag, fkField: 'lsp3Profile' },
  { subEntityClass: LSP3ProfileLink, fkField: 'lsp3Profile' },
  { subEntityClass: LSP3ProfileAsset, fkField: 'lsp3Profile' },
  { subEntityClass: LSP3ProfileImage, fkField: 'lsp3Profile' },
  { subEntityClass: LSP3ProfileBackgroundImage, fkField: 'lsp3Profile' },
];

// ---------------------------------------------------------------------------
// Parse callback
// ---------------------------------------------------------------------------

/**
 * Parse fetched LSP3 profile JSON into 7 sub-entity types.
 */
function parseAndAddSubEntities(
  entity: LSP3Profile,
  json: unknown,
  hctx: HandlerContext,
): { success: true } | { success: false; fetchErrorMessage: string } {
  if (typeof json !== 'object' || json === null) {
    return { success: false, fetchErrorMessage: 'Error: Invalid data' };
  }

  if (!('LSP3Profile' in json) || !json.LSP3Profile || typeof json.LSP3Profile !== 'object') {
    return { success: false, fetchErrorMessage: 'Error: Invalid LSP3Profile' };
  }

  const { LSP3Profile: lsp3Profile } = json;

  const parentRef = new LSP3Profile({ id: entity.id });

  // 1. LSP3ProfileName
  if ('name' in lsp3Profile && typeof lsp3Profile.name === 'string') {
    const nameEntity = new LSP3ProfileName({
      id: uuidv4(),
      lsp3Profile: parentRef,
      blockNumber: entity.blockNumber,
      transactionIndex: entity.transactionIndex,
      logIndex: entity.logIndex,
      timestamp: entity.timestamp,
      value: lsp3Profile.name,
    });
    hctx.batchCtx.addEntity('LSP3ProfileName', nameEntity.id, nameEntity);
  }

  // 2. LSP3ProfileDescription
  if ('description' in lsp3Profile && typeof lsp3Profile.description === 'string') {
    const descEntity = new LSP3ProfileDescription({
      id: uuidv4(),
      lsp3Profile: parentRef,
      blockNumber: entity.blockNumber,
      transactionIndex: entity.transactionIndex,
      logIndex: entity.logIndex,
      timestamp: entity.timestamp,
      value: lsp3Profile.description,
    });
    hctx.batchCtx.addEntity('LSP3ProfileDescription', descEntity.id, descEntity);
  }

  // 3. LSP3ProfileTag (array)
  if ('tags' in lsp3Profile && lsp3Profile.tags && Array.isArray(lsp3Profile.tags)) {
    for (const tag of lsp3Profile.tags) {
      if (typeof tag !== 'string') continue;
      const tagEntity = new LSP3ProfileTag({
        id: uuidv4(),
        lsp3Profile: parentRef,
        blockNumber: entity.blockNumber,
        transactionIndex: entity.transactionIndex,
        logIndex: entity.logIndex,
        timestamp: entity.timestamp,
        value: tag,
      });
      hctx.batchCtx.addEntity('LSP3ProfileTag', tagEntity.id, tagEntity);
    }
  }

  // 4. LSP3ProfileLink (array)
  if ('links' in lsp3Profile && lsp3Profile.links && Array.isArray(lsp3Profile.links)) {
    for (const link of lsp3Profile.links) {
      if (!isLink(link)) continue;
      const linkEntity = new LSP3ProfileLink({
        id: uuidv4(),
        lsp3Profile: parentRef,
        blockNumber: entity.blockNumber,
        transactionIndex: entity.transactionIndex,
        logIndex: entity.logIndex,
        timestamp: entity.timestamp,
        title: link.title,
        url: link.url,
      });
      hctx.batchCtx.addEntity('LSP3ProfileLink', linkEntity.id, linkEntity);
    }
  }

  // 5. LSP3ProfileAsset (from `avatar` array — file assets only)
  if ('avatar' in lsp3Profile && lsp3Profile.avatar && Array.isArray(lsp3Profile.avatar)) {
    for (const item of lsp3Profile.avatar) {
      if (!isFileAsset(item)) continue;
      const { url, fileType, verification } = item;
      const assetEntity = new LSP3ProfileAsset({
        id: uuidv4(),
        lsp3Profile: parentRef,
        blockNumber: entity.blockNumber,
        transactionIndex: entity.transactionIndex,
        logIndex: entity.logIndex,
        timestamp: entity.timestamp,
        url,
        fileType,
        verificationMethod: verification.method,
        verificationData: verification.data,
        verificationSource: verification.source,
      });
      hctx.batchCtx.addEntity('LSP3ProfileAsset', assetEntity.id, assetEntity);
    }
  }

  // 6. LSP3ProfileImage (flat array — not nested like LSP4)
  if (
    'profileImage' in lsp3Profile &&
    lsp3Profile.profileImage &&
    Array.isArray(lsp3Profile.profileImage)
  ) {
    for (const img of lsp3Profile.profileImage) {
      if (!isFileImage(img)) continue;
      const imageEntity = new LSP3ProfileImage({
        id: uuidv4(),
        lsp3Profile: parentRef,
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
      });
      hctx.batchCtx.addEntity('LSP3ProfileImage', imageEntity.id, imageEntity);
    }
  }

  // 7. LSP3ProfileBackgroundImage (flat array — same structure as profileImage)
  if (
    'backgroundImage' in lsp3Profile &&
    lsp3Profile.backgroundImage &&
    Array.isArray(lsp3Profile.backgroundImage)
  ) {
    for (const img of lsp3Profile.backgroundImage) {
      if (!isFileImage(img)) continue;
      const bgEntity = new LSP3ProfileBackgroundImage({
        id: uuidv4(),
        lsp3Profile: parentRef,
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
      });
      hctx.batchCtx.addEntity('LSP3ProfileBackgroundImage', bgEntity.id, bgEntity);
    }
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Handler definition
// ---------------------------------------------------------------------------

const fetchConfig: MetadataFetchConfig<'LSP3Profile'> = {
  entityKey: ENTITY_KEY,
  subEntityDescriptors: SUB_ENTITY_DESCRIPTORS,
  parseAndAddSubEntities,
  getUrl: (entity): string | null => entity.url ?? null,
  getId: (entity): string => entity.id,
};

const LSP3ProfileFetchHandler: EntityHandler = {
  name: 'lsp3ProfileFetch',
  listensToBag: ['LSP3Profile'],
  dependsOn: ['lsp3Profile'],
  drainAtHead: true,

  async handle(hctx, triggeredBy): Promise<void> {
    const unfetchedEntities = Array.from(hctx.batchCtx.getEntities(ENTITY_KEY).values());

    if (hctx.context.log.isDebug()) {
      const logger = createComponentLogger(hctx.context.log, 'metadata_fetch');
      logger.debug(
        {
          handler: 'LSP3ProfileFetchHandler',
          triggeredBy,
          unfetchedCount: unfetchedEntities.length,
        },
        'Starting LSP3 profile metadata fetch',
      );
      const startTime = Date.now();
      await handleMetadataFetch(hctx, fetchConfig, ENTITY_KEY);
      const duration = Date.now() - startTime;
      logger.debug(
        {
          handler: 'LSP3ProfileFetchHandler',
          durationMs: duration,
          processedCount: unfetchedEntities.length,
        },
        'LSP3 profile metadata fetch complete',
      );
    } else {
      await handleMetadataFetch(hctx, fetchConfig, ENTITY_KEY);
    }
  },
};

export default LSP3ProfileFetchHandler;
