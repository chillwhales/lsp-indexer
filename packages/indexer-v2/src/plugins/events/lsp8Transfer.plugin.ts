/**
 * LSP8 Transfer event plugin.
 *
 * Handles the `Transfer(address,address,address,bytes32,bool,bytes)` event
 * emitted by LSP8 identifiable (NFT) digital assets.
 *
 * LSP8 vs LSP7 distinction: Different event signatures produce different
 * topic0 hashes. LSP8 has `bytes32 tokenId` (indexed), while LSP7 has
 * `uint256 amount` (non-indexed). This plugin only handles the LSP8 variant.
 *
 * In addition to creating Transfer entities, this plugin also creates NFT
 * entities for mint (from === 0x0) and burn (to === 0x0) events.
 *
 * Tracked addresses:
 *   - `from` / `to` → UniversalProfile candidates
 *   - `log.address` → DigitalAsset candidate
 *
 * NFT verification is handled differently from UP/DA: NFTs don't use
 * supportsInterface — their parent DA's LSP8 check covers them. NFT
 * entities are created directly and upserted during persist.
 *
 * Port from v1:
 *   - scanner.ts L440-452 (event matching + NFT extraction)
 *   - utils/transfer/index.ts (extract LSP8 branch + populate)
 *   - utils/transfer/nft.ts (mint/burn NFT creation)
 */
import { v4 as uuidv4 } from 'uuid';
import { zeroAddress } from 'viem';

import { LSP8IdentifiableDigitalAsset } from '@chillwhales/abi';
import { DigitalAsset, NFT, Transfer } from '@chillwhales/typeorm';
import { Store } from '@subsquid/typeorm-store';

import { updateTotalSupply } from '@/core/handlerHelpers';
import { insertEntities, populateByDA, upsertEntities } from '@/core/pluginHelpers';
import {
  Block,
  EntityCategory,
  EventPlugin,
  HandlerContext,
  IBatchContext,
  Log,
} from '@/core/types';
import { generateTokenId } from '@/utils';

// Entity type keys used in the BatchContext entity bag
const TRANSFER_TYPE = 'LSP8Transfer';
const NFT_TYPE = 'NFT';

const LSP8TransferPlugin: EventPlugin = {
  name: 'lsp8Transfer',
  topic0: LSP8IdentifiableDigitalAsset.events.Transfer.topic,
  requiresVerification: [EntityCategory.UniversalProfile, EntityCategory.DigitalAsset],

  // ---------------------------------------------------------------------------
  // Phase 1: EXTRACT
  // ---------------------------------------------------------------------------

  extract(log: Log, block: Block, ctx: IBatchContext): void {
    const { timestamp, height } = block.header;
    const { address, logIndex, transactionIndex } = log;
    const { operator, from, to, tokenId, force, data } =
      LSP8IdentifiableDigitalAsset.events.Transfer.decode(log);

    const nftId = generateTokenId({ address, tokenId });

    // Create Transfer entity (amount is always 1 for LSP8)
    const transfer = new Transfer({
      id: uuidv4(),
      timestamp: new Date(timestamp),
      blockNumber: height,
      logIndex,
      transactionIndex,
      address,
      operator,
      from,
      to,
      amount: 1n,
      tokenId,
      force,
      data,
      nft: new NFT({ id: nftId, tokenId, address }),
    });

    ctx.addEntity(TRANSFER_TYPE, transfer.id, transfer);

    // Create NFT entity for mint/burn events
    if (from === zeroAddress) {
      ctx.addEntity(
        NFT_TYPE,
        nftId,
        new NFT({
          id: nftId,
          tokenId,
          address,
          digitalAsset: new DigitalAsset({ id: address, address }),
          isMinted: true,
          isBurned: false,
        }),
      );
    } else if (to === zeroAddress) {
      ctx.addEntity(
        NFT_TYPE,
        nftId,
        new NFT({
          id: nftId,
          tokenId,
          address,
          digitalAsset: new DigitalAsset({ id: address, address }),
          isMinted: false,
          isBurned: true,
        }),
      );
    }

    // Track from/to as UP candidates, contract address as DA candidate
    ctx.trackAddress(EntityCategory.UniversalProfile, from);
    ctx.trackAddress(EntityCategory.UniversalProfile, to);
    ctx.trackAddress(EntityCategory.DigitalAsset, address);
  },

  // ---------------------------------------------------------------------------
  // Phase 3: POPULATE
  // ---------------------------------------------------------------------------

  populate(ctx: IBatchContext): void {
    // Populate Transfer entities — link to verified DigitalAsset + enrich NFT ref
    const transfers = ctx.getEntities<Transfer>(TRANSFER_TYPE);

    for (const [id, entity] of transfers) {
      if (ctx.isValid(EntityCategory.DigitalAsset, entity.address)) {
        entity.digitalAsset = new DigitalAsset({ id: entity.address });

        if (entity.nft) {
          entity.nft = new NFT({
            ...entity.nft,
            digitalAsset: new DigitalAsset({ id: entity.address }),
          });
        }
      } else {
        ctx.removeEntity(TRANSFER_TYPE, id);
      }
    }

    // Populate NFT entities — link to verified DigitalAsset
    populateByDA<NFT>(ctx, NFT_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 4: PERSIST
  // ---------------------------------------------------------------------------

  async persist(store: Store, ctx: IBatchContext): Promise<void> {
    // Upsert NFTs first (Transfers have FK references to NFTs)
    await upsertEntities(store, ctx, NFT_TYPE);
    await insertEntities(store, ctx, TRANSFER_TYPE);
  },

  // ---------------------------------------------------------------------------
  // Phase 5: HANDLE — Update total supply for LSP8 mints/burns
  // ---------------------------------------------------------------------------

  async handle(hctx: HandlerContext): Promise<void> {
    const entities = hctx.batchCtx.getEntities<Transfer>(TRANSFER_TYPE);
    if (entities.size === 0) return;

    await updateTotalSupply(hctx.store, [...entities.values()]);
  },
};

export default LSP8TransferPlugin;
