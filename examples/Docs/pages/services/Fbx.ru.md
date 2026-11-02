<!-- generated -->
# Fbx

Скелет и анимация файла FBX в текстовом виде, как их отдают Blender и Mixamo: клип, сделанный для другого скелета. Parse(text), Sample(curve, time, fallback), Load(url, callback). Двоичный файл отвергается с понятной ошибкой: экспортируйте его как текст (ASCII FBX). Модель получает такие клипы через Models.Define(name, {URL, Motions: {walk: url, run: {URL, Stride, Held}}}) и Models.Retarget: кости сопоставляются по роли, а не по имени, twist-кости идут за своей костью, а Held берёт руки клипа как есть, вместе с пальцами: для рук, которые что-то держат.

## Методы

- `Parse(text)`
- `Sample(curve, time, fallback)`
- `Load(url, callback)`

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
		}).join('; ') + '\n\nOn a model: Models.Define(\'hero\', {URL: \'hero.glb\', Motions: {walk: \'Walk.fbx\'}})';
	}
})
</script>
```

## Тесты

- [reads the clip of an FBX as text and lays it on another skeleton, by what its bones are](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L7161) — `tests/regression/library-scene.test.js`
