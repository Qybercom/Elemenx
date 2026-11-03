<!-- generated -->
# Terrain

Земля игры, непрерывная: высоты из шума в любой точке (без клеток), её сетки кусками и пути по ней. Flat(options) — земля плоской карты: Size (1000), Height (высота самых высоких холмов, 60), Water (уровень моря от 0 до 1, 0.35), Scale (размер холмов, 180), Ridges (доля гор, 0.4), Seed; её методы Height(x, z) (ниже 0 — под морем), Normal(x, z), Slope(x, z) (0 — ровно, 1 — стена), Walkable(x, z, options) (MaxSlope, Swim, Blocked(x, z)), Chunk(x, z, size, resolution) — геометрия квадрата с цветами высот и склонов и юбкой под краями, Path({X, Z}, {X, Z}, options) — путь из точек {X, Y, Z} в обход непроходимого, спрямлённый где можно, или null. Sphere(options) — земля планеты, та самая, что на её запечённой поверхности (шум Graphics3D, как его запекает шейдер GameScene): Radius, Height, Seed, Ocean, Type; её методы Land(direction), Elevation(direction), Point(direction), Altitude(point), Patch(face, u, v, size, resolution). Cells({Width, Height, Depth, Color(x, y)}) — плоская земля карты клеток, одним куском. Работает и в Node.

## Методы

- `Flat(options)`
- `Cells(options)`
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
		var terrain = this.$Service('Terrain');
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

- [has continuous heights, chunks with a skirt, and ways that keep out of the sea](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L10177) — `tests/regression/library-scene.test.js`
- [has the ground of a planet whose coasts are the ones its baked surface shows, its squares turned outwards](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L10211) — `tests/regression/library-scene.test.js`
- [raises and lowers along a stroke, flattens to a height and smooths, up to its radius and no farther](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/terrain-sketch.test.js#L37) — `tests/regression/terrain-sketch.test.js`
- [draws ridges, valleys and canyons along lines, a river whose bed goes down the way it flows, a level road and a cliff on one side](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/terrain-sketch.test.js#L50) — `tests/regression/terrain-sketch.test.js`
- [makes plateaus, basins, lakes, terraces, swamps, beaches, floodplains, dunes, erosion, mountains, craters and stamps](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/terrain-sketch.test.js#L77) — `tests/regression/terrain-sketch.test.js`
- [keeps to its layers: one hidden draws nothing, its Strength weakens it; a mask freezes what it holds and holds back what comes after](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/terrain-sketch.test.js#L124) — `tests/regression/terrain-sketch.test.js`
- [tells the water it lays: a river a little wider than its bed under the levels of its way, a lake at its level](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/terrain-sketch.test.js#L139) — `tests/regression/terrain-sketch.test.js`
- [paints what it lays: the palette of a biome over an area, a road and the sand of a beach](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/terrain-sketch.test.js#L150) — `tests/regression/terrain-sketch.test.js`
- [tells where two sketches differ, and its workers make the very squares the page makes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/terrain-sketch.test.js#L159) — `tests/regression/terrain-sketch.test.js`
- [makes a ground again only where its sketch changed: the same ground, its squares there made again, what stands there set on it again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/terrain-sketch.test.js#L180) — `tests/regression/terrain-sketch.test.js`
- [draws a material of a recipe by its Blueprint, its parameters uniforms that change it without making it again](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L72) — `tests/regression/library-material-blueprints.test.js`
- [draws a ground by its Blueprint, the color of its parameter, and keeps the very same ground as its look changes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-material-blueprints.test.js#L198) — `tests/regression/library-material-blueprints.test.js`

+21 ещё в тех же файлах
