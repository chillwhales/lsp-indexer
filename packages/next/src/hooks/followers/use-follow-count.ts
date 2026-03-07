'use client';

import { createUseFollowCount } from '@lsp-indexer/react';
import { getFollowCount } from '../../actions/followers';

/** Fetch follower/following counts via server action. */
export const useFollowCount = createUseFollowCount(getFollowCount);
