# WebWorker real-execution regression coverage

Extends the existing four definition/lifecycle tests with six browser tests that use a real native Worker.

Covered contracts:
- Blob bootstrap imports Elemenx and the configured worker script, then emits Ready
- page -> Worker -> page communication through the real Elemenx.Messaging bridge
- reply routing to the sending socket's own channel
- lazy auto-start on first send to the configured worker channel
- Stop terminates/detaches and explicit Start creates a fresh native Worker
- manual Stop suppresses lazy auto-start
- Destroy terminates the running worker and stale Ready events cannot resurrect the handle

Runtime `elemenx.js` is unchanged.