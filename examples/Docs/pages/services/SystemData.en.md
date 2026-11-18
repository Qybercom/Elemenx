<!-- generated -->
# SystemData

SystemData: a star system as data (docs/SPACE-FORMAT.md): its passport, its tree of orbits (the objects of a Scene of space, each with its Parent: a star, a barycentre of stars and black holes, a planet, a moon, a ring, a belt, a black hole, a wormhole, a station... to any depth), what was changed of it, and the data of its bodies (planets of the planet format, PlanetData).

- Seeded(seed, options): the objects of a system of a seed (Astronomy.Generate), as a Scene has them.
- Make(source, settings): the data of a system: source {Seed} (made of it again whenever it is read: Origin generated) or {Objects} (written: Origin authored); settings {ID, Name}. data is {Manifest, Objects (of an authored one), Edits {Overrides: {id: {Values, Traits, Parent}}, Removed: [id], Added: [objects]}, Bodies: {id: planet data}}.
- Objects(data, key): its objects as a Scene draws them (System: {Objects}), its edits over what it was made of; a body with data (Manifest.Bodies: {id: {URL} or {Part: true}}) has the Data of its Surface named: the URL of its planet, or BodyKey(key, id), the key under which its planet is given to ScenePlanet (UseBodies).
- FromRecipe(recipe, settings) and Recipe(data, key): a system of the recipe of a Scene of space (Scene.Save, what SceneEditor edits: its seed, its Added, Removed and Overrides as its edits, its cosmos, time and cutscenes in its passport, Manifest.Scene) and back (Scene.Load).
- Edit(data, id, changes), Add(data, object), Remove(data, id): what is changed of it, written by the next Write.
- SetBody(data, id, planet), Body(data, id, callback(error, planet)): the planet of a body, kept in the system (its parts in the store of the system, each with Body: id) or of its URL.
- UseBodies(key, data, callback(error, keys)): the planets of its bodies given to ScenePlanet under their keys.
- Use(key, data), DataOf(key): systems kept under a key (a Scene names one: System='{"Data": key or URL}').
- Open(source, callback(error, data)): of what Make gave, a store of parts (PlanetData), the bytes or a Blob of its file, or the URL of its file; Write(data, store, callback, whole): its parts that changed (all with whole); Save(data) and Pack(data, callback): the bytes of its file (a zip: system.json, objects.json, edits.json, bodies/<id>/...).

Parts: {Kind: 'system'}, {Kind: 'tree'}, {Kind: 'edits'}; the parts of the planet of a body with Body: id.

## Methods

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

## Tests

- [makes a system of a seed again whenever it is read, and one written as a tree of any depth](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SystemData/SystemData.test.js#L60) — `libraries/ElemenxGraphics/services/SystemData/SystemData.test.js`
- [keeps its edits over what it was made of: changed, added, taken away](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SystemData/SystemData.test.js#L84) — `libraries/ElemenxGraphics/services/SystemData/SystemData.test.js`
- [keeps the planet of a body in its file, and opens it again with it, the planet by its parts](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SystemData/SystemData.test.js#L107) — `libraries/ElemenxGraphics/services/SystemData/SystemData.test.js`
- [is drawn by a Scene of its key: a binary star going round its barycentre, opposite one another](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SystemData/SystemData.test.js#L145) — `libraries/ElemenxGraphics/services/SystemData/SystemData.test.js`
- [weighs a barycentre of its members, a black hole among them when it is one, the stars alone by default](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SystemData/SystemData.test.js#L189) — `libraries/ElemenxGraphics/services/SystemData/SystemData.test.js`
- [makes a system of the recipe of a Scene of space and back: its seed, its edits, its cosmos, time and cutscenes](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SystemData/SystemData.test.js#L226) — `libraries/ElemenxGraphics/services/SystemData/SystemData.test.js`
- [gives the recipe of a system of a seed with options as its objects, so a Scene makes the very same](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SystemData/SystemData.test.js#L242) — `libraries/ElemenxGraphics/services/SystemData/SystemData.test.js`
- [saves its star system as a system of the system format and opens one, its bodies with their planets](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/SceneEditor/SceneEditor.test.js#L517) — `libraries/ElemenxGraphics/components/SceneEditor/SceneEditor.test.js`
- [glows of points of its kind, and gives the system of a star of its seed with the mass of the star](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L91) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [keeps its edits, a written system and a free body, saved as a file and opened again](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L124) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [takes a star put in by hand among the stars of its sector, with a system of its mass, and moves a body of no system along its velocity](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L146) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`
- [gives its black hole as a body with a system of its own: the hole and its disc, the young stars close round it on long thin orbits](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js#L177) — `libraries/ElemenxGraphics/services/GalaxyData/GalaxyData.test.js`

+5 more in the same files
