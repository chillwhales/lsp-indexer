/**
 * OwnedAssets entity handler.
 *
 * Subscribes to both LSP7Transfer and LSP8Transfer events. For each batch,
 * it processes all transfers to maintain OwnedAsset (balance tracking) and
 * OwnedToken (individual NFT ownership) records.
 *
 * Key behaviors:
 * - Dual-trigger: runs once per trigger ('LSP7Transfer' or 'LSP8Transfer'),
 *   but accumulates from BOTH bags each time to produce a single consistent
 *   result per batch.
 * - Sender side: decrements balance (OwnedAsset), marks OwnedToken for deletion.
 * - Receiver side: increments balance or creates new OwnedAsset, creates OwnedToken.
 * - Deletes OwnedAsset records when balance reaches zero.
 * - Deletes OwnedToken records when token is transferred away (sender side).
 * - OwnedToken FK to OwnedAsset — deletes OwnedTokens FIRST, then OwnedAssets
 *   (FK ordering via separate queueDelete calls).
 * - Queues enrichment for digitalAsset, universalProfile, nft, and ownedAsset FKs
 *   — never sets FKs directly.
 * - ID format: `{owner}:{address}` for OwnedAsset, `{owner}:{address}:{tokenId}`
 *   for OwnedToken.
 *
 * Port from v1:
 *   - core/handlerHelpers.ts → updateOwnedAssets() (deleted in 01-04)
 *   - handlers/ownedAssetsHandler.ts
 *   - utils/transfer/ownedAsset.ts
 *   - utils/transfer/ownedToken.ts
 */
import { EntityCategory, EntityHandler, HandlerContext } from '@/core/types';
import { generateOwnedAssetId, generateOwnedTokenId, isNullAddress } from '@/utils';
import { OwnedAsset, OwnedToken, Transfer } from '@chillwhales/typeorm';
import { In } from 'typeorm';
import { getAddress, isAddressEqual, zeroAddress } from 'viem';

// Entity type keys used in the BatchContext entity bag
const OWNED_ASSET_TYPE = 'OwnedAsset';
const OWNED_TOKEN_TYPE = 'OwnedToken';

const OwnedAssetsHandler: EntityHandler = {
  name: 'ownedAssets',
  listensToBag: ['LSP7Transfer', 'LSP8Transfer'],

  async handle(hctx: HandlerContext, triggeredBy: string): Promise<void> {
    // Only process transfers from the triggered bag (prevents double-processing)
    // Handler is called twice per batch: once for LSP7Transfer, once for LSP8Transfer
    const allTransfers: Transfer[] =
      triggeredBy === 'LSP7Transfer'
        ? [...hctx.batchCtx.getEntities<Transfer>('LSP7Transfer').values()]
        : triggeredBy === 'LSP8Transfer'
          ? [...hctx.batchCtx.getEntities<Transfer>('LSP8Transfer').values()]
          : [];

    if (allTransfers.length === 0) return;

    // Collect all potential OwnedAsset and OwnedToken IDs for bulk DB load
    const ownedAssetIds = new Set<string>();
    const ownedTokenIds = new Set<string>();

    for (const { address, from, to, tokenId } of allTransfers) {
      if (!isAddressEqual(getAddress(from), zeroAddress)) {
        ownedAssetIds.add(generateOwnedAssetId({ owner: from, address }));
      }
      if (!isAddressEqual(getAddress(to), zeroAddress)) {
        ownedAssetIds.add(generateOwnedAssetId({ owner: to, address }));
      }

      if (tokenId) {
        if (!isAddressEqual(getAddress(from), zeroAddress)) {
          ownedTokenIds.add(generateOwnedTokenId({ owner: from, address, tokenId }));
        }
        if (!isAddressEqual(getAddress(to), zeroAddress)) {
          ownedTokenIds.add(generateOwnedTokenId({ owner: to, address, tokenId }));
        }
      }
    }

    // Load existing entities from database
    const [existingOwnedAssetsMap, existingOwnedTokensMap] = await Promise.all([
      ownedAssetIds.size > 0
        ? hctx.store
            .findBy(OwnedAsset, { id: In([...ownedAssetIds]) })
            .then((entities) => new Map(entities.map((e) => [e.id, e])))
        : Promise.resolve(new Map<string, OwnedAsset>()),
      ownedTokenIds.size > 0
        ? hctx.store
            .findBy(OwnedToken, { id: In([...ownedTokenIds]) })
            .then((entities) => new Map(entities.map((e) => [e.id, e])))
        : Promise.resolve(new Map<string, OwnedToken>()),
    ]);

    // Also check what's already in the BatchContext (from a previous trigger invocation)
    const batchOwnedAssets = hctx.batchCtx.getEntities<OwnedAsset>(OWNED_ASSET_TYPE);
    const batchOwnedTokens = hctx.batchCtx.getEntities<OwnedToken>(OWNED_TOKEN_TYPE);

    const updatedOwnedAssetsMap = new Map<string, OwnedAsset>();
    const updatedOwnedTokensMap = new Map<string, OwnedToken>();

    for (const transfer of allTransfers) {
      const { timestamp, blockNumber, address, from, to, amount, tokenId } = transfer;

      // --- OwnedAsset: decrement sender (floor at 0 to prevent underflow) ---
      if (!isAddressEqual(getAddress(from), zeroAddress)) {
        const fromId = generateOwnedAssetId({ owner: from, address });
        const existing =
          updatedOwnedAssetsMap.get(fromId) ??
          batchOwnedAssets.get(fromId) ??
          existingOwnedAssetsMap.get(fromId);

        if (existing) {
          const newBalance = existing.balance >= amount ? existing.balance - amount : 0n;
          updatedOwnedAssetsMap.set(
            fromId,
            new OwnedAsset({
              ...existing,
              block: blockNumber,
              timestamp,
              balance: newBalance,
              // Explicitly preserve FK fields for enrichment
              digitalAsset: existing.digitalAsset ?? null,
              universalProfile: existing.universalProfile ?? null,
            }),
          );
        }
      }

      // --- OwnedAsset: increment receiver ---
      if (!isAddressEqual(getAddress(to), zeroAddress)) {
        const toId = generateOwnedAssetId({ owner: to, address });
        const existing =
          updatedOwnedAssetsMap.get(toId) ??
          batchOwnedAssets.get(toId) ??
          existingOwnedAssetsMap.get(toId);

        if (existing) {
          updatedOwnedAssetsMap.set(
            toId,
            new OwnedAsset({
              ...existing,
              block: blockNumber,
              timestamp,
              balance: existing.balance + amount,
              // Explicitly preserve FK fields for enrichment
              digitalAsset: existing.digitalAsset ?? null,
              universalProfile: existing.universalProfile ?? null,
            }),
          );
        } else {
          // Create new OwnedAsset for first-time holder
          // FKs are null — enrichment queue handles FK resolution
          updatedOwnedAssetsMap.set(
            toId,
            new OwnedAsset({
              id: toId,
              block: blockNumber,
              timestamp,
              balance: amount,
              address,
              owner: to,
              digitalAsset: null,
              universalProfile: null,
            }),
          );
        }
      }

      // --- OwnedToken: mark sender's token for deletion ---
      if (tokenId && !isAddressEqual(getAddress(from), zeroAddress)) {
        const fromId = generateOwnedTokenId({ owner: from, address, tokenId });
        const existing =
          updatedOwnedTokensMap.get(fromId) ??
          batchOwnedTokens.get(fromId) ??
          existingOwnedTokensMap.get(fromId);

        if (existing) {
          // Mark for deletion by setting tokenId to null sentinel
          updatedOwnedTokensMap.set(
            fromId,
            new OwnedToken({
              ...existing,
              block: blockNumber,
              timestamp,
              tokenId: null as unknown as string,
              // Explicitly preserve FK fields for enrichment
              digitalAsset: existing.digitalAsset ?? null,
              universalProfile: existing.universalProfile ?? null,
              nft: existing.nft ?? null,
              ownedAsset: existing.ownedAsset ?? null,
            }),
          );
        }
      }

      // --- OwnedToken: add to receiver ---
      if (tokenId && !isAddressEqual(getAddress(to), zeroAddress)) {
        const toId = generateOwnedTokenId({ owner: to, address, tokenId });
        const existing =
          updatedOwnedTokensMap.get(toId) ??
          batchOwnedTokens.get(toId) ??
          existingOwnedTokensMap.get(toId);

        if (existing) {
          // Restore/update existing OwnedToken
          updatedOwnedTokensMap.set(
            toId,
            new OwnedToken({
              ...existing,
              block: blockNumber,
              timestamp,
              tokenId,
              // Explicitly preserve FK fields for enrichment
              digitalAsset: existing.digitalAsset ?? null,
              universalProfile: existing.universalProfile ?? null,
              nft: existing.nft ?? null,
              ownedAsset: existing.ownedAsset ?? null,
            }),
          );
        } else {
          // Create new OwnedToken for receiver
          // FKs are null — enrichment queue handles FK resolution
          updatedOwnedTokensMap.set(
            toId,
            new OwnedToken({
              id: toId,
              block: blockNumber,
              timestamp,
              address,
              tokenId,
              owner: to,
              nft: null,
              digitalAsset: null,
              universalProfile: null,
              ownedAsset: null,
            }),
          );
        }
      }
    }

    // Separate entities to save vs delete
    const ownedAssetsToSave = [...updatedOwnedAssetsMap.entries()].filter(
      ([, { balance }]) => balance > 0n,
    );
    const ownedAssetsToDelete = [...updatedOwnedAssetsMap.values()].filter(
      ({ balance }) => balance === 0n,
    );

    const ownedTokensToSave = [...updatedOwnedTokensMap.entries()].filter(
      ([, { tokenId }]) => tokenId != null,
    );
    const ownedTokensToDelete = [...updatedOwnedTokensMap.values()].filter(
      ({ tokenId }) => tokenId == null,
    );

    // Queue deletions: OwnedTokens FIRST, then OwnedAssets (FK ordering)
    if (ownedTokensToDelete.length > 0) {
      hctx.batchCtx.queueDelete<OwnedToken>({
        entityClass: OwnedToken,
        entities: ownedTokensToDelete,
      });
    }

    if (ownedAssetsToDelete.length > 0) {
      hctx.batchCtx.queueDelete<OwnedAsset>({
        entityClass: OwnedAsset,
        entities: ownedAssetsToDelete,
      });
    }

    // Add saveable entities to BatchContext + queue enrichment
    for (const [id, entity] of ownedAssetsToSave) {
      hctx.batchCtx.addEntity(OWNED_ASSET_TYPE, id, entity);

      // Queue enrichment for digitalAsset FK
      if (!isNullAddress(entity.address)) {
        hctx.batchCtx.queueEnrichment<OwnedAsset>({
          category: EntityCategory.DigitalAsset,
          address: entity.address,
          entityType: OWNED_ASSET_TYPE,
          entityId: id,
          fkField: 'digitalAsset',
        });
      }

      // Queue enrichment for universalProfile FK
      if (!isNullAddress(entity.owner)) {
        hctx.batchCtx.queueEnrichment<OwnedAsset>({
          category: EntityCategory.UniversalProfile,
          address: entity.owner,
          entityType: OWNED_ASSET_TYPE,
          entityId: id,
          fkField: 'universalProfile',
        });
      }
    }

    for (const [id, entity] of ownedTokensToSave) {
      hctx.batchCtx.addEntity(OWNED_TOKEN_TYPE, id, entity);

      // Queue enrichment for digitalAsset FK
      if (!isNullAddress(entity.address)) {
        hctx.batchCtx.queueEnrichment<OwnedToken>({
          category: EntityCategory.DigitalAsset,
          address: entity.address,
          entityType: OWNED_TOKEN_TYPE,
          entityId: id,
          fkField: 'digitalAsset',
        });
      }

      // Queue enrichment for universalProfile FK
      if (!isNullAddress(entity.owner)) {
        hctx.batchCtx.queueEnrichment<OwnedToken>({
          category: EntityCategory.UniversalProfile,
          address: entity.owner,
          entityType: OWNED_TOKEN_TYPE,
          entityId: id,
          fkField: 'universalProfile',
        });
      }

      // Queue enrichment for nft FK (only for tokens with tokenId)
      if (entity.tokenId && !isNullAddress(entity.address)) {
        hctx.batchCtx.queueEnrichment<OwnedToken>({
          category: EntityCategory.NFT,
          address: entity.address,
          tokenId: entity.tokenId,
          entityType: OWNED_TOKEN_TYPE,
          entityId: id,
          fkField: 'nft',
        });
      }

      // Queue enrichment for ownedAsset FK
      // The parent OwnedAsset may have been created in this same batch
      const parentAssetId = generateOwnedAssetId({ owner: entity.owner, address: entity.address });
      const parentExists =
        updatedOwnedAssetsMap.has(parentAssetId) ||
        batchOwnedAssets.has(parentAssetId) ||
        existingOwnedAssetsMap.has(parentAssetId);

      if (parentExists) {
        // Set ownedAsset FK directly since we know the parent exists in this batch
        // and OwnedAsset is not a verified entity — it's handler-created.
        // We can't use enrichment queue for this since OwnedAsset is not a core entity
        // (UP, DA, NFT). Instead, set it directly on the entity.
        entity.ownedAsset = new OwnedAsset({ id: parentAssetId });
      }
    }
  },
};

export default OwnedAssetsHandler;
