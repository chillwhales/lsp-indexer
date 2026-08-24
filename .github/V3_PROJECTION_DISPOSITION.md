# LSP Indexer v3 projection disposition

Status: implemented chain-state boundary for [#384](https://github.com/chillwhales/lsp-indexer/issues/384)

This is the v2-to-v3 disposition for all 29 legacy entity handlers. V3 does not port the handler
registry, batch context, enrichment queue, TypeORM entities, or handler-specific length and
sub-entity tables. It reduces newly inserted `event_facts` in canonical order into deterministic,
chain-scoped current-state tables.

## Shared projection contract

- Interface candidates are deduplicated by exact `(block number, block hash, category, address)`.
  Bounded direct reads are used before the recorded Multicall3 deployment and bounded Multicall3
  batches afterward. The RPC hash is checked before and after every read. Current and legacy LSP0,
  LSP7, and LSP8 interface IDs are supported.
- A transport error or malformed multicall response aborts the batch. A failed individual contract
  call is an invalid candidate. Raw facts and raw ERC725Y values remain stored either way.
- Typed UP and digital-asset rows are created only after successful verification. Invalid optional
  references remain absent while their source fact/value remains queryable. A later invalid result
  marks an existing core row invalid and blocks further typed mutations until it verifies again.
- A fresh or reset projection database must start at the configured network origin. An existing
  cursor permits continuation only when `INDEXER_FROM_BLOCK` does not skip the next block.
- Only event IDs newly inserted in the target transaction reach the reducer. Resetting a cursor and
  replaying identical facts therefore cannot double-apply supply, balances, registries, or edges.
- Current state is keyed by chain ID plus its domain natural key. All IDs are deterministic and all
  writes, indexed-head visibility, rollback snapshots, and the Pipes cursor commit together.
- Changed creator, issued-asset, and controller rows are deleted before reinsertion, allowing
  unique array indexes to swap without transient collisions.
- Metadata bytes and URLs are durable chain inputs here. External IPFS/HTTP fetching, revision
  publication, retry policy, and metadata sub-entities belong to #385.

## Handler matrix

| V2 handler                 | V3 disposition                                                                                                                | V3 storage or owner                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `decimals`                 | Replaced by the block-pinned verification read plan; only meaningful for verified LSP7 assets.                                | `digital_assets.decimals`                                                  |
| `universalProfileOwner`    | Integrated into the ownership reducer.                                                                                        | `universal_profiles.owner_address`                                         |
| `digitalAssetOwner`        | Integrated into the same ownership reducer without creating the wrong domain for an emitter.                                  | `digital_assets.owner_address`                                             |
| `totalSupply`              | Integrated into ordered mint/burn transfer reduction with non-negative clamping.                                              | `digital_assets.total_supply`                                              |
| `nft`                      | Integrated for mint, burn, transfer ownership, and token-data stubs.                                                          | `nfts`                                                                     |
| `formattedTokenId`         | Collapsed into NFT reduction and retroactive reformatting when the collection format changes.                                 | `nfts.formatted_token_id`                                                  |
| `ownedAssets`              | Replaced by transfer-authoritative balances; zero balances delete current ownership.                                          | `owned_assets`, `owned_tokens`                                             |
| `follower`                 | Integrated as a current edge with follow/unfollow timestamps and an unfollow tombstone.                                       | `follower_edges`                                                           |
| `lsp4TokenName`            | Integrated scalar decode; raw bytes are retained even when invalid.                                                           | `digital_assets.name`, `data_values`                                       |
| `lsp4TokenSymbol`          | Integrated scalar decode.                                                                                                     | `digital_assets.symbol`, `data_values`                                     |
| `lsp4TokenType`            | Integrated bounded integer decode.                                                                                            | `digital_assets.token_type`, `data_values`                                 |
| `lsp8TokenIdFormat`        | Integrated current/legacy formats plus retroactive NFT formatting.                                                            | `digital_assets.token_id_format`, `nfts.formatted_token_id`, `data_values` |
| `lsp8ReferenceContract`    | Integrated exact address decode.                                                                                              | `digital_assets.token_id_reference_contract`, `data_values`                |
| `lsp8MetadataBaseURI`      | Integrated header validation and retroactive token-URI derivation.                                                            | `digital_assets.base_uri`, `nfts.token_uri`, `data_values`                 |
| `lsp4MetadataBaseUri`      | Its deterministic URL derivation is collapsed into the NFT/base-URI reducer; external content handling is #385.               | `nfts.token_uri`; #385 metadata revisions/jobs                             |
| `lsp4Creators`             | Length/index/map events merge into one row per creator. Shrinks and cleared map values delete stale rows.                     | `creators`, `data_values`                                                  |
| `lsp12IssuedAssets`        | Length/index/map events merge into one verified asset relationship; unresolved references remain only as raw values.          | `issued_assets`, `data_values`                                             |
| `lsp5ReceivedAssets`       | No duplicate registry projection. Raw registry state is retained, while transfers are authoritative for current balances.     | `data_values`, `owned_assets`                                              |
| `lsp6Controllers`          | Length/index/maps merge into one controller row; permissions remain lossless and CompactBytesArray values become JSON arrays. | `controllers`, `data_values`                                               |
| `lsp3Profile`              | Chain value is durable; parsing and publication are assigned to #385.                                                         | `data_values`; #385 metadata revisions/jobs                                |
| `lsp3ProfileFetch`         | Deliberately deferred; no network fetch occurs inside the Pipes transaction.                                                  | #385 metadata worker                                                       |
| `lsp4Metadata`             | Contract/token-scoped chain value is durable; parsing and publication are assigned to #385.                                   | `data_values`; #385 metadata revisions/jobs                                |
| `lsp4MetadataFetch`        | Deliberately deferred; stale-response and retry semantics are owned by #385.                                                  | #385 metadata worker                                                       |
| `lsp29EncryptedAsset`      | LSP29 length/index/map/revision bytes are retained without v2 helper entities.                                                | `data_values`                                                              |
| `lsp29EncryptedAssetFetch` | Deliberately deferred with all external metadata work.                                                                        | #385 metadata worker                                                       |
| `chillClaimed`             | Network-gated Chillwhales mint default plus monotonic claim polling at the exact available Portal head.                       | `chillwhales_nfts.chill_claimed`                                           |
| `orbsClaimed`              | Network-gated mint default plus block-pinned ORBS claim polling.                                                              | `chillwhales_nfts.orbs_claimed`                                            |
| `orbLevel`                 | Network-gated mint defaults and packed token-data reduction.                                                                  | `chillwhales_nfts.level`, `cooldown_expiry`                                |
| `orbFaction`               | Network-gated mint default and UTF-8 token-data reduction.                                                                    | `chillwhales_nfts.faction`                                                 |

The Chillwhales extension is enabled only by the LUKSO Mainnet network catalog entry. Its claim
reads are monotonic and bounded to 250 tokens per head, with new mints ahead of due stored rows. A
successful false result is scheduled 720 blocks later and an individual failed call 30 blocks
later; a transport or result-shape failure aborts the batch. Polling uses the Portal head's exact
number and hash, never unpinned RPC `latest`.

## Ordering and invalid-reference semantics

Events are ordered by block number, transaction index, and log index before reduction. Mint,
transfer, and burn transitions update supply and ownership from the state produced by the preceding
fact. Registry index/map updates merge across batches, and a later length shrink removes every row
at or above the new length.

The zero and dead addresses never become typed projections. EOAs may still appear as controller or
creator addresses because those relationships do not require the referenced address to be a UP.
An issued asset, follower edge, owned asset, or owned token is materialized only when its required
typed endpoints exist. This removes nullable enrichment work without discarding the source fact or
ERC725Y value.

## Evidence

- Projection unit tests cover exact-block candidate planning, current/legacy interface IDs, RPC
  failure semantics, value decoders, ordered reducers, registry cleanup, product extensions, and
  every persistence table.
- The PostgreSQL 17 suite proves exact replay does not double balances and a fork restores the
  previous owner, balance, facts, projection rows, snapshots, indexed head, and cursor.
- Production v2/v3 comparison at a shared finalized height remains a #389 cutover gate. This
  implementation does not claim that shadow-production evidence early.
