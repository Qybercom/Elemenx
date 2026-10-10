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
- the sync of `docs/RUNTIME-INTERNALS.md` and the table of contents of `elemenx.js` with the code (`runtime-internals.test.js`).

When a bug is found, add a regression test that reproduces it before changing runtime behavior. New public API should ship with a direct contract test or a stronger end-to-end test.

## Coverage levels

`COVERED` means a subsystem has direct automated contract/regression coverage. `E2E VERIFIED` is stronger: the behavior is also exercised through a real application and browser workflow.

The suite is split into three layers:

- browser contracts (`npm run test:browser`) cover runtime APIs and regressions in Chromium;
- tooling contracts (`npm run test:tools`) cover Builder, Generator/CLI and production server behavior in Node;
- real-browser E2E (`npm run test:history`) covers session history plus the official Simple/Advanced examples and production bundles.

The Examples E2E path verifies reactive state/events, persistent Storage, Application discovery, nested structural composition, Router/Guards, real Network XHR, Builder output, public assets and the production server.