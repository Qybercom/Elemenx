<!-- generated -->
# GameTactics

The modes of the seat the hero sits in, declared inside a Scene (the trait SceneBehaviour): a button for each of its Tactics (SceneTactics: its seat, helm, turret, radar, schematic, strategic), the one it is in marked; a press goes to it (Tactic of the scene). None while the hero sits nowhere or has no mode but its seat. It reads each Every seconds (0.25). Size small, medium or large; Label names it for screen readers. Put it on the screen of a console (in GameConsole it is) and over the view (a GameHud), to come back from a mode as well.

## Properties

| Property | Default |
| --- | --- |
| `Every` | `0.25` |
| `Size` | `'medium'` |
| `Label` | `''` |

## Example

```example
<p class="elemenx-caption">GameTactics reads the modes of the seat the hero sits in of the Scene it stands in: here, as if the hero sat at the seat of command of a ship with no gunner and no sensors (Show takes the modes as Tactics gives them, and the one it is in).</p>
<GameTactics #tactics />
<Button Label="Sit at the helm" (click)="Sit" />
<script>
({
	Sit: function () {
		this.$Ref('tactics', true).Show(['', 'helm', 'turret', 'radar'], 'radar');
	}
})
</script>
```

## Tests

- [gives a seat the modes of its role and the command seat those of the roles no seat has; mans a turret, knows what is round, shares a target](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-tactics.test.js#L47) — `tests/regression/library-tactics.test.js`
