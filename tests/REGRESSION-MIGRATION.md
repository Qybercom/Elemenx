# Elemenx regression coverage ledger

Current automated layers:
- Browser regression tests: component/state/lifecycle/templates/services/router/deferred discovery/storage/messaging/IndexedDB/WebWorker.
- Top-level Playwright history tests: real browser session history, popstate, Replace and route-instance reuse.

Historical migration:
- Phase 6.4 lifecycle/state: all eight runner scenarios are represented by automated regression tests.
- Phase 7 dynamic templates: inline Template, DOM TemplateID and Template precedence are represented.
- Phase 8 deferred/discovery: Application Root discovery, concurrent load coalescing, cache reuse and owner Destroy are represented.
- Phase 9 router/guards/history: common-prefix reuse, cancellation, Destroy invalidation, leave failure, NotFound/Replace, stale redirects and isolated real-history cycles are represented.

Current-runtime API audit:
- Component public surface is audited against the current runtime, not older structural-audit snapshots.
- Legacy imperative Outlet / Render / RenderAll / List methods are not part of the current component instance API.
- Ref remains public and is covered.
- Structural keyed collection behavior is exercised through current data-each lifecycle/state regressions rather than resurrecting removed imperative APIs.
- Storage Local/Session contexts: covered.
- Storage IndexedDB: CRUD, indexes, transactions and missing-store errors covered.
- Messaging: basic channels, ID/direct delivery, contexts, Off and Destroy covered.
- WebWorker: definition/start-mode/lifecycle validation covered.
- Network deferred component discovery: covered.
- Network Context and Metrics lifecycle: covered, including namespaced Metrics.* events and directional snapshot counters.
- Router/Guard/Service/Component core paths: covered.

Still open for next passes:
- Network transports: XHR lifecycle/progress/errors/abort; WebSocket; SSE; LongPolling; Stream; Transfer/TransferReceiver; WebRTC.
- Network Protocol and deeper context listener/protocol composition.
- ServiceWorker registration/update/unregister/message bridge.
- WebWorker real worker execution/message bridge rather than definition/lifecycle only.
- Messaging ownership/context edge cases and cross-runtime bridge integration.
- Additional current component helpers and negative/error paths discovered by direct runtime inspection.
- Coverage instrumentation/branch map once behavioral contracts are sufficiently represented.

Old numbered HTML runners and old API-audit files remain historical evidence. They must not be treated as authoritative for APIs that the current runtime has intentionally removed.