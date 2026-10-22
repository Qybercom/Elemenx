<!-- generated -->
# Slider

Ползунок. Value — число или [нижнее, верхнее] с Range. Min, Max и Step ограничивают его; Marks показывает деления через каждые Marks единиц (или в перечисленных значениях). ShowValue: always, active (пока тянут или в фокусе) или never. Бегунки следуют за указателем и клавишами: стрелки (Step), Page Up/Down (десять шагов), Home и End. Orientation 'vertical' ставит ползунок вертикально, минимум внизу, как вертикальный Meter. События: input при движении, change при отпускании.

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
| `Size` | `'medium'` |
| `Orientation` | `'horizontal'` |
| `Label` | `''` |
| `Disabled` | `false` |

## События

`input`, `change`

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
