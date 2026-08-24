# LSP Indexer v3 raw event disposition

Status: implemented for [#383](https://github.com/chillwhales/lsp-indexer/issues/383)

This is the v2-to-v3 contract for the 11 legacy event plugins. V3 uses narrow SQD Pipes queries,
Pipes' native `defineAbi()` codecs, and one deterministic `event_facts` record per accepted log. It
does not import a v2 plugin, generated ABI module, TypeORM entity, batch context, or enrichment
queue.

## Shared fact contract

Every accepted log stores these fields outside its decoded payload:

| Field                                                      | V3 behavior                                                                 |
| ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`                                                       | `eip155:<chainId>:log:<block>:<transactionIndex>:<logIndex>`                |
| `network`, `chainId`                                       | Required configured network identity                                        |
| `blockNumber`, `blockHash`, `parentHash`, `blockTimestamp` | Required canonical block provenance                                         |
| `transactionHash`, `transactionIndex`, `logIndex`          | Required transaction/log provenance                                         |
| `address`, `topic0`, `topics`, `data`                      | Lowercase raw EVM values                                                    |
| `eventName`, `eventDomain`                                 | Stable routing identity determined by the exact topic                       |
| `decoded`                                                  | V2-parity JSON on success; `null` for a known topic with malformed ABI data |

Unsigned ABI integers are decimal strings in JSON, avoiding precision loss and matching the public
package convention. Addresses, token IDs, data keys, topics, and byte strings keep their lossless
hex representation. LSP8 transfers retain the v2 synthetic `amount: "1"`; LSP7 transfers carry
`tokenId: null` so both variants have one stable payload shape.

## Plugin matrix

| V2 plugin              | Signature                                                                                                                  | Query scope                              | V3 identity                        | Decoded v2 fields retained                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| `dataChanged`          | `DataChanged(bytes32,bytes)`                                                                                               | Global exact topic                       | `DataChanged` / `erc725y`          | `dataKey`, `dataValue`                                                                         |
| `executed`             | `Executed(uint256,address,uint256,bytes4)`                                                                                 | Global exact topic                       | `Executed` / `erc725x`             | `decodedOperationType`, `operationType`, `value`, `target`, `selector`                         |
| `universalReceiver`    | `UniversalReceiver(address,uint256,bytes32,bytes,bytes)`                                                                   | Global exact topic                       | `UniversalReceiver` / `lsp0`       | `from`, `value`, `typeId`, `receivedData`, `returnedValue`                                     |
| `lsp7Transfer`         | `Transfer(address,address,address,uint256,bool,bytes)`                                                                     | Global exact topic                       | `Transfer` / `lsp7`                | `operator`, `from`, `to`, `amount`, `tokenId: null`, `force`, `data`                           |
| `lsp8Transfer`         | `Transfer(address,address,address,bytes32,bool,bytes)`                                                                     | Global exact topic                       | `Transfer` / `lsp8`                | `operator`, `from`, `to`, `amount: "1"`, `tokenId`, `force`, `data`                            |
| `ownershipTransferred` | `OwnershipTransferred(address,address)`                                                                                    | Global exact topic                       | `OwnershipTransferred` / `lsp14`   | `previousOwner`, `newOwner`                                                                    |
| `tokenIdDataChanged`   | `TokenIdDataChanged(bytes32,bytes32,bytes)`                                                                                | Global exact topic                       | `TokenIdDataChanged` / `lsp8`      | `tokenId`, `dataKey`, `dataValue`                                                              |
| `follow`               | `Follow(address,address)`                                                                                                  | Configured LSP26 address and start block | `Follow` / `lsp26`                 | `followerAddress`, `followedAddress`                                                           |
| `unfollow`             | `Unfollow(address,address)`                                                                                                | Configured LSP26 address and start block | `Unfollow` / `lsp26`               | `followerAddress`, `unfollowedAddress`                                                         |
| `deployedContracts`    | `DeployedContracts(address,address,(bytes32,uint256,bytes),(uint256,bytes,bool,bytes),address,bytes)`                      | Configured LSP23 address and start block | `DeployedContracts` / `lsp23`      | Both contract addresses, both named deployment tuples, post-deployment module and calldata     |
| `deployedProxies`      | `DeployedERC1167Proxies(address,address,(bytes32,uint256,address,bytes),(uint256,address,bytes,bool,bytes),address,bytes)` | Configured LSP23 address and start block | `DeployedERC1167Proxies` / `lsp23` | Both contract addresses, both named initialization tuples, post-deployment module and calldata |

LSP23 and LSP26 queries derive their address and first block from the selected network catalog.
Ethereum Sepolia has no configured LSP26 capability, so it issues no follower request and rejects a
matching signature if a Portal over-delivers one. Global events remain raw facts regardless of the
emitter's later interface-verification result; typed projection creation belongs to #384. The same
query requests every block header and persists it with the Portal's millisecond timestamp, including
blocks without a selected event, so canonical parent links cannot develop gaps between event facts.

## Invalid and duplicate input

- An unknown topic is outside the supported event surface and is not stored.
- A known LSP23/LSP26 topic from the wrong address, before deployment, or on a network without that
  capability is not stored.
- A known topic with valid raw hex/provenance but malformed ABI data is stored with its name and
  domain and `decoded: null`.
- Invalid fundamental provenance, such as a malformed address, hash, topic, index, or timestamp,
  fails the batch so the Pipes cursor cannot advance past untrustworthy input.
- Identical duplicate delivery is collapsed by deterministic ID. Two different records at the same
  deterministic position fail before persistence.
- Database inserts are idempotent and run inside the official Drizzle target transaction with the
  indexed head, rollback snapshots, and Pipes cursor.

## Evidence

- `packages/indexer-v3/src/events/__tests__/events.test.ts` pins all 11 topics and shared payload
  fields, all configured networks, singleton boundaries, malformed input, duplicate delivery, and
  the query-aware Portal transform.
- `packages/indexer-v3/src/db/__tests__/persistence.integration.test.ts` sends decoded and malformed
  facts through a Portal fixture and PostgreSQL 17, then proves identical replay and fork rollback.
- Production comparison at a shared finalized height remains a #389 cutover gate; this matrix does
  not claim that shadow-production evidence early.
