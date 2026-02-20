// Error types
export type { IndexerErrorCategory, IndexerErrorCode, IndexerErrorOptions } from './errors';

// Shared schemas — source of truth for cross-domain types
export { SortDirectionSchema } from './common';
export type { SortDirection } from './common';

// Profile domain — Zod schemas
export {
  ProfileFilterSchema,
  ProfileImageSchema,
  ProfileIncludeSchema,
  ProfileSchema,
  ProfileSortFieldSchema,
  ProfileSortSchema,
  UseInfiniteProfilesParamsSchema,
  UseProfileParamsSchema,
  UseProfilesParamsSchema,
} from './profiles';

// Profile domain — inferred types
export type {
  Profile,
  ProfileFilter,
  ProfileImage,
  ProfileInclude,
  ProfileSort,
  ProfileSortField,
  UseInfiniteProfilesParams,
  UseProfileParams,
  UseProfilesParams,
} from './profiles';

// Digital Asset domain — Zod schemas
export {
  DigitalAssetAttributeSchema,
  DigitalAssetFilterSchema,
  DigitalAssetImageSchema,
  DigitalAssetIncludeSchema,
  DigitalAssetLinkSchema,
  DigitalAssetOwnerSchema,
  DigitalAssetSchema,
  DigitalAssetSortFieldSchema,
  DigitalAssetSortSchema,
  StandardSchema,
  TokenTypeSchema,
  UseDigitalAssetParamsSchema,
  UseDigitalAssetsParamsSchema,
  UseInfiniteDigitalAssetsParamsSchema,
} from './digital-assets';

// Digital Asset domain — inferred types
export type {
  DigitalAsset,
  DigitalAssetAttribute,
  DigitalAssetFilter,
  DigitalAssetImage,
  DigitalAssetInclude,
  DigitalAssetLink,
  DigitalAssetOwner,
  DigitalAssetSort,
  DigitalAssetSortField,
  Standard,
  TokenType,
  UseDigitalAssetParams,
  UseDigitalAssetsParams,
  UseInfiniteDigitalAssetsParams,
} from './digital-assets';
