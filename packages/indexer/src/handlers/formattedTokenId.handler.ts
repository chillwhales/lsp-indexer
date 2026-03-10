/**
 * FormattedTokenId Entity Handler.
 *
 * Populates `NFT.formattedTokenId` based on the LSP8TokenIdFormat for the
 * contract. Has an explicit dependency on the lsp8TokenIdFormat handler
 * (the registry ensures it runs after lsp8TokenIdFormat in topological order).
 *
 * Two paths:
 *   1. New batch NFTs — look up the token ID format (from BatchContext +
 *      DB), set formattedTokenId by mutating the NFT entity IN PLACE.
 *   2. Format changes — when LSP8TokenIdFormat changes, retroactively query
 *      ALL existing NFTs for the affected contracts from DB and reformat.
 *
 * When the token ID format is unknown or not yet set, `formattedTokenId`
 * is left as null. A warning is logged for unknown formats to aid debugging.
 */

import { EntityHandler, HandlerContext } from '@/core/types';
import { formatTokenId } from '@/utils';
import { LSP8TokenIdFormat, NFT } from '@chillwhales/typeorm';
import { In } from 'typeorm';
import { isHex } from 'viem';

// Entity type keys used in BatchContext entity bag
const NFT_ENTITY_TYPE = 'NFT';
const TOKEN_ID_FORMAT_ENTITY_TYPE = 'LSP8TokenIdFormat';

const FormattedTokenIdHandler: EntityHandler = {
  name: 'formattedTokenId',
  listensToBag: ['LSP8Transfer', 'DataChanged'],
  dependsOn: ['lsp8TokenIdFormat'],

  async handle(hctx: HandlerContext, _triggeredBy: string): Promise<void> {
    const { store, context, batchCtx } = hctx;

    // -----------------------------------------------------------------------
    // Path 1: New batch NFTs — look up format, set formattedTokenId in place
    // -----------------------------------------------------------------------
    const batchNfts = batchCtx.getEntities(NFT_ENTITY_TYPE) as Map<string, NFT>;
    const nftsWithoutFormat = [...batchNfts.values()].filter(
      (nft) => nft.formattedTokenId === null || nft.formattedTokenId === undefined,
    );

    if (nftsWithoutFormat.length > 0) {
      // Collect unique contract addresses from NFTs needing formatting
      const nftAddresses = [...new Set(nftsWithoutFormat.map((nft) => nft.address))];

      // Load formats from both DB and current batch
      // NOTE: Uses address-based query (not ID-based), so resolveEntities is not applicable.
      // LSP8TokenIdFormat entities are queried by address field, not by id field.
      const dbFormats =
        nftAddresses.length > 0
          ? await store.findBy(LSP8TokenIdFormat, { address: In(nftAddresses) })
          : [];
      const batchFormats = batchCtx.getEntities(TOKEN_ID_FORMAT_ENTITY_TYPE) as Map<
        string,
        LSP8TokenIdFormat
      >;
      const allFormats = [...dbFormats, ...batchFormats.values()];

      for (const nft of nftsWithoutFormat) {
        // Find the most recent format for this contract (batch formats are newer)
        const latestFormat = allFormats
          .filter((f) => f.address === nft.address)
          .sort((a, b) => b.timestamp.valueOf() - a.timestamp.valueOf())[0];

        if (!isHex(nft.tokenId)) {
          nft.formattedTokenId = null;
          continue;
        }

        const formatted = formatTokenId({
          tokenId: nft.tokenId,
          lsp8TokenIdFormat: latestFormat?.value ?? null,
        });

        if (formatted === null && latestFormat?.value != null) {
          context.log.warn(
            {
              step: 'HANDLE',
              handler: 'formattedTokenId',
              address: nft.address,
              tokenId: nft.tokenId,
              format: latestFormat?.value,
            },
            'Unknown LSP8TokenIdFormat — leaving formattedTokenId as null',
          );
        }

        // Mutate NFT in place — it's already in BatchContext, pipeline will persist it
        nft.formattedTokenId = formatted;
      }
    }

    // -----------------------------------------------------------------------
    // Path 2: Format changes — retroactively reformat ALL existing NFTs
    // -----------------------------------------------------------------------
    const newFormats = [
      ...(
        batchCtx.getEntities(TOKEN_ID_FORMAT_ENTITY_TYPE) as Map<string, LSP8TokenIdFormat>
      ).values(),
    ];
    if (newFormats.length === 0) return;

    // Collect addresses with format changes
    const formatAddresses = [...new Set(newFormats.map((f) => f.address))];

    // IDs of NFTs already updated in Path 1 — skip them in Path 2
    const alreadyUpdatedIds = new Set(nftsWithoutFormat.map((nft) => nft.id));

    // Query ALL existing NFTs for affected contracts from DB
    // NOTE: Uses address-based query (not ID-based), so resolveEntities is not applicable.
    // We need ALL NFTs for each contract address to retroactively format them.
    const existingNfts =
      formatAddresses.length > 0 ? await store.findBy(NFT, { address: In(formatAddresses) }) : [];

    // Filter out NFTs already updated in Path 1
    const nftsToReformat = existingNfts.filter((nft) => !alreadyUpdatedIds.has(nft.id));

    if (nftsToReformat.length === 0) return;

    // Build a lookup: address → latest format from the new batch
    const formatByAddress = new Map<string, LSP8TokenIdFormat>();
    for (const format of newFormats) {
      const existing = formatByAddress.get(format.address);
      if (!existing || format.timestamp.valueOf() > existing.timestamp.valueOf()) {
        formatByAddress.set(format.address, format);
      }
    }

    for (const nft of nftsToReformat) {
      const format = formatByAddress.get(nft.address);
      if (!format) continue;

      if (!isHex(nft.tokenId)) {
        nft.formattedTokenId = null;
      } else {
        const formatted = formatTokenId({
          tokenId: nft.tokenId,
          lsp8TokenIdFormat: format.value ?? null,
        });

        if (formatted === null && format.value != null) {
          context.log.warn(
            {
              step: 'HANDLE',
              handler: 'formattedTokenId',
              address: nft.address,
              tokenId: nft.tokenId,
              format: format.value,
            },
            'Unknown LSP8TokenIdFormat — leaving formattedTokenId as null (retroactive)',
          );
        }

        nft.formattedTokenId = formatted;
      }

      // Add reformatted existing NFTs to BatchContext for persistence
      batchCtx.addEntity(NFT_ENTITY_TYPE, nft.id, nft);
    }
  },
};

export default FormattedTokenIdHandler;
