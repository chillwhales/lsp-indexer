'use server';

import type { FetchNftsResult } from '@lsp-indexer/node';
import { fetchNft, fetchNfts, getServerUrl } from '@lsp-indexer/node';
import type { NftFilter, NftInclude, NftResult, NftSort } from '@lsp-indexer/types';

/**
 * Server action: Fetch a single NFT by collection address and token ID (or formatted token ID).
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchNft` server-side using the URL returned by `getServerUrl()`
 * (`INDEXER_URL`, falling back to `NEXT_PUBLIC_INDEXER_URL`). This keeps the
 * GraphQL endpoint invisible to the client.
 *
 * Supports searching by either `tokenId` or `formattedTokenId` (or both).
 *
 * @param address - The NFT collection contract address
 * @param tokenId - The NFT token ID within the collection (optional if formattedTokenId provided)
 * @param formattedTokenId - The formatted token ID (optional if tokenId provided)
 * @param include - Optional field inclusion config
 * @returns The parsed NFT (narrowed by include), or `null` if not found
 */
export async function getNft<const I extends NftInclude | undefined = undefined>(
  address: string,
  tokenId?: string,
  formattedTokenId?: string,
  include?: I,
): Promise<NftResult<I> | null> {
  const url = getServerUrl();
  return fetchNft(url, { address, tokenId, formattedTokenId, include });
}

/**
 * Server action: Fetch a paginated list of NFTs.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchNfts` server-side. Supports filtering, sorting, pagination, and
 * field inclusion.
 *
 * @param params - Query parameters (filter, sort, pagination, include)
 * @returns Parsed NFTs and total count
 */
export async function getNfts<const I extends NftInclude | undefined = undefined>(params?: {
  filter?: NftFilter;
  sort?: NftSort;
  limit?: number;
  offset?: number;
  include?: I;
}): Promise<FetchNftsResult<I>> {
  const url = getServerUrl();
  return fetchNfts(url, params ?? {});
}
