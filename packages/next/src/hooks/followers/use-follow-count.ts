'use client';

import { createUseFollowCount } from '@lsp-indexer/react';
import { getFollowCount } from '@lsp-indexer/next/actions';

/** Fetch follower/following counts via server action. */
export const useFollowCount = createUseFollowCount(getFollowCount);
