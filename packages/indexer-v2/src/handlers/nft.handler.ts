/**
 * NFT entity handler.
 *
 * Subscribes to LSP8Transfer and TokenIdDataChanged events and creates NFT
 * entities with deterministic ids. Sets isMinted/isBurned flags based on
 * Transfer mint/burn events. Queues enrichment for digitalAsset FK.
 *
 * NFT entity creation priority:
 *   1. LSP8Transfer (mint/burn) — creates NFT with isMinted or isBurned flag
 *   2. TokenIdDataChanged — creates NFT stub only if not already in batch
 *
 * The formattedTokenId field is left null — formatting is handled by the
 * FormattedTokenId handler (issue #113) which runs after NFT creation.
 *
 * Port from v1:
 *   - utils/transfer/index.ts (NFT extraction from LSP8 Transfer)
 *   - utils/tokenIdDataChanged/index.ts (NFT stub creation)
 */
import { ZERO_ADDRESS } from '@/constants';
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { generateTokenId } from '@/utils';
import { NFT, TokenIdDataChanged, Transfer } from '@chillwhales/typeorm';

// Entity type key used in the BatchContext entity bag
const ENTITY_TYPE = 'NFT';

const NFTHandler: EntityHandler = {
  name: 'nft',
  listensToBag: ['LSP8Transfer', 'TokenIdDataChanged'],

  handle(hctx: HandlerContext, triggeredBy: string): void {
    const nfts = new Map<string, NFT>();

    // ---------------------------------------------------------------------------
    // Process LSP8Transfer first (higher priority for mint/burn status)
    // ---------------------------------------------------------------------------
    if (triggeredBy === 'LSP8Transfer') {
      const transfers = hctx.batchCtx.getEntities<Transfer>(triggeredBy);

      for (const transfer of transfers.values()) {
        const nftId = generateTokenId({ address: transfer.address, tokenId: transfer.tokenId });

        // Mint event: from === zero address
        if (transfer.from.toLowerCase() === ZERO_ADDRESS.toLowerCase()) {
          nfts.set(
            nftId,
            new NFT({
              id: nftId,
              tokenId: transfer.tokenId,
              address: transfer.address,
              formattedTokenId: null, // Populated by FormattedTokenId handler (issue #113)
              digitalAsset: null, // FK resolved via enrichment
              isMinted: true,
              isBurned: false,
            }),
          );
        }
        // Burn event: to === zero address
        else if (transfer.to.toLowerCase() === ZERO_ADDRESS.toLowerCase()) {
          nfts.set(
            nftId,
            new NFT({
              id: nftId,
              tokenId: transfer.tokenId,
              address: transfer.address,
              formattedTokenId: null, // Populated by FormattedTokenId handler (issue #113)
              digitalAsset: null, // FK resolved via enrichment
              isMinted: false,
              isBurned: true,
            }),
          );
        }
      }
    }

    // ---------------------------------------------------------------------------
    // Process TokenIdDataChanged (creates stubs only if not already created by Transfer)
    // ---------------------------------------------------------------------------
    if (triggeredBy === 'TokenIdDataChanged') {
      const events = hctx.batchCtx.getEntities<TokenIdDataChanged>(triggeredBy);

      for (const event of events.values()) {
        const nftId = generateTokenId({ address: event.address, tokenId: event.tokenId });

        // Only create NFT stub if Transfer didn't already create it
        if (!nfts.has(nftId)) {
          nfts.set(
            nftId,
            new NFT({
              id: nftId,
              tokenId: event.tokenId,
              address: event.address,
              formattedTokenId: null, // Populated by FormattedTokenId handler (issue #113)
              digitalAsset: null, // FK resolved via enrichment
              isMinted: false,
              isBurned: false,
            }),
          );
        }
      }
    }

    // ---------------------------------------------------------------------------
    // Queue enrichment for digitalAsset FK on all NFTs
    // ---------------------------------------------------------------------------
    for (const nft of nfts.values()) {
      hctx.batchCtx.queueEnrichment<NFT>({
        category: EntityCategory.DigitalAsset,
        address: nft.address,
        entityType: ENTITY_TYPE,
        entityId: nft.id,
        fkField: 'digitalAsset',
      });

      hctx.batchCtx.addEntity(ENTITY_TYPE, nft.id, nft);
    }
  },
};

export default NFTHandler;
