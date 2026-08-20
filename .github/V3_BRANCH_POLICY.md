# LSP Indexer v3 branch policy

The `lsp-indexer-v3` branch is the permanent integration branch for the multi-chain LSP
Indexer v3 program tracked by [epic #390](https://github.com/chillwhales/lsp-indexer/issues/390).

## Required workflow

1. Create every implementation branch from the latest `lsp-indexer-v3`.
2. Name indexer feature branches `feat/indexer-<name>` and associate them with a v3 issue.
3. Open every implementation pull request against `lsp-indexer-v3`, never directly against
   `main`.
4. Keep the integration pull request from `lsp-indexer-v3` to `main` in draft while any v3 goal
   or production acceptance gate remains incomplete.
5. Do not push commits directly to `lsp-indexer-v3` after this one-time bootstrap.
6. Do not merge the integration pull request automatically or through an agent. Only
   [@b00ste](https://github.com/b00ste) may mark it ready and merge it personally after v3 is fully
   working.

## Acceptance boundary

V3 is complete only when it is multi-chain by design, uses the SQD Pipes SDK without a legacy
processor or TypeORM persistence path, publishes the v3 `types`, `node`, `react`, and `next`
packages, passes replay and reorg validation, reaches shadow-production parity, and includes all
required public and operator documentation.
