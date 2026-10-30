<!-- generated -->
# Terrain

Земля игры, непрерывная: высоты из шума в любой точке (без клеток), её сетки кусками и пути по ней. Flat(options) — земля плоской карты: Size (1000), Height (высота самых высоких холмов, 60), Water (уровень моря от 0 до 1, 0.35), Scale (размер холмов, 180), Ridges (доля гор, 0.4), Seed; её методы Height(x, z) (ниже 0 — под морем), Normal(x, z), Slope(x, z) (0 — ровно, 1 — стена), Walkable(x, z, options) (MaxSlope, Swim, Blocked(x, z)), Chunk(x, z, size, resolution) — геометрия квадрата с цветами высот и склонов и юбкой под краями, Path({X, Z}, {X, Z}, options) — путь из точек {X, Y, Z} в обход непроходимого, спрямлённый где можно, или null. Sphere(options) — земля планеты, та самая, что на её запечённой поверхности (шум Graphics3D, как его запекает шейдер GameScene): Radius, Height, Seed, Ocean, Type; её методы Land(direction), Elevation(direction), Point(direction), Altitude(point), Patch(face, u, v, size, resolution). Cells({Width, Height, Depth, Color(x, y)}) — плоская земля карты клеток, одним куском. Работает и в Node.

## Методы

- `Flat(options)`
- `Cells(options)`
- `Sphere(options)`

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

- [has continuous heights, chunks with a skirt, and ways that keep out of the sea](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1524) — `tests/regression/library-scene.test.js`
- [has the ground of a planet whose coasts are the ones its baked surface shows, its squares turned outwards](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene.test.js#L1558) — `tests/regression/library-scene.test.js`
- [terrain draws a ground with its trees and houses, its units walk to the village round what blocks them, and the game saves](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L3239) — `tests/examples/ui-kit.spec.js`
