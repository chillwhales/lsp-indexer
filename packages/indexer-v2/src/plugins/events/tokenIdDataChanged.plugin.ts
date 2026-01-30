/**
 * TokenIdDataChanged event plugin.
 *
 * Handles the `TokenIdDataChanged(bytes32,bytes32,bytes)` event emitted by
 * LSP8 identifiable digital assets when per-token ERC725Y data is updated.
 *
 * This event fires whenever a data key is set on a specific tokenId of an
 * LSP8 contract. The plugin extracts the raw event entity, creates/upserts
 * the corresponding NFT entity, and routes data keys to DataKeyPlugins
 * via the PluginRegistry (e.g. LSP4Metadata per tokenId).
 *
 * Because the plugin needs access to the PluginRegistry for dataKey routing,
 * it uses a factory function (`createTokenIdDataChangedPlugin`) that captures
 * the registry in a closure — same pattern as the DataChanged meta-plugin.
 *
 * Tracked addresses:
 *   - `log.address` → DigitalAsset candidate
 *
 * Port from v1:
 *   - scanner.ts L454-471 (event matching + NFT extraction + dataKey routing)
 *   - utils/tokenIdDataChanged/index.ts (extract + populate)
 *   - utils/tokenIdDataChanged/nft.ts (NFT sub-extract)
 */
import { v4 as uuidv4 } from 'uuid';

import { LSP8IdentifiableDigitalAsset } from '@chillwhales/abi';
import { DigitalAsset, NFT, TokenIdDataChanged } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';

import { insertEntities, populateByDA, upsertEntities } from '@/core/pluginHelpers';
import {
  Block,
  EntityCategory,
  EventPlugin,
  IBatchContext,
  IPluginRegistry,
  Log,
} from '@/core/types';
import { generateTokenId } from '@/utils';

// Entity type keys used in the BatchContext entity bag
const TOKEN_ID_DATA_CHANGED_TYPE = 'TokenIdDataChanged';
const NFT_TYPE = 'NFT';

/**
 * Factory function that creates the TokenIdDataChanged event plugin.
 *
 * The registry is captured in closure so the plugin can route dataKeys
 * to DataKeyPlugins during extraction (e.g. LSP4Metadata per tokenId).
 */
export function createTokenIdDataChangedPlugin(registry: IPluginRegistry): EventPlugin {
  return {
    name: 'tokenIdDataChanged',
    topic0: LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.topic,
    requiresVerification: [EntityCategory.DigitalAsset],

    // -------------------------------------------------------------------------
    // Phase 1: EXTRACT
    // -------------------------------------------------------------------------

    extract(log: Log, block: Block, ctx: IBatchContext): void {
      const { timestamp, height } = block.header;
      const { address, logIndex, transactionIndex } = log;
      const { tokenId, dataKey, dataValue } =
        LSP8IdentifiableDigitalAsset.events.TokenIdDataChanged.decode(log);

      const nftId = generateTokenId({ address, tokenId });

      // Create TokenIdDataChanged entity (append-only, UUID id)
      const entity = new TokenIdDataChanged({
        id: uuidv4(),
        timestamp: new Date(timestamp),
        blockNumber: height,
        logIndex,
        transactionIndex,
        address,
        tokenId,
        dataKey,
        dataValue,
        nft: new NFT({ id: nftId, tokenId, address }),
      });

      ctx.addEntity(TOKEN_ID_DATA_CHANGED_TYPE, entity.id, entity);

      // Create NFT entity (upserted during persist).
      // Only add if not already in the batch — Transfer events take priority
      // for setting isMinted/isBurned status.
      if (!ctx.getEntities<NFT>(NFT_TYPE).has(nftId)) {
        ctx.addEntity(
          NFT_TYPE,
          nftId,
          new NFT({
            id: nftId,
            tokenId,
            address,
            digitalAsset: new DigitalAsset({ id: address, address }),
            isMinted: false,
            isBurned: false,
          }),
        );
      }

      // Track emitting contract as DigitalAsset candidate
      ctx.trackAddress(EntityCategory.DigitalAsset, address);

      // Route to the matching DataKeyPlugin (if any)
      // e.g. LSP4Metadata per tokenId
      const dataKeyPlugin = registry.getDataKeyPlugin(dataKey);
      if (dataKeyPlugin) {
        dataKeyPlugin.extract(log, dataKey, dataValue, block, ctx);
      }
    },

    // -------------------------------------------------------------------------
    // Phase 3: POPULATE
    // -------------------------------------------------------------------------

    populate(ctx: IBatchContext): void {
      // Populate TokenIdDataChanged entities — link to verified DigitalAsset + enrich NFT ref
      const entities = ctx.getEntities<TokenIdDataChanged>(TOKEN_ID_DATA_CHANGED_TYPE);

      for (const [id, entity] of entities) {
        if (ctx.isValid(EntityCategory.DigitalAsset, entity.address)) {
          entity.digitalAsset = new DigitalAsset({ id: entity.address });

          if (entity.nft) {
            entity.nft = new NFT({
              ...entity.nft,
              digitalAsset: new DigitalAsset({ id: entity.address }),
            });
          }
        } else {
          ctx.removeEntity(TOKEN_ID_DATA_CHANGED_TYPE, id);
        }
      }

      // Populate NFT entities — link to verified DigitalAsset
      populateByDA<NFT>(ctx, NFT_TYPE);
    },

    // -------------------------------------------------------------------------
    // Phase 4: PERSIST
    // -------------------------------------------------------------------------

    async persist(store: Store, ctx: IBatchContext): Promise<void> {
      // Upsert NFTs first (TokenIdDataChanged entities have FK to NFT)
      await upsertEntities(store, ctx, NFT_TYPE);
      await insertEntities(store, ctx, TOKEN_ID_DATA_CHANGED_TYPE);
    },
  };
}

export default createTokenIdDataChangedPlugin;
