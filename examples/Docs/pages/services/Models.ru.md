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
- `Bake(model)`
- `Bounds(geometry)`
- `Levels(name, options)`
- `Length(model, clip)`
- `Pose(model, clip, time, options)`

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

- [has units, animals, vehicles, plants, rocks, buildings and ships, each of whole triangles, its parents before their pieces](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1399) — `tests/regression/library-scene.test.js`
- [makes the same shape of the same variant, another of another, and throws on an unknown model](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1432) — `tests/regression/library-scene.test.js`
- [poses the pieces of a clip on their pivots, children with their parents, and fades from a clip to another](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1444) — `tests/regression/library-scene.test.js`
- [spins what turns with no end, and leaves a model of one piece still](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1470) — `tests/regression/library-scene.test.js`
- [makes simpler levels of a model, with fewer faces and the same size](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1477) — `tests/regression/library-scene.test.js`
- [takes the models of an application](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1497) — `tests/regression/library-scene.test.js`
- [draws the model of a file by the same API: fetched, lit, moved and played](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L902) — `tests/regression/library-scene.test.js`
- [sows the model of a file as it sows the ones of code](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L969) — `tests/regression/library-scene.test.js`
- [models stand in their shadows, play their clips, march and turn their shadows off](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L3172) — `tests/examples/ui-kit.spec.js`
