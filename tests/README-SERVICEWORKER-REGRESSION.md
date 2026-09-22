# ServiceWorker regression coverage

Adds a dedicated browser regression suite for the existing Elemenx ServiceWorker public API without changing runtime code.

Covered contracts:
- bootstrap registration URL, scope/channel/name metadata and active registration
- Registered / Controlled / Update
- updatefound state transitions: Installing -> Waiting -> Active
- verified unregister flow
- Messaging bridge page -> active ServiceWorker
- Messaging bridge active ServiceWorker -> page and source filtering
- Destroy bridge cleanup, idempotence and post-destroy Register rejection

The suite uses a deterministic ServiceWorkerContainer/Registration/Worker harness because Vitest Browser Mode itself is not a stable place to install and control a real service worker for every isolated regression run. The messaging bridge is nevertheless exercised through the real Elemenx.Messaging fabric.