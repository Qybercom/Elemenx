# Elemenx

Elemenx is a browser UI framework for component-based applications with reactive state, routing, services, storage, messaging and network transports.

## Installation

```bash
npm install @qybercom/elemenx
```

`elemenx` is the short name of the package: `npm install elemenx` installs the same version of `@qybercom/elemenx`, and its `elemenx` command runs the same CLI.

The package carries the framework (`elemenx.js`), the CLI (`elemenx`, see `docs/BUILDER.md`), the system library `ElemenxUI` (`libraries/ElemenxUI`), the documentation and the built distribution (`dist/`). Start an Application with:

```bash
npx elemenx generate application MyApp
npx elemenx dev
```

A page with no build and no server takes the distribution from a CDN or from `node_modules/@qybercom/elemenx/dist` (see "Distribution of the framework" in `docs/BUILDER.md`):

```html
<script src="https://cdn.jsdelivr.net/npm/@qybercom/elemenx@0.9/dist/elemenx.all.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@qybercom/elemenx@0.9/dist/elemenx-ui.emoji.min.js"></script>
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

`npm test` runs the browser contract suite, Node/tooling regressions, and real-browser Playwright end-to-end tests. Playwright runs its tests in parallel, on half of the processors; `ELEMENX_WORKERS=2 npm run test:history` sets the number of workers.

## Examples

The maintained examples are `examples/Simple` and `examples/Advanced`. From the Elemenx repository they can be started with:

```bash
npm run example:simple
npm run example:advanced
```

Two applications are built with ElemenxUI as well: `examples/Docs`, the reference of Elemenx and of the Library in English and Russian (its pages are Markdown files, `pages/<section>/<page>.<language>.md`; `npm run docs:pages` makes the pages of the Library again from the comments of its sources), and `examples/Builder`, a visual builder of pages that exports and imports their templates (its palette holds every component of the Library and the classes of its layouts; `npm run builder:palette` makes it again from the sources):

```bash
npm run example:docs
npm run example:builder
```

`Advanced` is also a standalone package consumer: after copying it outside the repository, run `npm install` and `npm run dev`. Its `@qybercom/elemenx` dependency provides the framework and CLI; the example does not carry a private copy of `elemenx.js` or the server.

The production path is exercised with:

```bash
npm run build:advanced
npm run example:advanced:dist
```

## Continuous integration and releases

`.github/workflows/ci.yml` runs the checks of `npm test` in parallel jobs. Every push to `main` and every pull request run the fast ones, in a few minutes: lint, the browser contracts against `elemenx.js` and against `dist/elemenx.min.js`, the tooling on Node 20, 22 and 24 (and on Windows). The end-to-end tests, three jobs of two Playwright workers each, run on a pull request, by hand (Actions, CI, Run workflow), every night when `main` has new commits, and before every release (`publish.yml` calls the whole CI and publishes when it passes). A change of the documentation alone runs nothing. The built `dist/` is kept as an artifact of the run.

`.github/workflows/publish.yml` publishes a release of `@qybercom/elemenx` and of its short name `elemenx` (`packages/elemenx`) when a tag `v<version>` is pushed. The steps of a release, and of the first one, are in `docs/RELEASING.md`; in short:

```bash
npm version 0.9.1
git push --follow-tags
```

## Regression coverage

The maintained coverage map is in `tests/TEST-COVERAGE.md`. New public API should include an automated contract, and bug fixes should include a regression test.