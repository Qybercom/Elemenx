<!-- generated -->
# WorldEditor

An editor of a whole world, its levels one in another: a galaxy (Scene of Setting galaxy, GalaxyData), the system of a star of it (SceneEditor of Setting space, SystemData), a planet of the system (PlanetEditor), a location of the planet (SceneEditor of a ground). The path over it goes up to any level; Enter goes down into what is picked (a star, a planet). At the level of the galaxy its panel searches round where the view looks (GalaxyData.Search: a type, a class, what was edited, a mass and a temperature, a text; at most 500, the nearest first): a row chosen is picked and flown to, chosen twice gone into. What a world uses is edited beside it, each in a tab of its own: models (ModelEditor), plants (FloraEditor), cutscenes (CutsceneEditor, each of a location of the world: Location, the key of it, played in a scene of it beside the cutscene; one added in a location is of it) and materials (Blueprint of type material), kept in the world by their names. The graphs of the library its grounds and planets are made of (blueprints/planet, sketch, carve of ElemenxGraphics) are changed for it alone, each in a tab of its own (Blueprint of type generator), a copy of the library's; Reset gives the library's back. Its planets have those of planet/ (planet/relief: the option ReliefGraph...), the grounds of its locations those of sketch/ and carve/ (Graphs of their Terrain trait); the scenes of its systems and locations those of shader/ (Graphs of Scene: the bake of a body of noise, the weather of the surfaces of things, the shape of a lightning) and planet/envelope (what lies over and under the surface of their bodies, read by the scene), and cloud/ (the stars of their skies and nights, the swarms of clusters and the rocks of belts), made again as one of them changes. A tab of a graph is a Blueprint of its kind; one that makes a thing of data (a cloud, a network, a layout, a picture) has what it gives drawn beside it as it is changed (BlueprintPreview). network/rivers are the rivers of its planets (their option RiversGraph), layout/ the plans of the settlements of its locations (grid, main, road, radial, districts: Graphs of their Terrain trait); image/ (the bark and the leaves of plants), the forms of interchanges and the race track are drawn beside them to be seen. Value is the world: {Name, Galaxy (options of GalaxyData.Make, or its data), Planets ({'star/body': the options of a planet}), Locations ({'star/body/location': a document of SceneEditor}), Resources ({Models, Plants, Cutscenes, Materials}: {ID: {Name, Value}}; a cutscene with its Location too), Graphs ({'planet/relief', 'sketch/river'...: a graph})}. change emits it after each edit, level the path ({Path: [{Level, ID}]}). Its file (Pack, Open) is a zip: world.json, the parts of its galaxy under galaxy/ (its systems with them). Methods: World(), Load(world), Galaxy(), Path(), Enter(level, id, callback), Up(index), AddResource(kind), OpenResource(kind, id), GraphNames(), OpenGraph(name), ResetGraph(name), Pack(callback), Open(source, callback).

## Properties

| Property | Default |
| --- | --- |
| `Value` | `null` |
| `Label` | `''` |

## Events

- `change`: The world changed: {Name, Galaxy, Planets, Locations, Resources, Graphs}.
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
- `GraphNames()`
- `OpenGraph(name)`
- `ResetGraph(name)`
- `Pack(callback)`
- `Open(source, callback)`

## Tests

- [goes from its galaxy into the system of a star and a planet of it, and back up its path](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L53) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [goes into a nebula of its galaxy as into a system, edits its kind and its size there, and keeps them in the world](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L107) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [searches its galaxy round where the view looks: a type, a mass, a text; a row chosen flies to it, chosen twice goes into it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L155) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [plays a cutscene of the world in a scene of the location it is of, chosen in its tab](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L217) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [opens what the world uses in tabs of their editors: a model, a plant, a cutscene, a material](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L261) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [changes a graph of the library for the world alone in a tab, gives it to its planets and the grounds of its locations, and gives the library's back](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L291) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [changes a shader graph for the world alone: the scenes of its systems and locations drawn with it, made again](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L396) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [changes a cloud, a network and a layout graph for the world alone in a Blueprint of its kind, what each gives drawn beside it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L437) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [keeps all of the world in one file: its galaxy and its edits, its planets, its locations and its resources](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L497) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [puts a star and a body of no system where the view looks, and the body goes along the velocity told](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L537) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
- [makes its panel as wide as its edge is dragged and keeps the width for the next time](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js#L556) — `libraries/ElemenxGraphics/components/WorldEditor/WorldEditor.test.js`
