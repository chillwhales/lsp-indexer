import { and, asc, eq, gt, inArray, isNull } from 'drizzle-orm';
import type { RuntimeConfig } from '../config/index.js';
import { dataValues, nfts } from '../db/schema.js';
import type { PersistenceHandlerContext } from '../db/target.js';
import {
  DATA_KEYS,
  decodeLsp8BaseUri,
  decodeLsp8TokenIdFormat,
  deriveTokenUri,
  formatTokenId,
} from './standards.js';
import type { DigitalAssetRow, NftRow, ProjectionState } from './state.js';

const RECOVERY_PAGE_SIZE = 500;

type ProjectionTransaction = PersistenceHandlerContext['tx'];

export interface Lsp8MetadataLocationRecoveryPage {
  digitalAssets: DigitalAssetRow[];
  nfts: NftRow[];
}

function chunks<T>(values: readonly T[]): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += RECOVERY_PAGE_SIZE) {
    result.push(values.slice(index, index + RECOVERY_PAGE_SIZE));
  }
  return result;
}

function recoverAssetLocations(
  state: ProjectionState,
  addresses: readonly string[],
  rows: readonly (typeof dataValues.$inferSelect)[],
): Map<string, DigitalAssetRow> {
  const baseUris = new Map<string, string | null>();
  const tokenIdFormats = new Map<string, number | null>();
  for (const row of rows) {
    if (row.dataKey === DATA_KEYS.lsp8MetadataBaseUri) {
      baseUris.set(row.address, decodeLsp8BaseUri(row.dataValue));
    } else if (row.dataKey === DATA_KEYS.lsp8TokenIdFormat) {
      tokenIdFormats.set(row.address, decodeLsp8TokenIdFormat(row.dataValue));
    }
  }

  const recovered = new Map<string, DigitalAssetRow>();
  for (const address of addresses) {
    const asset = state.digitalAssets.get(address);
    if (asset?.verification !== 'verified' || asset.standard !== 'lsp8') continue;
    recovered.set(address, {
      ...asset,
      baseUri: baseUris.has(address) ? (baseUris.get(address) ?? null) : asset.baseUri,
      tokenIdFormat: tokenIdFormats.has(address)
        ? (tokenIdFormats.get(address) ?? null)
        : asset.tokenIdFormat,
    });
  }
  return recovered;
}

function changedAssets(
  state: ProjectionState,
  recovered: ReadonlyMap<string, DigitalAssetRow>,
): DigitalAssetRow[] {
  return [...recovered.values()].filter((asset) => {
    const current = state.digitalAssets.get(asset.address);
    if (current == null) return true;
    return current.baseUri !== asset.baseUri || current.tokenIdFormat !== asset.tokenIdFormat;
  });
}

function recoverNftLocation(row: NftRow, asset: DigitalAssetRow): NftRow | null {
  const formattedTokenId = formatTokenId(row.tokenId, asset.tokenIdFormat);
  const tokenUri = deriveTokenUri(asset.baseUri, formattedTokenId ?? row.tokenId);
  if (row.formattedTokenId === formattedTokenId && row.tokenUri === tokenUri) return null;
  return {
    ...row,
    formattedTokenId,
    tokenUri,
    lastBlockNumber: asset.lastBlockNumber,
    lastBlockHash: asset.lastBlockHash,
    lastTransactionHash: asset.lastTransactionHash,
    lastTransactionIndex: asset.lastTransactionIndex,
    lastLogIndex: asset.lastLogIndex,
  };
}

/** Reapply stored LSP8 location controls when a collection becomes verified again. */
export async function* loadLsp8MetadataLocationRecoveryPages(
  tx: ProjectionTransaction,
  runtime: RuntimeConfig,
  state: ProjectionState,
  collectionAddresses: readonly string[],
): AsyncGenerator<Lsp8MetadataLocationRecoveryPage, void> {
  for (const addressChunk of chunks([...new Set(collectionAddresses)])) {
    const locationRows = await tx
      .select()
      .from(dataValues)
      .where(
        and(
          eq(dataValues.chainId, runtime.network.chainId),
          inArray(dataValues.address, addressChunk),
          isNull(dataValues.tokenId),
          inArray(dataValues.dataKey, [DATA_KEYS.lsp8MetadataBaseUri, DATA_KEYS.lsp8TokenIdFormat]),
        ),
      );
    const recoveredAssets = recoverAssetLocations(state, addressChunk, locationRows);
    const assetUpdates = changedAssets(state, recoveredAssets);
    if (assetUpdates.length > 0) yield { digitalAssets: assetUpdates, nfts: [] };
    if (recoveredAssets.size === 0) continue;

    let afterId: string | null = null;
    while (true) {
      const rows = await tx
        .select()
        .from(nfts)
        .where(
          and(
            eq(nfts.chainId, runtime.network.chainId),
            inArray(nfts.address, [...recoveredAssets.keys()]),
            afterId == null ? undefined : gt(nfts.id, afterId),
          ),
        )
        .orderBy(asc(nfts.id))
        .limit(RECOVERY_PAGE_SIZE);
      if (rows.length === 0) break;
      const nftUpdates = rows.flatMap((row) => {
        const asset = recoveredAssets.get(row.address);
        if (asset == null) return [];
        const recovered = recoverNftLocation(row, asset);
        return recovered == null ? [] : [recovered];
      });
      if (nftUpdates.length > 0) yield { digitalAssets: [], nfts: nftUpdates };
      if (rows.length < RECOVERY_PAGE_SIZE) break;
      afterId = rows.at(-1)?.id ?? null;
    }
  }
}
