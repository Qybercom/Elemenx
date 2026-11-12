<!-- generated -->
# SceneCache

SceneCache: то, что сцена сделала один раз и может понадобиться снова, хранится в браузере (IndexedDB, база elemenx-cache), чтобы следующий визит в тот же мир показал это сразу: прокси дальних плиток (SceneProxies), а позже — квадраты планеты. У каждой записи есть группа (store: proxies, planet…) и свой ключ. Когда всё хранимое превышает Limit мегабайт, первыми уходят записи, которые дольше всех не использовались.

- Get(store, key, callback(error, value)) — сохранённое (null — ничего); запись становится последней использованной.
- Put(store, key, value, callback(error)) — сохранить (объект из списков чисел вроде Float32Array и простых данных); затем удаляются самые старые, пока всё не уложится в Limit.
- Usage(callback(error, {Bytes, Entries, Limit})) — сколько хранится; Limit в мегабайтах.
- SetLimit(megabytes, callback(error)) — другой предел (по умолчанию 200); лишнее удаляется сразу. Ноль и меньше — ошибка.
- Clear(store, callback(error)) — удалить группу; store null — всё.
- Peek(store, key) — сразу, без ожидания базы: то, что эта страница недавно сохранила или прочитала (до Hot мегабайт, по умолчанию 64, старое отпускается), или undefined. Сцена берёт это в том же кадре.
- Knows(store, key) — сразу: есть ли ключ в базе (её ключи читаются при открытии; до того false). Сцена обращается к Get только тогда, иначе сразу делает нужное сама.

Все сцены страницы делят одну базу, её ключи и то, что под рукой.

Где IndexedDB нет (Node, приватное окно без неё), ничего не хранится: Get даёт null, остальное ничего не делает, без ошибок.

Свойство CacheSize сцены (мегабайты, по умолчанию 200; 0 — не хранить) задаёт предел для прокси её плиток. В демо Showcase на странице /graphics примера Advanced есть выбор размера, кнопка Clear cache и сколько сейчас хранится.

## Методы

- `Peek(store, key)`
- `Knows(store, key)`
- `Get(store, key, callback)`
- `Put(store, key, value, callback)`
- `Usage(callback)`
- `SetLimit(megabytes, callback)`
- `Clear(store, callback)`

## Тесты

- [keeps a value of lists of numbers by its group and key, and gives it back as it was](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js#L33) — `libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js`
- [tells how much it keeps, and clears a group or all](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js#L47) — `libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js`
- [lets the oldest go first when all it keeps is over its limit](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js#L68) — `libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js`
- [gives what the page kept lately at once, and tells at once whether it keeps a key](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js#L105) — `libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js`
- [keeps a value under its limit with no scan of all it keeps](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js#L125) — `libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js`
- [refuses a limit of no megabytes](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js#L156) — `libraries/ElemenxGraphics/services/SceneCache/SceneCache.test.js`
- [takes the proxies of the same world from the cache of the browser the next time](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/scatter-proxies.test.js#L98) — `tests/regression/scatter-proxies.test.js`
- [defines a species as a model of SceneModels, each of its variants another plant, made in workers](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js#L277) — `libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js`
