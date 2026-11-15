<!-- generated -->
# GameStat

Значение игры с подписью: круг, время, золото, скорость. Value и Unit, Label (название), Icon; Layout — stacked (название над значением, как на табло гонки) или inline (иконка, значение, затем название, как счётчик ресурса); Tone (accent, success, warning, danger) — его цвет; Size (small, medium, large). Цифры одной ширины, поэтому значение, меняющееся каждый кадр, не дрожит.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `''` |
| `Unit` | `''` |
| `Label` | `''` |
| `Icon` | `''` |
| `Layout` | `'stacked'` |
| `Tone` | `''` |
| `Size` | `'medium'` |

## Пример

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

## Тесты

- [GameStat shows its value, unit and name, stacked by default, inline with the name after the value, of its tone and size](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L40) — `tests/regression/library-game-stats.test.js`
- [GameStats draws a GameStat for each item on a panel, follows a change of a value, and keeps what is put in its slot](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L57) — `tests/regression/library-game-stats.test.js`
- [Field Size small sets its label narrow, of small type, in line with its control](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L76) — `tests/regression/library-game-stats.test.js`
- [a GameHud in the hud of a scene lets the pointer through to the scene, but its contents take it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-game-stats.test.js#L88) — `tests/regression/library-game-stats.test.js`
