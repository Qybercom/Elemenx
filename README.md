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

The Docs of the installed version (the guide, the core, every Component, Service and Directive of ElemenxUI with its live example) comes with the package and opens offline:

```bash
npx elemenx docs --open
```

The Designer of the installed version opens on a project: its applications, routes and components as a tree, its components on the canvas as they run, a copy of one to edit; nothing is written to its files:

```bash
npx elemenx designer --open
```

A page with no build and no server takes the distribution from a CDN or from `node_modules/@qybercom/elemenx/dist` (see "Distribution of the framework" in `docs/BUILDER.md`):

```html
<script src="https://cdn.jsdelivr.net/npm/@qybercom/elemenx@0.12/dist/elemenx.all.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@qybercom/elemenx@0.12/dist/elemenx-ui.emoji.min.js"></script>
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

`npm test` runs the browser contract suite, Node/tooling regressions, and real-browser Playwright end-to-end tests. The tests run 4 at a time (Vitest files and Playwright workers); `ELEMENX_WORKERS=2 npm test` sets the number.

Parts of it:

- `npm run test:browser` the browser contracts, `npm run test:watch` the same while files change;
- `npm run test:min` the browser contracts against the minified `dist/elemenx.min.js` (after `npm run dist`);
- `npm run test:tools` the Node tests of the CLI, the build and the tooling;
- `npm run test:e2e` the Playwright end-to-end tests, `npm run test:stress` the same five times each with no retry (to find the ones that fail under load);
- `npm run test:native` the desktop program built with Electron;
- `npm run test:coverage` and `npm run test:coverage:all` measure the coverage of `elemenx.js`, `npm run test:coverage:tools` the one of the CLI and `tools/` (see `tests/TEST-COVERAGE.md`).

## Editors

The extension of VS Code, the plugin of the IDEs of JetBrains (through LSP4IJ), the extension of Visual Studio 2022 and a language server for the other editors complete, document, check and color the templates and the code of Elemenx: see [docs/EDITORS.md](docs/EDITORS.md). `npm run editors` builds them into `dist/editors`.

## Examples

The examples, each a project of its own:

- `examples/Simple`: the smallest application, one page;
- `examples/Advanced`: the showcase of the runtime (Components, Router, Storage, Messaging, workers, Network) and the catalogue of ElemenxUI at `/ui`;
- `examples/PWA`: an application that installs and runs offline, and updates itself (`Elemenx.Install`);
- `examples/Widgets`: the Components of an application mounted as widgets on a page of another site (`Elemenx.Widgets`, `elemenx build --widget`);
- `examples/Native`: the desktop program (Electron) and the Android and iOS programs (Capacitor) of one application (`elemenx build --native`);
- `examples/Tutorials`: the projects of the tutorials of the Docs (a landing page, a blog, an admin panel, a shop, a chat, a game, an editor, a page of a server);
- `examples/Docs` and `examples/Designer`, below.

From the Elemenx repository they can be started with:

```bash
npm run example:simple
npm run example:advanced
```

Two applications are built with ElemenxUI as well: `examples/Docs`, the Docs of Elemenx and of the Library in English and Russian (its pages are Markdown files, `pages/<section>/<page>.<language>.md`; `npm run docs:pages` makes the pages of the Library again from the comments of its sources), and `examples/Designer`, a visual builder of pages that exports and imports their templates (its palette holds every component of the Library and the classes of its layouts; it takes them from the `data/meta.json` of the Library, which `npm run meta` makes again from the `$Meta` of the sources):

```bash
npm run example:docs
npm run example:designer
```

`Advanced` is also a standalone package consumer: after copying it outside the repository, run `npm install` and `npm run dev`. Its `@qybercom/elemenx` dependency provides the framework and CLI; the example does not carry a private copy of `elemenx.js` or the server.

The production path is exercised with:

```bash
npm run example:advanced:build
npm run example:advanced:serve
```

`npm run examples` serves the whole repository statically with Vite (as the end-to-end tests see it): every example and test page at its path, `http://127.0.0.1:5173/examples/Simple/`.

## Continuous integration and releases

`.github/workflows/ci.yml` runs the checks of `npm test` in parallel jobs. Every push to `main` and every pull request run the fast ones, in a few minutes: lint, the browser contracts against `elemenx.js` and against `dist/elemenx.min.js`, the tooling on Node 20, 22 and 24 (and on Windows). The end-to-end tests, three jobs of two Playwright workers each, run on a pull request, by hand (Actions, CI, Run workflow), every night when `main` has new commits, and before every release (`publish.yml` calls the whole CI and publishes when it passes). A change of the documentation alone runs nothing. The built `dist/` is kept as an artifact of the run.

`.github/workflows/publish.yml` publishes a release of `@qybercom/elemenx` and of its short name `elemenx` (`packages/elemenx`) when a tag `v<version>` is pushed. The steps of a release, and of the first one, are in `docs/RELEASING.md`; in short:

```bash
npm run release 0.10.3
```

It checks the branch and the tag, runs `npm test`, sets the version everywhere, commits, tags and pushes; the tag starts the publish workflow.

## Regression coverage

The maintained coverage map is in `tests/TEST-COVERAGE.md`. New public API should include an automated contract, and bug fixes should include a regression test.