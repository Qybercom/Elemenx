<!-- generated -->
# MultiSelect

Выбор нескольких вариантов. Options: [{Value, Label, Hint, Icon, Group, Disabled}]; Value — список выбранных Value. Display: chips (выбранные варианты как удаляемые метки в поле) или count («Выбрано: 3»). Searchable (по умолчанию включено) добавляет поле фильтра; SelectAll добавляет вариант, переключающий все доступные. Список остаётся открытым, пока варианты переключаются. Placeholder, Empty, Size, Shape, Disabled и Invalid — как в Select. События: change (список). Name — имя его значения в форме; событие change передаёт поле вместе с ним, как у остальных полей.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Options` | `[]` |
| `Value` | `[]` |
| `Placeholder` | `''` |
| `Empty` | `''` |
| `Display` | `'chips'` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Searchable` | `true` |
| `SelectAll` | `false` |
| `Disabled` | `false` |
| `Invalid` | `false` |
| `Name` | `null` |

## События

- `change`: Выбор изменился: список значений Value.

## Пример

```example
<Field Label="Colors" [hint]="Colors.join(', ') || 'None'"><MultiSelect Placeholder="Pick colors" [options]="Options" [value]="Colors" SelectAll="true" (change)="Changed" /></Field>
<Field Label="As a count"><MultiSelect Display="count" [options]="Options" [value]="Colors" (change)="Changed" /></Field>
<script>
({
	Colors: ['red', 'blue'],
	Options: [
		{Value: 'red', Label: 'Red', Group: 'Warm'},
		{Value: 'orange', Label: 'Orange', Group: 'Warm'},
		{Value: 'yellow', Label: 'Yellow', Group: 'Warm'},
		{Value: 'green', Label: 'Green', Group: 'Cold'},
		{Value: 'blue', Label: 'Blue', Group: 'Cold'},
		{Value: 'violet', Label: 'Violet', Group: 'Cold', Disabled: true}
	],

	Changed: function (value) {
		this.Colors = value;
	}
})
</script>
```
