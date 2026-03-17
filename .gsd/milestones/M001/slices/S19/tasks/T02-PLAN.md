# T02: 15-ci-cd-workflows-shared-infra 02

**Slice:** S19 — **Milestone:** M001

## Description

Create the release workflow (changesets-based npm publish + Docker image to GHCR) and preview release workflow (pkg-pr-new for PR-based pre-release packages). These are the two remaining workflow files needed to match the `chillwhales/LSPs` CI/CD pattern.

Purpose: Enables fully automated releases on merge to main (npm publish + Docker image + GitHub Releases) and installable preview packages from any PR.

Output: `.github/workflows/release.yml` and `.github/workflows/preview.yml` — both following the LSPs reference patterns with lsp-indexer-specific adaptations.

## Must-Haves

- [ ] "Pushing to main triggers the release workflow that either creates a Version Packages PR or publishes npm packages + Docker image"
- [ ] "Every PR to main triggers a preview release with PR-number-based dist-tags installable via npm"
- [ ] "Preview releases only publish the 4 @lsp-indexer packages, not internal packages"
- [ ] "Fork PRs are excluded from preview releases for security"
- [ ] "Docker image is pushed to GHCR with version tag matching the npm package version"

## Files

- `.github/workflows/release.yml`
- `.github/workflows/preview.yml`
