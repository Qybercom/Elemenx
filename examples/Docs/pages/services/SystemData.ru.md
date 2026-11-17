<!-- generated -->
# SystemData

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

## Методы

- `Seeded(seed, options)`
- `Make(source, settings)`
- `BodyKey(key, id)`
- `Objects(data, key)`
- `FromRecipe(recipe, settings)`
- `Recipe(data, key)`
- `Edit(data, id, changes)`
- `Add(data, object)`
- `Remove(data, id)`
- `SetBody(data, id, planet)`
- `Body(data, id, callback)`
- `UseBodies(key, data, callback)`
- `Use(key, data)`
- `DataOf(key)`
- `Write(data, store, callback, whole)`
- `Save(data)`
- `Pack(data, callback)`
- `Open(source, callback)`

## Тесты

- [makes a system of a seed again whenever it is read, and one written as a tree of any depth](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SystemData/SystemData.test.js#L60) — `libraries/ElemenxGraphics/services/SystemData/SystemData.test.js`
- [keeps its edits over what it was made of: changed, added, taken away](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SystemData/SystemData.test.js#L84) — `libraries/ElemenxGraphics/services/SystemData/SystemData.test.js`
- [keeps the planet of a body in its file, and opens it again with it, the planet by its parts](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SystemData/SystemData.test.js#L107) — `libraries/ElemenxGraphics/services/SystemData/SystemData.test.js`
- [is drawn by a Scene of its key: a binary star going round its barycentre, opposite one another](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SystemData/SystemData.test.js#L145) — `libraries/ElemenxGraphics/services/SystemData/SystemData.test.js`
- [weighs a barycentre of its members, a black hole among them when it is one, the stars alone by default](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SystemData/SystemData.test.js#L189) — `libraries/ElemenxGraphics/services/SystemData/SystemData.test.js`
- [makes a system of the recipe of a Scene of space and back: its seed, its edits, its cosmos, time and cutscenes](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SystemData/SystemData.test.js#L226) — `libraries/ElemenxGraphics/services/SystemData/SystemData.test.js`
- [gives the recipe of a system of a seed with options as its objects, so a Scene makes the very same](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SystemData/SystemData.test.js#L242) — `libraries/ElemenxGraphics/services/SystemData/SystemData.test.js`
- [saves its star system as a system of the system format and opens one, its bodies with their planets](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/SceneEditor/SceneEditor.test.js#L493) — `libraries/ElemenxGraphics/components/SceneEditor/SceneEditor.test.js`
- [glows of points of its kind, and gives the system of a star of its seed with the mass of the star](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L91) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [keeps its edits, a written system and a free body, saved as a file and opened again](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L124) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [takes a star put in by hand among the stars of its sector, with a system of its mass, and moves a body of no system along its velocity](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L146) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [gives its black hole as a body with a system of its own: the hole and its disc, the young stars close round it on long thin orbits](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L177) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`

+5 ещё в тех же файлах
