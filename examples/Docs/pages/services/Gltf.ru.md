<!-- generated -->
# Gltf

glTF 2.0 и GLB — модели из других программ (Blender и другие экспортируют их, FBX и OBJ конвертируются через них). Parse(data, callback, {Buffers}), Load(url, callback) — файл, файлы, которые он называет, и его картинки; Meshopt(mode, source, count, stride, filter). Читает сетки, материалы metal/roughness с картами, скины, анимации, KHR_mesh_quantization, KHR_texture_transform, KHR_materials_unlit, KHR_materials_specular и EXT_meshopt_compression; файл, требующий другого расширения (Draco, KTX2), отклоняется с его именем. Работает и в Node, кроме картинок.

Чужой файл читается осторожно: accessor, читающий за пределами своего буфера, индекс за пределами вершин, узел, который дважды чей-то ребёнок или входит в цикл, поток meshopt с недопустимым шагом — ошибки с описанием. Accessor без буфера держит не больше MaxValues чисел (16 777 216; опция MaxValues у Parse), буфер meshopt — не больше MaxBytes (1 ГБ; опция MaxBytes). Файлы, которые называет .gltf, берутся рядом с ним или по http(s); адреса других схем (javascript:, file:, blob:) не загружаются.

## Методы

- `Parse(data, callback, options)`
- `Load(url, callback)`
- `Write(asset, options)`
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
			}).join(', ') + '\nTriangles: ' + asset.Meshes[0][0].Geometry.Indices.length / 3 + '\n\nIn a scene: <SceneObject Kind="unit" Model="assets/hero.glb" Clip="Idle" />';
		});
	}
})
</script>
```

## Тесты

- [reads a GLB: its nodes, meshes, materials, skins, animations and pictures](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L13435) — `tests/regression/library-scene.test.js`
- [refuses what it cannot read, and says why](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L13466) — `tests/regression/library-scene.test.js`
- [decodes meshopt: the example of the specification, each mode and each filter](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L13482) — `tests/regression/library-scene.test.js`
- [refuses a glTF that reads past its buffers, is too large, indexes past its vertices or has nodes in a cycle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L13560) — `tests/regression/library-scene.test.js`
- [makes a model of a file: 1 tall on the ground, its clips found by their names, its skeleton in frames of a texture](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L13623) — `tests/regression/library-scene.test.js`
- [finds the legs of a skeleton by the names of its thighs, a Biped too, and keeps them out of its upper body](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L13696) — `tests/regression/library-scene.test.js`
- [makes the frames of the clips of standing and going first, then the one played, and lets each be seen before the rest](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L13733) — `tests/regression/library-scene.test.js`
- [measures a skinned model by where its skeleton holds it, not by the numbers of its vertices](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L13805) — `tests/regression/library-scene.test.js`
- [plays the only clip of a file by itself, and bakes one animation once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L13845) — `tests/regression/library-scene.test.js`
- [makes clips from a skeleton by the names of its bones: the walk of the graphs, legs in turn, arms let down](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L13882) — `tests/regression/library-scene.test.js`
- [bakes a long clip in steps, and joins the pieces of a location by material](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L14004) — `tests/regression/library-scene.test.js`
- [reads the clip of an FBX as text and lays it on another skeleton, by what its bones are](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L14030) — `tests/regression/library-scene.test.js`

+13 ещё в тех же файлах
