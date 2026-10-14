# Releasing

A release publishes two packages of the same version to npm: `@qybercom/elemenx` (the repository root) and `elemenx`, its short name (`packages/elemenx`: it depends on exactly that version of `@qybercom/elemenx` and runs its CLI). The tag `v<version>` starts `.github/workflows/publish.yml`: it checks that the tag is the version of both packages, runs `npm test`, publishes `@qybercom/elemenx` (its `prepack` builds `dist/` into it), then `elemenx`. A prerelease version (`0.9.1-beta.1`) goes to the dist-tag `next`, any other to `latest`.

Every command below starts from a working tree with nothing to commit, untracked files included; the version commands stop otherwise.

## A release

1. Make sure that `main` is green in GitHub Actions (workflow CI) and that the work is committed and pushed:

   ```bash
   git status
   git pull
   ```

2. Choose one of the two ways.

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

   `version:set` takes the same values as `npm version` (`patch`, `minor`...) and changes the three files only. `version:tag` tags the last commit `v0.9.1` when the working tree is clean, both packages have that version and the tag does not exist yet.

3. Follow the workflow Publish in GitHub Actions. When it is green, both versions are on npm:

   ```bash
   npm view @qybercom/elemenx version
   npm view elemenx version
   ```

## When the workflow fails

Before `npm publish` (the tag check or `npm test`): nothing is published. Fix the cause, then move the tag to the new commit:

```bash
git tag -d v0.9.1
git push origin :refs/tags/v0.9.1
```

then commit the fix and tag it again (`npm run version:tag`, as the version stays 0.9.1) and push with `git push --follow-tags`.

After `@qybercom/elemenx` is published but `elemenx` is not: npm never takes a version twice, so do not move the tag. Publish `elemenx` by hand from the tagged commit:

```bash
cd packages/elemenx
npm publish
```

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

   The tag starts the workflow, which then fails at `npm publish` as the version exists already; this once it is expected.
3. On npmjs.com, in the settings of `@qybercom/elemenx` and of `elemenx`, add a trusted publisher: GitHub Actions, the repository `Qybercom/Elemenx`, the workflow `publish.yml`, the environment `npm`.

From then on a release is the section above. npm adds provenance to a release from a public repository.
