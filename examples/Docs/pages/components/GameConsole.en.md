<!-- generated -->
# GameConsole

The screen of a console of a ship, declared inside a Scene (the trait SceneBehaviour): put in its slot screens as a data-screen named console:<seat>, console:<role> or console, it is shown on the screens of the consoles of a ship standing (SceneAboard), pressed there with the mouse or a finger. It reads, each Every seconds (0.25), where the hero is (Context of the scene): the ship For (an ID; empty: the one the hero sits in, or is in) and the Role of the console (pilot, copilot, captain, engineer, tactical, gunner, sensors, commander; empty: the one of the seat the hero sits in). It shows the role and the ship, its instruments (GameFlight: the hands of an engineer at the console of one, more of the places it knows at the console of sensors), its radar beside them with Radar (GameRadar, a map of RadarRange metres, RadarSize pixels wide) and, while the hero sits there, the modes of its seat (GameTactics) and a button to stand up (Leave of the scene); at the console of a pilot, a copilot or a captain the commands of the ship (GameCommands: land, take off, to orbit); at the console of a gunner, a tactical officer, a pilot or a captain its arms (GameArms: missiles, locks, flares, point defence, the warning of a missile at it). Size small, medium or large; Label names it for screen readers; its default slot holds buttons of its own.

## Properties

| Property | Default |
| --- | --- |
| `For` | `''` |
| `Role` | `''` |
| `Every` | `0.25` |
| `Radar` | `false` |
| `RadarRange` | `200` |
| `RadarSize` | `150` |
| `Size` | `'medium'` |
| `Label` | `''` |
| `Name` | `''` |

## Slots

default

## Example

```example
<p class="elemenx-caption">GameConsole reads where the hero is of the Scene it stands in: here, as if the hero sat at the console of an engineer (Show takes a context as Context gives it).</p>
<GameConsole #console Role="engineer" />
<Button Label="Sit at the console" (click)="Sit" />
<script>
({
	Sit: function () {
		this.$Ref('console', true).Show({Kind: 'seat', Vehicle: 'tempest', Seat: 'engineer', Role: 'engineer', Controls: false});
	}
})
</script>
```

## Tests

- [sits at a console: the view on its screen, the screens of the page on the consoles, a finger on one pressing it, a drag looking round within reach](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-aboard.test.js#L444) — `tests/regression/library-aboard.test.js`
