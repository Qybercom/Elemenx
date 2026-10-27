<!-- generated -->
# Signal

Сила сигнала: растущие полоски, горит столько, насколько сигнал силён (связь в звонке, сеть, пинг в игре). Value — от 0 до 1, или Quality: good, fair или poor (все полоски, примерно две трети, одна). Bars — сколько полосок (3). Горящие полоски берут цвет своего уровня: success — сильный, warning — средний, danger — слабый (Tone задаёт свой: accent, success, warning, danger или muted). Size — small или medium. Для скринридера это изображение с именем из Label или фразы своего уровня.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `1` |
| `Quality` | `''` |
| `Bars` | `3` |
| `Tone` | `''` |
| `Size` | `'medium'` |
| `Label` | `''` |

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 24px; align-items: center;">
	<Signal Quality="good" Label="Good connection" />
	<Signal Quality="fair" Label="Fair connection" />
	<Signal Quality="poor" Label="Poor connection" />
	<Signal Bars="5" [value]="Strength" Label="Strength" />
</div>
<p class="elemenx-text small muted">Good, fair and poor; then five bars at {{Math.round(Strength * 100)}}%.</p>
<Slider Min="0" Max="1" Step="0.05" [value]="Strength" (input)="Changed" />
<script>
({
	Strength: 0.6,

	Changed: function (value) {
		this.Strength = value;
	}
})
</script>
```
