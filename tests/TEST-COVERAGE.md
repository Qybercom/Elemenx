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
- WebWorker and ServiceWorker lifecycle and messaging integration.

When a bug is found, add a regression test that reproduces it before changing runtime behavior. New public API should ship with a direct contract test or a stronger end-to-end test.