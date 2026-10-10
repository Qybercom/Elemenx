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

- Router: `router-contracts.test.js`: path normalization, the `$Router()` facade, link interception, NotFound through links and history, redirects from guards and `$OnRouteLeave` (asked once), `NavigationError`;
- Structural: `structural-contracts.test.js`: `*for` over own keys and empty sources, the iteration limit, `*key` errors, Component props (literals, kebab-case, `{{...}}`, path bindings);
- Template and Component: `component-contracts.test.js`: `Elemenx.Template` arguments, `$Template: '#name'`, deferred Components before they are ready, `*error` and `$OnChildError` when resources fail, console logging only of unhandled failures;
- Discovery: `discovery-errors.test.js` with fixtures in `tests/public/discovery-errors/`: index and entity failures;
- Network transports: `network-*.test.js`: setters, backpressure, error branches, stale generations; `network-context.test.js` pins `Metrics` against a fake clock (counters freeze at `End()`);
- Storage, Events, Messaging: `storage-contracts.test.js`, `events-contracts.test.js`, `messaging-contracts.test.js`;
- public methods reached by no other test: `public-api-remaining.test.js`.

When a bug is found, add a regression test that reproduces it before changing runtime behavior. New public API should ship with a direct contract test or a stronger end-to-end test.

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

Combined coverage of `elemenx.js` on 2026-10-11: lines 94.0%, statements 91.5%, branches 81.2%, functions 98.0%. Code that runs inside a worker (`WebWorker` Attach, the service worker bootstrap side) cannot be measured from the page.
