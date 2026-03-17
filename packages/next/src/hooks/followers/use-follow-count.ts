'use client';

import { getFollowCount } from '@lsp-indexer/next/actions';
import { createUseFollowCount } from '@lsp-indexer/react';

/** Fetch follower/following counts via server action. */
export const useFollowCount = createUseFollowCount(getFollowCount);
