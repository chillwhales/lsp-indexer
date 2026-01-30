/**
 * LSP3Profile data key plugin.
 *
 * Handles the `LSP3Profile` data key (`0x5ef83ad9...`) emitted via
 * `DataChanged(bytes32,bytes)` on Universal Profiles.
 *
 * When a UP updates its profile metadata, this plugin:
 *   1. Decodes the VerifiableURI from the data value to get a metadata URL
 *   2. Creates/updates the `LSP3Profile` entity (deterministic id = address)
 *   3. Clears existing sub-entities before re-inserting (delete-then-reinsert)
 *
 * Sub-entity creation and metadata fetching are handled by the LSP3 metadata
 * fetch handler (Phase 5, issue #53). This plugin only persists the main
 * LSP3Profile entity with `isDataFetched: false`.
 *
 * Port from v1:
 *   - utils/dataChanged/lsp3Profile.ts (extract + populate + clearSubEntities)
 *   - app/index.ts L195-200, L420 (clear + upsert)
 */
import { LSP3DataKeys } from '@lukso/lsp3-contracts';

import {
  LSP3Profile,
  LSP3ProfileAsset,
  LSP3ProfileBackgroundImage,
  LSP3ProfileDescription,
  LSP3ProfileImage,
  LSP3ProfileLink,
  LSP3ProfileName,
  LSP3ProfileTag,
  UniversalProfile,
} from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { In } from 'typeorm';

import { upsertEntities } from '@/core/pluginHelpers';
import { Block, DataKeyPlugin, EntityCategory, IBatchContext, Log } from '@/core/types';
import { decodeVerifiableUri } from '@/utils';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP3Profile';

const LSP3_DATA_KEY: string = LSP3DataKeys.LSP3Profile;

const LSP3ProfilePlugin: DataKeyPlugin = {
  name: 'lsp3Profile',
  requiresVerification: [EntityCategory.UniversalProfile],

  // ---------------------------------------------------------------------------
  // Matching
  // ---------------------------------------------------------------------------

  matches(dataKey: string): boolean {
    return dataKey === LSP3_DATA_KEY;
  },

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, _dataKey: string, dataValue: string, block: Block, ctx: IBatchContext): void {
    const { timestamp } = block.header;
    const { address } = log;
    const { value: url, decodeError } = decodeVerifiableUri(dataValue);

    // Deterministic id = contract address (later events overwrite earlier ones
    // in the same batch, matching v1 Map<string, LSP3Profile> behavior)
    const entity = new LSP3Profile({
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

    // Address tracking is handled by the DataChanged meta-plugin (parent)
    // which already tracks log.address as both UP and DA candidates.
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    const entities = ctx.getEntities<LSP3Profile>(ENTITY_TYPE);

    for (const [id, entity] of entities) {
      if (ctx.isValid(EntityCategory.UniversalProfile, entity.address)) {
        entity.universalProfile = new UniversalProfile({ id: entity.address });
      } else {
        // Not a verified UP — remove the LSP3Profile entity
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
    const entities = ctx.getEntities<LSP3Profile>(ENTITY_TYPE);
    if (entities.size === 0) return;

    const ids = [...entities.keys()];
    const filter = { lsp3Profile: { id: In(ids) } };

    // Find all existing sub-entities for these LSP3Profiles
    const [assets, bgImages, descriptions, images, links, names, tags] = await Promise.all([
      store.findBy(LSP3ProfileAsset, filter),
      store.findBy(LSP3ProfileBackgroundImage, filter),
      store.findBy(LSP3ProfileDescription, filter),
      store.findBy(LSP3ProfileImage, filter),
      store.findBy(LSP3ProfileLink, filter),
      store.findBy(LSP3ProfileName, filter),
      store.findBy(LSP3ProfileTag, filter),
    ]);

    // Remove all found sub-entities
    await Promise.all([
      store.remove(assets),
      store.remove(bgImages),
      store.remove(descriptions),
      store.remove(images),
      store.remove(links),
      store.remove(names),
      store.remove(tags),
    ]);
  },

  // ---------------------------------------------------------------------------
  // Phase 4b: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    // Upsert main LSP3Profile (deterministic id = address, may already exist)
    await upsertEntities(store, ctx, ENTITY_TYPE);
  },
};

export default LSP3ProfilePlugin;
