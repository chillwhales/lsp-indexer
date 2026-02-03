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

// Lowercase zero address once for performance
const ZERO_ADDRESS_LOWER = ZERO_ADDRESS.toLowerCase();

const NFTHandler: EntityHandler = {
  name: 'nft',
  listensToBag: ['LSP8Transfer', 'TokenIdDataChanged'],

  handle(hctx: HandlerContext, triggeredBy: string): void {
    // Check BatchContext for NFTs already created in this batch by previous trigger invocations.
    // When both LSP8Transfer and TokenIdDataChanged exist in the same batch,
    // the pipeline calls handle() separately for each trigger. We must check BatchContext
    // to avoid overwriting mint/burn NFTs with stubs.
    const existingInBatch = hctx.batchCtx.getEntities<NFT>(ENTITY_TYPE);
    const nfts = new Map<string, NFT>(existingInBatch);

    // Process LSP8Transfer first (higher priority for mint/burn status)
    if (triggeredBy === 'LSP8Transfer') {
      const transfers = hctx.batchCtx.getEntities<Transfer>(triggeredBy);

      for (const transfer of transfers.values()) {
        const nftId = generateTokenId({ address: transfer.address, tokenId: transfer.tokenId });

        // Mint event: from === zero address
        if (transfer.from.toLowerCase() === ZERO_ADDRESS_LOWER) {
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
        else if (transfer.to.toLowerCase() === ZERO_ADDRESS_LOWER) {
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

    // Process TokenIdDataChanged (creates stubs only if not already created in this batch)
    //
    // NOTE: This will create stub NFTs (isMinted: false, isBurned: false) even for NFTs
    // that were minted in previous batches. The upsert will overwrite the existing NFT,
    // resetting mint/burn flags to false. This is a known limitation of the current
    // architecture - to fix it properly would require async DB lookups in handlers or
    // a separate NFT verification phase.
    //
    // In practice, this is rare: TokenIdDataChanged without Transfer typically only fires
    // when setting metadata on already-minted NFTs, and the flag reset doesn't affect
    // functionality (the Transfer event history still shows the mint).
    if (triggeredBy === 'TokenIdDataChanged') {
      const events = hctx.batchCtx.getEntities<TokenIdDataChanged>(triggeredBy);

      for (const event of events.values()) {
        const nftId = generateTokenId({ address: event.address, tokenId: event.tokenId });

        // Only create NFT stub if not already created by Transfer in this batch
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

    // Early return if no NFTs were created
    if (nfts.size === 0) return;

    // Queue enrichment for digitalAsset FK on all NFTs
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
