<!-- generated -->
# GameStat

A value of a game with its name: a lap, a time, gold, a speed. Value and Unit, Label (its name), Icon; Layout stacked (the name over the value, as on the board of a race) or inline (the icon, the value, then the name, as a count of a resource); Tone (accent, success, warning, danger, muted: a lamp that is off) its color; Size (small, medium, large). Its figures are of one width, so a value that changes each frame does not shake.

## Properties

| Property | Default |
| --- | --- |
| `Value` | `''` |
| `Unit` | `''` |
| `Label` | `''` |
| `Icon` | `''` |
| `Layout` | `'stacked'` |
| `Tone` | `''` |
| `Size` | `'medium'` |

## Example

```example
<div class="elemenx-game-panel docs-stack" style="max-width: 360px; padding: 12px;">
	<GameStat Label="Lap" Value="2/3" />
	<GameStat Label="Gold" [value]="Gold" Icon="games:coin" Layout="inline" Tone="accent" />
	<GameStat Label="Speed" [value]="Gold % 300" Unit=" km/h" Size="large" />
</div>
<Button Label="Earn 25" (click)="Gold = Gold + 25" />
<script>
({
	Gold: 1250
})
</script>
```

## Tests

- [GameStat shows its value, unit and name, stacked by default, inline with the name after the value, of its tone and size](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L40) — `tests/regression/library-game-stats.test.js`
- [GameStats draws a GameStat for each item on a panel, follows a change of a value, and keeps what is put in its slot](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L57) — `tests/regression/library-game-stats.test.js`
- [Field Size small sets its label narrow, of small type, in line with its control](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L76) — `tests/regression/library-game-stats.test.js`
- [a GameHud in the hud of a scene lets the pointer through to the scene, but its contents take it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L88) — `tests/regression/library-game-stats.test.js`
