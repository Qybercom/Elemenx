# Regression migration

This suite converts the important contracts established by the manual Elemenx regression campaign into permanent automated tests.

Migrated contracts:

- Phase 6.x core/lifecycle: idempotent Destroy; repeated `data-if` destroy/recreate; keyed remove/add/reorder survivor lifecycle; keyed focus/identity/data-model preservation; parent/child state isolation across recreate; Batch + structural state; recursive parent teardown; deep keyed/if/model/events/lifecycle composition.
- Phase 7.x templates: inline `Template`; DOM `TemplateID`; `Template` precedence.
- Phase 8.x deferred/network: Application Root discovery; concurrent-load coalescing; resolved cache reuse; pending-owner Destroy safety. Discovery fixtures are served verbatim from Vite `publicDir`, matching the original plain-HTTP regression environment.
- Phase 9.2-9.4 Router/Guards: common-prefix reuse; stale async guard cancellation; Router Destroy invalidation; exact navigation event order; leave-guard failure cancellation; NotFound/Replace; stale async redirect race.
- Phase 9.5-9.6.2 real browser history: Params/Query/Hash restoration; nested/common-route identity through popstate; Replace semantics; repeated back/forward cycles without route recreate/destroy.

The old numbered HTML runners remain historical evidence, not the executable source of truth. History tests intentionally use Playwright Test in isolated top-level pages because the old iframe harnesses demonstrated joint-session-history interference.

New regressions should now be attached to a concrete bug or feature instead of extending the old numbered manual phases.