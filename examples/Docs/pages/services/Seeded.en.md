<!-- generated -->
# Seeded

What is made of a seed, saved and made again. A record is its recipe by default: {Kind, Version, Seed, Params}, from which the very same thing is made again; baked, it keeps the data made too (Baked), read back without making it again.

- Define(kind, {Version, Make(params), Bake(made, options), Read(baked, params)}) adds a kind or replaces it: Make makes it of its params (Seed among them), Bake gives what it made as data, Read makes it of that data. Kinds() lists the kinds.
- Save(kind, params, options): the record of a thing of these params; options Baked (true: its data too, as Bake gives it), Made (what was made of them already: it is baked, not made again) and what a kind's Bake takes (Side of a terrain). The lists of numbers are packed as text: a record is JSON.
- Load(record): the thing again: of its Baked when it has one, else made of its recipe. An unknown kind, or a Version newer than the kind knows, is an error.
- Pack(value), Unpack(value): typed arrays to {Typed, Base64} and back, functions left out: the data of a thing as JSON.

The kind of this library: system, a star system (Astronomy.Generate, Params {Seed, and its options}). A Service of any Library defines its own kinds as it is made and declares them in $Provides ({Seeded: {Kinds: ['terrain']}}): a kind not known yet (Save, Load) or the list of them (Kinds) makes that Service first. So do terrain (Terrain), village (Biomes), model (Models), sigil (Sigils) and suprematism (Suprematist). The same functions run in Node: they read no page.

## Methods

- `Define(kind, definition)`
- `Kinds()`
- `Save(kind, params, options)`
- `Load(record)`
- `Pack(value)`
- `Unpack(value)`

## Tests

- [saves a recipe of the kinds of the library and makes the very same thing of it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/seeded.test.js#L23) — `tests/regression/seeded.test.js`
- [makes the Service that declares a kind as a record of it is loaded, and every one of them for the list](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/seeded.test.js#L45) — `tests/regression/seeded.test.js`
- [bakes what it made, its lists of numbers packed as text, and reads it back without making it again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/seeded.test.js#L59) — `tests/regression/seeded.test.js`
- [packs typed arrays of any kind and leaves functions out; tells what it cannot read](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/seeded.test.js#L107) — `tests/regression/seeded.test.js`
- [loads every Service of ElemenxCommon through its entry for Node: a loop runs on timers, FPS waits in silence](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/headless.test.js#L129) — `tests/regression/headless.test.js`
- [makes the provider only as a name of it is wanted, in the Application that wants it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-provides.test.js#L47) — `tests/regression/library-provides.test.js`
