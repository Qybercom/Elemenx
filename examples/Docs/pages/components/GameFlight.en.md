<!-- generated -->
# GameFlight

The instruments of a ship over a Scene, declared inside it (the trait SceneBehaviour): what Readout of the scene reads of For (an ID; empty: the hero) each Every seconds (0.15): its speed, its height and the air round it (Probe of the scene), its travel (warp, jump: its phase, its step), its throttle; of its systems (SceneShipSystems) its reactors (their heat, what they give, shut down by their heat), what each system is given of the power, the layers of its shield, a blocker of warp its sensors see, and the places it knows of, the nearest first (Nav of them shown). Engineer adds the hands of an engineer (or of a pilot alone): the shares of the power, each reactor on or off, venting their heat. Size small, medium or large; Label names it for screen readers; its default slot holds buttons of its own. Regression: the demos of space each wrote their own lines of the flight.

## Properties

| Property | Default |
| --- | --- |
| `For` | `''` |
| `Every` | `0.15` |
| `Nav` | `5` |
| `Engineer` | `false` |
| `Size` | `'medium'` |
| `Label` | `''` |

## Slots

default

## Example

```example
<p class="elemenx-caption">GameFlight reads the Readout of the Scene it stands in: here, what it shows of a ship (Show takes a readout as Readout gives it).</p>
<GameFlight #flight Engineer="true" />
<Button Label="A ship in warp, a layer hit" (click)="Ship" />
<script>
({
	Ship: function () {
		this.$Ref('flight', true).Show({Kind: 'ship', Speed: 3600 * 12.5, Throttle: 0.8, Travel: {Kind: 'warp', Phase: 'inside', Step: 4}, Environment: null, Systems: {
			Reactors: [{ID: 'main', Output: 80, Supply: 80, Heat: 0.62, On: true, Tripped: false}, {ID: 'aux', Output: 20, Supply: 0, Heat: 1.1, On: true, Tripped: true}],
			Power: {Engines: 0.7, Shields: 1, Weapons: 0.4},
			Shares: {Engines: 2, Shields: 1, Weapons: 1},
			Shields: [{ID: 'outer', Part: 0.2}, {ID: 'inner', Part: 1}],
			Jam: {ID: 'interdictor', Distance: 42, Inside: false},
			Nav: [{ID: 'halcyon', Name: 'Halcyon', Kind: 'station', Distance: 1200, Bearing: 12}, {ID: 'luna', Name: 'Luna', Kind: 'moon', Distance: 384400, Bearing: -40}]
		}});
	}
})
</script>
```

## Tests

- [shows the systems of a ship and gives an engineer the hands of its power](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-dash.test.js#L134) — `tests/regression/library-game-dash.test.js`
