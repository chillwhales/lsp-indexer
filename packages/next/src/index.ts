// Server actions (browser → Next.js server → Hasura)
export { getProfile, getProfiles } from './actions/profiles';

// Hooks that use server actions as queryFn (identical API to @lsp-indexer/react)
export { useInfiniteProfiles, useProfile, useProfiles } from './hooks/profiles';

// Digital Asset server actions (browser → Next.js server → Hasura)
export { getDigitalAsset, getDigitalAssets } from './actions/digital-assets';

// Digital Asset hooks that use server actions as queryFn (identical API to @lsp-indexer/react)
export {
  useDigitalAsset,
  useDigitalAssets,
  useInfiniteDigitalAssets,
} from './hooks/digital-assets';
