'use client';

import { createUseIsFollowing } from '@lsp-indexer/react';
import { getIsFollowing } from '../../actions/followers';

/** Check if one address follows another via server action. */
export const useIsFollowing = createUseIsFollowing(getIsFollowing);
