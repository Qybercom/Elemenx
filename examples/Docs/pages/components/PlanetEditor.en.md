<!-- generated -->
# PlanetEditor

An editor of a planet as a globe (ScenePlanet): what a developer draws of it, continents and oceans, ranges, rifts and rivers, its climates and lands, and what the planet makes of it shown as it is, however near: each pixel is reckoned of the planet in workers (Picture), coarse first and finer after, so nothing blurs when it comes close. Value is the planet: the options of ScenePlanet.Make ({Seed, Radius, Ocean, Relief, Depth, Plates, Detail, Paint}). change emits it after each action, select {Index} of the stroke selected. Tool: look (a drag turns the globe, the wheel comes nearer, a press selects a stroke), or a kind of stroke: land, sea, climate and biome are areas, mountains, rift and river lines; each press on the globe puts a point of it, a double press or Enter ends it, Escape leaves it. Overlay is what is shown: relief, plates (their motions as arrows), wind (as arrows), temperature, moisture or biomes. The panel beside sets the planet and the stroke selected; Delete removes it. Tool location picks the location of a point (SceneLocations: a cell of LocationSize km), its outline marked: its kind (generated or a model of a file), what is past its sides, passages to the locations beside; Open emits location with it. Methods: Planet() (ScenePlanet.Make of it), View() and SetView({Yaw, Pitch, Zoom}), At(clientX, clientY) ({Latitude, Longitude, Sample} under a point, or null), Finish(), Cancel(), Remove(index), Render().

## Properties

| Property | Default |
| --- | --- |
| `Value` | `null` |
| `Tool` | `'look'` |
| `Overlay` | `'relief'` |
| `Label` | `''` |

## Events

- `drawn`: The picture of the view is whole: {Overlay}.
- `change`: The planet changed: the options of ScenePlanet.Make.
- `select`: The stroke selected: {Index} (-1: none).
- `location`: A location of the planet opened: {ID, Location} (SceneLocations.Location: its World, its place, its kind).

## Methods

- `Planet()`
- `View()`
- `SetView(view)`
- `At(clientX, clientY)`
- `Render()`
- `Finish()`
- `Cancel()`
- `Remove(index)`

## Tests

- [paints the globe of the planet in workers, each pixel of it, and tells the point under the pointer](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L55) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [draws a continent by its points on the globe, sets its fields and takes it away, each change emitted](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L74) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [shows the winds and the plates as arrows over the globe](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L128) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
- [picks the location of a point, sets its kind and what is past it, adds a passage to the one beside, and opens it with the ground of the planet there](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js#L145) — `libraries/ElemenxGraphics/components/PlanetEditor/PlanetEditor.test.js`
