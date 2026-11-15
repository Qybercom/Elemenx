<!-- generated -->
# GameStats

The values of a game in a row (or a column) on a panel of the theme: the board of a race (lap, time, best), the resources of a strategy (gold, wood, food). Items [{ID, Label, Value, Unit, Icon, Tone}], each a GameStat of Layout; Orientation horizontal or vertical; Size; Label names the group for screen readers.

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Layout` | `'stacked'` |
| `Orientation` | `'horizontal'` |
| `Size` | `'medium'` |
| `Label` | `''` |

## Slots

default

## Example

```example
<GameStats Label="Race" [items]="[{ID: 'lap', Label: 'Lap', Value: Lap + '/3'}, {ID: 'time', Label: 'Time', Value: '1:02.4'}, {ID: 'best', Label: 'Best', Value: '0:58.1', Tone: 'success'}]" />
<GameStats Label="Resources" Layout="inline" [items]="[{ID: 'gold', Label: 'gold', Value: 1250, Icon: 'games:coin'}, {ID: 'gems', Label: 'gems', Value: 12, Icon: 'games:gem'}]" />
<Button Label="Next lap" (click)="Lap = Lap % 3 + 1" />
<script>
({
	Lap: 2
})
</script>
```

## Tests

- [GameStat shows its value, unit and name, stacked by default, inline with the name after the value, of its tone and size](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L40) — `tests/regression/library-game-stats.test.js`
- [GameStats draws a GameStat for each item on a panel, follows a change of a value, and keeps what is put in its slot](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L57) — `tests/regression/library-game-stats.test.js`
- [Field Size small sets its label narrow, of small type, in line with its control](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L76) — `tests/regression/library-game-stats.test.js`
- [a GameHud in the hud of a scene lets the pointer through to the scene, but its contents take it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L88) — `tests/regression/library-game-stats.test.js`
