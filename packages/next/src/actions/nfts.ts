'use server';

import type { FetchNftsResult } from '@lsp-indexer/node';
import { fetchNft, fetchNfts, getServerUrl } from '@lsp-indexer/node';
import type { Nft, NftFilter, NftSort } from '@lsp-indexer/types';

/**
 * Server action: Fetch a single NFT by collection address and token ID.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchNft` server-side using the Hasura URL from the server environment.
 * This keeps the GraphQL endpoint invisible to the client.
 *
 * @param address - The collection contract address
 * @param tokenId - The token ID within the collection
 * @returns The parsed NFT, or `null` if not found
 */
export async function getNft(address: string, tokenId: string): Promise<Nft | null> {
  const url = getServerUrl();
  return fetchNft(url, { address, tokenId });
}

/**
 * Server action: Fetch a paginated list of NFTs.
 *
 * Runs on the Next.js server — the browser calls this action, which executes
 * `fetchNfts` server-side. Supports filtering, sorting, and pagination.
 *
 * @param params - Query parameters (filter, sort, pagination)
 * @returns Parsed NFTs and total count
 */
export async function getNfts(params?: {
  filter?: NftFilter;
  sort?: NftSort;
  limit?: number;
  offset?: number;
}): Promise<FetchNftsResult> {
  const url = getServerUrl();
  return fetchNfts(url, params ?? {});
}
