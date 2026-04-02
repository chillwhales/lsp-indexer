---
estimated_steps: 36
estimated_files: 2
skills_used: []
---

# T01: Write the complete backfill SQL migration script

Write a hand-written SQL migration (per D018) that transforms all existing LUKSO data to the multi-chain schema. The script must:

1. Run inside a single BEGIN/COMMIT transaction
2. Use ALTER TABLE ... DISABLE TRIGGER ALL on every table to bypass FK checks during updates
3. Add `network` column with `ADD COLUMN IF NOT EXISTS network varchar NOT NULL DEFAULT 'lukso'` to all 71 entity tables
4. UPDATE all 27 deterministic-ID entity PKs: `SET id = 'lukso:' || id WHERE id NOT LIKE 'lukso:%'`
5. UPDATE all ~103 FK columns that reference those PKs with the same prefix
6. Re-enable triggers on all tables
7. Create indexes on the network column where not present

The script must be idempotent — safe to re-run. Every UPDATE must have a `WHERE ... NOT LIKE 'lukso:%'` guard.

Also write a verification SQL script that checks FK integrity after migration:
- For each FK relationship, count rows where FK value IS NOT NULL but doesn't match any PK in the parent table
- Report any orphaned FK references

**Critical table name reference (Subsquid SnakeNamingStrategy via inflected.underscore()):**

All 71 entity table names (snake_case):
chill_claimed, data_changed, decimals, deployed_contracts, deployed_erc1167_proxies, digital_asset, digital_asset_owner, executed, follow, follower, lsp12_issued_asset, lsp12_issued_assets_length, lsp29_encrypted_asset, lsp29_encrypted_asset_chunks, lsp29_encrypted_asset_description, lsp29_encrypted_asset_encryption, lsp29_encrypted_asset_entry, lsp29_encrypted_asset_file, lsp29_encrypted_asset_image, lsp29_encrypted_asset_revision_count, lsp29_encrypted_asset_title, lsp29_encrypted_assets_length, lsp3_profile, lsp3_profile_asset, lsp3_profile_background_image, lsp3_profile_description, lsp3_profile_image, lsp3_profile_link, lsp3_profile_name, lsp3_profile_tag, lsp4_creator, lsp4_creators_length, lsp4_metadata, lsp4_metadata_asset, lsp4_metadata_attribute, lsp4_metadata_category, lsp4_metadata_description, lsp4_metadata_icon, lsp4_metadata_image, lsp4_metadata_link, lsp4_metadata_name, lsp4_metadata_rank, lsp4_metadata_score, lsp4_token_name, lsp4_token_symbol, lsp4_token_type, lsp5_received_asset, lsp5_received_assets_length, lsp6_allowed_call, lsp6_allowed_erc725_y_data_key, lsp6_controller, lsp6_controllers_length, lsp6_permission, lsp8_reference_contract, lsp8_token_id_format, lsp8_token_metadata_base_uri, nft, orb_cooldown_expiry, orb_faction, orb_level, orbs_claimed, owned_asset, owned_token, ownership_transferred, token_id_data_changed, total_supply, transfer, unfollow, universal_profile, universal_profile_owner, universal_receiver

**27 Deterministic-ID entities (PK needs 'lukso:' prefix):**
universal_profile, digital_asset, nft, lsp4_metadata, lsp3_profile, lsp6_controller, lsp29_encrypted_asset, owned_asset, total_supply, decimals, digital_asset_owner, universal_profile_owner, lsp4_token_name, lsp4_token_symbol, lsp4_token_type, lsp4_creators_length, lsp3_profile_name, lsp5_received_assets_length, lsp6_controllers_length, lsp8_token_id_format, lsp8_reference_contract, lsp8_token_metadata_base_uri, lsp12_issued_assets_length, lsp29_encrypted_asset_entry, lsp29_encrypted_assets_length, owned_token, follower

PLUS these composite-ID entities whose IDs must ALSO be prefixed:
lsp6_permission, lsp6_allowed_call, lsp6_allowed_erc725_y_data_key, lsp5_received_asset, lsp4_creator, lsp12_issued_asset

**FK Update Map (all ~103 FK columns):**

Referenced by universal_profile (35 FKs):
data_changed.universal_profile_id, deployed_contracts.universal_profile_id, deployed_erc1167_proxies.universal_profile_id, executed.target_profile_id, executed.universal_profile_id, follow.followed_universal_profile_id, follow.follower_universal_profile_id, follower.followed_universal_profile_id, follower.follower_universal_profile_id, lsp12_issued_asset.universal_profile_id, lsp12_issued_assets_length.universal_profile_id, lsp29_encrypted_asset.universal_profile_id, lsp29_encrypted_asset_entry.universal_profile_id, lsp29_encrypted_asset_revision_count.universal_profile_id, lsp29_encrypted_assets_length.universal_profile_id, lsp3_profile.universal_profile_id, lsp4_creator.creator_profile_id, lsp5_received_asset.universal_profile_id, lsp5_received_assets_length.universal_profile_id, lsp6_controller.controller_profile_id, lsp6_controller.universal_profile_id, lsp6_controllers_length.universal_profile_id, owned_asset.universal_profile_id, owned_token.universal_profile_id, ownership_transferred.new_owner_profile_id, ownership_transferred.previous_owner_profile_id, ownership_transferred.universal_profile_id, transfer.from_profile_id, transfer.operator_profile_id, transfer.to_profile_id, unfollow.follower_universal_profile_id, unfollow.unfollowed_universal_profile_id, universal_profile_owner.universal_profile_id, universal_receiver.from_profile_id, universal_receiver.universal_profile_id

Referenced by digital_asset (28 FKs):
chill_claimed.digital_asset_id, data_changed.digital_asset_id, decimals.digital_asset_id, digital_asset_owner.digital_asset_id, executed.target_asset_id, lsp12_issued_asset.issued_asset_id, lsp4_creator.digital_asset_id, lsp4_creators_length.digital_asset_id, lsp4_metadata.digital_asset_id, lsp4_token_name.digital_asset_id, lsp4_token_symbol.digital_asset_id, lsp4_token_type.digital_asset_id, lsp5_received_asset.received_asset_id, lsp8_reference_contract.digital_asset_id, lsp8_token_id_format.digital_asset_id, lsp8_token_metadata_base_uri.digital_asset_id, nft.digital_asset_id, orb_cooldown_expiry.digital_asset_id, orb_faction.digital_asset_id, orb_level.digital_asset_id, orbs_claimed.digital_asset_id, owned_asset.digital_asset_id, owned_token.digital_asset_id, ownership_transferred.digital_asset_id, token_id_data_changed.digital_asset_id, total_supply.digital_asset_id, transfer.digital_asset_id, universal_receiver.from_asset_id

Referenced by nft (9 FKs):
chill_claimed.nft_id, lsp4_metadata.nft_id, orb_cooldown_expiry.nft_id, orb_faction.nft_id, orb_level.nft_id, orbs_claimed.nft_id, owned_token.nft_id, token_id_data_changed.nft_id, transfer.nft_id

Referenced by lsp4_metadata (13 FKs):
digital_asset.lsp4_metadata_id, lsp4_metadata_asset.lsp4_metadata_id, lsp4_metadata_attribute.lsp4_metadata_id, lsp4_metadata_category.lsp4_metadata_id, lsp4_metadata_description.lsp4_metadata_id, lsp4_metadata_icon.lsp4_metadata_id, lsp4_metadata_image.lsp4_metadata_id, lsp4_metadata_link.lsp4_metadata_id, lsp4_metadata_name.lsp4_metadata_id, lsp4_metadata_rank.lsp4_metadata_id, lsp4_metadata_score.lsp4_metadata_id, nft.lsp4_metadata_id, nft.lsp4_metadata_base_uri_id

Referenced by lsp3_profile (8 FKs):
lsp3_profile_asset.lsp3_profile_id, lsp3_profile_background_image.lsp3_profile_id, lsp3_profile_description.lsp3_profile_id, lsp3_profile_image.lsp3_profile_id, lsp3_profile_link.lsp3_profile_id, lsp3_profile_name.lsp3_profile_id, lsp3_profile_tag.lsp3_profile_id, universal_profile.lsp3_profile_id

Referenced by lsp6_controller (3 FKs):
lsp6_allowed_call.controller_id, lsp6_allowed_erc725_y_data_key.controller_id, lsp6_permission.controller_id

Referenced by lsp29_encrypted_asset (6 FKs):
lsp29_encrypted_asset_chunks.lsp29_encrypted_asset_id, lsp29_encrypted_asset_description.lsp29_encrypted_asset_id, lsp29_encrypted_asset_encryption.lsp29_encrypted_asset_id, lsp29_encrypted_asset_file.lsp29_encrypted_asset_id, lsp29_encrypted_asset_image.lsp29_encrypted_asset_id, lsp29_encrypted_asset_title.lsp29_encrypted_asset_id

Referenced by owned_asset (1 FK):
owned_token.owned_asset_id

## Inputs

- `packages/indexer/schema.graphql`

## Expected Output

- `packages/typeorm/db/migrations/backfill-network.sql`
- `packages/typeorm/db/migrations/verify-backfill.sql`

## Verification

Test SQL syntax: grep -c 'UPDATE' packages/typeorm/db/migrations/backfill-network.sql returns >= 130 (27+ PK updates + ~103 FK updates). grep -c 'DISABLE TRIGGER ALL' packages/typeorm/db/migrations/backfill-network.sql returns 71. grep -c 'ENABLE TRIGGER ALL' packages/typeorm/db/migrations/backfill-network.sql returns 71. grep -c 'ADD COLUMN IF NOT EXISTS network' packages/typeorm/db/migrations/backfill-network.sql returns 71. test -f packages/typeorm/db/migrations/verify-backfill.sql.
