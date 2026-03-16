---
'@chillwhales/indexer': patch
---

Fix OrbLevel/OrbCooldownExpiry FK enrichment failure when updated via TokenIdDataChanged events. TypeORM relation properties loaded from DB are not own enumerable properties, so spreading the entity missed digitalAsset and nft fields, causing the enrichment pipeline to skip FK assignment.
