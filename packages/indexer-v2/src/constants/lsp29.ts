/**
 * LSP29 Encrypted Assets Data Keys
 *
 * LSP29 defines a framework for storing encrypted, token-gated digital assets
 * within ERC725Y Universal Profiles on LUKSO.
 *
 * @see https://github.com/lukso-network/LIPs/pull/315
 */

export const LSP29DataKeys = {
  'LSP29EncryptedAssets[]': {
    /**
     * LSP29EncryptedAssets[index] - Individual array elements
     * Key prefix: first 16 bytes of keccak256('LSP29EncryptedAssets[]') + index (uint128)
     */
    index: '0x1965f98377ddff08e78c93d820cc8de4',

    /**
     * LSP29EncryptedAssets[] - Array of VerifiableURIs pointing to encrypted asset metadata
     * Key: keccak256('LSP29EncryptedAssets[]')
     */
    length: '0x1965f98377ddff08e78c93d820cc8de4eeb331e684b7724bce0debb1958386c3',
  },

  /**
   * LSP29EncryptedAssetsMap:<bytes20> - Mapping for O(1) lookup
   * Key prefix: first 10 bytes of keccak256('LSP29EncryptedAssetsMap') + 0000 + first 20 bytes of content ID hash
   * Value: uint128 array index
   */
  LSP29EncryptedAssetsMap: '0x2b9a7a38a67cedc507c2',

  /**
   * LSP29EncryptedAssetRevisionCount:<bytes20> - Revision count per content ID
   * Key prefix: first 10 bytes of keccak256('LSP29EncryptedAssetRevisionCount') + 0000 + first 20 bytes of content ID hash
   * Value: uint128 revision count
   */
  LSP29EncryptedAssetRevisionCount: '0xb41f63e335c22bded814',
} as const;
