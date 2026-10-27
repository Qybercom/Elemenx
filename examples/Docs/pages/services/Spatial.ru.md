<!-- generated -->
# Spatial

Где что лежит на плоскости, с быстрым поиском (сетка корзин). Create({Cell}) возвращает индекс (Cell — 64, примерно размер вещей): Set(id, x, y, width, height) кладёт вещь или двигает её (0 на 0 — точка), Remove(id), Has(id), Get(id), Count(), Clear(), Each(callback), Rect(x, y, width, height, filter) — ID вещей, задевающих прямоугольник (рамка выделения), Radius(x, y, radius, filter) — ID в радиусе, ближние первыми (дальность башни), Nearest(x, y, max, filter) — {ID, Distance} или null. Distance(x, y, вещь) — от точки до вещи.

## Методы

- `Distance(x, y, thing)`
- `Create(options)`

## Пример

```example
<p>Ten thousand points in a field of 1000 by 1000; the pointer at {{X}}, {{Y}}.</p>
<Slider Min="0" Max="1000" [value]="X" (input)="MovedX" />
<Slider Min="0" Max="1000" [value]="Y" (input)="MovedY" />
<p>Within 30: <strong>{{Near}}</strong> points · the nearest: <strong>{{Nearest}}</strong></p>
<script>
({
	X: 500,
	Y: 500,
	Near: 0,
	Nearest: '',

	$OnCreate: function () {
		var self = this;
		var random = this.$Service('Random').Create('points');
		/* The index stays out of the state: a plain object, not watched. */
		var index = this.$Service('Spatial').Create({Cell: 50});
		var i;

		for (i = 0; i < 10000; i++)
			index.Set('p' + i, random.Float(0, 1000), random.Float(0, 1000), 0, 0);

		this.Find = function () {
			var nearest = index.Nearest(self.X, self.Y);

			self.Near = index.Radius(self.X, self.Y, 30).length;
			self.Nearest = nearest ? nearest.ID + ' at ' + nearest.Distance.toFixed(1) : 'none';
		};

		this.Find();
	},

	MovedX: function (value) {
		this.X = value;
		this.Find();
	},

	MovedY: function (value) {
		this.Y = value;
		this.Find();
	}
})
</script>
```
