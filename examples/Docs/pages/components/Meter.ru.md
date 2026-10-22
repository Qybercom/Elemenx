<!-- generated -->
# Meter

Измерение в известном диапазоне, как <meter>: Value между Min и Max. Low и High делят диапазон на зоны; Optimum говорит, какая зона хорошая. Хорошая зона показывается цветом success, соседняя — warning, дальняя — danger. Shape 'bar' рисует полосу, горизонтальную или вертикальную (Orientation 'vertical'); Shape 'dial' — открытое кольцо в три четверти со стрелкой Needle, делениями Ticks вдоль него и слотом по умолчанию в середине (или значением, если слот пуст). Marks показывает метки Low и High (не Ticks), ShowRange — Min и Max на концах, ValuePlacement ставит значение на табличку под шкалой или в её угол (над концом полосы; у циферблата угол освобождается за счёт более короткого кольца в пять восьмых).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `0` |
| `Min` | `0` |
| `Max` | `100` |
| `Low` | `null` |
| `High` | `null` |
| `Optimum` | `null` |
| `Label` | `''` |
| `Unit` | `''` |
| `Size` | `'medium'` |
| `ShowValue` | `true` |
| `Orientation` | `'horizontal'` |
| `Shape` | `'bar'` |
| `Needle` | `false` |
| `Ticks` | `0` |
| `Marks` | `true` |
| `ShowRange` | `false` |
| `ValuePlacement` | `'auto'` |

## Слоты

по умолчанию

## Пример

```example
<input type="range" min="0" max="100" [(value)]="Load" style="width: 100%;" />
<Meter [value]="Number(Load)" Label="CPU" Unit="%" Low="50" High="80" Optimum="20" ShowValue="true" Marks="true" ShowRange="true" />
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Meter [value]="Number(Load)" Shape="dial" Needle="true" Ticks="11" Label="Speed" Unit="km/h" Max="100" Low="60" High="85" Optimum="30" ShowValue="true" />
	<Meter [value]="Number(Load)" Shape="dial" Label="Battery" Unit="%" Low="20" High="60" Optimum="90" ShowValue="true" Size="small" />
	<div style="height: 140px;"><Meter [value]="Number(Load)" Orientation="vertical" Label="Level" Low="30" High="70" Optimum="50" /></div>
</div>
<script>
({
	Load: '42',

	$OnCreate: function () {
		this.Number = function (value) {
			return Number(value);
		};
	}
})
</script>
```
