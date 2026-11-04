<!-- generated -->
# SceneTerrainGenerator

Земля игры, непрерывная: высоты из шума в любой точке (без клеток), её сетки кусками и пути по ней. Flat(options) — земля плоской карты: Size (1000), Height (высота самых высоких холмов, 60), Water (уровень моря от 0 до 1, 0.35), Scale (размер холмов, 180), Ridges (доля гор, 0.4), Seed; её методы Height(x, z) (ниже 0 — под морем), Normal(x, z), Slope(x, z) (0 — ровно, 1 — стена), Walkable(x, z, options) (MaxSlope, Swim, Blocked(x, z)), Chunk(x, z, size, resolution) — геометрия квадрата с цветами высот и склонов и юбкой под краями, Path({X, Z}, {X, Z}, options) — путь из точек {X, Y, Z} в обход непроходимого, спрямлённый где можно, или null. Sphere(options) — земля планеты, та самая, что на её запечённой поверхности (шум Renderer, как его запекает шейдер Scene): Radius, Height, Seed, Ocean, Type; её методы Land(direction), Elevation(direction), Point(direction), Altitude(point), Patch(face, u, v, size, resolution). Cells({Width, Height, Depth, Color(x, y)}) — плоская земля карты клеток, одним куском. Работает и в Node.

## Методы

- `Flat(options)`
- `OnRoad(field, x, z, width)`
- `Sphere(options)`
- `Work()`
- `Sketched(sketch, base, seed)`
- `SketchChanged(before, after)`
- `FromGrid(options, heights, side)`
- `Heights(field, side)`
- `Field(shape, options)`
- `Piece(shape, options, roads, args)`
- `Grid(options, side, top, steep)`
- `Source(names)`

## Пример

```example
<pre class="elemenx-code" style="white-space: pre-wrap;">{{Text}}</pre>
<script>
({
	Text: '',

	$OnCreate: function () {
		var terrain = this.$Service('SceneTerrainGenerator');
		var field = terrain.Flat({Size: 400, Height: 40, Seed: 7});
		var way = field.Path({X: 20, Z: 20}, {X: 180, Z: 160});
		var planet = terrain.Sphere({Radius: 6371, Height: 8, Seed: 3, Ocean: 0.6, Type: 'terran'});

		this.Text = 'Height(100, 100): ' + field.Height(100, 100).toFixed(2) + ', Slope: ' + field.Slope(100, 100).toFixed(2) + ', Walkable: ' + field.Walkable(100, 100) + '\n\nPath: ' + (way ? way.length + ' points, ' + way.map(function (point) {
			return Math.round(point.X) + ',' + Math.round(point.Z);
		}).join(' → ') : 'none') + '\n\nSphere: Elevation at the pole ' + planet.Elevation([0, 1, 0]).toFixed(3) + ', at the equator ' + planet.Elevation([1, 0, 0]).toFixed(3);
	}
})
</script>
```

## Тесты

- [draws a material of a recipe by its Blueprint, its parameters uniforms that change it without making it again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L72) — `tests/regression/library-material-blueprints.test.js`
- [draws a ground by its Blueprint, the color of its parameter, and keeps the very same ground as its look changes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L198) — `tests/regression/library-material-blueprints.test.js`
- [takes a ground from a model: floors one over the other, walls that stop a walker, and a plane at its foot](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1320) — `tests/regression/library-scene.test.js`
- [walks a hero with the feet of a body: walls stop it at any speed, it slides along them, jumps and falls, and faces the view](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1623) — `tests/regression/library-scene.test.js`
- [makes the noise of the clouds and the ground seen from above in workers: no cloud and no light of a field before they come](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1933) — `tests/regression/library-scene.test.js`
- [Workers runs the methods of Services in workers made of their source, and in the page when it cannot](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L3961) — `tests/regression/library-scene.test.js`
- [makes the squares of a ground of noise in workers, lets go of what came for roads that changed, and grows grass with no noise in a frame](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L4062) — `tests/regression/library-scene.test.js`
- [looks from what it follows to where it looks by degrees, so a raised eye makes no leap under the view](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L6666) — `tests/regression/library-scene.test.js`
- [leaves a hero where it stands when the scene changes round it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L6801) — `tests/regression/library-scene.test.js`
- [takes a short drop for no jump, though the body leaves the ground](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L6853) — `tests/regression/library-scene.test.js`
- [takes no seam of a map for a jump, and still falls and jumps](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L6970) — `tests/regression/library-scene.test.js`
- [lets a hero stand while the view goes round it with a free look, and brings it round when it sets off](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L7395) — `tests/regression/library-scene.test.js`

+11 ещё в тех же файлах
