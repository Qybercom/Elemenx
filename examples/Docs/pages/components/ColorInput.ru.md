<!-- generated -->
# ColorInput

Поле цвета со своей палитрой. Value — '#rrggbb' или '#rrggbbaa' с Alpha. В палитре — область насыщенности и яркости, ползунок оттенка, ползунок прозрачности (Alpha), образцы Swatches и пипетка, где браузер её поддерживает. Перетаскивание отправляет input, отпускание — change.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `'#000000'` |
| `Alpha` | `false` |
| `Swatches` | `[…]` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |
| `A` | `1` |

## События

- `input`: Цвет изменился при перетаскивании в выборе: Value.
- `change`: Цвет зафиксирован (отпущено перетаскивание, образец или пипетка): Value.

## Пример

```example
<Field Label="Accent" [hint]="Color"><ColorInput [value]="Color" (change)="Changed" /></Field>
<div style="height: 32px; border-radius: 6px;" [style.background]="Color"></div>
<script>
({
	Color: '#3d7be0',

	Changed: function (value) {
		this.Color = value;
	}
})
</script>
```

## Тесты

- [ColorInput takes a color typed as #rrggbb, and #rrggbbaa only with Alpha](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-misc.test.js#L83) — `tests/regression/library-misc.test.js`
