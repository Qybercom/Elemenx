SystemData: звёздная система как данные (docs/SPACE-FORMAT.md) — паспорт, дерево орбит (объекты сцены космоса, у каждого свой Parent: звезда, центр масс звёзд и чёрных дыр, планета, луна, кольцо, пояс, чёрная дыра, червоточина, станция... любой глубины), правки поверх неё и планеты её тел (формат планеты, PlanetData).

- Seeded(seed, options) — объекты системы из зерна (Astronomy.Generate), как их рисует Scene.
- Make(source, settings) — данные системы: source {Seed} (делается из зерна заново при каждом чтении: Origin generated) или {Objects} (написанная: Origin authored, дерево может быть с Children); settings {ID, Name}. data — {Manifest, Objects (у написанной), Edits {Overrides, Removed, Added}, Bodies}.
- Objects(data, key) — её объекты для Scene (System: {Objects}) с правками поверх того, из чего она сделана; у тела с данными (Manifest.Bodies: {id: {URL, Levels} или {Part: true}}) в Surface указана его планета: URL её файла или BodyKey(key, id) — ключ, под которым её даёт ScenePlanet (UseBodies).
- Edit(data, id, changes), Add(data, object), Remove(data, id) — правки; пишутся следующим Write.
- SetBody(data, id, planet), Body(data, id, callback(error, planet)) — планета тела, хранимая в системе (её части в хранилище системы, у каждой Body: id) или по её URL.
- UseBodies(key, data, callback(error, keys)) — планеты её тел отдаются ScenePlanet под их ключами.
- Use(key, data), DataOf(key) — системы под ключом: Scene называет систему так: System='{"Data": ключ или URL}', открывает её сама и показывает всю, когда она пришла.
- Open(source, callback(error, data)) — из того, что дал Make, хранилища частей (PlanetData), байтов или Blob её файла, или URL её файла; Write(data, store, callback, whole) — изменённые части (whole — все); Save(data) и Pack(data, callback) — байты её файла (zip: system.json, objects.json, edits.json, bodies/<id>/...).

Части: {Kind: 'system'}, {Kind: 'tree'}, {Kind: 'edits'}; части планеты тела — с Body: id.

В Scene вид barycentre — общий центр звёзд и чёрных дыр, вращающихся друг вокруг друга (двойная, тройная): от него ничего не рисуется. Его масса — Barycentre.Mass, иначе его Members (звёзды и чёрные дыры, например звезда с чёрной дырой в паре), иначе звёзды вокруг него; чёрная дыра дальше от него вращается вокруг него как планета. Тела вокруг чёрной дыры обращаются по её массе.

В Node: node scripts/system-make.js <system.json> <out.system> делает файл системы из её описания JSON ({ID, Name, Seed или Objects, Bodies}).
