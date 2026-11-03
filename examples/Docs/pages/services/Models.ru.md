<!-- generated -->
# Models

Модели игры, сделанные кодом: без файлов, одна и та же форма для одного варианта. Модель — дерево частей на шарнирах (тело, руки, башня, крылья мельницы), высотой около 1 (постройка — шириной); Size вида делает её нужного размера. Names({Group, Type}) — список: Group fantasy, scifi, nature, space; Type unit, animal, vehicle, plant, rock, building, ship; Has(name), Info(name). Define(name, {Group, Type, Size, Speed, Variants, Sway, Matte, Smooth, Clips, Build(tools, random)}) добавляет свою: Build возвращает части tools.Piece(id, parts, {Parent, Pivot, Team}) из tools.Box, Cylinder, Ball, Blob, Lathe и Wedge; часть с Team принимает цвет команды. Вместо Build можно указать файл: Define(name, {URL, Type, Size, Speed, Clips}), Load(name, callback), Ready(name), Bake(model). Make(name, {Variant}) — модель, сделанная один раз: {Name, Key, Size, Speed, Sway, Matte, Clips, Pieces: [{ID, Parent, Pivot, Team, Geometry}]}. Whole(model) — модель одной геометрией, Bounds(geometry) — её {Radius, Middle}, Levels(name, {Variant}) — геометрии от самой подробной к простым. Pose(model, clip, time, {From, FromTime, Fade}) — матрица каждой части на секунде клипа, Fade смешивает с клипом From; Length(model, clip) — его длина. Клип: {Length, Loop, Hold, Stride, Tracks: {часть: [[время от 0 до 1, rx, ry, rz, mx, my, mz]...]}, Spins: {часть: [x, y, z] градусов в секунду}}. Работает и в Node.

## Методы

- `Define(name, recipe)`
- `Has(name)`
- `Ready(name)`
- `Load(name, callback)`
- `Names(filter)`
- `Info(name)`
- `Make(name, options)`
- `Whole(model)`
- `Surfaces(model)`
- `Bake(model)`
- `BoneMatrix(model, bone, clip, time)`
- `Grip(bone, aim)`
- `Bounds(geometry)`
- `Levels(name, options)`
- `Length(model, clip)`
- `Pose(model, clip, time, options)`
- `Tagged(name, tag)`

## Пример

```example
<pre class="elemenx-code" style="white-space: pre-wrap;">{{Text}}</pre>
<script>
({
	Text: '',

	$OnCreate: function () {
		var models = this.$Service('Models');
		var graphics = this.$Service('Graphics3D');
		var knight = models.Make('knight');
		var foot = graphics.Apply(models.Pose(knight, 'walk', 0.2)['leg-l'], [-0.075, 0.03, 0.03]);

		models.Define('crate', {Group: 'fantasy', Type: 'prop', Size: 1, Build: function (tools) {
			return [tools.Piece('body', [tools.Box(1, 1, 1, [0, 0.5, 0], [0.5, 0.36, 0.23])])];
		}});

		this.Text = 'Units: ' + models.Names({Type: 'unit'}).join(', ') + '\n\nBuildings: ' + models.Names({Type: 'building'}).join(', ') + '\n\nKnight: ' + knight.Pieces.map(function (piece) {
			return piece.ID;
		}).join(', ') + '\nClips: ' + models.Info('knight').Clips.join(', ') + '\nFoot in the walk at 0.2 s: ' + foot.map(function (value) {
			return value.toFixed(2);
		}).join(', ') + '\n\nCrate: ' + models.Make('crate').Pieces[0].Geometry.Indices.length / 3 + ' triangles';
	}
})
</script>
```

## Тесты

- [knows its classes, from a shack to a business centre, and the height of each of its floors and its roof](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/buildings.test.js#L54) — `tests/regression/buildings.test.js`
- [varies a building of a class by its seed within what the class allows, the same seed the same building](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/buildings.test.js#L65) — `tests/regression/buildings.test.js`
- [is a model of Models as tall as its Size: a tower steps in at its setbacks, a business centre stands on a wider podium, its windows lit as told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/buildings.test.js#L81) — `tests/regression/buildings.test.js`
- [starts as a block, adds a part over the selected one in its piece, selects a part by a press on it, and emits the document](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-object-editor.test.js#L89) — `tests/regression/library-object-editor.test.js`
- [moves and scales a part by the gizmo along its axes, changes it by its fields, and undoes it all](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-object-editor.test.js#L135) — `tests/regression/library-object-editor.test.js`
- [gives its model to Models under a name, and as files of every format that read back with its pieces](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-object-editor.test.js#L216) — `tests/regression/library-object-editor.test.js`
- [keeps its document when it is given the same again without a Seed: nothing loaded anew, the selection kept](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-object-editor.test.js#L242) — `tests/regression/library-object-editor.test.js`
- [takes a recipe of the generator plugged in for a description, which Undo takes back; and shows the variant it is told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-object-editor.test.js#L260) — `tests/regression/library-object-editor.test.js`
- [offers the models it is given that Models has, and places each as the kind its Type fits, as large as it is](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editor.test.js#L108) — `tests/regression/library-scene-editor.test.js`
- [has units, animals, vehicles, plants, rocks, buildings and ships, each of whole triangles, its parents before their pieces](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L10050) — `tests/regression/library-scene.test.js`
- [makes the same shape of the same variant, another of another, and throws on an unknown model](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L10083) — `tests/regression/library-scene.test.js`
- [poses the pieces of a clip on their pivots, children with their parents, and fades from a clip to another](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L10095) — `tests/regression/library-scene.test.js`

+25 ещё в тех же файлах
