/**
 * LSP7 Transfer event plugin.
 *
 * Handles the `Transfer(address,address,address,uint256,bool,bytes)` event
 * emitted by LSP7 fungible digital assets.
 *
 * LSP7 vs LSP8 distinction: Different event signatures produce different
 * topic0 hashes. LSP7 has `uint256 amount` (non-indexed), while LSP8 has
 * `bytes32 tokenId` (indexed). This plugin only handles the LSP7 variant.
 *
 * Tracked addresses:
 *   - `from` / `to` → UniversalProfile candidates
 *   - `log.address` → DigitalAsset candidate
 *
 * Port from v1:
 *   - scanner.ts L429-438 (event matching)
 *   - utils/transfer/index.ts (extract + populate)
 */
import { updateTotalSupply } from '@/core/handlerHelpers';
import { insertEntities } from '@/core/persistHelpers';
import { populateByDA } from '@/core/populateHelpers';
import {
  Block,
  EntityCategory,
  EventPlugin,
  HandlerContext,
  IBatchContext,
  Log,
} from '@/core/types';
import { LSP7DigitalAsset } from '@chillwhales/abi';
import { Transfer } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';
import { v4 as uuidv4 } from 'uuid';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'LSP7Transfer';

const LSP7TransferPlugin: EventPlugin = {
  name: 'lsp7Transfer',
  topic0: LSP7DigitalAsset.events.Transfer.topic,
  requiresVerification: [EntityCategory.UniversalProfile, EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, block: Block, ctx: IBatchContext): void {
    const { timestamp, height } = block.header;
    const { address, logIndex, transactionIndex } = log;
    const { operator, from, to, amount, force, data } =
      LSP7DigitalAsset.events.Transfer.decode(log);

    const entity = new Transfer({
      id: uuidv4(),
      timestamp: new Date(timestamp),
      blockNumber: height,
      logIndex,
      transactionIndex,
      address,
      operator,
      from,
      to,
      amount,
      force,
      data,
      // LSP7: no tokenId, no nft
    });

    ctx.addEntity(ENTITY_TYPE, entity.id, entity);

    // Track from/to as UP candidates, contract address as DA candidate
    ctx.trackAddress(EntityCategory.UniversalProfile, from);
    ctx.trackAddress(EntityCategory.UniversalProfile, to);
    ctx.trackAddress(EntityCategory.DigitalAsset, address);
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    populateByDA<Transfer>(ctx, ENTITY_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    await insertEntities(store, ctx, ENTITY_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 5: HANDLE — Update total supply for LSP7 mints/burns
  // ---------------------------------------------------------------------------

  async handle(hctx: HandlerContext): Promise<void> {
    const entities = hctx.batchCtx.getEntities<Transfer>(ENTITY_TYPE);
    if (entities.size === 0) return;

    await updateTotalSupply(hctx.store, [...entities.values()]);
  },
};

export default LSP7TransferPlugin;
