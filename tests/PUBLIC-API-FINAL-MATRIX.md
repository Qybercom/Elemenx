# Elemenx final public API → regression matrix

Confirmed baseline before this pack: **128 browser + 4 real-history = 132/132 PASS**.

This pass re-audited the current runtime after the `Component.Ref` structural-lifecycle fix and compared the public facades against the regression suite.

## Coverage state

| Public family | Direct regression state |
|---|---|
| Application | Name/Root/Application/Component, Service, Network/Storage/Messaging ownership, WebWorker, ServiceWorker, Reload, Destroy covered |
| Component | Element/Application/State/Batch/Update/On/Emit/Service/Router/Ref/Destroy covered; this pack adds direct Generation + Parent hierarchy contract |
| Router | Start/Go/Replace/Current/Destroy and real popstate covered; this pack adds direct Router.Back/Forward real-history contract |
| Network | XHR, Protocol, Context, WebSocket, SSE, LongPolling, Stream, WebRTC, Transfer, Metrics covered; this pack strengthens direct TransferReceiver success/error contracts |
| Storage | Local, Session, Context, IndexedDB covered; this pack adds Cookie typed-value/namespace/remove isolation contract |
| Messaging | ID/On/Off/Send/Channels/Destroy and bridges covered; this pack adds direct Deliver contract |
| WebWorker | Definition/handle lifecycle plus real native Worker execution and Messaging bridge covered |
| ServiceWorker | Registration/update lifecycle, reachability, messaging, unregister/destroy plus Application ownership covered |
| Services / Guards | Registration, lookup, application/component access and router guard behavior covered |
| Structural/Templates | Phase 6 lifecycle/state, Phase 7.5 dynamic templates, Phase 8 deferred structural composition and stale Ref recreation covered |

## Final explicit edges added by this pack

1. `Component.Generation()` and `Component.Parent()`.
2. `Messaging.Deliver()`.
3. `Storage.Cookie` typed values, namespaces, remove/clear isolation.
4. `Network.TransferReceiver` reconstruction/ACK/Complete and missing-chunk error.
5. `Router.Back()` / `Router.Forward()` through a real top-level browser history session.

No runtime source is changed by this pack.

If all tests pass, the expected suite becomes **133 browser + 5 real-history = 138/138 PASS**.

At that point every public facade family identified in the current runtime has a direct regression contract or is exercised as part of a stronger end-to-end contract. Remaining untested code should be treated as internal implementation detail rather than a public API coverage gap.