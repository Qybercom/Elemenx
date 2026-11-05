<!-- generated -->
# Fbx

Скелет и анимация файла FBX в текстовом виде, как их отдают Blender и Mixamo: клип, сделанный для другого скелета. Parse(text), Sample(curve, time, fallback), Load(url, callback). Двоичный файл отвергается с понятной ошибкой: экспортируйте его как текст (ASCII FBX). Модель получает такие клипы через SceneModels.Define(name, {URL, Motions: {walk: url, run: {URL, Stride, Held}}}) и SceneModels.Retarget: кости сопоставляются по роли, а не по имени, twist-кости идут за своей костью, а Held берёт руки клипа как есть, вместе с пальцами: для рук, которые что-то держат.

## Методы

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

## Пример

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

## Тесты

- [unpacks zlib as the browser packs it: blocks stored, fixed and of their own codes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L359) — `tests/regression/model-formats.test.js`
- [reads an FBX as a model: polygons in triangles by material, its picture inside, its skin and its clip](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L378) — `tests/regression/model-formats.test.js`
- [reads a binary FBX the same as its text, of either width, its lists packed](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L437) — `tests/regression/model-formats.test.js`
- [writes a model in every format, and reads back the very same model](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L466) — `tests/regression/model-formats.test.js`
- [keeps to the letter of the formats: turns in their order, layers by polygon, four bones, names, degrees, bounds](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L518) — `tests/regression/model-formats.test.js`
- [exports a model of code with its clips, and its skeleton for a clip of another binary file](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L589) — `tests/regression/model-formats.test.js`
- [makes a model of a file of FBX through Models, as one of glTF](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-formats.test.js#L632) — `tests/regression/model-formats.test.js`
- [reads the clip of an FBX as text and lays it on another skeleton, by what its bones are](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L9343) — `tests/regression/library-scene.test.js`
