# Releasing

A release publishes two packages of the same version to npm: `@qybercom/elemenx` (the repository root) and `elemenx`, its short name (`packages/elemenx`: it depends on exactly that version of `@qybercom/elemenx` and runs its CLI). The tag `v<version>` starts `.github/workflows/publish.yml`: it checks that the tag is the version of both packages, runs the whole CI (`ci.yml` with the end-to-end tests, about 10 minutes), publishes `@qybercom/elemenx` (its `prepack` builds `dist/` into it), then `elemenx`. A prerelease version (`0.9.1-beta.1`) goes to the dist-tag `next`, any other to `latest`. Last, the workflow creates the GitHub release of the tag (a pre-release for a prerelease version): its notes list the changes since the last release, and it carries the files of `dist/` (every script, `manifest.json` with the sizes and the integrity, and `elemenx-<version>.zip` with all of `dist/`).

Every command below but `npm run release` (which commits the working tree) starts from a working tree with nothing to commit, untracked files included; the version commands stop otherwise.

## A release

1. Make sure that `main` is green in GitHub Actions (workflow CI) and that the work is committed and pushed:

   ```bash
   git status
   git pull
   ```

2. Choose one of the three ways.

   **In one command** (`scripts/release.js`: the version in a commit `v0.9.1` with the work of the working tree):

   ```bash
   npm run release 0.9.1
   ```

   It takes an exact version only (`0.9.1`, `1.0.0-beta.1`), greater than the one of `package.json`, and changes nothing when the branch is not `main`, the tag `v0.9.1` exists (here or on `origin`) or `main` is behind `origin/main`. It shows the changes it will commit and asks before it goes on, runs the whole `npm test`, then `npm run version:set -- 0.9.1`, `git add --all`, `git commit -m v0.9.1`, `npm run version:tag` and `git push --follow-tags`. `npm run release -- 0.9.1 --yes` does not ask, `--skip-tests` runs no tests. A step that fails stops it: it says what is done, undoes nothing, and the rest goes by hand as below.

   **The version in a commit of its own** (the commit `0.9.1` holds only the versions of `package.json`, `package-lock.json` and `packages/elemenx/package.json`, and gets the tag):

   ```bash
   npm version 0.9.1
   git push --follow-tags
   ```

   `npm version patch`, `npm version minor` or `npm version prerelease --preid beta` choose the next version.

   **The version in your commit** (with the last work, or a commit you write for it):

   ```bash
   npm run version:set -- 0.9.1
   git commit -am "Elemenx 0.9.1"
   npm run version:tag
   git push --follow-tags
   ```

   `version:set` puts the version in every place that holds it: `package.json`, `package-lock.json`, and the version and the dependency of `packages/elemenx`. It takes the same values as `npm version` (`patch`, `minor`...); without one it puts the version of `package.json` everywhere, after `package.json` was changed by hand. It commits and tags nothing. Do not change the versions by hand otherwise. `version:tag` tags the last commit `v0.9.1` when the working tree is clean, both packages have that version and the tag does not exist yet.

3. Follow the workflow Publish in GitHub Actions. When it is green, both versions are on npm and the release is in Releases on GitHub:

   ```bash
   npm view @qybercom/elemenx version
   npm view elemenx version
   ```

## When the workflow fails

Before `npm publish` (the tag check or the CI): nothing is published. Fix the cause, then move the tag to the new commit:

```bash
git tag -d v0.9.1
git push origin :refs/tags/v0.9.1
```

then commit the fix and tag it again (`npm run version:tag`, as the version stays 0.9.1) and push with `git push --follow-tags`.

After `npm publish`: the publishing steps skip what is done already (a published version, an existing GitHub release), so fix the cause (a trusted publisher of `elemenx` that is missing or different gives `404 Not Found` on `PUT`) and use Re-run failed jobs on the run of the workflow. A re-run takes the workflow of the tagged commit: for a tag made before this behavior, finish by hand as below.

After `@qybercom/elemenx` is published but `elemenx` is not: npm never takes a version twice, so do not move the tag. Publish `elemenx` by hand from the tagged commit:

```bash
cd packages/elemenx
npm publish
```

After both packages are published but the GitHub release is not: do not run the workflow again (npm takes no version twice). Create the release on GitHub (Releases, Draft a new release, the tag `v0.9.1`, Generate release notes) and attach the files of `dist/` built from the tagged commit (`npm run dist`).

A published version with a defect is fixed by the next version (`npm version patch`); `npm deprecate @qybercom/elemenx@0.9.1 "use 0.9.2"` warns its users.

## The first release

npm sets the trusted publisher of a package in its settings, so the first version of each package is published by hand:

1. On npmjs.com, create the organization `qybercom` (free for public packages), and sign in on this computer: `npm login`.
2. From a clean `main` with the version set and committed (`npm run version:set -- 0.9.0` if needed):

   ```bash
   npm test
   npm publish --access public
   cd packages/elemenx
   npm publish
   cd ../..
   npm run version:tag
   git push --follow-tags
   ```

   The tag starts the workflow, which then fails at `npm publish` as the version exists already; this once it is expected. Create the GitHub release of `v0.9.0` by hand, as in "When the workflow fails".
3. On npmjs.com, in the settings of `@qybercom/elemenx` and of `elemenx`, add a trusted publisher (it cannot be changed later):

   | Field | Value |
   |---|---|
   | Publisher | GitHub Actions |
   | Organization or user / Repository | `Qybercom` / `Elemenx` |
   | Workflow filename | `publish.yml` |
   | Environment name | `npm` |
   | Allow npm publish | checked (the workflow runs `npm publish`) |
   | Allow npm dist-tag | not needed (`npm publish --tag` sets the dist-tag) |

From then on a release is the section above. npm adds provenance to a release from a public repository.
