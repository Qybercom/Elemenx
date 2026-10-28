<!-- generated -->
# Random

Random numbers of a seed: always the same numbers for the same seed (a map made again, a replay, a picture of Suprematism), or of the time without one.

- Create(seed) returns a generator: Next() (0 to 1), Int(min, max) (both in), Float(min, max), Chance(probability), Pick(list), Weighted(list, weight) (weight: a function of an item, or the name of its field; Weight by default), Shuffle(list) (a new list), Fork(name) (a generator of its own for a part: the same for the same seed and name), Seed.
- Hash(text): a number of 32 bits of a text.
- Noise(seed, size) returns a smooth noise of a plane, noise(x, y) 0 to 1 (size: the cells of one wave, 16 by default): the ground of a map, clouds.

## Methods

- `Hash(text)`
- `Create(seed)`
- `Noise(seed, size)`

## Example

```example
<Field Label="Seed">
	<Input [value]="Seed" (input)="Typed" />
</Field>
<p>Dice: <strong>{{Dice}}</strong> · a card: <strong>{{Card}}</strong> · a loot: <strong>{{Loot}}</strong></p>
<p class="elemenx-text small muted">The same seed gives the same numbers, every time.</p>
<script>
({
	Seed: 'dungeon-1',
	Dice: '',
	Card: '',
	Loot: '',

	$OnCreate: function () {
		this.Roll();
	},

	Typed: function (value) {
		this.Seed = value;
		this.Roll();
	},

	Roll: function () {
		var random = this.$Service('Random').Create(this.Seed);

		this.Dice = [random.Int(1, 6), random.Int(1, 6), random.Int(1, 6)].join(', ');
		this.Card = random.Pick(['Ace', 'King', 'Queen', 'Jack', 'Ten']);
		this.Loot = random.Weighted([{Name: 'copper', Weight: 70}, {Name: 'silver', Weight: 25}, {Name: 'gold', Weight: 5}], 'Weight').Name;
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
