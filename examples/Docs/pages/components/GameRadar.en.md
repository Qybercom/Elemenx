<!-- generated -->
# GameRadar

The radar of a vehicle, declared inside a Scene (the trait SceneBehaviour): what it knows round it (Contacts of the scene: SceneTactics) within Range metres, its nose up. Shape plan is a map seen from over it (GameMinimap: a mark for each, rings of a third of its range); bubble is the space round it seen from behind and over it, a disc of its rings at its height, each contact over or under it on a stalk. What is of another team is marked as a foe, of its own as a friend, a place (NavPoint) and a blocker of warp as points; its target ringed; missiles (SceneMissiles) small, one at the vehicle red (incoming), flares as sparks. A press on a mark makes it the target of the vehicle (SetTarget): the event target ({Vehicle, Target}). For is the vehicle (empty: the one the hero sits in, or is in); it reads each Every seconds (0.2). Size is its width in pixels; Zoomable adds + and - (the range halved or doubled); Label names it for screen readers.

## Properties

| Property | Default |
| --- | --- |
| `For` | `''` |
| `Shape` | `'plan'` |
| `Range` | `150` |
| `Every` | `0.2` |
| `Size` | `180` |
| `Zoomable` | `false` |
| `Label` | `''` |
| `Vehicle` | `''` |
| `Contacts` | `[]` |

## Events

- `target`: A contact was pressed and made the target: {Vehicle, Target}.

## Example

```example
<p class="elemenx-caption">GameRadar reads what the vehicle of the hero knows of the Scene it stands in: here, as if it knew a foe ahead on its left, a friend behind and a station over it (Show takes the contacts as Contacts gives them).</p>
<div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start">
	<GameRadar #plan Range="200" Zoomable="true" />
	<GameRadar #bubble Shape="bubble" Size="220" Range="200" />
</div>
<Button Label="Show the contacts" (click)="Fill" />
<script>
({
	Fill: function () {
		var contacts = [
			{ID: 'raider', Name: 'Raider', Kind: 'walker', Team: 'red', Hostile: true, Distance: 90, Bearing: -35, Elevation: -5, Target: true},
			{ID: 'mira', Name: 'Mira', Kind: 'walker', Team: 'blue', Hostile: false, Distance: 60, Bearing: 160, Elevation: 0, Target: false},
			{ID: 'station', Name: 'Station', Kind: 'place', Team: '', Hostile: false, Distance: 150, Bearing: 40, Elevation: 30, Target: false}
		];

		this.$Ref('plan', true).Show(contacts);
		this.$Ref('bubble', true).Show(contacts);
	}
})
</script>
```

## Tests

- [GameArms shows what a ship has, its locks and the warning of a missile at it, and is hidden for a ship with none](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-arms.test.js#L38) — `tests/regression/library-game-arms.test.js`
- [GameRadar marks missiles small, the one at the vehicle as incoming, flares as sparks](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-arms.test.js#L138) — `tests/regression/library-game-arms.test.js`
- [gives a seat the modes of its role and the command seat those of the roles no seat has; mans a turret, knows what is round, shares a target](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tactics.test.js#L47) — `tests/regression/library-tactics.test.js`
