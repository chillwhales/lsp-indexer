-- =============================================================================
-- verify-backfill.sql
-- Post-migration FK integrity verification
--
-- For each FK relationship, counts rows where the FK value is NOT NULL but
-- does not match any PK in the parent table. Any non-zero count indicates
-- an orphaned FK reference (migration bug).
--
-- Run: psql -f verify-backfill.sql
-- Expected: all counts = 0
-- =============================================================================

\echo '=== FK Integrity Verification ==='
\echo ''

-- ---------------------------------------------------------------------------
-- FKs referencing universal_profile.id
-- ---------------------------------------------------------------------------
\echo 'Checking FKs referencing universal_profile...'

SELECT 'data_changed.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM data_changed c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'deployed_contracts.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM deployed_contracts c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'deployed_erc1167_proxies.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM deployed_erc1167_proxies c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'executed.target_profile_id' AS fk, COUNT(*) AS orphaned
FROM executed c
WHERE c.target_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.target_profile_id);

SELECT 'executed.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM executed c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'follow.followed_universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM follow c
WHERE c.followed_universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.followed_universal_profile_id);

SELECT 'follow.follower_universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM follow c
WHERE c.follower_universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.follower_universal_profile_id);

SELECT 'follower.followed_universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM follower c
WHERE c.followed_universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.followed_universal_profile_id);

SELECT 'follower.follower_universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM follower c
WHERE c.follower_universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.follower_universal_profile_id);

SELECT 'lsp12_issued_asset.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp12_issued_asset c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'lsp12_issued_assets_length.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp12_issued_assets_length c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'lsp29_encrypted_asset.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp29_encrypted_asset c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'lsp29_encrypted_asset_entry.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp29_encrypted_asset_entry c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'lsp29_encrypted_asset_revision_count.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp29_encrypted_asset_revision_count c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'lsp29_encrypted_assets_length.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp29_encrypted_assets_length c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'lsp3_profile.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp3_profile c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'lsp4_creator.creator_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp4_creator c
WHERE c.creator_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.creator_profile_id);

SELECT 'lsp5_received_asset.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp5_received_asset c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'lsp5_received_assets_length.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp5_received_assets_length c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'lsp6_controller.controller_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp6_controller c
WHERE c.controller_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.controller_profile_id);

SELECT 'lsp6_controller.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp6_controller c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'lsp6_controllers_length.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp6_controllers_length c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'owned_asset.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM owned_asset c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'owned_token.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM owned_token c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'ownership_transferred.new_owner_profile_id' AS fk, COUNT(*) AS orphaned
FROM ownership_transferred c
WHERE c.new_owner_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.new_owner_profile_id);

SELECT 'ownership_transferred.previous_owner_profile_id' AS fk, COUNT(*) AS orphaned
FROM ownership_transferred c
WHERE c.previous_owner_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.previous_owner_profile_id);

SELECT 'ownership_transferred.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM ownership_transferred c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'transfer.from_profile_id' AS fk, COUNT(*) AS orphaned
FROM transfer c
WHERE c.from_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.from_profile_id);

SELECT 'transfer.operator_profile_id' AS fk, COUNT(*) AS orphaned
FROM transfer c
WHERE c.operator_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.operator_profile_id);

SELECT 'transfer.to_profile_id' AS fk, COUNT(*) AS orphaned
FROM transfer c
WHERE c.to_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.to_profile_id);

SELECT 'unfollow.follower_universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM unfollow c
WHERE c.follower_universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.follower_universal_profile_id);

SELECT 'unfollow.unfollowed_universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM unfollow c
WHERE c.unfollowed_universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.unfollowed_universal_profile_id);

SELECT 'universal_profile_owner.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM universal_profile_owner c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

SELECT 'universal_receiver.from_profile_id' AS fk, COUNT(*) AS orphaned
FROM universal_receiver c
WHERE c.from_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.from_profile_id);

SELECT 'universal_receiver.universal_profile_id' AS fk, COUNT(*) AS orphaned
FROM universal_receiver c
WHERE c.universal_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM universal_profile p WHERE p.id = c.universal_profile_id);

-- ---------------------------------------------------------------------------
-- FKs referencing digital_asset.id
-- ---------------------------------------------------------------------------
\echo ''
\echo 'Checking FKs referencing digital_asset...'

SELECT 'chill_claimed.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM chill_claimed c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'data_changed.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM data_changed c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'decimals.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM decimals c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'digital_asset_owner.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM digital_asset_owner c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'executed.target_asset_id' AS fk, COUNT(*) AS orphaned
FROM executed c
WHERE c.target_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.target_asset_id);

SELECT 'lsp12_issued_asset.issued_asset_id' AS fk, COUNT(*) AS orphaned
FROM lsp12_issued_asset c
WHERE c.issued_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.issued_asset_id);

SELECT 'lsp4_creator.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM lsp4_creator c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'lsp4_creators_length.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM lsp4_creators_length c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'lsp4_metadata.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM lsp4_metadata c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'lsp4_token_name.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM lsp4_token_name c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'lsp4_token_symbol.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM lsp4_token_symbol c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'lsp4_token_type.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM lsp4_token_type c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'lsp5_received_asset.received_asset_id' AS fk, COUNT(*) AS orphaned
FROM lsp5_received_asset c
WHERE c.received_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.received_asset_id);

SELECT 'lsp8_reference_contract.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM lsp8_reference_contract c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'lsp8_token_id_format.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM lsp8_token_id_format c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'lsp8_token_metadata_base_uri.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM lsp8_token_metadata_base_uri c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'nft.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM nft c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'orb_cooldown_expiry.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM orb_cooldown_expiry c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'orb_faction.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM orb_faction c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'orb_level.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM orb_level c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'orbs_claimed.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM orbs_claimed c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'owned_asset.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM owned_asset c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'owned_token.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM owned_token c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'ownership_transferred.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM ownership_transferred c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'token_id_data_changed.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM token_id_data_changed c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'total_supply.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM total_supply c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'transfer.digital_asset_id' AS fk, COUNT(*) AS orphaned
FROM transfer c
WHERE c.digital_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.digital_asset_id);

SELECT 'universal_receiver.from_asset_id' AS fk, COUNT(*) AS orphaned
FROM universal_receiver c
WHERE c.from_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM digital_asset p WHERE p.id = c.from_asset_id);

-- ---------------------------------------------------------------------------
-- FKs referencing nft.id
-- ---------------------------------------------------------------------------
\echo ''
\echo 'Checking FKs referencing nft...'

SELECT 'chill_claimed.nft_id' AS fk, COUNT(*) AS orphaned
FROM chill_claimed c
WHERE c.nft_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nft p WHERE p.id = c.nft_id);

SELECT 'lsp4_metadata.nft_id' AS fk, COUNT(*) AS orphaned
FROM lsp4_metadata c
WHERE c.nft_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nft p WHERE p.id = c.nft_id);

SELECT 'orb_cooldown_expiry.nft_id' AS fk, COUNT(*) AS orphaned
FROM orb_cooldown_expiry c
WHERE c.nft_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nft p WHERE p.id = c.nft_id);

SELECT 'orb_faction.nft_id' AS fk, COUNT(*) AS orphaned
FROM orb_faction c
WHERE c.nft_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nft p WHERE p.id = c.nft_id);

SELECT 'orb_level.nft_id' AS fk, COUNT(*) AS orphaned
FROM orb_level c
WHERE c.nft_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nft p WHERE p.id = c.nft_id);

SELECT 'orbs_claimed.nft_id' AS fk, COUNT(*) AS orphaned
FROM orbs_claimed c
WHERE c.nft_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nft p WHERE p.id = c.nft_id);

SELECT 'owned_token.nft_id' AS fk, COUNT(*) AS orphaned
FROM owned_token c
WHERE c.nft_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nft p WHERE p.id = c.nft_id);

SELECT 'token_id_data_changed.nft_id' AS fk, COUNT(*) AS orphaned
FROM token_id_data_changed c
WHERE c.nft_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nft p WHERE p.id = c.nft_id);

SELECT 'transfer.nft_id' AS fk, COUNT(*) AS orphaned
FROM transfer c
WHERE c.nft_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM nft p WHERE p.id = c.nft_id);

-- ---------------------------------------------------------------------------
-- FKs referencing lsp4_metadata.id
-- ---------------------------------------------------------------------------
\echo ''
\echo 'Checking FKs referencing lsp4_metadata...'

SELECT 'digital_asset.lsp4_metadata_id' AS fk, COUNT(*) AS orphaned
FROM digital_asset c
WHERE c.lsp4_metadata_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp4_metadata p WHERE p.id = c.lsp4_metadata_id);

SELECT 'lsp4_metadata_asset.lsp4_metadata_id' AS fk, COUNT(*) AS orphaned
FROM lsp4_metadata_asset c
WHERE c.lsp4_metadata_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp4_metadata p WHERE p.id = c.lsp4_metadata_id);

SELECT 'lsp4_metadata_attribute.lsp4_metadata_id' AS fk, COUNT(*) AS orphaned
FROM lsp4_metadata_attribute c
WHERE c.lsp4_metadata_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp4_metadata p WHERE p.id = c.lsp4_metadata_id);

SELECT 'lsp4_metadata_category.lsp4_metadata_id' AS fk, COUNT(*) AS orphaned
FROM lsp4_metadata_category c
WHERE c.lsp4_metadata_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp4_metadata p WHERE p.id = c.lsp4_metadata_id);

SELECT 'lsp4_metadata_description.lsp4_metadata_id' AS fk, COUNT(*) AS orphaned
FROM lsp4_metadata_description c
WHERE c.lsp4_metadata_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp4_metadata p WHERE p.id = c.lsp4_metadata_id);

SELECT 'lsp4_metadata_icon.lsp4_metadata_id' AS fk, COUNT(*) AS orphaned
FROM lsp4_metadata_icon c
WHERE c.lsp4_metadata_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp4_metadata p WHERE p.id = c.lsp4_metadata_id);

SELECT 'lsp4_metadata_image.lsp4_metadata_id' AS fk, COUNT(*) AS orphaned
FROM lsp4_metadata_image c
WHERE c.lsp4_metadata_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp4_metadata p WHERE p.id = c.lsp4_metadata_id);

SELECT 'lsp4_metadata_link.lsp4_metadata_id' AS fk, COUNT(*) AS orphaned
FROM lsp4_metadata_link c
WHERE c.lsp4_metadata_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp4_metadata p WHERE p.id = c.lsp4_metadata_id);

SELECT 'lsp4_metadata_name.lsp4_metadata_id' AS fk, COUNT(*) AS orphaned
FROM lsp4_metadata_name c
WHERE c.lsp4_metadata_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp4_metadata p WHERE p.id = c.lsp4_metadata_id);

SELECT 'lsp4_metadata_rank.lsp4_metadata_id' AS fk, COUNT(*) AS orphaned
FROM lsp4_metadata_rank c
WHERE c.lsp4_metadata_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp4_metadata p WHERE p.id = c.lsp4_metadata_id);

SELECT 'lsp4_metadata_score.lsp4_metadata_id' AS fk, COUNT(*) AS orphaned
FROM lsp4_metadata_score c
WHERE c.lsp4_metadata_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp4_metadata p WHERE p.id = c.lsp4_metadata_id);

SELECT 'nft.lsp4_metadata_id' AS fk, COUNT(*) AS orphaned
FROM nft c
WHERE c.lsp4_metadata_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp4_metadata p WHERE p.id = c.lsp4_metadata_id);

SELECT 'nft.lsp4_metadata_base_uri_id' AS fk, COUNT(*) AS orphaned
FROM nft c
WHERE c.lsp4_metadata_base_uri_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp4_metadata p WHERE p.id = c.lsp4_metadata_base_uri_id);

-- ---------------------------------------------------------------------------
-- FKs referencing lsp3_profile.id
-- ---------------------------------------------------------------------------
\echo ''
\echo 'Checking FKs referencing lsp3_profile...'

SELECT 'lsp3_profile_asset.lsp3_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp3_profile_asset c
WHERE c.lsp3_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp3_profile p WHERE p.id = c.lsp3_profile_id);

SELECT 'lsp3_profile_background_image.lsp3_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp3_profile_background_image c
WHERE c.lsp3_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp3_profile p WHERE p.id = c.lsp3_profile_id);

SELECT 'lsp3_profile_description.lsp3_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp3_profile_description c
WHERE c.lsp3_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp3_profile p WHERE p.id = c.lsp3_profile_id);

SELECT 'lsp3_profile_image.lsp3_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp3_profile_image c
WHERE c.lsp3_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp3_profile p WHERE p.id = c.lsp3_profile_id);

SELECT 'lsp3_profile_link.lsp3_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp3_profile_link c
WHERE c.lsp3_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp3_profile p WHERE p.id = c.lsp3_profile_id);

SELECT 'lsp3_profile_name.lsp3_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp3_profile_name c
WHERE c.lsp3_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp3_profile p WHERE p.id = c.lsp3_profile_id);

SELECT 'lsp3_profile_tag.lsp3_profile_id' AS fk, COUNT(*) AS orphaned
FROM lsp3_profile_tag c
WHERE c.lsp3_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp3_profile p WHERE p.id = c.lsp3_profile_id);

SELECT 'universal_profile.lsp3_profile_id' AS fk, COUNT(*) AS orphaned
FROM universal_profile c
WHERE c.lsp3_profile_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp3_profile p WHERE p.id = c.lsp3_profile_id);

-- ---------------------------------------------------------------------------
-- FKs referencing lsp6_controller.id
-- ---------------------------------------------------------------------------
\echo ''
\echo 'Checking FKs referencing lsp6_controller...'

SELECT 'lsp6_allowed_call.controller_id' AS fk, COUNT(*) AS orphaned
FROM lsp6_allowed_call c
WHERE c.controller_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp6_controller p WHERE p.id = c.controller_id);

SELECT 'lsp6_allowed_erc725_y_data_key.controller_id' AS fk, COUNT(*) AS orphaned
FROM lsp6_allowed_erc725_y_data_key c
WHERE c.controller_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp6_controller p WHERE p.id = c.controller_id);

SELECT 'lsp6_permission.controller_id' AS fk, COUNT(*) AS orphaned
FROM lsp6_permission c
WHERE c.controller_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp6_controller p WHERE p.id = c.controller_id);

-- ---------------------------------------------------------------------------
-- FKs referencing lsp29_encrypted_asset.id
-- ---------------------------------------------------------------------------
\echo ''
\echo 'Checking FKs referencing lsp29_encrypted_asset...'

SELECT 'lsp29_encrypted_asset_chunks.lsp29_encrypted_asset_id' AS fk, COUNT(*) AS orphaned
FROM lsp29_encrypted_asset_chunks c
WHERE c.lsp29_encrypted_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp29_encrypted_asset p WHERE p.id = c.lsp29_encrypted_asset_id);

SELECT 'lsp29_encrypted_asset_description.lsp29_encrypted_asset_id' AS fk, COUNT(*) AS orphaned
FROM lsp29_encrypted_asset_description c
WHERE c.lsp29_encrypted_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp29_encrypted_asset p WHERE p.id = c.lsp29_encrypted_asset_id);

SELECT 'lsp29_encrypted_asset_encryption.lsp29_encrypted_asset_id' AS fk, COUNT(*) AS orphaned
FROM lsp29_encrypted_asset_encryption c
WHERE c.lsp29_encrypted_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp29_encrypted_asset p WHERE p.id = c.lsp29_encrypted_asset_id);

SELECT 'lsp29_encrypted_asset_file.lsp29_encrypted_asset_id' AS fk, COUNT(*) AS orphaned
FROM lsp29_encrypted_asset_file c
WHERE c.lsp29_encrypted_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp29_encrypted_asset p WHERE p.id = c.lsp29_encrypted_asset_id);

SELECT 'lsp29_encrypted_asset_image.lsp29_encrypted_asset_id' AS fk, COUNT(*) AS orphaned
FROM lsp29_encrypted_asset_image c
WHERE c.lsp29_encrypted_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp29_encrypted_asset p WHERE p.id = c.lsp29_encrypted_asset_id);

SELECT 'lsp29_encrypted_asset_title.lsp29_encrypted_asset_id' AS fk, COUNT(*) AS orphaned
FROM lsp29_encrypted_asset_title c
WHERE c.lsp29_encrypted_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lsp29_encrypted_asset p WHERE p.id = c.lsp29_encrypted_asset_id);

-- ---------------------------------------------------------------------------
-- FKs referencing owned_asset.id
-- ---------------------------------------------------------------------------
\echo ''
\echo 'Checking FKs referencing owned_asset...'

SELECT 'owned_token.owned_asset_id' AS fk, COUNT(*) AS orphaned
FROM owned_token c
WHERE c.owned_asset_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM owned_asset p WHERE p.id = c.owned_asset_id);

-- ---------------------------------------------------------------------------
-- Summary
-- ---------------------------------------------------------------------------
\echo ''
\echo '=== Verification Complete ==='
\echo 'All counts should be 0. Any non-zero count indicates orphaned FK references.'
