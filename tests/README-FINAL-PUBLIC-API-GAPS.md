# Elemenx final public API gap pack

Adds four focused browser regression contracts identified by the 128-test public API audit:

- Application-owned ServiceWorker lifecycle.
- Application.Reload validation and successful discovered Component reload.
- Component.Ref lifecycle across conditional structural destruction/recreation.
- Component.Router facade identity, pre-attachment listener queue, navigation and detach behavior.

No runtime source is changed by this pack. Any failure should therefore be treated as either a newly exposed runtime contract defect or a test/harness assumption to inspect before changing `elemenx.js`.

Expected suite size if all four pass: 128 browser tests + 4 real-history tests = 132 total.