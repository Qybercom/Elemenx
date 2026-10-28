<!-- generated -->
# Combobox

Поле с подсказками: ввод фильтрует Options ([{Value, Label, Hint, Icon, Group, Disabled}]) в списке под ним, сначала — подписи, начинающиеся с текста; стрелки и Enter выбирают, Escape закрывает, затем возвращает текст. Value — Value выбранного варианта. AllowCustom принимает и текст, которого нет среди вариантов: строка «Создать» предлагает его, и Value становится текстом (create отправляет его). Событие search несёт каждый введённый текст, так что владелец может подгружать Options с сервера (Loading показывает индикатор; Filter: false оставляет Options как есть). Clearable добавляет крестик. Текст, оставленный без выбора, возвращается к подписи Value (или принимается с AllowCustom). События: change (Value), search (текст), create (текст).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Options` | `[]` |
| `Value` | `null` |
| `Placeholder` | `''` |
| `Empty` | `''` |
| `CreateLabel` | `''` |
| `AllowCustom` | `false` |
| `Filter` | `true` |
| `Loading` | `false` |
| `Clearable` | `false` |
| `Icon` | `''` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |

## События

- `search`: Текст изменился: текст, чтобы загрузить Options с сервера.
- `create`: Принят текст, которого нет среди вариантов (AllowCustom): текст.
- `change`: Выбран вариант: Value.

## Пример

```example
<Field Label="A fruit" [hint]="Note"><Combobox Placeholder="Type to search" [options]="Fruits" [value]="Fruit" AllowCustom="true" (change)="Changed" (create)="Created" /></Field>
<script>
({
	Fruit: 'pear',
	Note: 'Type a name that is not in the list to add it.',
	Fruits: [{Value: 'apple', Label: 'Apple'}, {Value: 'pear', Label: 'Pear'}, {Value: 'plum', Label: 'Plum'}, {Value: 'peach', Label: 'Peach'}],

	Changed: function (value) {
		this.Fruit = value;
		this.Note = 'Chosen: ' + value;
	},

	Created: function (text) {
		this.Fruits = this.Fruits.concat([{Value: text.toLowerCase(), Label: text}]);
		this.Fruit = text.toLowerCase();
		this.Note = 'Added: ' + text;
	}
})
</script>
```

## Тесты

- [Combobox filters its options as the text is typed, tells every text, picks with the keys, and creates a text of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-pickers.test.js#L98) — `tests/regression/library-pickers.test.js`
