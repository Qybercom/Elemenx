<!-- generated -->
# ModelFormats

The files of models, read and written in one form: the asset of Gltf ({Nodes, Meshes, Materials, Images, Skins, Animations, Scene, Lights}). glb and gltf (Gltf), fbx binary or text (Fbx: meshes, materials, pictures inside or beside, skins, clips), obj with its mtl.

- Formats(): the formats it reads and writes. Detect(data, name): the format of bytes or a text (or of the name of its file): glb, gltf, fbx, obj, or ''.
- Read(data, options): the asset of a file (an ArrayBuffer, a Uint8Array or a text); options Format (else detected), Name, Buffers (the files a .gltf names), Materials (the text of the mtl of an obj). An error tells what is wrong.
- Parse(data, callback, options): the same, called back (error, asset).
- Load(url, callback): fetches a file of any of them, what it names beside it (the buffers of a .gltf, the mtl of an obj) and its pictures where there is a page: (error, asset). Models loads its files so.
- Write(asset, format, options): glb and fbx an ArrayBuffer (fbx {Text: true}: text), gltf the text of its JSON, obj its text (positions in the space of the scene, a group for each mesh) and mtl the text of its materials.
- FromModel(model): a model of Models as an asset: of a file, its asset; of code, a node for each piece (at its pivot), its colors in its vertices, its clips sampled 30 times a second: what Write exports.

The same functions run in Node: they read no page, but for Load.

## Methods

- `Formats()`
- `Detect(data, name)`
- `Read(data, options)`
- `Parse(data, callback, options)`
- `Load(url, callback)`
- `Write(asset, format, options)`
- `FromModel(model)`

## Tests

- [unpacks zlib as the browser packs it: blocks stored, fixed and of their own codes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L359) — `tests/regression/model-formats.test.js`
- [reads an FBX as a model: polygons in triangles by material, its picture inside, its skin and its clip](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L378) — `tests/regression/model-formats.test.js`
- [reads a binary FBX the same as its text, of either width, its lists packed](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L437) — `tests/regression/model-formats.test.js`
- [writes a model in every format, and reads back the very same model](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L466) — `tests/regression/model-formats.test.js`
- [keeps to the letter of the formats: turns in their order, layers by polygon, four bones, names, degrees, bounds](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L518) — `tests/regression/model-formats.test.js`
- [exports a model of code with its clips, and its skeleton for a clip of another binary file](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L588) — `tests/regression/model-formats.test.js`
- [makes a model of a file of FBX through Models, as one of glTF](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L630) — `tests/regression/model-formats.test.js`
- [zips a project of Elemenx: the page, the Application of its root, the Component Game, and each model as a glb](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-editor.test.js#L119) — `tests/regression/game-editor.test.js`
- [gives its model to Models under a name, and as files of every format that read back with its pieces](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-object-editor.test.js#L216) — `tests/regression/library-object-editor.test.js`
