---
phase: quick-2
plan: 2
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/indexer/package.json
  - .changeset/config.json
  - .github/workflows/docker.yml
autonomous: true
must_haves:
  truths:
    - "Changesets versions @chillwhales/indexer with CHANGELOG and git tags"
    - "Other private packages (abi, typeorm, comparison-tool) are ignored by changesets"
    - "Docker workflow triggers on changeset-created indexer tags"
    - "Indexer package.json reflects current version 2.1.1"
  artifacts:
    - path: ".changeset/config.json"
      provides: "Private package versioning + ignore list"
      contains: "\"version\": true"
    - path: "packages/indexer/package.json"
      provides: "Indexer version baseline"
      contains: "\"version\": \"2.1.1\""
    - path: ".github/workflows/docker.yml"
      provides: "Tag-triggered Docker build"
      contains: "@chillwhales/indexer@"
  key_links:
    - from: ".changeset/config.json"
      to: "packages/indexer/package.json"
      via: "privatePackages enables versioning for non-ignored private packages"
      pattern: "privatePackages.*version.*true"
    - from: ".github/workflows/docker.yml"
      to: ".changeset/config.json"
      via: "tag trigger matches changeset tag format"
      pattern: "@chillwhales/indexer@"
---

<objective>
Wire changesets to version the indexer package and trigger Docker builds on release.

Purpose: Enable automated release pipeline — changeset PRs generate CHANGELOG + version bump + git tag, which triggers Docker image build and push to GHCR.

Output: Updated changeset config, indexer package.json, and Docker workflow.
</objective>

<execution_context>
@/home/coder/.config/opencode/get-shit-done/workflows/execute-plan.md
@/home/coder/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md

Release flow after changes:
1. Dev adds changeset: `pnpm changeset` → selects `@chillwhales/indexer` → writes summary
2. PR merged to main → release.yml creates Release PR (version bump + CHANGELOG.md)
3. Release PR merged → `changeset publish` creates git tag `@chillwhales/indexer@X.Y.Z`
4. Tag push triggers docker.yml → builds + pushes image to GHCR

<interfaces>
From .changeset/config.json (current):
```json
{
  "privatePackages": { "version": false, "tag": false },
  "fixed": [["@lsp-indexer/types", "@lsp-indexer/node", "@lsp-indexer/react", "@lsp-indexer/next"]],
  "ignore": []
}
```

From .github/workflows/docker.yml (current trigger):
```yaml
on:
  push:
    tags: ['indexer-v*']
  workflow_dispatch:
    inputs:
      version:
        description: 'Version tag (e.g. 1.0.0) — omit to use git SHA'
```

From packages/indexer/package.json (current):
```json
{
  "name": "@chillwhales/indexer",
  "private": true,
  "version": "0.1.0"
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Enable changeset versioning for indexer</name>
  <files>.changeset/config.json, packages/indexer/package.json</files>
  <action>
    1. In `.changeset/config.json`:
       - Change `"privatePackages"` from `{ "version": false, "tag": false }` to `{ "version": true, "tag": true }`
       - Change `"ignore"` from `[]` to `["@chillwhales/abi", "@chillwhales/typeorm", "@chillwhales/comparison-tool"]`
       This enables changeset versioning + git tagging for private packages, while ignoring everything except the indexer.

    2. In `packages/indexer/package.json`:
       - Change `"version"` from `"0.1.0"` to `"2.1.1"` to reflect the current Docker image version baseline.
  </action>
  <verify>
    Read .changeset/config.json and confirm privatePackages has version: true, tag: true and ignore contains the 3 non-indexer packages.
    Read packages/indexer/package.json and confirm version is "2.1.1".
  </verify>
  <done>Changesets will version @chillwhales/indexer (CHANGELOG + version bump + git tag) while ignoring abi, typeorm, and comparison-tool.</done>
</task>

<task type="auto">
  <name>Task 2: Update Docker workflow to trigger on changeset tags</name>
  <files>.github/workflows/docker.yml</files>
  <action>
    Update `.github/workflows/docker.yml`:

    1. Change tag trigger from `['indexer-v*']` to `['@chillwhales/indexer@*']` to match changeset's tag format for scoped packages.

    2. Keep `workflow_dispatch` for manual builds but remove the `version` input (changesets handle versioning now). Keep it as a simple no-input dispatch for emergency rebuilds.

    3. Update the "Compute image tags" step:
       - For tag pushes: extract version from changeset tag format.
         `@chillwhales/indexer@2.2.0` → `VERSION=2.2.0`
         Use: `VERSION="${GITHUB_REF_NAME#@chillwhales/indexer@}"`
       - For manual dispatch: use SHA only (no version input).
         `TAGS="${IMAGE}:${SHA}"`
       - For tag pushes: `TAGS="${IMAGE}:${SHA},${IMAGE}:v${VERSION},${IMAGE}:latest"`
  </action>
  <verify>
    Read .github/workflows/docker.yml and confirm:
    - Tag trigger is '@chillwhales/indexer@*'
    - Version extraction uses GITHUB_REF_NAME with @chillwhales/indexer@ prefix strip
    - workflow_dispatch has no version input
  </verify>
  <done>Docker workflow triggers on changeset-created tags and correctly extracts semver from the scoped package tag format.</done>
</task>

</tasks>

<verification>
- `.changeset/config.json` has `privatePackages: { version: true, tag: true }` and ignore list with 3 packages
- `packages/indexer/package.json` version is `"2.1.1"`
- `.github/workflows/docker.yml` triggers on `@chillwhales/indexer@*` tags
- `pnpm build` still passes (no functional changes)
</verification>

<success_criteria>
- Changeset versioning enabled for indexer only
- Docker workflow triggers on changeset tag format
- Version baseline set to 2.1.1
- Release flow: changeset PR → merge → tag → Docker build
</success_criteria>

<output>
After completion, create `.planning/quick/2-release-pipeline-with-versioning-for-mon/2-SUMMARY.md`
</output>
