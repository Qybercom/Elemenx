<!-- generated -->
# WorldEditor

An editor of a whole world, its levels one in another: a galaxy (Scene of Setting galaxy, GalaxyData), the system of a star of it (SceneEditor of Setting space, SystemData), a planet of the system (PlanetEditor), a location of the planet (SceneEditor of a ground). The path over it goes up to any level; Enter goes down into what is picked (a star, a planet). At the level of the galaxy its panel searches round where the view looks (GalaxyData.Search: a type, a class, what was edited, a mass and a temperature, a text; at most 500, the nearest first): a row chosen is picked and flown to, chosen twice gone into. What a world uses is edited beside it, each in a tab of its own: models (ModelEditor), plants (FloraEditor), cutscenes (CutsceneEditor) and materials (Blueprint of type material), kept in the world by their names. Value is the world: {Name, Galaxy (options of GalaxyData.Make, or its data), Planets ({'star/body': the options of a planet}), Locations ({'star/body/location': a document of SceneEditor}), Resources ({Models, Plants, Cutscenes, Materials}: {ID: {Name, Value}})}. change emits it after each edit, level the path ({Path: [{Level, ID}]}). Its file (Pack, Open) is a zip: world.json, the parts of its galaxy under galaxy/ (its systems with them). Methods: World(), Load(world), Galaxy(), Path(), Enter(level, id, callback), Up(index), AddResource(kind), OpenResource(kind, id), Pack(callback), Open(source, callback).

## Properties

| Property | Default |
| --- | --- |
| `Value` | `null` |
| `Label` | `''` |

## Events

- `change`: The world changed: {Name, Galaxy, Planets, Locations, Resources}.
- `level`: The level shown changed: {Path: [{Level, ID}]}.
- `error`: A file of a world was not read: the error.

## Methods

- `Load(world)`
- `World()`
- `Galaxy()`
- `Path()`
- `Up(index)`
- `Enter(level, id, callback)`
- `AddResource(kind)`
- `OpenResource(kind, id)`
- `Pack(callback)`
- `Open(source, callback)`

## Tests

- [goes from its galaxy into the system of a star and a planet of it, and back up its path](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L52) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [goes into a nebula of its galaxy as into a system, edits its kind and its size there, and keeps them in the world](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L106) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [searches its galaxy round where the view looks: a type, a mass, a text; a row chosen flies to it, chosen twice goes into it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L154) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [opens what the world uses in tabs of their editors: a model, a plant, a cutscene, a material](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L212) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [keeps all of the world in one file: its galaxy and its edits, its planets, its locations and its resources](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L242) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [puts a star and a body of no system where the view looks, and the body goes along the velocity told](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L282) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [makes its panel as wide as its edge is dragged and keeps the width for the next time](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L301) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
