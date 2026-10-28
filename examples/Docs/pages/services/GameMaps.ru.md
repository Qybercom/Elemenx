<!-- generated -->
# GameMaps

Карты GameWorld: свой JSON или карта Tiled (.tmj), приведённые к одному виду.

- Normalize(map) возвращает карту, которую рисует GameWorld: {Width, Height, Projection (orthogonal или isometric), TileWidth, TileHeight, Terrain: {ключ: {Name, Color, Cost, Opaque, Image, SourceX, SourceY, SourceWidth, SourceHeight}}, Layers: [{Name, Cells (Width * Height ключей Terrain, null там, где пусто)}], Objects: [{ID, Kind, X, Y, Width, Height, Team, ...}]}. Слой JSON задаёт Rows (строки текста, символ — ключ Terrain: '.' трава, '~' вода...) или Data (ключи, строка за строкой).
- FromTiled(data, base) читает карту Tiled: её слои тайлов (каждый тайл — ключ Terrain, нарисованный картинкой своего тайлсета; свойства тайла cost и opaque, Color на случай, если картинки нет), её слои объектов (class или type объекта — его Kind: unit, building или что угодно, его свойства — его поля) и её ориентацию. base — URL, от которого считаются картинки тайлсетов.
- Load(url, callback): загружает карту (свой JSON или Tiled) и вызывает (error, map).

Позиции — в клетках: X поперёк, Y вниз (на изометрической карте — вдоль двух её краёв).

## Методы

- `Normalize(map)`
- `FromTiled(data, base)`
- `Load(url, callback)`

## Пример

```example
<div style="height: 260px;">
	<GameWorld [map]="Map" />
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: '',
	/* A map of its own JSON: its terrain, its rows of text and its objects. GameMaps.Load reads one from a URL, of Tiled too (.tmj). */
	Map: {
		Width: 12,
		Height: 6,
		Terrain: {o: {Name: 'lava', Color: '#d8453c', Cost: 'Infinity'}},
		Layers: [{Name: 'ground', Rows: [
			'....~~......',
			'....~~..oo..',
			'....==..oo..',
			'....~~......',
			'..^^~~....TT',
			'....~~....TT'
		]}],
		Objects: [
			{ID: 'hut', Kind: 'building', X: 1, Y: 1, Width: 2, Height: 2, Team: 'blue'},
			{ID: 'scout', Kind: 'unit', X: 2, Y: 4, Team: 'blue'}
		]
	},

	$OnCreate: function () {
		var map = this.$Service('GameMaps').Normalize(this.Map);

		this.Note = map.Width + ' by ' + map.Height + ' cells, ' + Object.keys(map.Terrain).length + ' kinds of ground, ' + map.Objects.length + ' objects.';
	}
})
</script>
```

## Тесты

- [GameMaps: its own JSON with rows of text, and a map of Tiled with its tiles, their properties and its objects](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L87) — `tests/regression/game-world.test.js`
- [GameWorld: sets no timer of no function while it is made (a page that forbids eval refuses one)](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L116) — `tests/regression/game-world.test.js`
- [GameWorld: the map and the objects it declares, the ways round its buildings, its methods, the order walked to the end](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L137) — `tests/regression/game-world.test.js`
- [GameWorld: a declaration changed moves its object, one taken away takes it away; a map by its URL loads](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-world.test.js#L226) — `tests/regression/game-world.test.js`
