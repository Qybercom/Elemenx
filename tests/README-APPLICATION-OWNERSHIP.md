# Application ownership runtime correction

The Application audit exposed two genuine runtime ownership gaps and two incorrect test assumptions.

Runtime fixes:
- `Application.Network(context)` now uses the owner-bound Network facade instead of calling the non-callable global `Elemenx.Network` facade as a function.
- `Application.Messaging(context)` now creates an owner-bound Messaging socket.
- `Application.Destroy()` now destroys Network and Messaging resources owned directly by the Application, in addition to its existing WebWorker and ServiceWorker cleanup.

Test corrections:
- `Root` is not treated as passive metadata when a root Component exists; it intentionally enables Discovery, so the basic synchronous facade test no longer supplies a fake discovery root.
- WebWorker handles do not expose an `Application()` method; ownership is tested behaviorally through Application Destroy.

`Storage` remains context-based and has no owner lifecycle because its facade represents persistent browser storage rather than a disposable runtime resource.