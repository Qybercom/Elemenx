<!-- generated -->
# Gltf

glTF 2.0, the models other programs make (Blender and the rest export it; FBX and OBJ come through ModelFormats).

- Parse(data, callback, options): data an ArrayBuffer, a Uint8Array or the JSON of a .gltf (its text or the object); calls back (error, asset). options Buffers: {uri: ArrayBuffer} for the files a .gltf names.
- Load(url, callback): fetches a .glb or a .gltf with the files it names, and its pictures where there is a page.
- Write(asset, options): an asset as a .glb (an ArrayBuffer), or the JSON of a .gltf with its buffer inside ({Text: true}): nodes, meshes, materials with their pictures, skins, clips, lamps (KHR_lights_punctual), light over 1 (KHR_materials_emissive_strength), moved pictures (KHR_texture_transform), unlit.
- The asset: {Nodes: [{Name, Parent, Children, Translation, Rotation, Scale, Mesh, Skin}], Meshes: [[{Geometry, Material}]], Lights: [{Name, Type, Color, Intensity, Range, Outer}] (a node with one has its Light), Materials: [{Name, BaseColor, Metallic, Roughness, Emissive, ColorMap, NormalMap, MetalMap, OcclusionMap, EmissiveMap, Alpha, Cutoff, DoubleSided, Unlit}], Images: [{Data, Type, URI, Picture}], Skins: [{Joints, Inverse}], Animations: [{Name, Length, Channels: [{Node, Path, Times, Values, Step}]}], Scene (the indices of its roots)}. A Geometry has Positions, Normals, UVs, Indices, and Joints and Weights when it is skinned.
- The extensions read: KHR_mesh_quantization, KHR_texture_transform, KHR_materials_unlit, KHR_materials_specular, KHR_materials_clearcoat, KHR_materials_emissive_strength, EXT_meshopt_compression (Meshopt(mode, source, count, stride, filter) decodes one buffer); a file that requires another is refused: 'Elemenx Gltf: extension <name> is not supported'.

The same functions run in Node: they read no page, but for the pictures of Load.

## Methods

- `Parse(data, callback, options)`
- `Load(url, callback)`
- `Write(asset, options)`
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
			}).join(', ') + '\nTriangles: ' + asset.Meshes[0][0].Geometry.Indices.length / 3 + '\n\nIn a scene: <SceneObject Kind="unit" Model="assets/hero.glb" Clip="Idle" />';
		});
	}
})
</script>
```

## Tests

- [reads a GLB: its nodes, meshes, materials, skins, animations and pictures](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L9019) — `tests/regression/library-scene.test.js`
- [refuses what it cannot read, and says why](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L9050) — `tests/regression/library-scene.test.js`
- [decodes meshopt: the example of the specification, each mode and each filter](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L9066) — `tests/regression/library-scene.test.js`
- [makes a model of a file: 1 tall on the ground, its clips found by their names, its skeleton in frames of a texture](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L9139) — `tests/regression/library-scene.test.js`
- [measures a skinned model by where its skeleton holds it, not by the numbers of its vertices](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L9203) — `tests/regression/library-scene.test.js`
- [plays the only clip of a file by itself, and bakes one animation once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L9243) — `tests/regression/library-scene.test.js`
- [makes clips from a skeleton by the names of its bones: legs that swing in turn, arms let down](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L9275) — `tests/regression/library-scene.test.js`
- [bakes a long clip in steps, and joins the pieces of a location by material](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L9317) — `tests/regression/library-scene.test.js`
- [reads the clip of an FBX as text and lays it on another skeleton, by what its bones are](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L9343) — `tests/regression/library-scene.test.js`
- [reads a material of specular and glossiness as one of metal and roughness](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L9421) — `tests/regression/library-scene.test.js`
- [closes the dish of the radar: seen from above it has a side that faces up](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L9429) — `tests/regression/library-scene.test.js`
- [lets a piece no skin holds go with the nearest bone, and takes the turn of the whole body out of a clip](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L9445) — `tests/regression/library-scene.test.js`

+10 more in the same files
