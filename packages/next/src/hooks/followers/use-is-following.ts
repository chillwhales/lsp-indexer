'use client';

import { getIsFollowing } from '@lsp-indexer/next/actions';
import { createUseIsFollowing } from '@lsp-indexer/react';

/** Check if one address follows another via server action. */
export const useIsFollowing = createUseIsFollowing(getIsFollowing);
