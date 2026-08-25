import { graphql } from '../graphql';

// These fragments intentionally select package fields rather than exposing generated Hasura
// records. The service parsers enforce the non-null and lossless-scalar boundary documented by v3.

export const V3BlockFields = graphql(`
  fragment V3BlockFields on block {
    id
    network
    chainId: chain_id
    number
    hash
    parentHash: parent_hash
    timestamp
  }
`);

export const V3EventFields = graphql(`
  fragment V3EventFields on event_fact {
    id
    network
    chainId: chain_id
    blockNumber: block_number
    blockHash: block_hash
    parentHash: parent_hash
    timestamp: block_timestamp
    transactionHash: transaction_hash
    transactionIndex: transaction_index
    logIndex: log_index
    address
    topic0
    topics
    data
    eventName: event_name
    eventDomain: event_domain
    decoded
    universalProfile {
      ...V3ProfileFields
    }
    digitalAsset {
      ...V3DigitalAssetFields
    }
  }
`);

export const V3ProfileFields = graphql(`
  fragment V3ProfileFields on universal_profile {
    id
    network
    chainId: chain_id
    address
    ownerAddress: owner_address
    verification
    lastBlockNumber: last_block_number
    lastBlockHash: last_block_hash
    lastTransactionHash: last_transaction_hash
    lastTransactionIndex: last_transaction_index
    lastLogIndex: last_log_index
    metadataRevisions(
      where: { is_current: { _eq: true }, kind: { _eq: lsp3_profile } }
      order_by: [{ last_block_number: desc }, { chain_id: asc }, { id: asc }]
      limit: 1
    ) {
      content
    }
    followerCount: followedBy_aggregate(where: { is_following: { _eq: true } }) {
      aggregate {
        count
      }
    }
    followingCount: followed_aggregate(where: { is_following: { _eq: true } }) {
      aggregate {
        count
      }
    }
  }
`);

export const V3DigitalAssetFields = graphql(`
  fragment V3DigitalAssetFields on digital_asset {
    id
    network
    chainId: chain_id
    address
    ownerAddress: owner_address
    standard
    tokenType: token_type
    name
    symbol
    decimals
    totalSupply: total_supply
    tokenIdFormat: token_id_format
    tokenIdReferenceContract: token_id_reference_contract
    baseUri: base_uri
    verification
    lastBlockNumber: last_block_number
    lastBlockHash: last_block_hash
    lastTransactionHash: last_transaction_hash
    lastTransactionIndex: last_transaction_index
    lastLogIndex: last_log_index
    metadataRevisions(
      where: { is_current: { _eq: true }, kind: { _eq: lsp4_asset } }
      order_by: [{ last_block_number: desc }, { chain_id: asc }, { id: asc }]
      limit: 1
    ) {
      content
    }
    holderCount: ownedAssets_aggregate(where: { balance: { _gt: "0" } }) {
      aggregate {
        count
      }
    }
    creatorCount: lsp4Creators_aggregate {
      aggregate {
        count
      }
    }
  }
`);

export const V3NftFields = graphql(`
  fragment V3NftFields on nft {
    id
    network
    chainId: chain_id
    address
    tokenId: token_id
    formattedTokenId: formatted_token_id
    isMinted: is_minted
    isBurned: is_burned
    ownerAddress: owner_address
    tokenUri: token_uri
    verification
    lastBlockNumber: last_block_number
    lastBlockHash: last_block_hash
    lastTransactionHash: last_transaction_hash
    lastTransactionIndex: last_transaction_index
    lastLogIndex: last_log_index
    metadataRevisions(
      where: { is_current: { _eq: true }, kind: { _eq: lsp4_token } }
      order_by: [{ last_block_number: desc }, { chain_id: asc }, { id: asc }]
      limit: 1
    ) {
      content
    }
    digitalAsset {
      ...V3DigitalAssetFields
    }
    ownedToken {
      ownerAddress: owner_address
      lastBlockNumber: last_block_number
      universalProfile {
        ...V3ProfileFields
      }
    }
    chillwhales {
      chillClaimed: chill_claimed
      orbsClaimed: orbs_claimed
      level
      cooldownExpiry: cooldown_expiry
      faction
    }
  }
`);

export const V3OwnedAssetFields = graphql(`
  fragment V3OwnedAssetFields on owned_asset {
    id
    network
    chainId: chain_id
    ownerAddress: owner_address
    assetAddress: asset_address
    balance
    lastBlockNumber: last_block_number
    lastBlockHash: last_block_hash
    lastTransactionHash: last_transaction_hash
    lastTransactionIndex: last_transaction_index
    lastLogIndex: last_log_index
    digitalAsset {
      ...V3DigitalAssetFields
    }
    universalProfile {
      ...V3ProfileFields
    }
    tokenIdCount: tokenIds_aggregate {
      aggregate {
        count
      }
    }
  }
`);

export const V3OwnedTokenFields = graphql(`
  fragment V3OwnedTokenFields on owned_token {
    id
    network
    chainId: chain_id
    ownerAddress: owner_address
    assetAddress: asset_address
    tokenId: token_id
    balance
    lastBlockNumber: last_block_number
    lastBlockHash: last_block_hash
    lastTransactionHash: last_transaction_hash
    lastTransactionIndex: last_transaction_index
    lastLogIndex: last_log_index
    digitalAsset {
      ...V3DigitalAssetFields
    }
    universalProfile {
      ...V3ProfileFields
    }
    nft {
      ...V3NftFields
    }
    ownedAsset {
      ...V3OwnedAssetFields
    }
  }
`);

export const V3FollowerFields = graphql(`
  fragment V3FollowerFields on follower {
    id
    network
    chainId: chain_id
    followerAddress: follower_address
    followedAddress: followed_address
    isFollowing: is_following
    followedAt: followed_at
    unfollowedAt: unfollowed_at
    lastBlockNumber: last_block_number
    lastBlockHash: last_block_hash
    lastTransactionHash: last_transaction_hash
    lastTransactionIndex: last_transaction_index
    lastLogIndex: last_log_index
    followerProfile: followerUniversalProfile {
      ...V3ProfileFields
    }
    followedProfile: followedUniversalProfile {
      ...V3ProfileFields
    }
  }
`);

export const V3CreatorFields = graphql(`
  fragment V3CreatorFields on lsp4_creator {
    id
    network
    chainId: chain_id
    assetAddress: asset_address
    creatorAddress: creator_address
    arrayIndex: array_index
    interfaceId: interface_id
    verified
    lastBlockNumber: last_block_number
    lastBlockHash: last_block_hash
    lastTransactionHash: last_transaction_hash
    lastTransactionIndex: last_transaction_index
    lastLogIndex: last_log_index
    digitalAsset {
      ...V3DigitalAssetFields
    }
    creatorProfile {
      ...V3ProfileFields
    }
  }
`);

export const V3IssuedAssetFields = graphql(`
  fragment V3IssuedAssetFields on lsp12_issued_asset {
    id
    network
    chainId: chain_id
    issuerAddress: issuer_address
    assetAddress: asset_address
    arrayIndex: array_index
    interfaceId: interface_id
    lastBlockNumber: last_block_number
    lastBlockHash: last_block_hash
    lastTransactionHash: last_transaction_hash
    lastTransactionIndex: last_transaction_index
    lastLogIndex: last_log_index
    issuerProfile: universalProfile {
      ...V3ProfileFields
    }
    digitalAsset {
      ...V3DigitalAssetFields
    }
  }
`);

export const V3ControllerFields = graphql(`
  fragment V3ControllerFields on lsp6_controller {
    id
    network
    chainId: chain_id
    profileAddress: profile_address
    controllerAddress: controller_address
    arrayIndex: array_index
    permissions
    allowedCalls: allowed_calls
    allowedDataKeys: allowed_data_keys
    lastBlockNumber: last_block_number
    lastBlockHash: last_block_hash
    lastTransactionHash: last_transaction_hash
    lastTransactionIndex: last_transaction_index
    lastLogIndex: last_log_index
    universalProfile {
      ...V3ProfileFields
    }
    controllerProfile {
      ...V3ProfileFields
    }
  }
`);

export const V3ChillwhalesNftFields = graphql(`
  fragment V3ChillwhalesNftFields on chillwhales_nft {
    id
    network
    chainId: chain_id
    address
    tokenId: token_id
    chillClaimed: chill_claimed
    orbsClaimed: orbs_claimed
    claimCheckAfterBlock: claim_check_after_block
    level
    cooldownExpiry: cooldown_expiry
    faction
    lastBlockNumber: last_block_number
    lastBlockHash: last_block_hash
    lastTransactionHash: last_transaction_hash
    lastTransactionIndex: last_transaction_index
    lastLogIndex: last_log_index
    digitalAsset {
      ...V3DigitalAssetFields
    }
    nft {
      ...V3NftFields
    }
  }
`);

export const V3DataValueFields = graphql(`
  fragment V3DataValueFields on data_value {
    id
    network
    chainId: chain_id
    address
    tokenId: token_id
    dataKey: data_key
    dataValue: data_value
    lastBlockNumber: last_block_number
    lastBlockHash: last_block_hash
    lastTransactionHash: last_transaction_hash
    lastTransactionIndex: last_transaction_index
    lastLogIndex: last_log_index
    universalProfile {
      ...V3ProfileFields
    }
    digitalAsset {
      ...V3DigitalAssetFields
    }
    nft {
      ...V3NftFields
    }
  }
`);

export const V3MetadataRevisionFields = graphql(`
  fragment V3MetadataRevisionFields on metadata_revision {
    id
    network
    chainId: chain_id
    address
    tokenId: token_id
    dataKey: data_key
    kind
    sourceRevision: source_revision
    contentUri: content_uri
    contentHash: content_hash
    contentType: content_type
    contentLength: content_length
    content
    fetchedAt: fetched_at
    isCurrent: is_current
    lastBlockNumber: last_block_number
    lastBlockHash: last_block_hash
    lastTransactionHash: last_transaction_hash
    lastTransactionIndex: last_transaction_index
    lastLogIndex: last_log_index
    universalProfile {
      ...V3ProfileFields
    }
    digitalAsset {
      ...V3DigitalAssetFields
    }
    nft {
      ...V3NftFields
    }
  }
`);

export const V3IndexedHeadFields = graphql(`
  fragment V3IndexedHeadFields on indexed_head {
    network
    chainId: chain_id
    blockNumber: block_number
    blockHash: block_hash
    blockTimestamp: block_timestamp
    finalizedBlockNumber: finalized_block_number
    finalizedBlockHash: finalized_block_hash
    updatedAt: updated_at
  }
`);
