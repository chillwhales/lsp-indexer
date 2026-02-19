// Server actions (browser → Next.js server → Hasura)
export { getCreatorAddresses } from './actions/creators';
export { getDataChangedEvents } from './actions/data-changed';
export { getEncryptedAsset, getEncryptedAssets } from './actions/encrypted-assets';
export { getEncryptedAssetFeed } from './actions/encrypted-feed';
export { getNft, getNfts } from './actions/nfts';
export { getOwnedAssets, getOwnedTokens } from './actions/owned-assets';
export { getProfile, getProfiles } from './actions/profiles';
export { getUniversalReceiverEvents } from './actions/universal-receiver';

// Hooks that use server actions as queryFn (identical API to @lsp-indexer/react)
export { useCreatorAddresses, useInfiniteCreatorAddresses } from './hooks/creators';
export { useDataChangedEvents, useInfiniteDataChangedEvents } from './hooks/data-changed';
export {
  useEncryptedAsset,
  useEncryptedAssets,
  useInfiniteEncryptedAssets,
} from './hooks/encrypted-assets';
export { useEncryptedAssetFeed, useInfiniteEncryptedAssetFeed } from './hooks/encrypted-feed';
export { useInfiniteNfts, useNft, useNfts, useNftsByCollection } from './hooks/nfts';
export {
  useInfiniteOwnedAssets,
  useInfiniteOwnedTokens,
  useOwnedAssets,
  useOwnedTokens,
} from './hooks/owned-assets';
export { useInfiniteProfiles, useProfile, useProfiles } from './hooks/profiles';
export {
  useInfiniteUniversalReceiverEvents,
  useUniversalReceiverEvents,
} from './hooks/universal-receiver';

// Digital Asset server actions
export { getDigitalAsset, getDigitalAssets } from './actions/digital-assets';

// Digital Asset hooks (via server actions)
export {
  useDigitalAsset,
  useDigitalAssets,
  useInfiniteDigitalAssets,
} from './hooks/digital-assets';

// Social/Follow server actions
export { getFollowCount, getFollowers, getFollowing } from './actions/social';

// Social/Follow hooks (via server actions)
export {
  useFollowCount,
  useFollowers,
  useFollowing,
  useInfiniteFollowers,
  useInfiniteFollowing,
} from './hooks/social';
