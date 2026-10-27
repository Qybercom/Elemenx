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
- Structural: `structural-contracts.test.js`: `*for` over own keys and empty sources, the iteration limit, `*key` errors, Component props (literals, kebab-case, `{{...}}`, path bindings);
- Template and Component: `component-contracts.test.js`: `Elemenx.Template` arguments, `$Template: '#name'`, deferred Components before they are ready, `*error` and `$OnChildError` when resources fail, console logging only of unhandled failures;
- Discovery: `discovery-errors.test.js` with fixtures in `tests/public/discovery-errors/`: index and entity failures;
- Network transports: `network-*.test.js`: setters, backpressure, error branches, stale generations; `network-context.test.js` pins `Metrics` against a fake clock (counters freeze at `End()`);
- Storage, Events, Messaging: `storage-contracts.test.js`, `events-contracts.test.js`, `messaging-contracts.test.js`;
- public methods reached by no other test: `public-api-remaining.test.js`.
- the distribution and the release: `dist.test.js` (the bundles, the packs of ElemenxUI, `elemenx build --single` and the packs it embeds), `tests/dist/*.spec.js` (the bundles and a single file from `file://`), `package-release.test.js` (the files npm publishes, the package fields, the short name `elemenx` and its CLI, the CI and publish workflows against `npm test`);
- the ElemenxUI library: `tests/examples/ui-kit.spec.js` drives the `/ui` catalogue of the Advanced example in development and in the production bundle (masks, dropdowns, menus, tabs, file upload, Workspace splitters).

When a bug is found, add a regression test that reproduces it before changing runtime behavior. New public API should ship with a direct contract test or a stronger end-to-end test.

The library ElemenxUI, the examples and the editors:

- the components, Services and directives of ElemenxUI in the browser contracts: `tests/library.js` (`Use(names)`) defines them from their sources with what they use, and `library-*.test.js` drive them (`library-services`, `library-directives`, `library-inputs`, `library-pickers`, `library-overlays`, `library-forms`, `library-controls`, `library-misc`, `library-contracts` for `Elemenx.Library` and `$Use`), besides the tests of one component each (`board`, `title-bar`, `tip`, `popup`...);
- the meta of ElemenxUI (`cli-meta.test.js`): every Component declares its group, icon, the description of each prop, and every event it emits with a description, and no other;
- every page of the reference and every example in it (`tests/examples/docs-pages.spec.js`), so each Component, Service and directive runs at least in its example; the `/ui` catalogue of Advanced in development and production (`ui-kit.spec.js`);
- the examples as projects: `widgets-example.spec.js`, `pwa-example.spec.js`, `tests/native/desktop.spec.js`, and `tutorials.spec.js`, which builds every project of `examples/Tutorials` and walks its tutorial;
- the editors: the language server and its core (`language-server.test.js`), the build of the extensions (`editors-build.test.js`), their branding (`editors-branding.test.js`); the plugin of JetBrains has tests of its own in Kotlin (`gradlew test` in `editors/intellij`, not part of `npm test`).

## Coverage levels

`COVERED` means a subsystem has direct automated contract/regression coverage. `E2E VERIFIED` is stronger: the behavior is also exercised through a real application and browser workflow.

The suite is split into three layers:

- browser contracts (`npm run test:browser`) cover runtime APIs and regressions in Chromium;
- tooling contracts (`npm run test:tools`) cover Builder, Generator/CLI and production server behavior in Node;
- real-browser E2E (`npm run test:history`) covers session history plus the official Simple/Advanced examples and production bundles.

The Examples E2E path verifies reactive state/events, persistent Storage, Application discovery, nested structural composition, Router/Guards, real Network XHR, Builder output, public assets and the production server.

## Console output

The browser suite prints nothing to the console. A test that expects an error or a warning captures it itself (and asserts it). Vitest hides browser console lines when its output is piped, so check with `npx vitest run --reporter=verbose` and look for `stderr |` / `stdout |` lines. Once a test adds its own window `error` listener, the Vitest browser runner echoes every window error to `console.error`: such a test silences that echo while it listens.

## Measuring coverage

- `npm run test:coverage` measures `elemenx.js` under the browser contracts (Vitest). Report: `coverage/`.
- `npm run test:coverage:all` adds the real-browser Playwright scenarios (history, official examples, production bundles) and writes the combined report to `coverage/all/` (`index.html`, `coverage-summary.json`). Playwright pages collect V8 coverage only in this mode; `npm test` runs them unchanged.

Coverage is a map of what the tests do not touch yet, not a goal by itself: before refactoring a function, check that its paths are covered and add contract tests where they are not.

The tooling in Node (`npx vitest run --config vitest.node.config.mjs --coverage --coverage.include="tools/**/*.js"`), on 2026-10-27: lines 66%, most modules of `tools/` 83-98% (`electron.js` 95%, `zip.js` 88%, `generator.js` 93%, `builder.js` 76%). The figure counts only what runs in the process of the tests: `elemenx-cli.js` and `tools/extension.js` run as child processes of the tests (and of the end-to-end tests of the dist), and the bridges of `tools/electron` and `tools/capacitor` run inside the programs (`tests/native`).

Combined coverage of `elemenx.js` on 2026-10-27: lines 94.5%, statements 92.6%, branches 83.9%, functions 95.8% (the browser contracts alone: lines 91.3%). The sections least covered: `Install` (the PWA, driven mostly by `pwa-example.spec.js` through a real service worker), then `WebWorker` and the service worker bootstrap: code that runs inside a worker (`WebWorker` Attach, the service worker bootstrap side) cannot be measured from the page.
