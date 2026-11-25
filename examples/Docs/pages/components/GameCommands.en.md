<!-- generated -->
# GameCommands

The commands of a ship, declared inside a Scene (the trait SceneBehaviour): what ShipCommands of the scene gives of For (an ID; empty: the hero if it is a ship, else the ship the hero sits in or walks in) each Every seconds (0.25): Land (at the site chosen of the markers of the body, else under the ship), Take off, To orbit (with the hint nearer than 2000 km over the body). A press gives the command (ShipCommand of the scene); the event command tells it ({ID, Done}). None while the ship has none. Put it on the screen of the console of a pilot (in GameConsole it is) and in the instruments over the view (GameFlight with Commands). Size small, medium or large; Label names it for screen readers.

## Properties

| Property | Default |
| --- | --- |
| `For` | `''` |
| `Every` | `0.25` |
| `Size` | `'medium'` |
| `Label` | `''` |
| `Commands` | `[]` |
| `Hint` | `false` |

## Events

- `command`: A command was given: {ID (land, takeoff, orbit), Done (false where the ship could not)}.

## Example

```example
<p class="elemenx-caption">GameCommands reads the commands of the ship of the Scene it stands in: here, as if the ship were near a planet with two sites to land at (Show takes the commands as ShipCommands gives them).</p>
<GameCommands #commands />
<Button Label="Near a planet" (click)="Near" />
<script>
({
	Near: function () {
		this.$Ref('commands', true).Show([{ID: 'land', Markers: [{ID: 'hills', Name: 'Green Hills', Day: true}, {ID: 'base', Name: 'Sea Base', Day: false}]}, {ID: 'orbit', Hint: 'orbit'}]);
	}
})
</script>
```

## Tests

- [gives the commands of a ship as data and on GameCommands, the buttons of the scene only with ShipButtons](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L1184) — `tests/regression/library-scene-landing.test.js`
- [preloads the globe of a planet into the store of the browser, and a scene of it takes it from there at once](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-scene-landing.test.js#L162) — `tests/regression/library-scene-landing.test.js`
