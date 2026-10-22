<!-- generated -->
# DateRangeInput

Диапазон дат. Value: [start, end] в виде 'YYYY-MM-DD' (или [] — без диапазона). Поле показывает диапазон в Locale; его кнопка открывает два месяца рядом: первое нажатие выбирает начало, второе — конец (диапазон виден, пока движется указатель), в любом порядке. Готовые варианты слева выбирают весь диапазон сразу: [{Label, Value: [start, end]} или {Label, Last: дни (включая сегодня)} или {Label, Period: 'week', 'month', 'previous-month', 'year'}]. Min и Max ограничивают дни; FirstDay — первый день недели (0 — воскресенье, 1 — понедельник, по умолчанию; 'locale' — по Locale). Клавиши в месяцах: стрелки двигают на день или неделю, Page Up и Page Down — на месяц, Enter или пробел выбирают, Escape закрывает. События: change ([start, end]).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `[]` |
| `Min` | `''` |
| `Max` | `''` |
| `Locale` | `''` |
| `FirstDay` | `null` |
| `Placeholder` | `''` |
| `Presets` | `[…]` |
| `ClearLabel` | `''` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |

## События

`change`

## Пример

```example
<Field Label="A stay" [hint]="Note"><DateRangeInput (change)="Changed" /></Field>
<script>
({
	Note: 'Pick the first day, then the last.',

	Changed: function (value) {
		this.Note = value.length ? value.join(' → ') : 'Cleared';
	}
})
</script>
```
