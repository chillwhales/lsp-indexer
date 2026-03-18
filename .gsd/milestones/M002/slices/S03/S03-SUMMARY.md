---
id: S03
milestone: M002
provides:
  - apps/docs/scripts/generate-md.mjs — generate + --check modes for .md sidecars
  - apps/docs/public/llm/{quickstart,indexer,node,react,next}.md — 5 static files committed
  - apps/docs/package.json — generate/generate:check scripts
  - apps/docs/src/app/llms.txt/route.ts — GET handler, project summary + per-page links
  - apps/docs/src/app/llms-full.txt/route.ts — GET handler, all 5 docs concatenated
requires:
  - slice: S02
    provides: content/docs/*.mdx MDX files as source
affects: [S04]
key_files:
  - apps/docs/scripts/generate-md.mjs
  - apps/docs/public/llm/
  - apps/docs/src/app/llms.txt/route.ts
  - apps/docs/src/app/llms-full.txt/route.ts
  - apps/docs/package.json
key_decisions:
  - "generate script prepends # {title} from frontmatter so .md files are self-contained"
  - "llms-full.txt reads from public/llm/ static files (reuses sidecars, no MDX parsing)"
  - "route.ts for llms.txt is plain NextResponse (not route handler pattern with Request param)"
patterns_established:
  - "generate-md.mjs: generate mode writes, --check mode exits 1 on stale with slug name"
drill_down_paths:
  - .gsd/milestones/M002/slices/S03/S03-PLAN.md
duration: 30min
verification_result: pass
completed_at: 2026-03-18T08:50:00Z
---

# S03: AI Compatibility — llms.txt, llms-full.txt, .md Sidecars

**5 static .md sidecars committed; /llms.txt and /llms-full.txt serve AI agents; generate:check exits 1 on stale**

## What Was Built

**T01:** `scripts/generate-md.mjs` reads each `content/docs/{slug}.mdx`, extracts the title from frontmatter, strips frontmatter, prepends `# {title}`, writes `public/llm/{slug}.md`. Check mode compares to disk and exits 1 naming stale slugs. Added `generate` and `generate:check` scripts to package.json. Generated all 5 `.md` files.

**T02:** Created `app/llms.txt/route.ts` returning a plain-text project summary with per-page `/llm/{slug}.md` links. Created `app/llms-full.txt/route.ts` reading all 5 `public/llm/*.md` files and concatenating with `---` separators. Both registered as dynamic (`ƒ`) routes. Build passes.

## Deviations

None.

## Files Created/Modified

- `apps/docs/scripts/generate-md.mjs` — new
- `apps/docs/public/llm/*.md` — 5 generated files (committed)
- `apps/docs/package.json` — generate/generate:check scripts added
- `apps/docs/src/app/llms.txt/route.ts` — new
- `apps/docs/src/app/llms-full.txt/route.ts` — new
