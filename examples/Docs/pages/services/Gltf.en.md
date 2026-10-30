<!-- generated -->
# Gltf

glTF 2.0, the models other programs make (Blender and the rest export it; FBX and OBJ go through them).

- Parse(data, callback, options): data an ArrayBuffer, a Uint8Array or the JSON of a .gltf (its text or the object); calls back (error, asset). options Buffers: {uri: ArrayBuffer} for the files a .gltf names.
- Load(url, callback): fetches a .glb or a .gltf with the files it names, and its pictures where there is a page.
- The asset: {Nodes: [{Name, Parent, Children, Translation, Rotation, Scale, Mesh, Skin}], Meshes: [[{Geometry, Material}]], Materials: [{Name, BaseColor, Metallic, Roughness, Emissive, ColorMap, NormalMap, MetalMap, OcclusionMap, EmissiveMap, Alpha, Cutoff, DoubleSided, Unlit}], Images: [{Data, Type, URI, Picture}], Skins: [{Joints, Inverse}], Animations: [{Name, Length, Channels: [{Node, Path, Times, Values, Step}]}], Scene (the indices of its roots)}. A Geometry has Positions, Normals, UVs, Indices, and Joints and Weights when it is skinned.
- The extensions read: KHR_mesh_quantization, KHR_texture_transform, KHR_materials_unlit, EXT_meshopt_compression (Meshopt(mode, source, count, stride, filter) decodes one buffer); a file that requires another is refused: 'Elemenx Gltf: extension <name> is not supported'.

The same functions run in Node: they read no page, but for the pictures of Load.

## Methods

- `Parse(data, callback, options)`
- `Load(url, callback)`
- `Meshopt(mode, source, count, stride, filter)`

## Example

```example
<pre class="elemenx-code" style="white-space: pre-wrap;">{{Text}}</pre>
<script>
({
	Text: '',

	$OnCreate: function () {
		var gltf = this.$Service('Gltf');
		var self = this;
		var json = {
			asset: {version: '2.0'},
			scenes: [{nodes: [0]}],
			nodes: [{name: 'Triangle', mesh: 0, translation: [0, 1, 0]}],
			meshes: [{primitives: [{attributes: {POSITION: 0}}]}],
			accessors: [{bufferView: 0, componentType: 5126, count: 3, type: 'VEC3'}],
			bufferViews: [{buffer: 0, byteLength: 36}],
			buffers: [{byteLength: 36, uri: 'data:application/octet-stream;base64,AAAAAAAAAAAAAAAAAACAPwAAAAAAAAAAAAAAAAAAgD8AAAAA'}]
		};

		gltf.Parse(json, function (error, asset) {
			self.Text = error ? String(error) : 'Nodes: ' + asset.Nodes.map(function (node) {
				return node.Name;
			}).join(', ') + '\nTriangles: ' + asset.Meshes[0][0].Geometry.Indices.length / 3 + '\n\nIn a scene: <GameObject Kind="unit" Model="assets/hero.glb" Clip="Idle" />';
		});
	}
})
</script>
```

## Tests

- [reads a GLB: its nodes, meshes, materials, skins, animations and pictures](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1193) — `tests/regression/library-scene.test.js`
- [refuses what it cannot read, and says why](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1223) — `tests/regression/library-scene.test.js`
- [decodes meshopt: the example of the specification, each mode and each filter](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1239) — `tests/regression/library-scene.test.js`
- [makes a model of a file: 1 tall on the ground, its clips found by their names, its skeleton in frames of a texture](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1312) — `tests/regression/library-scene.test.js`
- [takes a loop of a clip round, and holds one that does not](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1372) — `tests/regression/library-scene.test.js`
