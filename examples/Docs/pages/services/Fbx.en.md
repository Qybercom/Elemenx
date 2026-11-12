<!-- generated -->
# Fbx

Fbx: the files of FBX, binary (7.x, its lists packed by zlib or not) and text, read and written.

- Read(data) returns a file as a model in the very form Gltf gives (its asset): nodes (the models of FBX, their pivots, pre- and post-rotations and orders of turns made matrices), meshes of polygons in triangles, a part for each material, materials of Phong made PBR (Lambert too), the pictures of their textures (inside the file, or the files it names), skins (clusters) and clips (a stack each, sampled at its keys); a file of Z up is turned Y up. ModelFormats reads it so.
- Write(asset, options): an asset (of Read, of Gltf) as a file: binary (an ArrayBuffer) by default, text with {Text: true}; FromAsset(asset) its tree, Binary(tree) and Text(tree) a tree as a file; Typed(type, value) a value of a type of its own for them (I, L, D, S, l).
- Tree(data): the tree of a file, {Version, Nodes: [{Name, Props, Nodes}]}; Child(node, name), Children(node, name), Properties(node) ({name: [values]} of its Properties70); Inflate(bytes) unpacks zlib; IsBinary(bytes).
- Parse(data) returns the skeleton and the clip of a file (text, or bytes binary or not): {Bones: [{ID, Name, Parent, Translation, Pre, Rotation}], Length, Curves}. Parent is an index, -1 for a root; Pre and Rotation are degrees, x, y, z. Curves: {bone index: {T: [x, y, z], R: [x, y, z]}}, each [{Times, Values}] in seconds, degrees and the units of the file, or null where nothing moves: the way a clip made for another skeleton comes to a model (SceneModels.Retarget). Skeleton(tree) is the same of a tree.
- Sample(curve, time, fallback) is the value of a curve at a second.
- Load(url, callback) fetches and parses: (error, parsed).

The same functions run in Node: they read no page, but for Load.

## Methods

- `Parse(data)`
- `Sample(curve, time, fallback)`
- `Load(url, callback)`
- `IsBinary(bytes)`
- `Tree(data)`
- `Inflate(bytes)`
- `Child(node, name)`
- `Children(node, name)`
- `Skeleton(tree)`
- `Read(data)`
- `Typed(type, value)`
- `Binary(tree)`
- `Text(tree)`
- `FromAsset(asset)`
- `Write(asset, options)`
- `Properties(node)`

## Example

```example
<pre class="elemenx-code" style="white-space: pre-wrap;">{{Text}}</pre>
<script>
({
	Text: '',

	$OnCreate: function () {
		var source = this.$Service('Fbx').Parse('Objects:  {\n\tModel: 1, "Model::mixamorig:Hips", "LimbNode" {\n\t\tP: "Lcl Translation", "Lcl Translation", "", "A+",0,100,0\n\t}\n}');

		this.Text = 'Bones: ' + source.Bones.map(function (bone) {
			return bone.Name + ' at ' + bone.Translation.join(', ');
		}).join('; ') + '\n\nOn a model: SceneModels.Define(\'hero\', {URL: \'hero.glb\', Motions: {walk: \'Walk.fbx\'}})';
	}
})
</script>
```

## Tests

- [unpacks zlib as the browser packs it: blocks stored, fixed and of their own codes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L359) — `tests/regression/model-formats.test.js`
- [reads an FBX as a model: polygons in triangles by material, its picture inside, its skin and its clip](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L378) — `tests/regression/model-formats.test.js`
- [reads a binary FBX the same as its text, of either width, its lists packed](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L437) — `tests/regression/model-formats.test.js`
- [writes a model in every format, and reads back the very same model](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L466) — `tests/regression/model-formats.test.js`
- [keeps to the letter of the formats: turns in their order, layers by polygon, four bones, names, degrees, bounds](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L518) — `tests/regression/model-formats.test.js`
- [exports a model of code with its clips, and its skeleton for a clip of another binary file](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L589) — `tests/regression/model-formats.test.js`
- [makes a model of a file of FBX through Models, as one of glTF](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L632) — `tests/regression/model-formats.test.js`
- [reads the clip of an FBX as text and lays it on another skeleton, by what its bones are](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L10027) — `tests/regression/library-scene.test.js`
