<!-- generated -->
# Generated

What is made of a seed, saved and made again. A record is its recipe by default: {Kind, Version, Seed, Params}, from which the very same thing is made again; baked, it keeps the data made too (Baked), read back without making it again.

- Define(kind, {Version, Make(params), Bake(made, options), Read(baked, params)}) adds a kind or replaces it: Make makes it of its params (Seed among them), Bake gives what it made as data, Read makes it of that data. Kinds() lists them.
- Save(kind, params, options): the record of a thing of these params; options Baked (true: its data too, as Bake gives it), Made (what was made of them already: it is baked, not made again) and what a kind's Bake takes (Side of a terrain). The lists of numbers are packed as text: a record is JSON.
- Load(record): the thing again: of its Baked when it has one, else made of its recipe. An unknown kind, or a Version newer than the kind knows, is an error.
- Pack(value), Unpack(value): typed arrays to {Typed, Base64} and back, functions left out: the data of a thing as JSON.

The kinds of the library:

- terrain: a ground of noise (Terrain.Flat, Params its options); baked, its heights in a grid of Side points a side (257), read back by Terrain.FromGrid.
- system: a star system (Astronomy.Generate, Params {Seed, and its options}).
- village: a village (Biomes.Village, Params {Terrain: the options of its ground, X, Y, Houses, Radius, Seed, Shapes}).
- model: a model made of code (Models.Make, Params {Name, Variant}); baked, its pieces and their geometries.
- sigil: a magic circle (Sigils.Make, Params {Seed, and its options}).
- suprematism: a picture of Suprematism (Suprematist.Generate, Params its options); baked, its SVG.

The same functions run in Node: they read no page.

## Methods

- `Define(kind, definition)`
- `Kinds()`
- `Save(kind, params, options)`
- `Load(record)`
- `Pack(value)`
- `Unpack(value)`

## Tests

- [saves a recipe of the kinds of the library and makes the very same thing of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/generated.test.js#L23) — `tests/regression/generated.test.js`
- [bakes what it made, its lists of numbers packed as text, and reads it back without making it again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/generated.test.js#L41) — `tests/regression/generated.test.js`
- [packs typed arrays of any kind and leaves functions out; tells what it cannot read](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/generated.test.js#L89) — `tests/regression/generated.test.js`
