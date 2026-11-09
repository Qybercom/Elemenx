<!-- generated -->
# SceneTextures

SceneTextures: textures of materials made of code once and kept as pictures, as sharp as they are near and as smooth as they are far: baked on the graphics card into tiles that repeat with no seam (every noise of a recipe has a whole number of its cells across the tile), with their mipmaps and seen at a slant without a blur (anisotropic filtering).

A recipe is {Title, Group (ground, road, build, other), Metres (the side of its tile in metres of the world), Size (texels across, 1024), Rows (true: laid in rows, sampled as it is, with no hexagons), Params ({Name: {Value, Min, Max, Title}}: what a lab or a game turns, uniforms p_<Name> of its code), Code}. Code is the body of a function of GLSL over uv (vec2, 0 to 1 across the tile), px (float: a texel in uv) and seed (float), writing c (vec3: the color, linear), r (roughness), h (height, 0 to 1) and ao (how much light reaches it, 0 to 1). Its helpers repeat at the tile: tex_hash(cell, period, seed) and tex_hash2, tex_noise(p, period, seed) (value noise of period cells), tex_fbm(uv, period, octaves, seed), tex_cells(uv, period, seed) ({f1, f2, id, id2} of the nearest cells), tex_blades(uv, cells, length, width, way, spread, seed) ({cover, along, id, lean}: blades of grass seen from over them, each from a root of a cell, as long as length in cells; along 0 at its root, 1 at its tip), tex_line(q, a, b) (the distance to a segment) and tex_ramp(t, a, b, c) (three colors along t).

- Define(name, recipe), Get(name), Has(name), Names(group).
- Bake(renderer, name, params): the tile on that renderer ({Color: albedo in sRGB with roughness in a, Surface: the normal xy, the height and the light reached, Metres, Size, Name}), made once for the same params (its own, Seed, and Size: the texels across, smaller for a quick look); Forget(renderer, name) drops it.
- Array(renderer, names, params): the tiles of names as the layers of two textures ({Color, Surface, Layers: {name: index}, Metres: {name: metres}}), for a ground of many materials: one sampler each, however many materials; params {name: {param: value}}. Made again only when one of its tiles is.
- Chunk(layered): the GLSL of tex_sample(Color, Surface, place, metres, spin, ...) (spin 1: each hexagon turns the tile its own way, for what has no way of its own; 0: only shifted, for beds and flutes that must stay level and upright; below 0: the tile as it is, no hexagons, for blocks laid in rows) a ground samples a tile with: a grid of hexagons over the ground, each with the tile turned and shifted its own way, the three round a point blended by their heights (hex-tiling), and patches of metres of the place itself, so no repeat shows at any distance. Layered: tex_sample_layer (Color, Surface, layer, place, metres, ...) of the textures of Array.
- Source(name): the fragment shader that bakes a recipe (to read, or to check).

Built in: lawn (a dense lawn of blades, light and dark tufts, dry blades and fallen leaves as params say), grassy-soil (sandy soil with patches of grass and rosettes of weeds, its Cover from 0 to 1), asphalt (stones of its aggregate in the binder, worn patches, sealed cracks and stains), paving (concrete blocks in rows across the way, bevelled, sand and moss in the joints, tones, wear), dirt (earth trodden hard: grains, stones, dry cracks, damp hollows, dust), cliff (the face of a cliff of soft rock or earth seen from its side: beds and their ledges, flutes the rain cut down it, cracks, stones; neutral, a ground tints its beds by their height).

## Methods

- `Define(name, recipe)`
- `Get(name)`
- `Has(name)`
- `Names(group)`
- `Source(name)`
- `Bake(renderer, name, params)`
- `Array(renderer, names, params)`
- `Forget(renderer, name)`
- `Chunk(layered)`

## Tests

- [bakes a recipe into a tile that repeats with no seam, with mipmaps, once for the same params](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneTextures/SceneTextures.test.js#L51) — `libraries/ElemenxGraphics/services/SceneTextures/SceneTextures.test.js`
- [keeps the arrays of grounds asked in turn, and gives back the textures of one it lets go](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneTextures/SceneTextures.test.js#L103) — `libraries/ElemenxGraphics/services/SceneTextures/SceneTextures.test.js`
- [shows a texture in TextureLab as a tile or a ground, a slider for each param, and tells change](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneTextures/SceneTextures.test.js#L149) — `libraries/ElemenxGraphics/services/SceneTextures/SceneTextures.test.js`
- [draws the materials of a ground that name a texture with their tiles, a layer each, bound to its land](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneTextures/SceneTextures.test.js#L189) — `libraries/ElemenxGraphics/services/SceneTextures/SceneTextures.test.js`
- [draws a road by the materials of its surfaces and the ground by its own, all of them compiled](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-roads.test.js#L113) — `tests/regression/library-scene-roads.test.js`
