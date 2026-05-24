---
name: npm-ops
description: npm package operations - publish, deprecate, unpublish, rollback, dist-tags, security incident response, and multi-version maintenance
user-invocable: true
allowed-tools: Bash, Read, Grep, Edit, Write
---

# npm-ops — Package Operations Runbook

Handles all npm package lifecycle operations including CI/CD publishing,
emergency hotfixes, deprecation, rollback, and multi-version maintenance.

## When to use

- **Publishing** a new version (CI or local emergency)
- **Deprecating** or **unpublishing** a compromised version
- **Rolling back** latest to a previous version via dist-tags
- **Maintaining multiple release lines** (e.g., 1.1.x and 1.2.x simultaneously)
- **Security incident response** (credential rotation, advisory filing)

## CI/CD Publish (OIDC Trusted Publisher)

```bash
# Bump version
npm version patch  # or minor, major

# Push triggers CI → OIDC → publish
git add package.json && git commit -m "chore: bump to $(node -p 'require(\"./package.json\").version')" && git push

# Watch
gh run list --limit 1 --workflow ci.yml
```

Requirements: GitHub environment `npm`, workflow with `id-token: write`, npm >= 11.5.1.

## Emergency Local Publish

```bash
npm run build && npm test
npm publish --access public --otp=XXXXXX

# Commit immediately to prevent CI conflict
git add package.json && git commit -m "fix: emergency hotfix $(node -p 'require(\"./package.json\").version')" && git push
```

## Deprecate / Undeprecate

```bash
# Deprecate
npm deprecate <pkg>@<version> "reason: use X.Y.Z instead" --otp=XXXXXX

# Undo
npm deprecate <pkg>@<version> "" --otp=XXXXXX
```

## Rollback (dist-tag)

Point `latest` to a known-good version without publishing:

```bash
npm dist-tag add <pkg>@<good-version> latest --otp=XXXXXX
npm view <pkg> dist-tags
```

## Unpublish (within 72h only)

```bash
npm unpublish <pkg>@<version> --otp=XXXXXX
```

Warning: version number is burned forever.

## Multi-Version Maintenance

Support multiple semver lines (e.g., 1.1.x security patches while 1.2.x is latest):

```bash
# Create maintenance branch from last release in that series
git branch release/1.1 <commit-hash>
git checkout release/1.1

# Bump patch
npm version patch --no-git-tag-version

# Publish under dist-tag (does NOT move latest)
npm publish --access public --tag release-1.1 --otp=XXXXXX

# Users install via:
npm install <pkg>@release-1.1    # explicit tag
npm install <pkg>@"^1.1.0"       # semver range resolves to 1.1.x
```

To automate via CI, add branch trigger:
```yaml
on:
  push:
    branches: [main, 'release/**']
```

And conditionally set `--tag`:
```yaml
- run: |
    if [[ "${{ github.ref }}" == refs/heads/release/* ]]; then
      TAG="release-${GITHUB_REF#refs/heads/release/}"
      npm publish --provenance --access public --tag "$TAG"
    else
      npm publish --provenance --access public
    fi
```

## Pre-release / Canary

```bash
npm version prerelease --preid=rc
npm publish --access public --tag next --otp=XXXXXX
```

## Security Incident

1. Unpublish (< 72h) or deprecate with SECURITY warning
2. Revoke all tokens: npmjs.com → Settings → Access Tokens
3. Rotate Trusted Publisher (delete + recreate)
4. Publish clean version
5. File advisory: npmjs.com → Report Vulnerability

## Ownership

```bash
npm owner ls <pkg>
npm owner add <user> <pkg> --otp=XXXXXX
npm owner rm <user> <pkg> --otp=XXXXXX
```

## Verification

```bash
npm view <pkg> versions --json
npm view <pkg> dist-tags --json
npm audit signatures
```
