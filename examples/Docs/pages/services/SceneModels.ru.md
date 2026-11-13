<!-- generated -->
# SceneModels

Модели игры, сделанные кодом: без файлов, одна и та же форма для одного варианта. Модель — дерево частей на шарнирах (тело, руки, башня, крылья мельницы), высотой около 1 (постройка — шириной); Size вида делает её нужного размера. Names({Group, Type}) — список: Group fantasy, scifi, nature, space; Type unit, animal, vehicle, plant, rock, building, ship; Has(name), Info(name). Define(name, {Group, Type, Size, Speed, Variants, Sway, Matte, Smooth, Clips, Build(tools, random)}) добавляет свою: Build возвращает части tools.Piece(id, parts, {Parent, Pivot, Team}) из tools.Box, Cylinder, Ball, Blob, Lathe и Wedge; часть с Team принимает цвет команды. Вместо Build можно указать файл: Define(name, {URL, Type, Size, Speed, Clips}), Load(name, callback), Ready(name), Bake(model). Вместо файла рецепт может дать Generate(callback): модель делается этой функцией при первом Load, callback(error, asset) с ассетом в виде Gltf — так сделана модель mannequin (SceneMannequin); или список ассетов, по одному на каждый вариант Variants (растения SceneFlora: каждый вариант — другое растение). Remake(name) пересобирает модель при следующем Make под новым Key (изменились роли её частей). Make(name, {Variant}) — модель, сделанная один раз: {Name, Key, Size, Speed, Sway, Matte, Clips, Pieces: [{ID, Parent, Pivot, Team, Geometry}]}. Whole(model) — модель одной геометрией, Bounds(geometry) — её {Radius, Middle}, Levels(name, {Variant}) — геометрии от самой подробной к простым. Pose(model, clip, time, {From, FromTime, Fade}) — матрица каждой части на секунде клипа, Fade смешивает с клипом From; Length(model, clip) — его длина. Клип: {Length, Loop, Hold, Stride, Tracks: {часть: [[время от 0 до 1, rx, ry, rz, mx, my, mz]...]}, Spins: {часть: [x, y, z] градусов в секунду}}. Работает и в Node.

Уличная мебель, у каждой модели настоящая высота как Size: streetlamp (фонарь с фонарём на столбе, 4,5 м), roadlamp (мачта дороги с двумя головами, 9 м), bench (скамья), bin (урна), bus-stop (остановка), roadsign (знак), traffic-light (светофор), hydrant (гидрант), bollard (столбик), planter (клумба), kiosk (киоск). Части цвета больше 1 (лампы, сигналы) светятся сами: ночью в полную силу, днём слабо. Они ничего не освещают и не дают теней, а bloom размывает их свет.

Модель из частей может задать свои лампы — рецепт Lamps: [{Place [x, y, z] (в её единицах: её высота — 1), Color, Power, Radius (в её единицах), Spot (угол конуса в градусах; без него — во все стороны), Aim, Night (true — горит только ночью)}]. Фонари (streetlamp, roadlamp) и окно киоска ночью освещают всё вокруг.

Правки модели и её частей делаются поверх исходника (рецепта или файла) и не меняют его. Это список операций рецепта (Edits) и тех, что хранятся для модели в браузере: Edits(name), SetEdits(name, edits), Edit(name, edit). Модель пересобирается с ними. Операции:
- split — разбить: по связности (By connected) или выделенные треугольники (By vertices, Vertices — диапазоны вершин);
- group, ungroup — сгруппировать и разгруппировать (логическая группа);
- merge — слить части в одну; rename, parent, pivot — имя, родитель, точка поворота;
- remove, keep — удалить части или оставить только их; hide — скрыть или показать (Hidden false);
- duplicate — дублировать со сдвигом Move; mirror — отразить по оси (Axis);
- transform — Move, Turn (в градусах), Scale вокруг Pivot; origin — начало координат внизу посередине (To bottom) или в центре.

PieceList(name) перечисляет части для редактора: {ID, Name, Parent, Group, Hidden, Triangles, Material, Skinned}. Extract(name, ids, newName) выносит части в отдельную модель из того же исходника, а из исходной убирает. Combine(newName, parts, options) собирает модель из нескольких ([{Model, At, Turn, Scale}], в единицах каждой); у такого рецепта поле Of.

## Методы

- `Define(name, recipe)`
- `Remake(name)`
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
		var models = this.$Service('SceneModels');
		var graphics = this.$Service('Renderer');
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

- [gives the parts of its blocks: floors a function makes, a rail as a tube, a mirror, its pieces](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-blueprints.test.js#L68) — `tests/regression/model-blueprints.test.js`
- [makes a model of a recipe of a graph, a tube laid along its path and no other way](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-blueprints.test.js#L108) — `tests/regression/model-blueprints.test.js`
- [makes a graph of every block of models code, the very parts and pieces of its run](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/model-blueprints.test.js#L129) — `tests/regression/model-blueprints.test.js`
- [defines a species as a model of SceneModels, each of its variants another plant, made in workers](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js#L277) — `libraries/ElemenxGraphics/services/SceneFlora/SceneFlora.test.js`
- [is a model of SceneModels, loaded as a file is, and others of options are defined of it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js#L140) — `libraries/ElemenxGraphics/services/SceneMannequin/SceneMannequin.test.js`
- [makes a Component of the game that defines its models, loads its scene and gives the keys to its hero](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-editor.test.js#L63) — `tests/regression/game-editor.test.js`
- [zips a project of Elemenx: the page, the Application of its root, the Component Game, and each model as a glb](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-editor.test.js#L135) — `tests/regression/game-editor.test.js`
- [moves and scales a part by the gizmo along its axes, changes it by its fields, and undoes it all](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-object-editor.test.js#L135) — `tests/regression/library-object-editor.test.js`
- [gives its model to Models under a name, and as files of every format that read back with its pieces](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-object-editor.test.js#L216) — `tests/regression/library-object-editor.test.js`
- [takes a recipe of the generator plugged in for a description, which Undo takes back; and shows the variant it is told](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-object-editor.test.js#L260) — `tests/regression/library-object-editor.test.js`
- [offers the models it is given that Models has, and places each as the kind its Type fits, as large as it is](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-editor.test.js#L108) — `tests/regression/library-scene-editor.test.js`
- [joins the pieces of a skeleton that never moves, of one material, into one draw, in their places](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-frames.test.js#L48) — `tests/regression/library-scene-frames.test.js`

+33 ещё в тех же файлах
