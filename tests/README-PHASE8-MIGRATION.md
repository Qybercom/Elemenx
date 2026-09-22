# Phase 8 final harness correction

Two remaining failures were harness isolation problems, not runtime failures.

- `deferred-each-after-preload` historically means that `RemoteChild` is already registered before the keyed remote parent is compiled. The test now establishes that precondition directly and verifies that loading the remote parent does not request/redefine the child.
- Phase 8.16 pending-destroy now uses its own `P8FinalHeldChild`. The previous correction reused `P8HeldChild`, which had already been resolved by the earlier pending-destroy test in the same Vitest browser context, so there was no script request left to intercept.

Runtime `elemenx.js` is unchanged.