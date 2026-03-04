'use client';

import { createUseFollowCount } from '@lsp-indexer/react';
import { getFollowCount } from '../../actions/followers';

/**
 * Fetch follower and following counts for an address via Next.js server action.
 *
 * Identical API to `@lsp-indexer/react`'s `useFollowCount`, but routes the request
 * through a server action instead of calling Hasura directly from the browser.
 *
 * @param params - Address whose follow counts to fetch
 * @returns `{ followerCount, followingCount, isLoading, error, ...rest }` — follow counts
 *   with full TanStack Query state
 */
export const useFollowCount = createUseFollowCount(getFollowCount);
