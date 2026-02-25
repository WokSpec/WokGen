# Branch Protection & Repository Configuration Guide

This guide explains how to configure branch protection rules, tag protection, and related settings for the WokGen repository on GitHub.

---

## 1. Protecting the `main` Branch

Navigate to **Settings → Branches → Add branch protection rule** and enter `main` as the branch name pattern.

### Required settings

| Setting | Value |
|---|---|
| Require a pull request before merging | ✅ enabled |
| Required number of approvals | **1** |
| Dismiss stale pull request approvals when new commits are pushed | ✅ enabled |
| Require status checks to pass before merging | ✅ enabled |
| Require branches to be up to date before merging | ✅ enabled |
| Require linear history | ✅ enabled |
| Allow force pushes | ❌ **disabled** |
| Allow deletions | ❌ disabled |
| Do not allow bypassing the above settings | ✅ enabled (applies to admins too) |

### Required status checks

Add the following jobs (they must appear in the "Search for status checks" dropdown after at least one CI run):

- `TypeScript` — TypeScript type-check job from `ci.yml`
- `ESLint` — lint job from `ci.yml`
- `TypeScript` — job from `type-check.yml`

> **Note:** If the task spec calls for check names `build`, `type-check`, or `test`, map them to the actual job names above once your CI has run at least once so GitHub recognises them.

### Restricting who can push to `main`

1. Under the branch rule, enable **Restrict pushes that create matching branches**.
2. Add the `WokSpec/maintainers` team (or individual maintainer GitHub usernames, e.g. `@wokspec`) to the allow list.
3. All other contributors must go through a pull request.

---

## 2. Setting Up the `develop` Branch (Pre-production)

`develop` is the integration branch where features are merged before promotion to `main`.

1. Create the branch if it does not yet exist:
   ```bash
   git checkout -b develop main
   git push public develop
   ```
2. Add a second branch protection rule with pattern `develop`:
   - Require pull request before merging ✅
   - Required approvals: **1**
   - Require status checks to pass ✅ (same checks as `main`)
   - Require branches to be up to date ✅
   - Allow force pushes ❌

Developers create feature branches off `develop` (`feat/…`, `fix/…`) and open PRs targeting `develop`. Only release/hotfix PRs target `main` directly.

---

## 3. Tag Protection for Releases

Protect release tags so only authorised maintainers can create or delete them.

1. Go to **Settings → Tags → Add tag protection rule**.
2. Pattern: `v*.*.*`  (matches semantic version tags such as `v1.0.0`, `v2.3.1-beta.1`)
3. This prevents contributors from accidentally publishing release tags.

To create a release:
```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push public v1.0.0
```

Then create a GitHub Release from the tag via **Releases → Draft a new release**.

---

## 4. Additional Recommended Settings

| Setting | Location | Recommendation |
|---|---|---|
| Default branch | Settings → General | `main` |
| Allow merge commits | Settings → General | ✅ (or disable in favour of squash) |
| Allow squash merging | Settings → General | ✅ enabled |
| Allow rebase merging | Settings → General | optional |
| Automatically delete head branches | Settings → General | ✅ enabled |
| Dependency graph | Settings → Code security | ✅ enabled |
| Dependabot alerts | Settings → Code security | ✅ enabled |
| Secret scanning | Settings → Code security | ✅ enabled |

---

## 5. CODEOWNERS

The `.github/CODEOWNERS` file automatically requests reviews from the right people.  
Current configuration: see [`.github/CODEOWNERS`](../.github/CODEOWNERS).

When adding new top-level directories, add a corresponding entry:
```
/new-directory/  @wokspec
```
