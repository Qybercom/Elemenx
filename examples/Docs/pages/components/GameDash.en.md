<!-- generated -->
# GameDash

The instruments of a game over a Scene, declared inside it (the trait SceneBehaviour): what Readout of the scene reads of For (an ID; empty: the hero, as the hero changes: in a car its dial of speed, its gear, its revolutions, its indicators and its lights; on foot its health and its pace), each Every seconds (0.1). Size small, medium or large; Label names it for screen readers. Regression: each demo read its car itself, and showed the car still once the driver had left it.

## Properties

| Property | Default |
| --- | --- |
| `For` | `''` |
| `Every` | `0.1` |
| `Size` | `'medium'` |
| `Label` | `''` |

## Example

```example
<p class="elemenx-caption">GameDash reads the Readout of the Scene it stands in: here, what a dash shows of a car and of a character on foot (Show takes a readout as Readout gives it).</p>
<GameDash #dash />
<Button Label="A car at 120 km/h" (click)="Car" />
<Button Label="On foot" (click)="Foot" />
<script>
({
	Car: function () {
		this.$Ref('dash', true).Show({Kind: 'car', Speed: 120, TopSpeed: 330, Gear: 4, RpmPart: 0.62, Left: 1, Lights: 1});
	},
	Foot: function () {
		this.$Ref('dash', true).Show({Kind: 'walk', Speed: 5, HealthPart: 0.7});
	}
})
</script>
```

## Tests

- [reads the speed, the revolutions of the redline of the car itself, the gear and the lamps](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-dash.test.js#L51) — `tests/regression/library-game-dash.test.js`
- [shows the instruments of the hero as it changes: of the car it drives, of the character once it left it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-dash.test.js#L78) — `tests/regression/library-game-dash.test.js`
- [shows the systems of a ship and gives an engineer the hands of its power](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-dash.test.js#L134) — `tests/regression/library-game-dash.test.js`
