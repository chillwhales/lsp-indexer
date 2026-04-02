# S02: Backfill Migration

**Goal:** Write and validate a hand-crafted SQL migration that adds the network column to all existing tables, sets default values for existing LUKSO rows, prefixes all deterministic entity IDs with 'lukso:', and updates all FK references to match the new prefixed IDs.
**Demo:** After this: Apply SQL migration to a PostgreSQL database with existing LUKSO data. All rows get network='lukso'. All deterministic IDs are prefixed with 'lukso:'. All FK references updated consistently. Row counts preserved. FK constraint checks pass.

## Tasks
