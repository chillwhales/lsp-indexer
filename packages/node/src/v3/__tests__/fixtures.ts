export const ADDRESS = `0x${'11'.repeat(20)}`;
export const OTHER_ADDRESS = `0x${'22'.repeat(20)}`;
export const HASH = `0x${'33'.repeat(32)}`;
export const OTHER_HASH = `0x${'44'.repeat(32)}`;
export const TOKEN_ID = `0x${'55'.repeat(32)}`;
export const TIMESTAMP = '2026-08-24T12:00:00.000Z';

export const projection = {
  network: 'lukso-mainnet',
  chainId: '42',
  lastBlockNumber: '123',
  lastBlockHash: HASH,
  lastTransactionHash: OTHER_HASH,
  lastTransactionIndex: 2,
  lastLogIndex: 3,
};

export const profileRow = {
  ...projection,
  id: '42:profile',
  address: ADDRESS,
  ownerAddress: OTHER_ADDRESS,
  verification: 'verified',
  metadataRevisions: [
    {
      content: {
        LSP3Profile: {
          name: 'Alice',
          description: 'Profile',
          tags: ['builder'],
          links: [{ title: 'Web', url: 'https://example.com' }],
          avatar: [{ url: 'ipfs://avatar', fileType: 'model/gltf', verification: null }],
          profileImage: [[{ url: 'ipfs://profile', width: 100, height: 100 }]],
          backgroundImage: [[{ url: 'ipfs://background' }]],
        },
      },
    },
  ],
  followerCount: { aggregate: { count: 2 } },
  followingCount: { aggregate: { count: 3 } },
};

export const digitalAssetRow = {
  ...projection,
  id: '42:asset',
  address: OTHER_ADDRESS,
  ownerAddress: ADDRESS,
  standard: 'lsp7',
  tokenType: 0,
  name: 'Token',
  symbol: 'TKN',
  decimals: 18,
  totalSupply: '900719925474099300000',
  tokenIdFormat: null,
  tokenIdReferenceContract: null,
  baseUri: null,
  verification: 'verified',
  metadataRevisions: [
    {
      content: {
        LSP4Metadata: {
          name: 'Token metadata',
          symbol: 'META',
          description: 'Asset',
          category: 'Collectible',
          icon: [[{ url: 'ipfs://icon' }]],
          images: [[{ url: 'ipfs://image' }]],
          links: [{ title: 'Web', url: 'https://example.com' }],
          attributes: [{ key: 'color', value: 'blue', type: 'string' }],
        },
      },
    },
  ],
  holderCount: { aggregate: { count: 4 } },
  creatorCount: { aggregate: { count: 1 } },
};

export const nftRow = {
  ...projection,
  id: '42:nft',
  address: OTHER_ADDRESS,
  tokenId: TOKEN_ID,
  formattedTokenId: '1',
  isMinted: true,
  isBurned: false,
  ownerAddress: ADDRESS,
  tokenUri: 'ipfs://token',
  verification: 'verified',
  metadataRevisions: [
    {
      content: {
        LSP4Metadata: {
          name: 'NFT',
          description: 'Token',
          category: 'Collectible',
          icon: [[{ url: 'ipfs://nft-icon' }]],
          images: [[{ url: 'ipfs://nft-image' }]],
          links: [],
          attributes: [{ key: 'level', value: '1', type: 'number' }],
        },
      },
    },
  ],
  digitalAsset: digitalAssetRow,
  ownedToken: { universalProfile: profileRow },
  chillwhales: {
    chillClaimed: true,
    orbsClaimed: false,
    level: 2,
    cooldownExpiry: null,
    faction: 'blue',
  },
};

export const ownedAssetRow = {
  ...projection,
  id: '42:owned-asset',
  ownerAddress: ADDRESS,
  assetAddress: OTHER_ADDRESS,
  balance: '1000000000000000000',
  digitalAsset: digitalAssetRow,
  universalProfile: profileRow,
  tokenIdCount: { aggregate: { count: 1 } },
};

export const ownedTokenRow = {
  ...projection,
  id: '42:owned-token',
  ownerAddress: ADDRESS,
  assetAddress: OTHER_ADDRESS,
  tokenId: TOKEN_ID,
  balance: '1',
  digitalAsset: digitalAssetRow,
  universalProfile: profileRow,
  nft: nftRow,
  ownedAsset: ownedAssetRow,
};

export const followerRow = {
  ...projection,
  id: '42:follower',
  followerAddress: ADDRESS,
  followedAddress: OTHER_ADDRESS,
  isFollowing: true,
  followedAt: TIMESTAMP,
  unfollowedAt: null,
  followerProfile: profileRow,
  followedProfile: { ...profileRow, address: OTHER_ADDRESS },
};

export const creatorRow = {
  ...projection,
  id: '42:creator',
  assetAddress: OTHER_ADDRESS,
  creatorAddress: ADDRESS,
  arrayIndex: '0',
  interfaceId: '0x12345678',
  verified: true,
  creatorProfile: profileRow,
  digitalAsset: digitalAssetRow,
};

export const issuedAssetRow = {
  ...projection,
  id: '42:issued',
  issuerAddress: ADDRESS,
  assetAddress: OTHER_ADDRESS,
  arrayIndex: '0',
  interfaceId: null,
  issuerProfile: profileRow,
  digitalAsset: digitalAssetRow,
};

export const eventRow = {
  id: '42:event',
  network: 'lukso-mainnet',
  chainId: '42',
  blockNumber: '123',
  blockHash: HASH,
  parentHash: OTHER_HASH,
  timestamp: TIMESTAMP,
  transactionHash: OTHER_HASH,
  transactionIndex: 2,
  logIndex: 3,
  address: ADDRESS,
  topic0: HASH,
  topics: [HASH],
  data: '0x',
  eventName: 'DataChanged',
  eventDomain: 'erc725y',
  decoded: { dataKey: HASH, dataValue: '0x1234' },
  universalProfile: profileRow,
  digitalAsset: digitalAssetRow,
};

export const metadataRevisionRow = {
  ...projection,
  id: '42:metadata',
  address: ADDRESS,
  tokenId: null,
  dataKey: HASH,
  kind: 'lsp29_encrypted_asset',
  sourceRevision: HASH,
  contentUri: 'ipfs://encrypted',
  contentHash: null,
  contentType: 'application/json',
  contentLength: '123',
  content: {
    LSP29EncryptedAsset: {
      id: 'content',
      revision: 1,
      title: 'Secret',
      description: 'Encrypted',
      encryption: {
        provider: 'lit',
        method: 'threshold',
        params: { tokenAddress: OTHER_ADDRESS, requiredBalance: '1' },
      },
      file: { name: 'secret.txt', type: 'text/plain', size: 123 },
      chunks: { iv: 'iv', totalSize: 123, ipfs: { cids: ['cid'] } },
      images: [[{ url: 'ipfs://encrypted-image' }]],
    },
  },
  fetchedAt: TIMESTAMP,
  universalProfile: profileRow,
};

export const directRows = {
  blocks: {
    id: '42:123',
    network: 'lukso-mainnet',
    chainId: '42',
    number: '123',
    hash: HASH,
    parentHash: OTHER_HASH,
    timestamp: TIMESTAMP,
  },
  events: eventRow,
  profiles: profileRow,
  digitalAssets: digitalAssetRow,
  nfts: nftRow,
  ownedAssets: ownedAssetRow,
  ownedTokens: ownedTokenRow,
  followers: followerRow,
  creators: creatorRow,
  issuedAssets: issuedAssetRow,
  controllers: {
    ...projection,
    id: '42:controller',
    profileAddress: ADDRESS,
    controllerAddress: OTHER_ADDRESS,
    arrayIndex: '0',
    permissions: null,
    allowedCalls: null,
    allowedDataKeys: null,
  },
  chillwhalesNfts: {
    ...projection,
    id: '42:chillwhales',
    address: OTHER_ADDRESS,
    tokenId: TOKEN_ID,
    chillClaimed: true,
    orbsClaimed: false,
    claimCheckAfterBlock: '124',
    level: 2,
    cooldownExpiry: null,
    faction: 'blue',
  },
  dataValues: {
    ...projection,
    id: '42:data',
    address: ADDRESS,
    tokenId: null,
    dataKey: HASH,
    dataValue: '0x1234',
  },
  metadataRevisions: metadataRevisionRow,
  indexedHeads: {
    network: 'lukso-mainnet',
    chainId: '42',
    blockNumber: '123',
    blockHash: HASH,
    blockTimestamp: TIMESTAMP,
    finalizedBlockNumber: null,
    finalizedBlockHash: null,
    updatedAt: TIMESTAMP,
  },
} as const;
