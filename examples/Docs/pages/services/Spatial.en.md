<!-- generated -->
# Spatial

Where things are on a plane, found fast: a grid of buckets (a spatial hash). The units of a map under a selection frame, the enemies in the range of a tower, the nearest tree.

- Create({Cell}) returns an index (Cell: the side of a bucket, 64 by default; about the size of the things): - Set(id, x, y, width, height): puts a thing in it, or moves it (width and height 0: a point); - Remove(id), Has(id), Get(id) ({ID, X, Y, Width, Height}), Count(), Clear(), Each(callback); - Rect(x, y, width, height, filter): the IDs of the things that touch the rectangle; - Radius(x, y, radius, filter): the IDs of the things within radius of the point, the nearest first; - Nearest(x, y, max, filter): {ID, Distance} of the nearest thing (within max, when given), or null. filter(id, thing) keeps a thing when it returns true.
- Distance(x, y, thing): from a point to a thing ({X, Y, Width, Height}): 0 inside it.

## Methods

- `Distance(x, y, thing)`
- `Create(options)`

## Example

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

## Tests

- [Random: the same numbers for the same seed, its helpers in their bounds, a fork of its own, a smooth noise](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L27) — `tests/regression/game-services.test.js`
- [Spatial: the things in a rectangle, within a radius the nearest first, the nearest one, as they move and go](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L67) — `tests/regression/game-services.test.js`
- [Pathfinding: a way round the walls, no corner cut, around costly cells, to the nearest reachable cell, on a graph of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L104) — `tests/regression/game-services.test.js`
- [Visibility: a line, the sight past a wall, the field of view and its shadows, the fog of war](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L181) — `tests/regression/game-services.test.js`
- [GameLoop: steps of the same time whatever the frames, a part of a step to draw between, its speed, pause and catch-up limit](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/game-services.test.js#L228) — `tests/regression/game-services.test.js`
