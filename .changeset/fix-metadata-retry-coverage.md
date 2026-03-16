---
'@chillwhales/indexer': patch
---

Complete metadata retry coverage for all retryable error codes. The cross-batch retry query only matched ETIMEDOUT and EPROTO, leaving ~45k metadata entries permanently stuck. Now retries all worker-recognized network errors (ECONNABORTED, ECONNRESET, ENOTFOUND, EAI_AGAIN) plus batch-level WORKER_POOL_ERROR. Also resolves bare IPFS CIDv0/CIDv1 hashes missing the ipfs:// prefix.
