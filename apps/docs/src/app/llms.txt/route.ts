import { NextResponse } from 'next/server';

const CONTENT = `# @lsp-indexer

LUKSO blockchain indexer with React and Next.js hooks.

A monorepo providing packages to query LUKSO L1 data indexed by a Subsquid-based processor.

## Packages

- @lsp-indexer/node — Low-level GraphQL fetch functions, parsers, query key factories, and subscription client
- @lsp-indexer/react — Client-side React hooks (TanStack Query) for all 12 LUKSO domains
- @lsp-indexer/next — Next.js server actions and query hooks (server-side data fetching)
- @lsp-indexer/indexer — Subsquid blockchain processor that writes to PostgreSQL via Hasura

## Supported Domains

Universal Profiles, Digital Assets, NFTs, Owned Assets, Owned Tokens, Followers/Following,
Creators, Issued Assets, Encrypted Assets, Data Changed Events, Token ID Data Changed Events,
Universal Receiver Events.

## Documentation Pages

- Overview: /llm/index.md
- Quickstart: /llm/quickstart.md
- Indexer: /llm/indexer.md
- @lsp-indexer/node: /llm/node.md
- @lsp-indexer/react: /llm/react.md
- @lsp-indexer/next: /llm/next.md

## Full Documentation

All pages concatenated: /llms-full.txt
`;

export function GET(): NextResponse {
  return new NextResponse(CONTENT, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
