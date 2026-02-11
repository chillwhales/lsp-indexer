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
 *
 * Port from v1:
 *   - utils/dataChanged/lsp3Profile.ts (extractSubEntities + clearSubEntities)
 *   - Deletion note: V1 extractSubEntities() directly fetched + parsed.
 *     V2 delegates fetching to handleMetadataFetch() and only provides the
 *     parsing callback.
 */
import { EntityHandler, HandlerContext } from '@/core/types';
import { isFileAsset, isVerification } from '@/utils';
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
} from '@chillwhales/typeorm';
import type { LSP3ProfileMetadataJSON } from '@lukso/lsp3-contracts';
import { v4 as uuidv4 } from 'uuid';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP3Profile';

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
 *
 * Port from v1: utils/dataChanged/lsp3Profile.ts extractSubEntities()
 */
function parseAndAddSubEntities(
  entity: LSP3Profile,
  data: unknown,
  hctx: HandlerContext,
): { success: true } | { success: false; fetchErrorMessage: string } {
  if (typeof data !== 'object' || data === null) {
    return { success: false, fetchErrorMessage: 'Error: Invalid data' };
  }

  const json = data as LSP3ProfileMetadataJSON;
  if (!json.LSP3Profile) {
    return { success: false, fetchErrorMessage: 'Error: Invalid LSP3Profile' };
  }

  const { name, description, tags, links, avatar, profileImage, backgroundImage } =
    json.LSP3Profile;

  const parentRef = new LSP3Profile({ id: entity.id });

  // 1. LSP3ProfileName
  const nameEntity = new LSP3ProfileName({
    id: uuidv4(),
    lsp3Profile: parentRef,
    value: name,
  });
  hctx.batchCtx.addEntity('LSP3ProfileName', nameEntity.id, nameEntity);

  // 2. LSP3ProfileDescription
  const descEntity = new LSP3ProfileDescription({
    id: uuidv4(),
    lsp3Profile: parentRef,
    value: description,
  });
  hctx.batchCtx.addEntity('LSP3ProfileDescription', descEntity.id, descEntity);

  // 3. LSP3ProfileTag (array)
  if (tags && Array.isArray(tags)) {
    for (const tag of tags) {
      const tagEntity = new LSP3ProfileTag({
        id: uuidv4(),
        lsp3Profile: parentRef,
        value: tag,
      });
      hctx.batchCtx.addEntity('LSP3ProfileTag', tagEntity.id, tagEntity);
    }
  }

  // 4. LSP3ProfileLink (array)
  if (links && Array.isArray(links)) {
    for (const link of links) {
      const linkEntity = new LSP3ProfileLink({
        id: uuidv4(),
        lsp3Profile: parentRef,
        title: link.title,
        url: link.url,
      });
      hctx.batchCtx.addEntity('LSP3ProfileLink', linkEntity.id, linkEntity);
    }
  }

  // 5. LSP3ProfileAsset (from `avatar` array — file assets only)
  if (avatar && Array.isArray(avatar)) {
    for (const item of avatar) {
      if (!isFileAsset(item)) continue;
      const { url, fileType, verification } = item;
      const assetEntity = new LSP3ProfileAsset({
        id: uuidv4(),
        lsp3Profile: parentRef,
        url,
        fileType,
        ...(isVerification(verification) && {
          verificationMethod: verification.method,
          verificationData: verification.data,
          verificationSource: verification.source,
        }),
      });
      hctx.batchCtx.addEntity('LSP3ProfileAsset', assetEntity.id, assetEntity);
    }
  }

  // 6. LSP3ProfileImage (flat array — not nested like LSP4)
  if (profileImage && Array.isArray(profileImage)) {
    for (const img of profileImage) {
      const imageEntity = new LSP3ProfileImage({
        id: uuidv4(),
        lsp3Profile: parentRef,
        url: img.url,
        width: img.width,
        height: img.height,
        ...(isVerification(img.verification) && {
          verificationMethod: img.verification.method,
          verificationData: img.verification.data,
          verificationSource: img.verification.source,
        }),
      });
      hctx.batchCtx.addEntity('LSP3ProfileImage', imageEntity.id, imageEntity);
    }
  }

  // 7. LSP3ProfileBackgroundImage (flat array — same structure as profileImage)
  if (backgroundImage && Array.isArray(backgroundImage)) {
    for (const img of backgroundImage) {
      const bgEntity = new LSP3ProfileBackgroundImage({
        id: uuidv4(),
        lsp3Profile: parentRef,
        url: img.url,
        width: img.width,
        height: img.height,
        ...(isVerification(img.verification) && {
          verificationMethod: img.verification.method,
          verificationData: img.verification.data,
          verificationSource: img.verification.source,
        }),
      });
      hctx.batchCtx.addEntity('LSP3ProfileBackgroundImage', bgEntity.id, bgEntity);
    }
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Handler definition
// ---------------------------------------------------------------------------

const fetchConfig: MetadataFetchConfig<LSP3Profile> = {
  entityClass: LSP3Profile,
  entityType: ENTITY_TYPE,
  subEntityDescriptors: SUB_ENTITY_DESCRIPTORS,
  parseAndAddSubEntities,
  getUrl: (entity: LSP3Profile): string | null => entity.url ?? null,
  getId: (entity: LSP3Profile): string => entity.id,
};

const LSP3ProfileFetchHandler: EntityHandler = {
  name: 'lsp3ProfileFetch',
  listensToBag: ['LSP3Profile'],
  dependsOn: ['lsp3Profile'],

  async handle(hctx: HandlerContext, triggeredBy: string): Promise<void> {
    const logger = createComponentLogger(hctx.context.log, 'metadata_fetch');

    const unfetchedEntities = Array.from(hctx.batchCtx.getEntityBag(ENTITY_TYPE).values());

    if (logger.isLevelEnabled('debug')) {
      logger.debug(
        {
          handler: 'LSP3ProfileFetchHandler',
          triggeredBy,
          unfetchedCount: unfetchedEntities.length,
        },
        'Starting LSP3 profile metadata fetch',
      );
    }

    const startTime = Date.now();
    await handleMetadataFetch(hctx, fetchConfig, triggeredBy);
    const duration = Date.now() - startTime;

    if (logger.isLevelEnabled('debug')) {
      logger.debug(
        {
          handler: 'LSP3ProfileFetchHandler',
          durationMs: duration,
          processedCount: unfetchedEntities.length,
        },
        'LSP3 profile metadata fetch complete',
      );
    }
  },
};

export default LSP3ProfileFetchHandler;
