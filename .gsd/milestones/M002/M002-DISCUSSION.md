# M002 Discussion Log

## Exchange — 2026-03-18T07:34:51.672Z

### Sidecar strategy

The docs MDX files are plain markdown with frontmatter — no JSX components. Given that, do you want per-page .md files at all?

- **Keep per-page .md sidecars (Recommended)** — Generate public/llm/{slug}.md from each .mdx source (frontmatter stripped). Gives Context7 and any per-page AI fetch a clean stable URL. The generate script handles both generation and CI check.
- **Drop per-page .md, keep llms.txt + llms-full.txt only** — Simpler — llms-full.txt covers full-context loading, llms.txt covers discovery. No sidecar script, no CI check. Context7 would point at llms-full.txt instead of per-page URLs.

**Selected:** Keep per-page .md sidecars (Recommended)
**Notes:** well can you clarify if fumadocs renders plain md files or it needs to have mdx, beacause im pretty usre it needs mdx and thats why we generat md with a script so we can server plain md to ai agents

---
