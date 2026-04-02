-- =============================================================================
-- backfill-network.sql
-- Idempotent migration: backfill existing LUKSO data into multi-chain schema
--
-- This script:
--   1. Disables triggers on all 71 entity tables (bypass FK checks)
--   2. Adds 'network' column to all tables (IF NOT EXISTS)
--   3. Prefixes deterministic IDs with 'lukso:' on PKs and all FK references
--   4. Re-enables triggers
--   5. Creates indexes on the network column
--
-- Safe to re-run: every UPDATE has a WHERE ... NOT LIKE 'lukso:%' guard.
-- Runs in a single transaction.
-- =============================================================================

BEGIN;

-- ===========================================================================
-- STEP 1: Disable triggers on all 71 tables
-- ===========================================================================
ALTER TABLE chill_claimed DISABLE TRIGGER ALL;
ALTER TABLE data_changed DISABLE TRIGGER ALL;
ALTER TABLE decimals DISABLE TRIGGER ALL;
ALTER TABLE deployed_contracts DISABLE TRIGGER ALL;
ALTER TABLE deployed_erc1167_proxies DISABLE TRIGGER ALL;
ALTER TABLE digital_asset DISABLE TRIGGER ALL;
ALTER TABLE digital_asset_owner DISABLE TRIGGER ALL;
ALTER TABLE executed DISABLE TRIGGER ALL;
ALTER TABLE follow DISABLE TRIGGER ALL;
ALTER TABLE follower DISABLE TRIGGER ALL;
ALTER TABLE lsp12_issued_asset DISABLE TRIGGER ALL;
ALTER TABLE lsp12_issued_assets_length DISABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_asset DISABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_asset_chunks DISABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_asset_description DISABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_asset_encryption DISABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_asset_entry DISABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_asset_file DISABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_asset_image DISABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_asset_revision_count DISABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_asset_title DISABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_assets_length DISABLE TRIGGER ALL;
ALTER TABLE lsp3_profile DISABLE TRIGGER ALL;
ALTER TABLE lsp3_profile_asset DISABLE TRIGGER ALL;
ALTER TABLE lsp3_profile_background_image DISABLE TRIGGER ALL;
ALTER TABLE lsp3_profile_description DISABLE TRIGGER ALL;
ALTER TABLE lsp3_profile_image DISABLE TRIGGER ALL;
ALTER TABLE lsp3_profile_link DISABLE TRIGGER ALL;
ALTER TABLE lsp3_profile_name DISABLE TRIGGER ALL;
ALTER TABLE lsp3_profile_tag DISABLE TRIGGER ALL;
ALTER TABLE lsp4_creator DISABLE TRIGGER ALL;
ALTER TABLE lsp4_creators_length DISABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata DISABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_asset DISABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_attribute DISABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_category DISABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_description DISABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_icon DISABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_image DISABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_link DISABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_name DISABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_rank DISABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_score DISABLE TRIGGER ALL;
ALTER TABLE lsp4_token_name DISABLE TRIGGER ALL;
ALTER TABLE lsp4_token_symbol DISABLE TRIGGER ALL;
ALTER TABLE lsp4_token_type DISABLE TRIGGER ALL;
ALTER TABLE lsp5_received_asset DISABLE TRIGGER ALL;
ALTER TABLE lsp5_received_assets_length DISABLE TRIGGER ALL;
ALTER TABLE lsp6_allowed_call DISABLE TRIGGER ALL;
ALTER TABLE lsp6_allowed_erc725_y_data_key DISABLE TRIGGER ALL;
ALTER TABLE lsp6_controller DISABLE TRIGGER ALL;
ALTER TABLE lsp6_controllers_length DISABLE TRIGGER ALL;
ALTER TABLE lsp6_permission DISABLE TRIGGER ALL;
ALTER TABLE lsp8_reference_contract DISABLE TRIGGER ALL;
ALTER TABLE lsp8_token_id_format DISABLE TRIGGER ALL;
ALTER TABLE lsp8_token_metadata_base_uri DISABLE TRIGGER ALL;
ALTER TABLE nft DISABLE TRIGGER ALL;
ALTER TABLE orb_cooldown_expiry DISABLE TRIGGER ALL;
ALTER TABLE orb_faction DISABLE TRIGGER ALL;
ALTER TABLE orb_level DISABLE TRIGGER ALL;
ALTER TABLE orbs_claimed DISABLE TRIGGER ALL;
ALTER TABLE owned_asset DISABLE TRIGGER ALL;
ALTER TABLE owned_token DISABLE TRIGGER ALL;
ALTER TABLE ownership_transferred DISABLE TRIGGER ALL;
ALTER TABLE token_id_data_changed DISABLE TRIGGER ALL;
ALTER TABLE total_supply DISABLE TRIGGER ALL;
ALTER TABLE transfer DISABLE TRIGGER ALL;
ALTER TABLE unfollow DISABLE TRIGGER ALL;
ALTER TABLE universal_profile DISABLE TRIGGER ALL;
ALTER TABLE universal_profile_owner DISABLE TRIGGER ALL;
ALTER TABLE universal_receiver DISABLE TRIGGER ALL;

-- ===========================================================================
-- STEP 2: Add network column to all 71 tables (idempotent)
-- ===========================================================================
ALTER TABLE chill_claimed ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE data_changed ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE decimals ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE deployed_contracts ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE deployed_erc1167_proxies ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE digital_asset ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE digital_asset_owner ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE executed ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE follow ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE follower ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp12_issued_asset ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp12_issued_assets_length ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp29_encrypted_asset ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp29_encrypted_asset_chunks ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp29_encrypted_asset_description ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp29_encrypted_asset_encryption ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp29_encrypted_asset_entry ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp29_encrypted_asset_file ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp29_encrypted_asset_image ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp29_encrypted_asset_revision_count ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp29_encrypted_asset_title ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp29_encrypted_assets_length ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp3_profile ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp3_profile_asset ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp3_profile_background_image ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp3_profile_description ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp3_profile_image ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp3_profile_link ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp3_profile_name ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp3_profile_tag ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp4_creator ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp4_creators_length ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp4_metadata ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp4_metadata_asset ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp4_metadata_attribute ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp4_metadata_category ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp4_metadata_description ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp4_metadata_icon ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp4_metadata_image ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp4_metadata_link ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp4_metadata_name ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp4_metadata_rank ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp4_metadata_score ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp4_token_name ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp4_token_symbol ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp4_token_type ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp5_received_asset ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp5_received_assets_length ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp6_allowed_call ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp6_allowed_erc725_y_data_key ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp6_controller ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp6_controllers_length ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp6_permission ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp8_reference_contract ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp8_token_id_format ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE lsp8_token_metadata_base_uri ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE nft ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE orb_cooldown_expiry ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE orb_faction ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE orb_level ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE orbs_claimed ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE owned_asset ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE owned_token ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE ownership_transferred ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE token_id_data_changed ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE total_supply ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE transfer ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE unfollow ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE universal_profile ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE universal_profile_owner ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';
ALTER TABLE universal_receiver ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso';

-- ===========================================================================
-- STEP 3: Prefix deterministic-ID PKs with 'lukso:'
-- 27 address-based deterministic IDs
-- ===========================================================================
UPDATE universal_profile SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE digital_asset SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE nft SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp4_metadata SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp3_profile SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp6_controller SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp29_encrypted_asset SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE owned_asset SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE total_supply SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE decimals SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE digital_asset_owner SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE universal_profile_owner SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp4_token_name SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp4_token_symbol SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp4_token_type SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp4_creators_length SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp3_profile_name SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp5_received_assets_length SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp6_controllers_length SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp8_token_id_format SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp8_reference_contract SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp8_token_metadata_base_uri SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp12_issued_assets_length SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp29_encrypted_asset_entry SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp29_encrypted_assets_length SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE owned_token SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE follower SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';

-- 6 composite-ID entities whose IDs also need prefixing
UPDATE lsp6_permission SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp6_allowed_call SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp6_allowed_erc725_y_data_key SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp5_received_asset SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp4_creator SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';
UPDATE lsp12_issued_asset SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%';

-- ===========================================================================
-- STEP 4: Update all FK references to match prefixed PKs
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- FKs referencing universal_profile (35 FKs)
-- ---------------------------------------------------------------------------
UPDATE data_changed SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE deployed_contracts SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE deployed_erc1167_proxies SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE executed SET target_profile_id = 'lukso:' || target_profile_id WHERE target_profile_id IS NOT NULL AND target_profile_id NOT LIKE 'lukso:%';
UPDATE executed SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE follow SET followed_universal_profile_id = 'lukso:' || followed_universal_profile_id WHERE followed_universal_profile_id IS NOT NULL AND followed_universal_profile_id NOT LIKE 'lukso:%';
UPDATE follow SET follower_universal_profile_id = 'lukso:' || follower_universal_profile_id WHERE follower_universal_profile_id IS NOT NULL AND follower_universal_profile_id NOT LIKE 'lukso:%';
UPDATE follower SET followed_universal_profile_id = 'lukso:' || followed_universal_profile_id WHERE followed_universal_profile_id IS NOT NULL AND followed_universal_profile_id NOT LIKE 'lukso:%';
UPDATE follower SET follower_universal_profile_id = 'lukso:' || follower_universal_profile_id WHERE follower_universal_profile_id IS NOT NULL AND follower_universal_profile_id NOT LIKE 'lukso:%';
UPDATE lsp12_issued_asset SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE lsp12_issued_assets_length SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE lsp29_encrypted_asset SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE lsp29_encrypted_asset_entry SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE lsp29_encrypted_asset_revision_count SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE lsp29_encrypted_assets_length SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE lsp3_profile SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE lsp4_creator SET creator_profile_id = 'lukso:' || creator_profile_id WHERE creator_profile_id IS NOT NULL AND creator_profile_id NOT LIKE 'lukso:%';
UPDATE lsp5_received_asset SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE lsp5_received_assets_length SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE lsp6_controller SET controller_profile_id = 'lukso:' || controller_profile_id WHERE controller_profile_id IS NOT NULL AND controller_profile_id NOT LIKE 'lukso:%';
UPDATE lsp6_controller SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE lsp6_controllers_length SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE owned_asset SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE owned_token SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE ownership_transferred SET new_owner_profile_id = 'lukso:' || new_owner_profile_id WHERE new_owner_profile_id IS NOT NULL AND new_owner_profile_id NOT LIKE 'lukso:%';
UPDATE ownership_transferred SET previous_owner_profile_id = 'lukso:' || previous_owner_profile_id WHERE previous_owner_profile_id IS NOT NULL AND previous_owner_profile_id NOT LIKE 'lukso:%';
UPDATE ownership_transferred SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE transfer SET from_profile_id = 'lukso:' || from_profile_id WHERE from_profile_id IS NOT NULL AND from_profile_id NOT LIKE 'lukso:%';
UPDATE transfer SET operator_profile_id = 'lukso:' || operator_profile_id WHERE operator_profile_id IS NOT NULL AND operator_profile_id NOT LIKE 'lukso:%';
UPDATE transfer SET to_profile_id = 'lukso:' || to_profile_id WHERE to_profile_id IS NOT NULL AND to_profile_id NOT LIKE 'lukso:%';
UPDATE unfollow SET follower_universal_profile_id = 'lukso:' || follower_universal_profile_id WHERE follower_universal_profile_id IS NOT NULL AND follower_universal_profile_id NOT LIKE 'lukso:%';
UPDATE unfollow SET unfollowed_universal_profile_id = 'lukso:' || unfollowed_universal_profile_id WHERE unfollowed_universal_profile_id IS NOT NULL AND unfollowed_universal_profile_id NOT LIKE 'lukso:%';
UPDATE universal_profile_owner SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';
UPDATE universal_receiver SET from_profile_id = 'lukso:' || from_profile_id WHERE from_profile_id IS NOT NULL AND from_profile_id NOT LIKE 'lukso:%';
UPDATE universal_receiver SET universal_profile_id = 'lukso:' || universal_profile_id WHERE universal_profile_id IS NOT NULL AND universal_profile_id NOT LIKE 'lukso:%';

-- ---------------------------------------------------------------------------
-- FKs referencing digital_asset (28 FKs)
-- ---------------------------------------------------------------------------
UPDATE chill_claimed SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE data_changed SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE decimals SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE digital_asset_owner SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE executed SET target_asset_id = 'lukso:' || target_asset_id WHERE target_asset_id IS NOT NULL AND target_asset_id NOT LIKE 'lukso:%';
UPDATE lsp12_issued_asset SET issued_asset_id = 'lukso:' || issued_asset_id WHERE issued_asset_id IS NOT NULL AND issued_asset_id NOT LIKE 'lukso:%';
UPDATE lsp4_creator SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE lsp4_creators_length SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE lsp4_metadata SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE lsp4_token_name SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE lsp4_token_symbol SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE lsp4_token_type SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE lsp5_received_asset SET received_asset_id = 'lukso:' || received_asset_id WHERE received_asset_id IS NOT NULL AND received_asset_id NOT LIKE 'lukso:%';
UPDATE lsp8_reference_contract SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE lsp8_token_id_format SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE lsp8_token_metadata_base_uri SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE nft SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE orb_cooldown_expiry SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE orb_faction SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE orb_level SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE orbs_claimed SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE owned_asset SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE owned_token SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE ownership_transferred SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE token_id_data_changed SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE total_supply SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE transfer SET digital_asset_id = 'lukso:' || digital_asset_id WHERE digital_asset_id IS NOT NULL AND digital_asset_id NOT LIKE 'lukso:%';
UPDATE universal_receiver SET from_asset_id = 'lukso:' || from_asset_id WHERE from_asset_id IS NOT NULL AND from_asset_id NOT LIKE 'lukso:%';

-- ---------------------------------------------------------------------------
-- FKs referencing nft (9 FKs)
-- ---------------------------------------------------------------------------
UPDATE chill_claimed SET nft_id = 'lukso:' || nft_id WHERE nft_id IS NOT NULL AND nft_id NOT LIKE 'lukso:%';
UPDATE lsp4_metadata SET nft_id = 'lukso:' || nft_id WHERE nft_id IS NOT NULL AND nft_id NOT LIKE 'lukso:%';
UPDATE orb_cooldown_expiry SET nft_id = 'lukso:' || nft_id WHERE nft_id IS NOT NULL AND nft_id NOT LIKE 'lukso:%';
UPDATE orb_faction SET nft_id = 'lukso:' || nft_id WHERE nft_id IS NOT NULL AND nft_id NOT LIKE 'lukso:%';
UPDATE orb_level SET nft_id = 'lukso:' || nft_id WHERE nft_id IS NOT NULL AND nft_id NOT LIKE 'lukso:%';
UPDATE orbs_claimed SET nft_id = 'lukso:' || nft_id WHERE nft_id IS NOT NULL AND nft_id NOT LIKE 'lukso:%';
UPDATE owned_token SET nft_id = 'lukso:' || nft_id WHERE nft_id IS NOT NULL AND nft_id NOT LIKE 'lukso:%';
UPDATE token_id_data_changed SET nft_id = 'lukso:' || nft_id WHERE nft_id IS NOT NULL AND nft_id NOT LIKE 'lukso:%';
UPDATE transfer SET nft_id = 'lukso:' || nft_id WHERE nft_id IS NOT NULL AND nft_id NOT LIKE 'lukso:%';

-- ---------------------------------------------------------------------------
-- FKs referencing lsp4_metadata (13 FKs)
-- ---------------------------------------------------------------------------
UPDATE digital_asset SET lsp4_metadata_id = 'lukso:' || lsp4_metadata_id WHERE lsp4_metadata_id IS NOT NULL AND lsp4_metadata_id NOT LIKE 'lukso:%';
UPDATE lsp4_metadata_asset SET lsp4_metadata_id = 'lukso:' || lsp4_metadata_id WHERE lsp4_metadata_id IS NOT NULL AND lsp4_metadata_id NOT LIKE 'lukso:%';
UPDATE lsp4_metadata_attribute SET lsp4_metadata_id = 'lukso:' || lsp4_metadata_id WHERE lsp4_metadata_id IS NOT NULL AND lsp4_metadata_id NOT LIKE 'lukso:%';
UPDATE lsp4_metadata_category SET lsp4_metadata_id = 'lukso:' || lsp4_metadata_id WHERE lsp4_metadata_id IS NOT NULL AND lsp4_metadata_id NOT LIKE 'lukso:%';
UPDATE lsp4_metadata_description SET lsp4_metadata_id = 'lukso:' || lsp4_metadata_id WHERE lsp4_metadata_id IS NOT NULL AND lsp4_metadata_id NOT LIKE 'lukso:%';
UPDATE lsp4_metadata_icon SET lsp4_metadata_id = 'lukso:' || lsp4_metadata_id WHERE lsp4_metadata_id IS NOT NULL AND lsp4_metadata_id NOT LIKE 'lukso:%';
UPDATE lsp4_metadata_image SET lsp4_metadata_id = 'lukso:' || lsp4_metadata_id WHERE lsp4_metadata_id IS NOT NULL AND lsp4_metadata_id NOT LIKE 'lukso:%';
UPDATE lsp4_metadata_link SET lsp4_metadata_id = 'lukso:' || lsp4_metadata_id WHERE lsp4_metadata_id IS NOT NULL AND lsp4_metadata_id NOT LIKE 'lukso:%';
UPDATE lsp4_metadata_name SET lsp4_metadata_id = 'lukso:' || lsp4_metadata_id WHERE lsp4_metadata_id IS NOT NULL AND lsp4_metadata_id NOT LIKE 'lukso:%';
UPDATE lsp4_metadata_rank SET lsp4_metadata_id = 'lukso:' || lsp4_metadata_id WHERE lsp4_metadata_id IS NOT NULL AND lsp4_metadata_id NOT LIKE 'lukso:%';
UPDATE lsp4_metadata_score SET lsp4_metadata_id = 'lukso:' || lsp4_metadata_id WHERE lsp4_metadata_id IS NOT NULL AND lsp4_metadata_id NOT LIKE 'lukso:%';
UPDATE nft SET lsp4_metadata_id = 'lukso:' || lsp4_metadata_id WHERE lsp4_metadata_id IS NOT NULL AND lsp4_metadata_id NOT LIKE 'lukso:%';
UPDATE nft SET lsp4_metadata_base_uri_id = 'lukso:' || lsp4_metadata_base_uri_id WHERE lsp4_metadata_base_uri_id IS NOT NULL AND lsp4_metadata_base_uri_id NOT LIKE 'lukso:%';

-- ---------------------------------------------------------------------------
-- FKs referencing lsp3_profile (8 FKs)
-- ---------------------------------------------------------------------------
UPDATE lsp3_profile_asset SET lsp3_profile_id = 'lukso:' || lsp3_profile_id WHERE lsp3_profile_id IS NOT NULL AND lsp3_profile_id NOT LIKE 'lukso:%';
UPDATE lsp3_profile_background_image SET lsp3_profile_id = 'lukso:' || lsp3_profile_id WHERE lsp3_profile_id IS NOT NULL AND lsp3_profile_id NOT LIKE 'lukso:%';
UPDATE lsp3_profile_description SET lsp3_profile_id = 'lukso:' || lsp3_profile_id WHERE lsp3_profile_id IS NOT NULL AND lsp3_profile_id NOT LIKE 'lukso:%';
UPDATE lsp3_profile_image SET lsp3_profile_id = 'lukso:' || lsp3_profile_id WHERE lsp3_profile_id IS NOT NULL AND lsp3_profile_id NOT LIKE 'lukso:%';
UPDATE lsp3_profile_link SET lsp3_profile_id = 'lukso:' || lsp3_profile_id WHERE lsp3_profile_id IS NOT NULL AND lsp3_profile_id NOT LIKE 'lukso:%';
UPDATE lsp3_profile_name SET lsp3_profile_id = 'lukso:' || lsp3_profile_id WHERE lsp3_profile_id IS NOT NULL AND lsp3_profile_id NOT LIKE 'lukso:%';
UPDATE lsp3_profile_tag SET lsp3_profile_id = 'lukso:' || lsp3_profile_id WHERE lsp3_profile_id IS NOT NULL AND lsp3_profile_id NOT LIKE 'lukso:%';
UPDATE universal_profile SET lsp3_profile_id = 'lukso:' || lsp3_profile_id WHERE lsp3_profile_id IS NOT NULL AND lsp3_profile_id NOT LIKE 'lukso:%';

-- ---------------------------------------------------------------------------
-- FKs referencing lsp6_controller (3 FKs)
-- ---------------------------------------------------------------------------
UPDATE lsp6_allowed_call SET controller_id = 'lukso:' || controller_id WHERE controller_id IS NOT NULL AND controller_id NOT LIKE 'lukso:%';
UPDATE lsp6_allowed_erc725_y_data_key SET controller_id = 'lukso:' || controller_id WHERE controller_id IS NOT NULL AND controller_id NOT LIKE 'lukso:%';
UPDATE lsp6_permission SET controller_id = 'lukso:' || controller_id WHERE controller_id IS NOT NULL AND controller_id NOT LIKE 'lukso:%';

-- ---------------------------------------------------------------------------
-- FKs referencing lsp29_encrypted_asset (6 FKs)
-- ---------------------------------------------------------------------------
UPDATE lsp29_encrypted_asset_chunks SET lsp29_encrypted_asset_id = 'lukso:' || lsp29_encrypted_asset_id WHERE lsp29_encrypted_asset_id IS NOT NULL AND lsp29_encrypted_asset_id NOT LIKE 'lukso:%';
UPDATE lsp29_encrypted_asset_description SET lsp29_encrypted_asset_id = 'lukso:' || lsp29_encrypted_asset_id WHERE lsp29_encrypted_asset_id IS NOT NULL AND lsp29_encrypted_asset_id NOT LIKE 'lukso:%';
UPDATE lsp29_encrypted_asset_encryption SET lsp29_encrypted_asset_id = 'lukso:' || lsp29_encrypted_asset_id WHERE lsp29_encrypted_asset_id IS NOT NULL AND lsp29_encrypted_asset_id NOT LIKE 'lukso:%';
UPDATE lsp29_encrypted_asset_file SET lsp29_encrypted_asset_id = 'lukso:' || lsp29_encrypted_asset_id WHERE lsp29_encrypted_asset_id IS NOT NULL AND lsp29_encrypted_asset_id NOT LIKE 'lukso:%';
UPDATE lsp29_encrypted_asset_image SET lsp29_encrypted_asset_id = 'lukso:' || lsp29_encrypted_asset_id WHERE lsp29_encrypted_asset_id IS NOT NULL AND lsp29_encrypted_asset_id NOT LIKE 'lukso:%';
UPDATE lsp29_encrypted_asset_title SET lsp29_encrypted_asset_id = 'lukso:' || lsp29_encrypted_asset_id WHERE lsp29_encrypted_asset_id IS NOT NULL AND lsp29_encrypted_asset_id NOT LIKE 'lukso:%';

-- ---------------------------------------------------------------------------
-- FKs referencing owned_asset (1 FK)
-- ---------------------------------------------------------------------------
UPDATE owned_token SET owned_asset_id = 'lukso:' || owned_asset_id WHERE owned_asset_id IS NOT NULL AND owned_asset_id NOT LIKE 'lukso:%';

-- ===========================================================================
-- STEP 5: Re-enable triggers on all 71 tables
-- ===========================================================================
ALTER TABLE chill_claimed ENABLE TRIGGER ALL;
ALTER TABLE data_changed ENABLE TRIGGER ALL;
ALTER TABLE decimals ENABLE TRIGGER ALL;
ALTER TABLE deployed_contracts ENABLE TRIGGER ALL;
ALTER TABLE deployed_erc1167_proxies ENABLE TRIGGER ALL;
ALTER TABLE digital_asset ENABLE TRIGGER ALL;
ALTER TABLE digital_asset_owner ENABLE TRIGGER ALL;
ALTER TABLE executed ENABLE TRIGGER ALL;
ALTER TABLE follow ENABLE TRIGGER ALL;
ALTER TABLE follower ENABLE TRIGGER ALL;
ALTER TABLE lsp12_issued_asset ENABLE TRIGGER ALL;
ALTER TABLE lsp12_issued_assets_length ENABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_asset ENABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_asset_chunks ENABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_asset_description ENABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_asset_encryption ENABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_asset_entry ENABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_asset_file ENABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_asset_image ENABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_asset_revision_count ENABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_asset_title ENABLE TRIGGER ALL;
ALTER TABLE lsp29_encrypted_assets_length ENABLE TRIGGER ALL;
ALTER TABLE lsp3_profile ENABLE TRIGGER ALL;
ALTER TABLE lsp3_profile_asset ENABLE TRIGGER ALL;
ALTER TABLE lsp3_profile_background_image ENABLE TRIGGER ALL;
ALTER TABLE lsp3_profile_description ENABLE TRIGGER ALL;
ALTER TABLE lsp3_profile_image ENABLE TRIGGER ALL;
ALTER TABLE lsp3_profile_link ENABLE TRIGGER ALL;
ALTER TABLE lsp3_profile_name ENABLE TRIGGER ALL;
ALTER TABLE lsp3_profile_tag ENABLE TRIGGER ALL;
ALTER TABLE lsp4_creator ENABLE TRIGGER ALL;
ALTER TABLE lsp4_creators_length ENABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata ENABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_asset ENABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_attribute ENABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_category ENABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_description ENABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_icon ENABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_image ENABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_link ENABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_name ENABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_rank ENABLE TRIGGER ALL;
ALTER TABLE lsp4_metadata_score ENABLE TRIGGER ALL;
ALTER TABLE lsp4_token_name ENABLE TRIGGER ALL;
ALTER TABLE lsp4_token_symbol ENABLE TRIGGER ALL;
ALTER TABLE lsp4_token_type ENABLE TRIGGER ALL;
ALTER TABLE lsp5_received_asset ENABLE TRIGGER ALL;
ALTER TABLE lsp5_received_assets_length ENABLE TRIGGER ALL;
ALTER TABLE lsp6_allowed_call ENABLE TRIGGER ALL;
ALTER TABLE lsp6_allowed_erc725_y_data_key ENABLE TRIGGER ALL;
ALTER TABLE lsp6_controller ENABLE TRIGGER ALL;
ALTER TABLE lsp6_controllers_length ENABLE TRIGGER ALL;
ALTER TABLE lsp6_permission ENABLE TRIGGER ALL;
ALTER TABLE lsp8_reference_contract ENABLE TRIGGER ALL;
ALTER TABLE lsp8_token_id_format ENABLE TRIGGER ALL;
ALTER TABLE lsp8_token_metadata_base_uri ENABLE TRIGGER ALL;
ALTER TABLE nft ENABLE TRIGGER ALL;
ALTER TABLE orb_cooldown_expiry ENABLE TRIGGER ALL;
ALTER TABLE orb_faction ENABLE TRIGGER ALL;
ALTER TABLE orb_level ENABLE TRIGGER ALL;
ALTER TABLE orbs_claimed ENABLE TRIGGER ALL;
ALTER TABLE owned_asset ENABLE TRIGGER ALL;
ALTER TABLE owned_token ENABLE TRIGGER ALL;
ALTER TABLE ownership_transferred ENABLE TRIGGER ALL;
ALTER TABLE token_id_data_changed ENABLE TRIGGER ALL;
ALTER TABLE total_supply ENABLE TRIGGER ALL;
ALTER TABLE transfer ENABLE TRIGGER ALL;
ALTER TABLE unfollow ENABLE TRIGGER ALL;
ALTER TABLE universal_profile ENABLE TRIGGER ALL;
ALTER TABLE universal_profile_owner ENABLE TRIGGER ALL;
ALTER TABLE universal_receiver ENABLE TRIGGER ALL;

-- ===========================================================================
-- STEP 6: Create indexes on network column (idempotent)
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_chill_claimed_network ON chill_claimed (network);
CREATE INDEX IF NOT EXISTS idx_data_changed_network ON data_changed (network);
CREATE INDEX IF NOT EXISTS idx_decimals_network ON decimals (network);
CREATE INDEX IF NOT EXISTS idx_deployed_contracts_network ON deployed_contracts (network);
CREATE INDEX IF NOT EXISTS idx_deployed_erc1167_proxies_network ON deployed_erc1167_proxies (network);
CREATE INDEX IF NOT EXISTS idx_digital_asset_network ON digital_asset (network);
CREATE INDEX IF NOT EXISTS idx_digital_asset_owner_network ON digital_asset_owner (network);
CREATE INDEX IF NOT EXISTS idx_executed_network ON executed (network);
CREATE INDEX IF NOT EXISTS idx_follow_network ON follow (network);
CREATE INDEX IF NOT EXISTS idx_follower_network ON follower (network);
CREATE INDEX IF NOT EXISTS idx_lsp12_issued_asset_network ON lsp12_issued_asset (network);
CREATE INDEX IF NOT EXISTS idx_lsp12_issued_assets_length_network ON lsp12_issued_assets_length (network);
CREATE INDEX IF NOT EXISTS idx_lsp29_encrypted_asset_network ON lsp29_encrypted_asset (network);
CREATE INDEX IF NOT EXISTS idx_lsp29_encrypted_asset_chunks_network ON lsp29_encrypted_asset_chunks (network);
CREATE INDEX IF NOT EXISTS idx_lsp29_encrypted_asset_description_network ON lsp29_encrypted_asset_description (network);
CREATE INDEX IF NOT EXISTS idx_lsp29_encrypted_asset_encryption_network ON lsp29_encrypted_asset_encryption (network);
CREATE INDEX IF NOT EXISTS idx_lsp29_encrypted_asset_entry_network ON lsp29_encrypted_asset_entry (network);
CREATE INDEX IF NOT EXISTS idx_lsp29_encrypted_asset_file_network ON lsp29_encrypted_asset_file (network);
CREATE INDEX IF NOT EXISTS idx_lsp29_encrypted_asset_image_network ON lsp29_encrypted_asset_image (network);
CREATE INDEX IF NOT EXISTS idx_lsp29_encrypted_asset_revision_count_network ON lsp29_encrypted_asset_revision_count (network);
CREATE INDEX IF NOT EXISTS idx_lsp29_encrypted_asset_title_network ON lsp29_encrypted_asset_title (network);
CREATE INDEX IF NOT EXISTS idx_lsp29_encrypted_assets_length_network ON lsp29_encrypted_assets_length (network);
CREATE INDEX IF NOT EXISTS idx_lsp3_profile_network ON lsp3_profile (network);
CREATE INDEX IF NOT EXISTS idx_lsp3_profile_asset_network ON lsp3_profile_asset (network);
CREATE INDEX IF NOT EXISTS idx_lsp3_profile_background_image_network ON lsp3_profile_background_image (network);
CREATE INDEX IF NOT EXISTS idx_lsp3_profile_description_network ON lsp3_profile_description (network);
CREATE INDEX IF NOT EXISTS idx_lsp3_profile_image_network ON lsp3_profile_image (network);
CREATE INDEX IF NOT EXISTS idx_lsp3_profile_link_network ON lsp3_profile_link (network);
CREATE INDEX IF NOT EXISTS idx_lsp3_profile_name_network ON lsp3_profile_name (network);
CREATE INDEX IF NOT EXISTS idx_lsp3_profile_tag_network ON lsp3_profile_tag (network);
CREATE INDEX IF NOT EXISTS idx_lsp4_creator_network ON lsp4_creator (network);
CREATE INDEX IF NOT EXISTS idx_lsp4_creators_length_network ON lsp4_creators_length (network);
CREATE INDEX IF NOT EXISTS idx_lsp4_metadata_network ON lsp4_metadata (network);
CREATE INDEX IF NOT EXISTS idx_lsp4_metadata_asset_network ON lsp4_metadata_asset (network);
CREATE INDEX IF NOT EXISTS idx_lsp4_metadata_attribute_network ON lsp4_metadata_attribute (network);
CREATE INDEX IF NOT EXISTS idx_lsp4_metadata_category_network ON lsp4_metadata_category (network);
CREATE INDEX IF NOT EXISTS idx_lsp4_metadata_description_network ON lsp4_metadata_description (network);
CREATE INDEX IF NOT EXISTS idx_lsp4_metadata_icon_network ON lsp4_metadata_icon (network);
CREATE INDEX IF NOT EXISTS idx_lsp4_metadata_image_network ON lsp4_metadata_image (network);
CREATE INDEX IF NOT EXISTS idx_lsp4_metadata_link_network ON lsp4_metadata_link (network);
CREATE INDEX IF NOT EXISTS idx_lsp4_metadata_name_network ON lsp4_metadata_name (network);
CREATE INDEX IF NOT EXISTS idx_lsp4_metadata_rank_network ON lsp4_metadata_rank (network);
CREATE INDEX IF NOT EXISTS idx_lsp4_metadata_score_network ON lsp4_metadata_score (network);
CREATE INDEX IF NOT EXISTS idx_lsp4_token_name_network ON lsp4_token_name (network);
CREATE INDEX IF NOT EXISTS idx_lsp4_token_symbol_network ON lsp4_token_symbol (network);
CREATE INDEX IF NOT EXISTS idx_lsp4_token_type_network ON lsp4_token_type (network);
CREATE INDEX IF NOT EXISTS idx_lsp5_received_asset_network ON lsp5_received_asset (network);
CREATE INDEX IF NOT EXISTS idx_lsp5_received_assets_length_network ON lsp5_received_assets_length (network);
CREATE INDEX IF NOT EXISTS idx_lsp6_allowed_call_network ON lsp6_allowed_call (network);
CREATE INDEX IF NOT EXISTS idx_lsp6_allowed_erc725_y_data_key_network ON lsp6_allowed_erc725_y_data_key (network);
CREATE INDEX IF NOT EXISTS idx_lsp6_controller_network ON lsp6_controller (network);
CREATE INDEX IF NOT EXISTS idx_lsp6_controllers_length_network ON lsp6_controllers_length (network);
CREATE INDEX IF NOT EXISTS idx_lsp6_permission_network ON lsp6_permission (network);
CREATE INDEX IF NOT EXISTS idx_lsp8_reference_contract_network ON lsp8_reference_contract (network);
CREATE INDEX IF NOT EXISTS idx_lsp8_token_id_format_network ON lsp8_token_id_format (network);
CREATE INDEX IF NOT EXISTS idx_lsp8_token_metadata_base_uri_network ON lsp8_token_metadata_base_uri (network);
CREATE INDEX IF NOT EXISTS idx_nft_network ON nft (network);
CREATE INDEX IF NOT EXISTS idx_orb_cooldown_expiry_network ON orb_cooldown_expiry (network);
CREATE INDEX IF NOT EXISTS idx_orb_faction_network ON orb_faction (network);
CREATE INDEX IF NOT EXISTS idx_orb_level_network ON orb_level (network);
CREATE INDEX IF NOT EXISTS idx_orbs_claimed_network ON orbs_claimed (network);
CREATE INDEX IF NOT EXISTS idx_owned_asset_network ON owned_asset (network);
CREATE INDEX IF NOT EXISTS idx_owned_token_network ON owned_token (network);
CREATE INDEX IF NOT EXISTS idx_ownership_transferred_network ON ownership_transferred (network);
CREATE INDEX IF NOT EXISTS idx_token_id_data_changed_network ON token_id_data_changed (network);
CREATE INDEX IF NOT EXISTS idx_total_supply_network ON total_supply (network);
CREATE INDEX IF NOT EXISTS idx_transfer_network ON transfer (network);
CREATE INDEX IF NOT EXISTS idx_unfollow_network ON unfollow (network);
CREATE INDEX IF NOT EXISTS idx_universal_profile_network ON universal_profile (network);
CREATE INDEX IF NOT EXISTS idx_universal_profile_owner_network ON universal_profile_owner (network);
CREATE INDEX IF NOT EXISTS idx_universal_receiver_network ON universal_receiver (network);

COMMIT;
