<!-- generated -->
# Slider

Ползунок. Value — число или [нижнее, верхнее] с Range. Min, Max и Step ограничивают его; Marks показывает деления через каждые Marks единиц (или в перечисленных значениях). ShowValue: always (над бегунком, место для него оставлено), active (пока тянут или в фокусе), end (после дорожки) или never; Format — функция, которая записывает значение текстом. Бегунки следуют за указателем и клавишами: стрелки (Step), Page Up/Down (десять шагов), Home и End. Orientation 'vertical' ставит ползунок вертикально, минимум внизу, как вертикальный Meter. События: input при движении, change при отпускании.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `0` |
| `Range` | `false` |
| `Min` | `0` |
| `Max` | `100` |
| `Step` | `1` |
| `Marks` | `null` |
| `ShowValue` | `'active'` |
| `Unit` | `''` |
| `Format` | `null` |
| `Size` | `'medium'` |
| `Orientation` | `'horizontal'` |
| `Label` | `''` |
| `Disabled` | `false` |

## События

- `input`: Значение изменилось при перетаскивании или клавишами: Value.
- `change`: Значение зафиксировано (отпущено): Value.

## Пример

```example
<Field Label="Volume" [hint]="Volume + '%'"><Slider [value]="Volume" Min="0" Max="100" ShowValue="always" (input)="Moved" /></Field>
<Field Label="Price" [hint]="Range[0] + ' – ' + Range[1] + ' €'"><Slider Range="true" [value]="Range" Min="0" Max="500" Step="10" Marks="100" (change)="Ranged" /></Field>
<Slider Orientation="vertical" Value="30" Label="Level" />
<script>
({
	Volume: 40,
	Range: [100, 300],

	Moved: function (value) {
		this.Volume = value;
	},

	Ranged: function (value) {
		this.Range = value;
	}
})
</script>
```

## Тесты

- [Slider writes its value by Format, on the thumb and to a screen reader, and its Unit after it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L37) — `tests/regression/library-controls.test.js`
- [Slider without a Format shows the value as it is](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L54) — `tests/regression/library-controls.test.js`
- [Slider keeps room for a value that always shows, and writes one after the track](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L62) — `tests/regression/library-controls.test.js`
