<!-- generated -->
# SceneMaterials

The library of materials of a Scene: what a surface is made of, drawn by its own pattern of GLSL in metres of the world (no picture: it never repeats, it is sharp as near as the eye comes, and fades to its color where it is too small to see). A material changes the color of a surface (its tint: the color it is given stays its color), its roughness, its metal and its height (metres: the light bends on it). The ground of a Scene is drawn of them (each part of a palette: Sand, Low, High, Rock, Snow, Deep, Road, and what a sketch lays: a road, a beach), a road by the materials of its surfaces, a model by the Pattern of a material of it.

- Names(group), Has(name), Get(name), Define(name, material): a material is {Title, Group (ground, road, build or other), Land (true: the ground may be made of it), Code (the body of a function of GLSL over q (vec2, metres along the surface), px (float, metres a pixel covers), c (inout vec3: its color), r (inout float: its roughness), m (inout float: its metal) and h (inout float: its height, metres); helpers enx_mh (a hash of a vec2), enx_mh2, enx_mn (value noise), enx_mf (its octaves), enx_mc (cells: f1, f2 and two hashes of the nearest) and enx_ms (px, size: 1 where features of size are seen, 0 where they are too small))}. Built in: lawn, soil (moss, leaves, pebbles), gravel (sandy, colored grains), clay (clods, pits), sand, rock, snow, dirt; asphalt (fresh, grainy), terrazzo (speckled grey), concrete, paving, cobbles, ballast; brick, stone, plaster, wood, metal, glass, fabric. They are resources, material graphs of a block GLSL each (blueprints/materials, ElemenxGraphics/materials/<name>): an Application gives one of that name in its place.
- Chunk(names): the GLSL of those materials and enx_material(id, q, px, c, r, m, h) drawing the one of index id of names; enx_bump(position, normal, h) bends a normal by a height (of the derivatives of the screen: called where all pixels go).
- Land(names): the GLSL of the materials of a ground (up to 12, its slots) in the shader of the land: landMaterials(place, px, color, height), each by the weight of it at the corners (vMaterials, vMaterials2, vMaterials3), drawn once where it weighs.
- LandNames(): the materials a ground may be made of. Texture of a material names a texture of SceneTextures: on a ground it is its tile baked (sharp near, smooth far, no repeat), Textured(names) the textures of a ground in the order of its layers (SceneTextures.Array), its Code what a model of it draws.
- Surface(name): a material written by hand for a Blueprint of a material of a model (Blueprints, type material): the pattern on its body, in metres of it, on the side its normal faces most.

The same functions run in Node: they read no page.

## Methods

- `Names(group)`
- `Has(name)`
- `Get(name)`
- `Define(name, material)`
- `Chunk(names)`
- `Land(names)`
- `Textured(names)`
- `LandNames()`
- `Surface(name, along)`

## Tests

- [takes a wall of ground as steep, and a skirt (its normals half as long) as the ground over it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMaterials/SceneMaterials.test.js#L87) — `libraries/ElemenxGraphics/services/SceneMaterials/SceneMaterials.test.js`
- [has the materials of the references and the common ones, by group, and the ground may be made of those of land](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMaterials/SceneMaterials.test.js#L122) — `libraries/ElemenxGraphics/services/SceneMaterials/SceneMaterials.test.js`
- [draws each of its materials as a pattern: it compiles, it varies near, and fades to its color where it is too small to see](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMaterials/SceneMaterials.test.js#L142) — `libraries/ElemenxGraphics/services/SceneMaterials/SceneMaterials.test.js`
- [defines a material of its own, in the chunk of materials and as the surface of a model](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMaterials/SceneMaterials.test.js#L155) — `libraries/ElemenxGraphics/services/SceneMaterials/SceneMaterials.test.js`
- [defines the materials and the textures of their resources, one of an Application in the place of one of them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L910) — `tests/regression/blueprints.test.js`
- [draws the materials of a ground that name a texture with their tiles, a layer each, bound to its land](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneTextures/SceneTextures.test.js#L189) — `libraries/ElemenxGraphics/services/SceneTextures/SceneTextures.test.js`
