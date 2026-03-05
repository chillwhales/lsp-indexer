# Phase 12 — Cross-Check Audit Results

**Date:** 2026-03-05
**Scope:** All 16 @chillwhales/\* packages cross-checked against lsp-indexer codebase

## Cross-Check: @chillwhales/\* Package Overlaps

Packages already swapped in Plan 01 (`erc725`, `lsp1`) are skipped.

| Package             | Version | Published       | Exports                                                                             | Overlaps Found                                                                          | Action                |
| ------------------- | ------- | --------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------- |
| @chillwhales/config | —       | No (not on npm) | —                                                                                   | None                                                                                    | Skip — not published  |
| @chillwhales/erc725 | 0.1.0   | Yes             | _(swapped in Plan 01)_                                                              | _(done)_                                                                                | **Already swapped**   |
| @chillwhales/lsp1   | 0.1.0   | Yes             | _(swapped in Plan 01)_                                                              | _(done)_                                                                                | **Already swapped**   |
| @chillwhales/lsp2   | 0.2.0   | Yes             | `encodeVerifiableUri`, `decodeVerifiableUri`, `parseVerifiableUri`, schemas, etc.   | None — lsp-indexer does not encode/decode VerifiableURIs (Hasura provides decoded data) | No swap               |
| @chillwhales/lsp3   | 0.1.2   | Yes             | `lsp3ProfileSchema`, `getProfileDisplayName`, `getProfileImageUrl`                  | None — lsp-indexer parses Hasura-provided flattened data, not raw LSP3 JSON             | No swap               |
| @chillwhales/lsp4   | 0.2.0   | Yes             | `lsp4MetadataSchema`, `getAssetDisplayName`, `getAssetImageUrl`, `attributesSchema` | None — lsp-indexer parses Hasura-provided relational data, not raw LSP4 JSON            | No swap               |
| @chillwhales/lsp6   | 0.2.0   | Yes             | `buildPermissionsKey`, `buildAllowedCallsKey`                                       | None — lsp-indexer is read-only (no key manager interactions)                           | No swap               |
| @chillwhales/lsp7   | 0.2.0   | Yes             | `LSP7_MINTABLE_INIT`                                                                | None — lsp-indexer does not deploy contracts                                            | No swap               |
| @chillwhales/lsp8   | 0.2.0   | Yes             | `LSP8_MINTABLE_INIT`                                                                | None — lsp-indexer does not deploy contracts                                            | No swap               |
| @chillwhales/lsp17  | 0.2.0   | Yes             | `buildExtensionKey`, `extractSelectorFromExtensionKey`, `filterExtensionKeys`       | None — lsp-indexer does not manage contract extensions                                  | No swap               |
| @chillwhales/lsp23  | 0.2.0   | Yes             | `generateDeployParams`                                                              | None — lsp-indexer does not deploy Universal Profiles                                   | No swap               |
| @chillwhales/lsp26  | 0.2.0   | Yes             | `LSP26_FOLLOWER_SYSTEM` (constant only)                                             | None — lsp-indexer reads follower data from Hasura, no on-chain follower system calls   | No swap               |
| @chillwhales/lsp29  | 0.2.0   | Yes             | `computeLsp29MapKey`, `decodeLsp29Metadata`, schemas, etc.                          | None — lsp-indexer reads encrypted asset data from Hasura (already decoded/indexed)     | No swap               |
| @chillwhales/lsp31  | 0.2.0   | Yes             | `encodeLsp31Uri`, `parseLsp31Uri`, `computeContentHash`, schemas                    | None — lsp-indexer does not encode/decode LSP31 URIs                                    | No swap               |
| @chillwhales/up     | 0.2.0   | Yes             | `UP_INIT` (constant only)                                                           | None — lsp-indexer does not deploy Universal Profiles                                   | No swap               |
| @chillwhales/utils  | 0.2.0   | Yes             | 90+ utility functions (see details below)                                           | **Partial** — see analysis                                                              | Evaluate per-function |

### @chillwhales/utils — Detailed Analysis

The `@chillwhales/utils` package exports 90+ utility functions. Key overlap areas checked:

| Upstream Function                               | Local Equivalent                                    | Same API?                                                                                                            | Swap?                                                     | Rationale                                                |
| ----------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| `isNumeric(value)`                              | `packages/indexer-v2/src/utils/index.ts::isNumeric` | Yes — identical logic (`!isNaN(Number(v)) && !isNaN(parseFloat(v))`)                                                 | **No** — indexer-v2 is out of scope (Phase 13 removes it) | indexer-v2 is legacy; Phase 13 deletes it entirely       |
| `isEqual(a, b)`                                 | Not used in publishable packages                    | —                                                                                                                    | No                                                        | No overlap                                               |
| `parseLinks(links)`                             | `packages/node/src/parsers/utils.ts::parseLinks`    | **Different** — upstream parses raw URLs with title extraction; local parses Hasura relational `{title, url}` tuples | **No**                                                    | Different input shapes (raw URL string vs Hasura object) |
| `truncateAddress(addr)`                         | `apps/test/src/lib/utils.ts::truncateAddress`       | Similar but different format (`0x1234…5678` vs upstream)                                                             | **No** — test app utility, not in publishable packages    | UI display helper, not in npm packages                   |
| `formatRelativeTime()`                          | `apps/test/src/lib/utils.ts::formatRelativeTime`    | Similar concept                                                                                                      | **No** — test app utility, not in publishable packages    | UI display helper, not in npm packages                   |
| `cidToGatewayUrl()` / `extractCidFromIpfsUrl()` | `apps/test/src/lib/utils.ts::resolveUrl`            | Different scope                                                                                                      | **No** — simpler local version for test app only          | Local version is trivial (string replace)                |
| `findBestImage()` / `findClosestImage()`        | Not used in lsp-indexer                             | —                                                                                                                    | No                                                        | No overlap                                               |
| `compareAddresses()`                            | Not used in publishable packages                    | —                                                                                                                    | No                                                        | lsp-indexer uses `_ilike` at Hasura level                |

**Summary:** No swappable overlaps found. The `@chillwhales/utils` functions operate on raw blockchain data (addresses, IPFS CIDs, raw metadata), while lsp-indexer's utilities operate on Hasura-provided relational data (already parsed by the indexer). The two codebases are at different layers of the stack.

## Extractable Utilities

Scanned the following files for pure utility functions that could be contributed upstream:

- `packages/node/src/parsers/utils.ts` — parseImage, parseAsset, parseLinks, parseAttributes, parseImages, numericToString
- `packages/node/src/services/utils.ts` — escapeLike, orderDir, hasActiveIncludes, normalizeTimestamp, buildBlockOrderSort
- `packages/types/src/include-types.ts` — IncludeResult, PartialExcept, ActiveFields
- `packages/node/src/parsers/strip.ts` — stripExcluded

| Utility               | Source              | Candidate?   | Target Package       | Rationale                                                                                                |
| --------------------- | ------------------- | ------------ | -------------------- | -------------------------------------------------------------------------------------------------------- |
| `parseImage`          | `parsers/utils.ts`  | **No**       | —                    | Transforms Hasura relational data (snake_case fields) — specific to Hasura schema, not raw LSP data      |
| `parseAsset`          | `parsers/utils.ts`  | **No**       | —                    | Same as parseImage — Hasura-specific transformation                                                      |
| `parseLinks`          | `parsers/utils.ts`  | **No**       | —                    | Hasura relational tuple → clean object — Hasura-specific                                                 |
| `parseAttributes`     | `parsers/utils.ts`  | **No**       | —                    | Hasura relational tuple → clean object — Hasura-specific                                                 |
| `parseImages`         | `parsers/utils.ts`  | **No**       | —                    | Groups by `image_index` from Hasura — Hasura-specific                                                    |
| `numericToString`     | `parsers/utils.ts`  | **No**       | —                    | Converts Hasura `numeric` scalar to safe string — Hasura-specific                                        |
| `escapeLike`          | `services/utils.ts` | **No**       | —                    | Escapes PostgreSQL LIKE wildcards for Hasura `_ilike` — Hasura/SQL-specific                              |
| `orderDir`            | `services/utils.ts` | **No**       | —                    | Maps direction+nulls to Hasura `Order_By` enum — tightly coupled to Hasura types                         |
| `hasActiveIncludes`   | `services/utils.ts` | **No**       | —                    | Internal include-system helper — specific to this codebase's include pattern                             |
| `normalizeTimestamp`  | `services/utils.ts` | **Marginal** | `@chillwhales/utils` | Generic (unix seconds → ISO string), but trivially simple (3 lines) — not worth the upstream PR overhead |
| `buildBlockOrderSort` | `services/utils.ts` | **No**       | —                    | Returns Hasura `order_by` objects — tightly coupled to Hasura schema                                     |
| `IncludeResult`       | `include-types.ts`  | **No**       | —                    | Prisma-style type algebra — specific to this codebase's conditional include pattern                      |
| `PartialExcept`       | `include-types.ts`  | **Marginal** | `@chillwhales/utils` | Generic utility type, but trivially simple (`Partial<T> & Pick<T, K>`) and common in TypeScript projects |
| `stripExcluded`       | `parsers/strip.ts`  | **No**       | —                    | Runtime companion to IncludeResult — tightly coupled to the include system                               |
| `isNumeric`           | `indexer-v2/utils`  | **No**       | —                    | Already exists as `@chillwhales/utils::isNumeric`. indexer-v2 is legacy (Phase 13 deletes)               |

### Test App Utilities (apps/test/src/lib/utils.ts)

| Utility                | Candidate? | Rationale                                                                                                                                     |
| ---------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `formatTokenAmount`    | **No**     | BigInt-based uint256 formatter with compact notation — interesting but too opinionated (tier thresholds, decimal places) for a shared package |
| `truncateAddress`      | **No**     | Already exists as `@chillwhales/utils::truncateAddress`                                                                                       |
| `formatRelativeTime`   | **No**     | Already exists as `@chillwhales/utils::formatRelativeTime`                                                                                    |
| `resolveUrl`           | **No**     | Trivial ipfs:// → https://ipfs.io/ipfs/ replace. `@chillwhales/utils::cidToGatewayUrl` is more comprehensive                                  |
| `getProfileLabel`      | **No**     | UI display helper — too specific to card component patterns                                                                                   |
| `getDigitalAssetLabel` | **No**     | UI display helper — too specific to card component patterns                                                                                   |

## Why No PRs

After thorough cross-checking of all 16 @chillwhales/\* packages and scanning all utility functions in the lsp-indexer codebase, **no extractable utilities are generic enough for upstream contribution**. The reasons fall into three categories:

### 1. Different Stack Layers

The lsp-indexer operates at the **Hasura/GraphQL read layer** — it consumes already-indexed, relational data from a PostgreSQL database via Hasura. Its utilities transform Hasura's snake_case relational output into clean camelCase domain objects.

The @chillwhales/\* packages operate at the **on-chain interaction layer** — they encode/decode raw blockchain data (VerifiableURIs, ERC725Y keys, contract deployments). There is minimal functional overlap between these two layers.

### 2. Tightly Coupled to Internal Systems

Most lsp-indexer utilities are tightly coupled to:

- **Hasura's `Order_By` type enum** (e.g., `orderDir`, `buildBlockOrderSort`)
- **Hasura's `_ilike` operator** (e.g., `escapeLike`)
- **The codebase's conditional include type system** (e.g., `IncludeResult`, `stripExcluded`, `hasActiveIncludes`)
- **Hasura's relational data shapes** (e.g., `parseImage`, `parseLinks`, `parseAttributes`)

These are architectural patterns, not portable utilities.

### 3. Already Covered or Trivially Simple

The few generic candidates are either:

- **Already in @chillwhales/utils** (e.g., `isNumeric`, `truncateAddress`, `formatRelativeTime`)
- **Too trivially simple** to justify a PR (e.g., `normalizeTimestamp` is 3 lines, `PartialExcept` is a one-line type alias)

### Conclusion

This is a valid outcome per CONTEXT.md: "Upstream PRs are opened but do NOT block this phase — local code stays until upstream merges." In this case, no PRs are warranted because the lsp-indexer's utility layer operates at a fundamentally different abstraction level than the @chillwhales packages.

---

_Audit completed: 2026-03-05_
_All 16 @chillwhales/\* packages checked (14 remaining after erc725 and lsp1 swapped in Plan 01)_
