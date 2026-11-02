<!-- generated -->
# Gltf

glTF 2.0 и GLB — модели из других программ (Blender и другие экспортируют их, FBX и OBJ конвертируются через них). Parse(data, callback, {Buffers}), Load(url, callback) — файл, файлы, которые он называет, и его картинки; Meshopt(mode, source, count, stride, filter). Читает сетки, материалы metal/roughness с картами, скины, анимации, KHR_mesh_quantization, KHR_texture_transform, KHR_materials_unlit, KHR_materials_specular и EXT_meshopt_compression; файл, требующий другого расширения (Draco, KTX2), отклоняется с его именем. Работает и в Node, кроме картинок.

## Методы

- `Parse(data, callback, options)`
- `Load(url, callback)`
- `Meshopt(mode, source, count, stride, filter)`

## Пример

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

## Тесты

- [reads a GLB: its nodes, meshes, materials, skins, animations and pictures](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L6837) — `tests/regression/library-scene.test.js`
- [refuses what it cannot read, and says why](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L6868) — `tests/regression/library-scene.test.js`
- [decodes meshopt: the example of the specification, each mode and each filter](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L6884) — `tests/regression/library-scene.test.js`
- [makes a model of a file: 1 tall on the ground, its clips found by their names, its skeleton in frames of a texture](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L6957) — `tests/regression/library-scene.test.js`
- [measures a skinned model by where its skeleton holds it, not by the numbers of its vertices](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L7021) — `tests/regression/library-scene.test.js`
- [plays the only clip of a file by itself, and bakes one animation once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L7061) — `tests/regression/library-scene.test.js`
- [makes clips from a skeleton by the names of its bones: legs that swing in turn, arms let down](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L7093) — `tests/regression/library-scene.test.js`
- [bakes a long clip in steps, and joins the pieces of a location by material](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L7135) — `tests/regression/library-scene.test.js`
- [reads the clip of an FBX as text and lays it on another skeleton, by what its bones are](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L7161) — `tests/regression/library-scene.test.js`
- [reads a material of specular and glossiness as one of metal and roughness](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L7239) — `tests/regression/library-scene.test.js`
- [closes the dish of the radar: seen from above it has a side that faces up](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L7247) — `tests/regression/library-scene.test.js`
- [lets a piece no skin holds go with the nearest bone, and takes the turn of the whole body out of a clip](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L7263) — `tests/regression/library-scene.test.js`

+10 ещё в тех же файлах
