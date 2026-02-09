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
 *
 * Port from v1:
 *   - utils/dataChanged/lsp4Metadata.ts (extractSubEntities, clearSubEntities)
 *   - app/handlers/lsp4MetadataHandler.ts (DB queries, fetch flow, Score/Rank)
 */
import { EntityHandler, HandlerContext } from '@/core/types';
import { isFileAsset, isFileImage, isNumeric, isVerification } from '@/utils';
import {
  handleMetadataFetch,
  MetadataFetchConfig,
  SubEntityDescriptor,
} from '@/utils/metadataFetch';
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
} from '@chillwhales/typeorm';
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
// LSP4 JSON shape (extends standard with optional category + attribute extras)
// ---------------------------------------------------------------------------

/**
 * LSP4 metadata JSON shape.
 *
 * LSP4Metadata may include `category` which isn't in the official
 * LSP4DigitalAssetMetadataJSON type. Attribute items may carry `score`
 * and `rarity` fields from LUKSO-specific extensions.
 */
interface LSP4MetadataJSON {
  LSP4Metadata?: {
    name?: string;
    description?: string;
    category?: string;
    links?: Array<{ title?: string; url?: string }>;
    images?: Array<
      Array<{
        url?: string;
        width?: number;
        height?: number;
        verification?: { method?: string; data?: string; source?: string };
      }>
    >;
    icon?: Array<{
      url?: string;
      width?: number;
      height?: number;
      verification?: { method?: string; data?: string; source?: string };
    }>;
    assets?: Array<{
      url?: string;
      fileType?: string;
      verification?: { method?: string; data?: string; source?: string };
    }>;
    attributes?: Array<{
      key?: string;
      value?: string;
      type?: string | number;
      score?: string | number;
      rarity?: string | number;
    }>;
  };
}

// ---------------------------------------------------------------------------
// Parse fetched JSON into sub-entities
// ---------------------------------------------------------------------------

/**
 * Parse LSP4 metadata JSON and add all sub-entities to the BatchContext.
 *
 * Creates 10 sub-entity types from the parsed data. Score and Rank are
 * derived from Attribute entities where key === 'Score' or 'Rank' and the
 * value is numeric.
 *
 * Port from v1:
 *   - utils/dataChanged/lsp4Metadata.ts lines 56-226 (extractSubEntities)
 *   - app/handlers/lsp4MetadataHandler.ts lines 297-320 (Score/Rank extraction)
 *
 * @param entity - The LSP4Metadata entity being fetched
 * @param data   - Raw JSON from worker pool
 * @param hctx   - Handler context for addEntity calls
 */
function parseAndAddSubEntities(
  entity: LSP4Metadata,
  data: unknown,
  hctx: HandlerContext,
): { success: true } | { success: false; fetchErrorMessage: string } {
  if (typeof data !== 'object' || data === null) {
    return { success: false, fetchErrorMessage: 'Error: Invalid data' };
  }

  const typed = data as LSP4MetadataJSON;
  if (!typed.LSP4Metadata) {
    return { success: false, fetchErrorMessage: 'Error: Invalid LSP4Metadata' };
  }

  const { name, description, category, links, images, icon, assets, attributes } =
    typed.LSP4Metadata;

  const parentRef = new LSP4Metadata({ id: entity.id });

  // --- Name ---
  const nameEntity = new LSP4MetadataName({
    id: uuidv4(),
    lsp4Metadata: parentRef,
    value: name,
  });
  hctx.batchCtx.addEntity('LSP4MetadataName', nameEntity.id, nameEntity);

  // --- Description ---
  const descEntity = new LSP4MetadataDescription({
    id: uuidv4(),
    lsp4Metadata: parentRef,
    value: description,
  });
  hctx.batchCtx.addEntity('LSP4MetadataDescription', descEntity.id, descEntity);

  // --- Category (always created, even if value is undefined — matches V1) ---
  const catEntity = new LSP4MetadataCategory({
    id: uuidv4(),
    lsp4Metadata: parentRef,
    value: category,
  });
  hctx.batchCtx.addEntity('LSP4MetadataCategory', catEntity.id, catEntity);

  // --- Links ---
  if (links && Array.isArray(links)) {
    for (const { title, url } of links) {
      const linkEntity = new LSP4MetadataLink({
        id: uuidv4(),
        lsp4Metadata: parentRef,
        title,
        url,
      });
      hctx.batchCtx.addEntity('LSP4MetadataLink', linkEntity.id, linkEntity);
    }
  }

  // --- Images (Array<Array<ImageMetadata>> with imageIndex) ---
  // V1 pattern: images.filter(Array.isArray).flatMap((imageSet, index) =>
  //   imageSet.filter(isFileImage).map(...)
  // ) with imageIndex = index
  if (images && Array.isArray(images)) {
    images
      .filter((imageSet): imageSet is Array<unknown> => Array.isArray(imageSet))
      .forEach((imageSet, index) => {
        imageSet.filter(isFileImage).forEach(({ url, width, height, verification }) => {
          const imgEntity = new LSP4MetadataImage({
            id: uuidv4(),
            lsp4Metadata: parentRef,
            url,
            width,
            height,
            ...(isVerification(verification) && {
              verificationMethod: verification.method,
              verificationData: verification.data,
              verificationSource: verification.source,
            }),
            imageIndex: index,
          });
          hctx.batchCtx.addEntity('LSP4MetadataImage', imgEntity.id, imgEntity);
        });
      });
  }

  // --- Icons (flat array — V1 maps ALL items without isFileImage filter) ---
  if (icon && Array.isArray(icon)) {
    for (const iconItem of icon) {
      const iconEntity = new LSP4MetadataIcon({
        id: uuidv4(),
        lsp4Metadata: parentRef,
        url: iconItem.url,
        width: iconItem.width,
        height: iconItem.height,
        ...(iconItem.verification &&
          isVerification(iconItem.verification) && {
            verificationMethod: iconItem.verification.method,
            verificationData: iconItem.verification.data,
            verificationSource: iconItem.verification.source,
          }),
      });
      hctx.batchCtx.addEntity('LSP4MetadataIcon', iconEntity.id, iconEntity);
    }
  }

  // --- Assets ---
  if (assets && Array.isArray(assets)) {
    for (const asset of assets.filter(isFileAsset)) {
      const assetEntity = new LSP4MetadataAsset({
        id: uuidv4(),
        lsp4Metadata: parentRef,
        url: asset.url,
        fileType: asset.fileType,
        ...(asset.verification &&
          isVerification(asset.verification) && {
            verificationMethod: asset.verification.method,
            verificationData: asset.verification.data,
            verificationSource: asset.verification.source,
          }),
      });
      hctx.batchCtx.addEntity('LSP4MetadataAsset', assetEntity.id, assetEntity);
    }
  }

  // --- Attributes (with score + rarity extraction matching V1 exactly) ---
  const attributeEntities: LSP4MetadataAttribute[] = [];

  if (attributes && Array.isArray(attributes)) {
    for (const attribute of attributes) {
      const { key, value, type } = attribute;

      // Score field — V1 logic: check 'score' property, parse string or number
      const score =
        'score' in attribute
          ? typeof attribute.score === 'string'
            ? isNumeric(attribute.score)
              ? parseInt(attribute.score)
              : null
            : typeof attribute.score === 'number'
              ? attribute.score
              : null
          : null;

      // Rarity field — V1 logic: check 'rarity' property, parse string or number
      const rarity =
        'rarity' in attribute
          ? typeof attribute.rarity === 'string'
            ? isNumeric(attribute.rarity)
              ? parseFloat(attribute.rarity)
              : null
            : typeof attribute.rarity === 'number'
              ? attribute.rarity
              : null
          : null;

      const attrEntity = new LSP4MetadataAttribute({
        id: uuidv4(),
        lsp4Metadata: parentRef,
        key,
        value,
        type: type?.toString(),
        score,
        rarity,
      });
      hctx.batchCtx.addEntity('LSP4MetadataAttribute', attrEntity.id, attrEntity);
      attributeEntities.push(attrEntity);
    }
  }

  // --- Score (derived from attributes where key === 'Score' and value is numeric) ---
  // V1: lsp4MetadataHandler.ts lines 297-307
  for (const attr of attributeEntities) {
    if (attr.key === 'Score' && attr.value && isNumeric(attr.value)) {
      const scoreEntity = new LSP4MetadataScore({
        id: uuidv4(),
        lsp4Metadata: parentRef,
        value: parseInt(attr.value),
      });
      hctx.batchCtx.addEntity('LSP4MetadataScore', scoreEntity.id, scoreEntity);
    }
  }

  // --- Rank (derived from attributes where key === 'Rank' and value is numeric) ---
  // V1: lsp4MetadataHandler.ts lines 309-320
  for (const attr of attributeEntities) {
    if (attr.key === 'Rank' && attr.value && isNumeric(attr.value)) {
      const rankEntity = new LSP4MetadataRank({
        id: uuidv4(),
        lsp4Metadata: parentRef,
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

const ENTITY_TYPE = 'LSP4Metadata';

const config: MetadataFetchConfig<LSP4Metadata> = {
  entityClass: LSP4Metadata,
  entityType: ENTITY_TYPE,
  subEntityDescriptors,
  parseAndAddSubEntities,
  getUrl: (entity) => entity.url ?? null,
  getId: (entity) => entity.id,
};

const LSP4MetadataFetchHandler: EntityHandler = {
  name: 'lsp4MetadataFetch',
  listensToBag: ['LSP4Metadata'],
  dependsOn: ['lsp4Metadata'],

  async handle(hctx: HandlerContext, triggeredBy: string): Promise<void> {
    await handleMetadataFetch(hctx, config, triggeredBy);
  },
};

export default LSP4MetadataFetchHandler;
