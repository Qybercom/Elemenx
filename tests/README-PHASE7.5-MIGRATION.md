# Phase 7.5 modern regression migration

Adds seven Vitest Browser regression tests migrated from the final historical Phase 7.5 runner:

- Function Template + independent reactive instances
- Dynamic Template + nested data-if recreation
- Dynamic Template + component keyed data-each identity/events
- Dynamic Template + data-if containing keyed component collection
- Dynamic Template destroy/recreate + dead listeners
- Dynamic Template + component projection + structural content
- Dynamic Template + model/nested if/keyed/events

This patch changes tests only. `elemenx.js` is intentionally untouched.