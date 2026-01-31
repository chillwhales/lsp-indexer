/**
 * LSP4Metadata data key plugin.
 *
 * Handles the `LSP4Metadata` VerifiableURI data key emitted via:
 *   - `DataChanged(bytes32,bytes)` on Digital Assets (id = address)
 *   - `TokenIdDataChanged(bytes32,bytes32,bytes)` on LSP8 contracts (id = "{address} - {tokenId}")
 *
 * When metadata is updated, this plugin:
 *   1. Decodes the VerifiableURI from the data value to get a metadata URL
 *   2. Creates/updates the `LSP4Metadata` entity with deterministic id
 *   3. For TokenIdDataChanged: links entity to NFT via tokenId
 *   4. Clears existing sub-entities before re-inserting (delete-then-reinsert)
 *
 * Sub-entity creation and metadata fetching are handled by the LSP4 metadata
 * fetch handler (Phase 5, issue #54). This plugin only persists the main
 * LSP4Metadata entity with `isDataFetched: false`.
 *
 * Port from v1:
 *   - utils/dataChanged/lsp4Metadata.ts (extract + populate + clearSubEntities)
 *   - utils/tokenIdDataChanged/lsp4Metadata.ts (extract with tokenId + nft)
 *   - app/index.ts L202-206, L423-424 (clear + upsert)
 */
import { upsertEntities } from '@/core/persistHelpers';
import { Block, DataKeyPlugin, EntityCategory, IBatchContext, Log } from '@/core/types';
import { decodeVerifiableUri, generateTokenId } from '@/utils';
import {
  DigitalAsset,
  LSP4Metadata,
  LSP4MetadataAsset,
  LSP4MetadataAttribute,
  LSP4MetadataCategory,
  LSP4MetadataDescription,
  LSP4MetadataIcon,
  LSP4MetadataImage,
  LSP4MetadataLink,
  LSP4MetadataName,
  NFT,
} from '@chillwhales/typeorm';
import { LSP4DataKeys } from '@lukso/lsp4-contracts';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP4Metadata';

const LSP4_METADATA_KEY: string = LSP4DataKeys.LSP4Metadata;

/**
 * Detect whether the log originates from a TokenIdDataChanged event.
 *
 * DataChanged(bytes32 indexed dataKey, bytes dataValue) has 2 topics.
 * TokenIdDataChanged(bytes32 indexed tokenId, bytes32 indexed dataKey, bytes dataValue) has 3 topics.
 */
function isTokenIdDataChanged(log: Log): boolean {
  return log.topics.length === 3;
}

/**
 * Extract tokenId from a TokenIdDataChanged log.
 * The tokenId is the first indexed parameter (topics[1]).
 */
function extractTokenId(log: Log): string {
  return log.topics[1];
}

const LSP4MetadataPlugin: DataKeyPlugin = {
  name: 'lsp4Metadata',
  requiresVerification: [EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // Matching
  // ---------------------------------------------------------------------------

  matches(dataKey: string): boolean {
    return dataKey === LSP4_METADATA_KEY;
  },

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, _dataKey: string, dataValue: string, block: Block, ctx: IBatchContext): void {
    const { timestamp } = block.header;
    const { address } = log;
    const { value: url, decodeError } = decodeVerifiableUri(dataValue);

    if (isTokenIdDataChanged(log)) {
      // TokenIdDataChanged path: id = "{address} - {tokenId}", linked to NFT
      const tokenId = extractTokenId(log);
      const nftId = generateTokenId({ address, tokenId });

      const entity = new LSP4Metadata({
        id: nftId,
        address,
        timestamp: new Date(timestamp),
        tokenId,
        nft: new NFT({ id: nftId, tokenId, address }),
        url,
        rawValue: dataValue,
        decodeError,
        isDataFetched: false,
        retryCount: 0,
      });

      ctx.addEntity(ENTITY_TYPE, entity.id, entity);
    } else {
      // DataChanged path: id = address (no tokenId, no NFT)
      const entity = new LSP4Metadata({
        id: address,
        address,
        timestamp: new Date(timestamp),
        url,
        rawValue: dataValue,
        decodeError,
        isDataFetched: false,
        retryCount: 0,
      });

      ctx.addEntity(ENTITY_TYPE, entity.id, entity);
    }
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    const entities = ctx.getEntities<LSP4Metadata>(ENTITY_TYPE);

    for (const [id, entity] of entities) {
      if (ctx.isValid(EntityCategory.DigitalAsset, entity.address)) {
        entity.digitalAsset = new DigitalAsset({ id: entity.address });

        // For TokenIdDataChanged-sourced entities: enrich nft.digitalAsset
        if (entity.nft) {
          entity.nft = new NFT({
            ...entity.nft,
            digitalAsset: new DigitalAsset({ id: entity.address }),
          });
        }
      } else {
        ctx.removeEntity(ENTITY_TYPE, id);
      }
    }
  },

  // ---------------------------------------------------------------------------
  // Phase 4a: CLEAR SUB-ENTITIES
  // Delete-then-reinsert pattern: remove existing sub-entities before the
  // handler (Phase 5) re-creates them from freshly fetched metadata.
  // ---------------------------------------------------------------------------

  async clearSubEntities(store: Store, ctx: IBatchContext): Promise<void> {
    const entities = ctx.getEntities<LSP4Metadata>(ENTITY_TYPE);
    if (entities.size === 0) return;

    const ids = [...entities.keys()];
    const filter = { lsp4Metadata: { id: In(ids) } };

    // Find all existing sub-entities for these LSP4Metadata records
    const [assets, attributes, categories, descriptions, icons, images, links, names] =
      await Promise.all([
        store.findBy(LSP4MetadataAsset, filter),
        store.findBy(LSP4MetadataAttribute, filter),
        store.findBy(LSP4MetadataCategory, filter),
        store.findBy(LSP4MetadataDescription, filter),
        store.findBy(LSP4MetadataIcon, filter),
        store.findBy(LSP4MetadataImage, filter),
        store.findBy(LSP4MetadataLink, filter),
        store.findBy(LSP4MetadataName, filter),
      ]);

    // Remove all found sub-entities
    await Promise.all([
      store.remove(assets),
      store.remove(attributes),
      store.remove(categories),
      store.remove(descriptions),
      store.remove(icons),
      store.remove(images),
      store.remove(links),
      store.remove(names),
    ]);
  },

  // ---------------------------------------------------------------------------
  // Phase 4b: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    // Upsert main LSP4Metadata (deterministic id, may already exist)
    await upsertEntities(store, ctx, ENTITY_TYPE);
  },
};

export default LSP4MetadataPlugin;
