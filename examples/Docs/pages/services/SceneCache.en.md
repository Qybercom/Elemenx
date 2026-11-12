<!-- generated -->
# SceneCache

SceneCache: what a scene made once and may need again, kept in the browser (IndexedDB, elemenx-cache) so that the next visit of the same world shows it at once: the proxies of far tiles (SceneProxies), the squares of a planet. Each entry is of a group (store: proxies, planet...) and a key of its own; what was used longest ago goes first when all of them are more than Limit megabytes.

- Get(store, key, callback(error, value)): what was kept (null: nothing), now the latest used.
- Put(store, key, value, callback(error)): kept (an object of lists of numbers, Float32Array and the like, and plain data); then the oldest go while all are over Limit.
- Usage(callback(error, {Bytes, Entries, Limit})): how much is kept, Limit in megabytes.
- SetLimit(megabytes, callback(error)): another limit (200 by default), the oldest gone at once while over it.
- Clear(store, callback(error)): all of a group gone; store null: all.
- Peek(store, key): at once, what this page kept or read lately (up to Hot megabytes of them, the oldest let go), or undefined: a scene takes it in the same frame, with no wait for the database.
- Knows(store, key): at once, whether the database has it (its keys are read when it opens; false till then): a scene asks it with Get only then, else makes what it needs at once.

All the scenes of a page share one database, its keys and what is hot (Page). Where there is no IndexedDB (Node, a worker of some browsers, a private window that has none) nothing is kept: Get gives null, the rest do nothing; never an error for that.

## Methods

- `Peek(store, key)`
- `Knows(store, key)`
- `Get(store, key, callback)`
- `Put(store, key, value, callback)`
- `Usage(callback)`
- `SetLimit(megabytes, callback)`
- `Clear(store, callback)`

## Tests

- [keeps a value of lists of numbers by its group and key, and gives it back as it was](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js#L33) — `libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js`
- [tells how much it keeps, and clears a group or all](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js#L47) — `libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js`
- [lets the oldest go first when all it keeps is over its limit](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js#L68) — `libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js`
- [gives what the page kept lately at once, and tells at once whether it keeps a key](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js#L105) — `libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js`
- [keeps a value under its limit with no scan of all it keeps](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js#L125) — `libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js`
- [refuses a limit of no megabytes](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js#L156) — `libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js`
- [takes the proxies of the same world from the cache of the browser the next time](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scatter-proxies.test.js#L98) — `tests/regression/scatter-proxies.test.js`
- [defines a species as a model of SceneModels, each of its variants another plant, made in workers](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js#L277) — `libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js`
