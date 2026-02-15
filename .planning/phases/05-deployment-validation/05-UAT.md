---
status: testing
phase: 05-deployment-validation
source: 05.1-01-SUMMARY.md, 05.1-02-SUMMARY.md, 05.2-01-SUMMARY.md, 05.2-02-SUMMARY.md, 05.2-03-SUMMARY.md, 05.3-01-SUMMARY.md
started: 2026-02-15T11:21:21Z
updated: 2026-02-15T11:50:00Z
---

## Current Test

number: 12
name: Overall V1-V2 Parity
expected: |
Running comparison tool with --tolerance=2 shows all 72 entity types as ✓ MATCH or ≈ TOLERANCE (within 2%).
No MISMATCH or ✗ FAIL results for entity types that should match.
Known divergences (LSP8ReferenceContract) properly flagged as V1 bugs.
awaiting: user response

## Tests

### 1. Pipeline Address Filter Bug Fix

expected: After re-indexing with the pipeline bug fix, the comparison tool should show non-zero entity counts for Follow (>100K), Unfollow (>2K), DeployedContracts (>0), and DeployedERC1167Proxies (>35K) entities — previously at zero due to case-sensitive address comparison
result: [pending]

### 2. UniversalProfileOwner Handler

expected: Comparison tool shows UniversalProfileOwner entity count matching V1 (within 2% tolerance). Owner entities created for every OwnershipTransferred event on verified Universal Profiles, with id=emitting address and address=newOwner field
result: [pending]

### 3. DigitalAssetOwner Handler

expected: Comparison tool shows DigitalAssetOwner entity count matching V1 (within 2% tolerance). Owner entities created for every OwnershipTransferred event on verified Digital Assets, with id=emitting address and address=newOwner field
result: [pending]

### 4. ChillClaimed Handler

expected: Comparison tool shows ChillClaimed entity count matching V1. Entities created for Chillwhale NFT mints with on-chain verification at chain head (value=true when claimed, value=false when not)
result: [pending]

### 5. OrbsClaimed Handler

expected: Comparison tool shows OrbsClaimed entity count matching V1. Entities created for Orbs NFT claims with on-chain verification at chain head (value=true when claimed, value=false when not)
result: [pending]

### 6. OwnedAsset Double-Processing Fix

expected: Comparison tool shows OwnedAsset count matching V1 (within 2% tolerance) — previously V2 had ~14K MORE entities due to double-processing bug. TriggeredBy filtering ensures each transfer processed exactly once per batch
result: [pending]

### 7. OrbLevel Mint Defaults

expected: Comparison tool shows OrbLevel entity count matching V1 (within 2% tolerance). OrbLevel entities created on mint with default value=0, overwritten when TokenIdDataChanged events arrive
result: [pending]

### 8. OrbCooldownExpiry Mint Defaults

expected: Comparison tool shows OrbCooldownExpiry entity count matching V1 (within 2% tolerance). OrbCooldownExpiry entities created on mint with default value=0, overwritten when TokenIdDataChanged events arrive
result: [pending]

### 9. OrbFaction Mint Defaults

expected: Comparison tool shows OrbFaction entity count matching V1 (within 2% tolerance). OrbFaction entities created on mint with default value='Neutral', overwritten when TokenIdDataChanged events arrive
result: [pending]

### 10. LSP4 Base URI Derivation

expected: Comparison tool shows LSP4Metadata entity count matching V1 (within 2% tolerance) — V2 was missing ~84K entities from base URI derivation. Base URI handler creates per-token metadata URLs from LSP8TokenMetadataBaseURI + NFT tokenIds
result: [pending]

### 11. Entity Upsert Pattern Helpers

expected: Code inspection shows resolveEntity and resolveEntities helpers exist in handlerHelpers.ts with 12/12 unit tests passing. Old mergeEntitiesFromBatchAndDb function deleted. Search codebase confirms zero references to old function name
result: [pending]

### 1. Pipeline Address Filter Bug Fix

expected: After re-indexing with the pipeline bug fix, the comparison tool should show non-zero entity counts for Follow (>100K), Unfollow (>2K), DeployedContracts (>0), and DeployedERC1167Proxies (>35K) entities — previously at zero due to case-sensitive address comparison
result: issue
reported: "Comparison shows 29/72 exact matches + 15 within tolerance, but many V2 fields showing as 'undefined' including LSP4 metadata sub-entities (Image/Asset/Attribute), LSP29 encrypted assets, LSP5/LSP6 entities. 19,535 unexpected diffs. Exit status 1."
severity: blocker

### 2. UniversalProfileOwner Handler

expected: Comparison tool shows UniversalProfileOwner entity count matching V1 (within 2% tolerance). Owner entities created for every OwnershipTransferred event on verified Universal Profiles, with id=emitting address and address=newOwner field
result: [pending]

### 3. DigitalAssetOwner Handler

expected: Comparison tool shows DigitalAssetOwner entity count matching V1 (within 2% tolerance). Owner entities created for every OwnershipTransferred event on verified Digital Assets, with id=emitting address and address=newOwner field
result: [pending]

### 4. ChillClaimed Handler

expected: Comparison tool shows ChillClaimed entity count matching V1. Entities created for Chillwhale NFT mints with on-chain verification at chain head (value=true when claimed, value=false when not)
result: [pending]

### 5. OrbsClaimed Handler

expected: Comparison tool shows OrbsClaimed entity count matching V1. Entities created for Orbs NFT claims with on-chain verification at chain head (value=true when claimed, value=false when not)
result: [pending]

### 6. OwnedAsset Double-Processing Fix

expected: Comparison tool shows OwnedAsset count matching V1 (within 2% tolerance) — previously V2 had ~14K MORE entities due to double-processing bug. TriggeredBy filtering ensures each transfer processed exactly once per batch
result: [pending]

### 7. OrbLevel Mint Defaults

expected: Comparison tool shows OrbLevel entity count matching V1 (within 2% tolerance). OrbLevel entities created on mint with default value=0, overwritten when TokenIdDataChanged events arrive
result: [pending]

### 8. OrbCooldownExpiry Mint Defaults

expected: Comparison tool shows OrbCooldownExpiry entity count matching V1 (within 2% tolerance). OrbCooldownExpiry entities created on mint with default value=0, overwritten when TokenIdDataChanged events arrive
result: [pending]

### 9. OrbFaction Mint Defaults

expected: Comparison tool shows OrbFaction entity count matching V1 (within 2% tolerance). OrbFaction entities created on mint with default value=0, overwritten when TokenIdDataChanged events arrive
result: [pending]

### 10. LSP4 Base URI Derivation

expected: Comparison tool shows LSP4Metadata entity count matching V1 (within 2% tolerance) — V2 was missing ~84K entities from base URI derivation. Base URI handler creates per-token metadata URLs from LSP8TokenMetadataBaseURI + NFT tokenIds
result: [pending]

### 11. Entity Upsert Pattern Helpers

expected: Code inspection shows resolveEntity and resolveEntities helpers exist in handlerHelpers.ts with 12/12 unit tests passing. Old mergeEntitiesFromBatchAndDb function deleted. Search codebase confirms zero references to old function name
result: [pending]

### 12. Overall V1-V2 Parity

expected: Running comparison tool with --tolerance=2 shows all 72 entity types as ✓ MATCH or ≈ TOLERANCE (within 2%). No MISMATCH or ✗ FAIL results for entity types that should match. Known divergences (LSP8ReferenceContract) properly flagged as V1 bugs
result: [pending]

## Summary

total: 12
passed: 0
issues: 1
pending: 11
skipped: 0

## Gaps

- truth: "After re-indexing with the pipeline bug fix, the comparison tool should show non-zero entity counts for Follow (>100K), Unfollow (>2K), DeployedContracts (>0), and DeployedERC1167Proxies (>35K) entities"
  status: failed
  reason: "User reported: Comparison shows 29/72 exact matches + 15 within tolerance, but many V2 fields showing as 'undefined' including LSP4 metadata sub-entities (Image/Asset/Attribute), LSP29 encrypted assets, LSP5/LSP6 entities. 19,535 unexpected diffs. Exit status 1."
  severity: blocker
  test: 1
  root_cause: "V2 uses uuidv4() for metadata sub-entity IDs (LSP4MetadataImage, LSP4MetadataAsset, LSP4MetadataAttribute, LSP29\* sub-entities), generating random UUIDs. V1 uses deterministic IDs. Comparison tool samples IDs from V1 (e.g., '00003c95-9a1e-4a02-8eb8-2cf19a21c08b') and queries V2 for those exact IDs, but V2 has completely different UUIDs for the same entities. Result: targetRow is undefined for all sampled metadata sub-entities, showing as 19K+ diffs."
  artifacts:
  - path: "packages/indexer-v2/src/handlers/lsp4MetadataFetch.handler.ts"
    issue: "Line 161: id: uuidv4() generates random UUIDs instead of deterministic IDs"
  - path: "packages/indexer-v2/src/handlers/lsp29MetadataFetch.handler.ts"
    issue: "Uses uuidv4() for all LSP29 sub-entity IDs"
  - path: "packages/comparison-tool/src/comparisonEngine.ts"
    issue: "Lines 127-136: Samples IDs from V1, queries V2 by those IDs - fails with random UUIDs"
    missing:
    - "Deterministic ID generation for metadata sub-entities matching V1's scheme"
    - "OR: Comparison tool fallback to content-based matching when IDs don't align"
      debug_session: ""
      fix_applied: true
      fix_commit: "51ea57f"
      fix_description: "Added dual matching strategies: ID-based for core entities, content-based for metadata sub-entities (isMetadataSub=true). New querySampleRows() method fetches full rows, buildContentSignatureMap() creates content signatures for matching."
