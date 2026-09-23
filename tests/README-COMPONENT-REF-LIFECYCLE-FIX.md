# Component.Ref structural lifecycle fix

The final public-API gap test exposed a real runtime defect: `collectRefs()` populated a static ref map only once during component construction. When `data-if` removed a subtree, `Component.Ref(name)` continued returning the detached original node; after recreation it could also remain stale.

Runtime correction:
- `Ref(name)` returns the cached node only while it is still connected and contained by the component root.
- When the cached node is stale/missing, it lazily resolves the currently live `[data-ref]` node from the component DOM.
- If no live node exists, the stale cache entry is removed and `null` is returned.

The regression test remains unchanged. No test contract was weakened.