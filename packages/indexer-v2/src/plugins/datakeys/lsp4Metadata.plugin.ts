/**
 * LSP4Metadata data key plugin.
 *
 * Handles the `LSP4Metadata` VerifiableURI data key emitted via
 * `DataChanged(bytes32,bytes)` on Digital Assets.
 *
 * When metadata is updated, this plugin:
 *   1. Decodes the VerifiableURI from the data value to get a metadata URL
 *   2. Creates/updates the `LSP4Metadata` entity (deterministic id = address)
 *   3. Clears existing sub-entities before re-inserting (delete-then-reinsert)
 *
 * Sub-entity creation and metadata fetching are handled by the LSP4 metadata
 * fetch handler (Phase 5, issue #54). This plugin only persists the main
 * LSP4Metadata entity with `isDataFetched: false`.
 *
 * Port from v1:
 *   - utils/dataChanged/lsp4Metadata.ts (extract + populate + clearSubEntities)
 *   - app/index.ts L202-206, L423-424 (clear + upsert)
 */
import { LSP4DataKeys } from '@lukso/lsp4-contracts';

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
} from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';

import { populateByDA, upsertEntities } from '@/core/pluginHelpers';
import { Block, DataKeyPlugin, EntityCategory, IBatchContext, Log } from '@/core/types';
import { decodeVerifiableUri } from '@/utils';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP4Metadata';

const LSP4_METADATA_KEY: string = LSP4DataKeys.LSP4Metadata;

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

    // Deterministic id = contract address (later events overwrite earlier ones
    // in the same batch, matching v1 Map<string, LSP4Metadata> behavior)
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
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    populateByDA<LSP4Metadata>(ctx, ENTITY_TYPE);
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
    // Upsert main LSP4Metadata (deterministic id = address, may already exist)
    await upsertEntities(store, ctx, ENTITY_TYPE);
  },
};

export default LSP4MetadataPlugin;
