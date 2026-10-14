# Elemenx

Elemenx is a browser UI framework for component-based applications with reactive state, routing, services, storage, messaging and network transports.

## Installation

```bash
npm install elemenx
```

The package carries the framework (`elemenx.js`), the CLI (`elemenx`, see `docs/BUILDER.md`), the system library `ElemenxUI` (`libraries/ElemenxUI`), the documentation and the built distribution (`dist/`). Start an Application with:

```bash
npx elemenx generate application MyApp
npx elemenx dev
```

A page with no build and no server takes the distribution from a CDN or from `node_modules/elemenx/dist` (see "Distribution of the framework" in `docs/BUILDER.md`):

```html
<script src="https://cdn.jsdelivr.net/npm/elemenx@0.9/dist/elemenx.all.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/elemenx@0.9/dist/elemenx-ui.emoji.min.js"></script>
```

`elemenx.all.min.js` is the framework and ElemenxUI; the scripts of the packs (`emoji`, `emoji.ru`, `brands`, `files`) are needed only by the pages that use them.

## Development

Install the development dependencies:

```bash
npm install
```

The browser regression suite uses the locally installed stable Google Chrome; no Playwright browser download is required.

Run the complete suite:

```bash
npm test
```

`npm test` runs the browser contract suite, Node/tooling regressions, and real-browser Playwright end-to-end tests.

## Examples

The maintained examples are `examples/Simple` and `examples/Advanced`. From the Elemenx repository they can be started with:

```bash
npm run example:simple
npm run example:advanced
```

`Advanced` is also a standalone package consumer: after copying it outside the repository, run `npm install` and `npm run dev`. Its `elemenx` dependency provides the framework and CLI; the example does not carry a private copy of `elemenx.js` or the server.

The production path is exercised with:

```bash
npm run build:advanced
npm run example:advanced:dist
```

## Continuous integration and releases

`.github/workflows/ci.yml` runs the checks of `npm test` on every push to `main` and every pull request, in parallel jobs: lint, the browser contracts against `elemenx.js` and against `dist/elemenx.min.js`, the tooling on Node 20, 22 and 24 (and on Windows), and the end-to-end tests in three shards. The built `dist/` is kept as an artifact of the run.

`.github/workflows/publish.yml` publishes a release: set the version in `package.json` (`npm version 0.9.1 --no-git-tag-version`), commit, then push the tag `v0.9.1`. The workflow checks that the tag is the version, runs `npm test` and publishes; `prepack` builds `dist/` into the package. A prerelease version (`0.9.1-beta.1`) goes to the dist-tag `next`. The workflow signs in to npm with trusted publishing, without a token: on npmjs.com, in the settings of the package, add the GitHub repository and the workflow file `publish.yml` (environment `npm`) as its trusted publisher. npm adds provenance to a release from a public repository.

## Regression coverage

The maintained coverage map is in `tests/TEST-COVERAGE.md`. New public API should include an automated contract, and bug fixes should include a regression test.