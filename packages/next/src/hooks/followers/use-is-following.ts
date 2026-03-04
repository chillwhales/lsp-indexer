'use client';

import { createUseIsFollowing } from '@lsp-indexer/react';
import { getIsFollowing } from '../../actions/followers';

/**
 * Check if one address follows another via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useIsFollowing`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Two addresses to check the follow relationship between
 * @returns `{ isFollowing, isLoading, error, ...rest }` — boolean result
 *   with full TanStack Query state
 */
export const useIsFollowing = createUseIsFollowing(getIsFollowing);
