'use client';

import { getIsFollowingBatch } from '@lsp-indexer/next/actions';
import { createUseIsFollowingBatch } from '@lsp-indexer/react';

/** Check if multiple follower→followed pairs exist via server action. Reconstructs Map from serialized Record. */
export const useIsFollowingBatch = createUseIsFollowingBatch(async (pairs) => {
  const record = await getIsFollowingBatch(pairs);
  return new Map(Object.entries(record));
});
