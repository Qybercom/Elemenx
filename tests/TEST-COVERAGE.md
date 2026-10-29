# Regression coverage

The automated suite is the canonical regression baseline for Elemenx.

It covers:

- component creation, nesting, lifecycle, state, batching, keyed collections and structural recreation;
- inline, DOM and function templates, slots, projection and dynamic structural composition;
- deferred component discovery, concurrent discovery, caching, pending destruction and nested remote components;
- router navigation, guards, cancellation, common-prefix reuse, NotFound behavior, replacement and real browser back/forward history;
- Application ownership and public facades;
- Storage, IndexedDB and Messaging;
- XHR, Protocol, WebSocket, SSE, LongPolling, Stream, Transfer, WebRTC and network contexts;
- WebWorker and ServiceWorker lifecycle and messaging integration;
- the frozen public API surface (`public-api-surface.test.js`) and ES5 syntax of all shipped code (`es5-syntax.test.js`);
- DOM-like isolation of event listeners: an exception is reported and the dispatch continues (`listener-isolation.test.js`);
- the sync of `docs/RUNTIME-INTERNALS.md` and the table of contents of `elemenx.js` with the code (`runtime-internals.test.js`).

Contract files grouped by subsystem (`tests/regression/`):

- Router: `router-contracts.test.js`: path normalization, the `$Router()` facade, link interception, NotFound through links and history, redirects from guards and `$OnRouteLeave` (asked once), `NavigationError`, the URL modes `hash` and `memory` (`tests/dist/single.spec.js` routes a page from a file in `memory`);
- Structural: `projection-lifecycle.test.js`: the content of the tag of a Component starts with its first instance (none for a Component never shown, nor for a `*lazy` in it); `structural-contracts.test.js`: `*for` over own keys and empty sources, the iteration limit, `*key` errors, Component props (literals, kebab-case, `{{...}}`, path bindings);
- Template and Component: `component-contracts.test.js`: `Elemenx.Template` arguments, `$TemplateID` and a name in `$Template` refused, deferred Components before they are ready, `*error` and `$OnChildError` when resources fail, console logging only of unhandled failures; `handler-lookup.test.js`: the handlers of `(events)` found when the event comes (methods, and functions `$OnCreate` sets, at the root, in a `*if`, in a row of a `*for`) and the methods of the definition called by the expressions;
- Discovery: `discovery-errors.test.js` with fixtures in `tests/public/discovery-errors/`: index and entity failures;
- Network transports: `network-*.test.js`: setters, backpressure, error branches, stale generations; `network-context.test.js` pins `Metrics` against a fake clock (counters freeze at `End()`);
- Storage, Events, Messaging: `storage-contracts.test.js`, `events-contracts.test.js`, `messaging-contracts.test.js`;
- public methods reached by no other test: `public-api-remaining.test.js`.
- the templates of a page: `server.test.js` (`tools/templates.js` writes a `<template id>` as a `<script type="text/html" id>`, and the server sends it so) and `tests/examples/page-templates.spec.js` (a `<Table>`, a `<Select>` and a self-closing `<Card />` of a `<template id>` reach Elemenx as written);
- the distribution and the release: `dist.test.js` (the bundles, the packs of ElemenxUI, `elemenx build --single` and the packs it embeds), `tests/dist/*.spec.js` (the bundles and a single file from `file://`), `package-release.test.js` (the files npm publishes, the package fields, the short name `elemenx` and its CLI, the CI and publish workflows against `npm test`);
- the ElemenxUI library: `tests/examples/ui-kit.spec.js` drives the `/ui` catalogue of the Advanced example in development and in the production bundle (masks, dropdowns, menus, tabs, file upload, Workspace splitters).

When a bug is found, add a regression test that reproduces it before changing runtime behavior. New public API should ship with a direct contract test or a stronger end-to-end test.

The library ElemenxUI, the examples and the editors:

- the components, Services and directives of ElemenxUI in the browser contracts: `tests/library.js` (`Use(names)`) defines them from their sources with what they use, and `library-*.test.js` drive them (`library-services`, `library-directives`, `library-inputs`, `library-pickers`, `library-overlays`, `library-forms`, `library-controls`, `library-misc`, `library-new` for SplitButton, Accordion, Countdown, Clock, Consent, DiffView, SignaturePad, ImageCropper, QRCode, QRScanner, FileBrowser and MediaPlayer, `library-contracts` for `Elemenx.Library` and `$Use`), besides the tests of one component each (`board`, `title-bar`, `tip`, `popup`...);
- the meta of ElemenxUI (`cli-meta.test.js`): every Component declares its group, icon, the description of each prop, and every event it emits with a description, and no other; a build keeps the `$Meta` of the libraries when a component of the Application reads `Elemenx.Meta`;
- every page of the Docs and every example in it (`tests/examples/docs-pages.spec.js`), so each Component, Service and directive runs at least in its example; the `/ui` catalogue of Advanced in development and production (`ui-kit.spec.js`);
- the examples as projects: `widgets-example.spec.js`, `pwa-example.spec.js`, `tests/native/desktop.spec.js`, and `tutorials.spec.js`, which builds every project of `examples/Tutorials`, serves it with the API of its `elemenx.config.js` (`Server.Request`, `Server.WebSocket`) and walks its tutorial (offline with `setOffline`, a second page for a call, a token refused by `page.route`), loads the extension of the tutorial into Edge, and runs the call of two pages with the fake camera of Chrome;
- the Docs: `docs-pages.spec.js` opens every page and runs its examples; `docs.spec.js` checks the blocks ```diagram (an inline SVG in the colors of the theme, kept out of the search);
- the style document for other projects (`frontend-style.test.js`): `docs/FRONTEND-CODE-STYLE.md` carries the rules of the linters of the repository and turns on all of them;
- the editors: the language server and its core (`language-server.test.js`), the build of the extensions (`editors-build.test.js`), their branding (`editors-branding.test.js`); the plugin of JetBrains has tests of its own in Kotlin (`gradlew test` in `editors/intellij`, not part of `npm test`; `ElemenxNavigationTest` drives Ctrl+click and the whole inspection profile as the IDE does, run it in WebStorm with `-Pwebstorm=2026.2.3`).

## Coverage levels

`COVERED` means a subsystem has direct automated contract/regression coverage. `E2E VERIFIED` is stronger: the behavior is also exercised through a real application and browser workflow.

The suite is split into three layers:

- browser contracts (`npm run test:browser`) cover runtime APIs and regressions in Chromium;
- tooling contracts (`npm run test:tools`) cover Builder, Generator/CLI and production server behavior in Node;
- real-browser E2E (`npm run test:e2e`) covers session history plus the official Simple/Advanced examples and production bundles.

The Examples E2E path verifies reactive state/events, persistent Storage, Application discovery, nested structural composition, Router/Guards, real Network XHR, Builder output, public assets and the production server.

## Console output

The browser suite prints nothing to the console. A test that expects an error or a warning captures it itself (and asserts it). Vitest hides browser console lines when its output is piped, so check with `npx vitest run --reporter=verbose` and look for `stderr |` / `stdout |` lines. Once a test adds its own window `error` listener, the Vitest browser runner echoes every window error to `console.error`: such a test silences that echo while it listens.

## Measuring coverage

- `npm run test:coverage` measures `elemenx.js` under the browser contracts (Vitest). Report: `coverage/`.
- `npm run test:coverage:all` adds the real-browser Playwright scenarios (history, official examples, production bundles), the WebWorkers of their pages (a session of the DevTools protocol attaches to each before it starts), and `elemenx.js` in Node without a DOM (`headless.test.js`), and writes the combined report to `coverage/all/` (`index.html`, `coverage-summary.json`). Playwright pages collect V8 coverage only in this mode; `npm test` runs them unchanged. The service workers are not measured: a second client of theirs breaks the network Playwright emulates, and the production builds they run are not `elemenx.js` itself.
- `npm run test:coverage:tools` measures the CLI and `tools/` under the tests in Node, the processes they start included (the CLI and the builds, through `NODE_V8_COVERAGE`). Report: `coverage/tools/`.

Coverage is a map of what the tests do not touch yet, not a goal by itself: before refactoring a function, check that its paths are covered and add contract tests where they are not.

The CLI and the tooling in Node (`npm run test:coverage:tools`), on 2026-10-27: lines 85%, statements 84%, branches 72% (the process of the tests alone gave 66% lines). Least covered: `tools/extension.js` (11%: it runs in the end-to-end tests of the dist, not in Node) and `elemenx-cli.js` (78%). The bridges of `tools/electron` and `tools/capacitor` run inside the programs (`tests/native`) and are not counted.

Combined coverage of `elemenx.js` on 2026-10-27: lines 95.1%, statements 93.4%, branches 85.2%, functions 96.0% (before the WebWorkers and the run without a DOM were counted: lines 94.5%, branches 83.9%). The sections least covered: `Network` (Transfer), `Template and Component` (deferred instances), `Install` (driven mostly by `pwa-example.spec.js` through a real service worker, which is not measured), and the service worker bootstrap.
