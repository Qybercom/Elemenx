<!-- generated -->
# SceneFlora

SceneFlora: realistic plants of code, a species a preset of numbers (and later of a picture of it: FloraEditor), each plant of it another of its seed: no file, the same plant for the same seed.

- A plant grows as plants do: a trunk (or several stems) up to its crown, then its branches toward the light, by space colonization (points scattered in the shape of its crown draw the nearest buds toward them, each bud a step a time, a point reached is used up: Runions 2007); a spruce in whorls (a leader and its tiers of branches); a palm a curved trunk and its fronds. Its branches as thick as the pipes of what they carry (da Vinci: the sum of the children's radii to the power Pipe is the parent's), tubes with their bark laid along them; its leaves cards of clusters of leaves or tufts of needles, lit as the round of its crown is; dead stubs on its bare trunk.
- Its textures are drawn of code too: its bark (the height of the plant along it: a pine dark below, orange above; its relief a normal map) and its leaves (an atlas of four clusters, their alpha the cut, and below them the same in shade: the leaves deep in its crown). A preset may give its own pictures instead (Bark.Image, Leaves.Image: {Width, Height, Data} RGBA).
- Species() the names of its presets; Preset(name) a copy of one (with what it does not tell); Tree(preset, variant) the plant {Height, Bark: geometry, Leaves: geometry ({Positions, Normals, UVs, Indices}, metres, standing on 0), Triangles, Nodes}; Textures(preset) its pictures {Bark, BarkNormal, Leaves} ({Width, Height, Data}); Asset(tree, textures) the plant as Gltf gives a file (two materials: bark, leaves cut by their alpha and seen from both sides).
- FromPicture(picture, base) a species of a photograph of a plant on white or clear (its reference): its bare trunk, the profile, width, lean and holes of its crown, the colors of its leaves and of its bark; {Preset, Found}.
- Define(name, preset or species, options {Variants (8), Size, Sway, Group, Keep (false: not kept in the browser, a preview of FloraEditor)}) makes it a model of SceneModels: its Variants made in workers (Work) the first time one is asked for, each another plant of the species; kept in the browser (SceneCache, under Key(preset, variants)) and taken from there the next time.

The same in a page, a worker and Node: it reads no page.

## Methods

- `Species()`
- `Preset(name)`
- `Tree(preset, variant)`
- `Textures(preset)`
- `Asset(tree, textures)`
- `FromPicture(picture, base)`
- `Key(preset, variants)`
- `Define(name, preset, options)`

## Tests

- [draws its plants in its style: realistic plants of SceneFlora once they came, or the simple models of code](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3525) — `tests/regression/library-scene.test.js`
- [grows each species as tall as it is, its bark and its leaves within a budget of triangles, the same of the same seed](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js#L16) — `libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js`
- [covers as much with the leaves of its simpler levels as near](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js#L51) — `libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js`
- [makes a species of a picture of a plant: the largest of a row, its bare trunk, its crown, its colors; no plant, null](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js#L82) — `libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js`
- [hangs the leaves of a weeping willow, draws flowers and fruits among its leaves, each bark of its own](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js#L154) — `libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js`
- [tells the far form of a species of tree: its height, bare trunk, crown, colors; none of grass nor of no species](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js#L197) — `libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js`
- [grows a clump of stalks, its leaves along them and from the ground, a head on each top of the last tile of its atlas](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js#L210) — `libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js`
- [draws its bark (a normal map with it) and its leaves, cut where there is no leaf, or takes pictures of its own](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js#L256) — `libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js`
- [defines a species as a model of SceneModels, each of its variants another plant, made in workers](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js#L277) — `libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js`
- [draws a plant of SceneFlora of its pictures at its simpler levels too, its leaves cut by their alpha in its shadow](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/traits/SceneScatter/SceneScatter.test.js#L128) — `libraries/ElemenxGraphics/traits/SceneScatter/SceneScatter.test.js`
- [stands houses where a settlement is, woods where trees grow, and nothing on the sea](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/planet-things.test.js#L45) — `tests/regression/planet-things.test.js`
