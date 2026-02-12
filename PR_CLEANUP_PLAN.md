# PR #152 Cleanup Plan

## Current Status

- Branch: `fix/indexer-v2-metadata-fetch-resilience`
- Total commits: 17
- Status: **WORKS IN PRODUCTION** ✅

## Problem

Too many commits with debug logging, reverts, and experimental changes mixed in.

## Solution: Create Clean PR with 3 Commits

### Commit 1: Docker Entrypoint Fix

**File:** `docker/v2/entrypoint.sh`

```bash
pnpm migration:generate || {
  echo "ℹ️  No schema changes detected - skipping migration generation"
}
```

**Why:** Prevents restart loop when no schema changes exist.

---

### Commit 2: Add Error Handling to Metadata Fetch

**Files:**

- `packages/indexer-v2/src/utils/metadataFetch.ts`
- `packages/indexer-v2/src/constants/index.ts`

**Changes:**

1. Add try-catch around `workerPool.fetchBatch()`
2. Add constants: `FETCH_BATCH_SIZE=1000`, `FETCH_BATCH_TIMEOUT_MS=300000`
3. Implement batching loop (split requests into batches of 1000)
4. Add Promise.race timeout to prevent infinite hangs
5. Track failures, continue to next batch on error

**Code snippet:**

```typescript
const batchCount = Math.ceil(requests.length / FETCH_BATCH_SIZE);
for (let i = 0; i < batchCount; i++) {
  const batchRequests = requests.slice(i * FETCH_BATCH_SIZE, (i + 1) * FETCH_BATCH_SIZE);

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), FETCH_BATCH_TIMEOUT_MS),
    );
    results = await Promise.race([hctx.workerPool.fetchBatch(batchRequests), timeoutPromise]);
  } catch (err) {
    // Log and continue
    totalFailed += batchRequests.length;
    continue;
  }
}
```

**Why:** Prevents processor from hanging when metadata fetch fails.

---

### Commit 3: Fix Worker Path Resolution for ts-node

**File:** `packages/indexer-v2/src/core/metadataWorkerPool.ts`

**Change:**

```typescript
// Before
const workerPath = path.resolve(__dirname, 'metadataWorker.js');

// After
const workerPath = __filename.endsWith('.ts')
  ? path.resolve(__dirname, '../../lib/core/metadataWorker.js')
  : path.resolve(__dirname, 'metadataWorker.js');
```

**Why:** **THIS WAS THE BUG**. When running with ts-node, `__dirname` points to `src/core` but worker file is in `lib/core`. Workers crashed on startup with MODULE_NOT_FOUND.

---

## Additional Logging (Optional - Keep or Remove?)

**Keep these minimal logs:**

```typescript
hctx.context.log.info(`[${entityType}] At chain head - checking for metadata backlog`);
hctx.context.log.info(`[${entityType}] Found ${count} unfetched entities`);
hctx.context.log.info(
  `[${entityType}] Metadata backlog drain complete: ${processed} processed, ${failed} failed`,
);
```

**Remove verbose debug logs:**

- Worker creation logs
- Per-batch distribution logs
- Worker message logs
- Already removed in commit 8b18d49

---

## How to Create Clean Branch

### Option A: Interactive Rebase

```bash
git checkout fix/indexer-v2-metadata-fetch-resilience
git rebase -i origin/refactor/indexer-v2
# Squash/fixup commits into 3 logical commits
# Force push
```

### Option B: Fresh Branch with Cherry-Pick

```bash
git checkout -b fix/indexer-v2-clean origin/refactor/indexer-v2
# Manually apply the 3 changes above
git commit -m "fix(docker): ..."
git commit -m "fix(indexer-v2): add error handling..."
git commit -m "fix(indexer-v2): fix worker path..."
```

### Option C: Use Current Branch, Update PR Description

- Keep all commits as-is
- Write comprehensive PR description explaining the fixes
- Reviewers can see the debug process

---

## Recommendation

**Option C** - Keep the commits, improve PR description.

**Why:**

1. Shows the debugging process (valuable context)
2. Each commit passed CI
3. Production is working
4. Can always squash on merge

**PR Description Template:**

```markdown
## Problem

Indexer-v2 hung at block 6,729,432 when reaching archive head, never switching to RPC mode.

## Root Cause

Worker threads crashed on startup with MODULE_NOT_FOUND - workers never started at all.

When running via ts-node, `__dirname` points to `src/core` but compiled worker file is in `lib/core/metadataWorker.js`.

## Solution

1. Fix worker path resolution for ts-node execution
2. Add error handling to prevent hangs on fetch failures
3. Add timeout protection (5 minutes per batch)
4. Fix Docker entrypoint restart loop

## Testing

- ✅ Workers start successfully (4 threads)
- ✅ Processes 1000 URLs per batch in ~3 seconds
- ✅ Retry logic works (failed requests retried up to 6 times)
- ✅ Indexer progresses past block 6,729,432
- ✅ Continues to next block ranges

## Performance

- 10,000 entity backlog = ~30-40 seconds
- 100x faster than initial 100-batch approach
```

---

## Next Steps (Separate PRs)

### PR 2: Improve Debug Logging Strategy

- Create logging utility with configurable levels
- Add `DEBUG_WORKER_POOL` env var
- Structured logging for operations

### PR 3: Optimize Worker Concurrency

- Queue-based worker pool
- Keep N workers busy with X requests each
- Env vars: `WORKER_POOL_SIZE=4`, `WORKER_BATCH_SIZE=250`, `FETCH_LIMIT=10000`
