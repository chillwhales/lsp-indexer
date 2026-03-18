# CLAUDE.md

Instructions for Claude Code when working with this repository.

## ⚠️ Documentation — MANDATORY

**Every code change MUST include corresponding documentation updates.** The docs app (`apps/docs`) contains MDX documentation pages that serve as the public-facing docs for the `@lsp-indexer` packages. When you modify any package (`node`, `react`, `next`, `types`, or the indexer), you MUST update the relevant docs page(s):

| Change                                     | Update                                                                            |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| New hook or server action                  | `apps/docs/src/app/docs/react/page.mdx` and/or `docs/next/page.mdx`              |
| New fetch function, parser, or key factory | `apps/docs/src/app/docs/node/page.mdx`                                           |
| New type, filter, sort, or include field   | `apps/docs/src/app/docs/node/page.mdx` and domain tables in `docs/react/page.mdx`|
| New domain (e.g., new entity type)         | All docs pages + supported domains table in `apps/docs/src/app/(home)/page.mdx`  |
| Indexer pipeline, Docker, or env changes   | `apps/docs/src/app/docs/indexer/page.mdx`                                        |
| New env variable                           | `apps/docs/.env.example` + quickstart + relevant package docs                     |
| Subscription or provider changes           | `docs/react/page.mdx` and/or `docs/next/page.mdx` + quickstart                   |

**Do NOT skip documentation. Outdated docs are worse than no docs.**

## Critical Workflow

### Before ANY Work

1. **GitHub Issue Management** — **REQUIRED** before starting any work:
   - Check if task/epic exists: `gh issue list --search "task name"`
   - If task exists:
     - Move task to "In Progress": `gh issue edit <number> --add-label "in-progress"`
     - Reference issue in commits: `git commit -m "feat: description (#123)"`
   - If task does NOT exist:
     - **For small tasks**: Create task issue: `gh issue create --template task.md`
     - **For large tasks (>1 day)**: Create epic with 2+ sub-tasks
   - **This is MANDATORY** — No work without a tracked issue

### After Completing Work

1. **Close GitHub Issue**:
   - Commit with issue reference: `git commit -m "feat: description (closes #123)"`
   - Or manually close: `gh issue close <number> --comment "Completed in PR #X"`

## Git Push Rules

- **Never push directly to a PR base branch** — always create a feature branch and open a PR to it. This applies to `main`, epic branches, and any other branch that has an open PR.
- **Check for existing open PRs** from the current branch before creating a new one: `gh pr list --head $(git branch --show-current) --state open`

## When Guidelines Conflict with Requirements

If documentation makes a requested change impossible or conflicts with requirements:

1. **Do NOT** proceed with the change
2. **Explain** what guideline prevents the change and why
3. **Wait** for user to clarify or update guidelines
