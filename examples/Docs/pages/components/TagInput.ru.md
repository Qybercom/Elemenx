<!-- generated -->
# TagInput

Поле меток. Value — метки (строки). Ввод и Enter (или Separator: по умолчанию ',' и ';') добавляют метку; вставленный список ('a, b; c' или по одной в строке) добавляет каждую; Backspace в пустом поле удаляет последнюю метку; крестик метки удаляет её. Suggestions (строки) открываются под полем при вводе (стрелки и Enter выбирают); AllowNew: false принимает только подсказки. Pattern (регулярное выражение, которому должна соответствовать метка, например '^[^@]+@[^@]+$'), Unique (true) и Max ограничивают принимаемое; отклонённый текст остаётся в поле, помеченный, и отправляет invalid с {Text, Reason: 'pattern', 'duplicate', 'max' или 'unknown'}. Case 'lower' или 'upper' меняет регистр меток. События: change (метки), add (метка), remove (метка), invalid.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `[]` |
| `Suggestions` | `[]` |
| `Placeholder` | `''` |
| `Separators` | `[',', ';']` |
| `AllowNew` | `true` |
| `Unique` | `true` |
| `Max` | `0` |
| `Pattern` | `''` |
| `Case` | `''` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |
| `Text` | `''` |

## События

- `invalid`: Текст отклонён: {Text, Reason (pattern, duplicate, max или unknown)}.
- `add`: Добавлен тег: сам тег.
- `change`: Теги изменились: список тегов.
- `remove`: Удалён тег: сам тег.

## Пример

```example
<Field Label="Topics" Hint="Enter or a comma adds a tag; Backspace removes the last one"><TagInput [value]="Tags" [suggestions]="['elemenx', 'es5', 'ui', 'components', 'reactivity', 'router']" Case="lower" (change)="Changed" (invalid)="Refused" /></Field>
<Field Label="Emails" Hint="Only addresses, at most 3"><TagInput Pattern="^[^@]+@[^@]+$" Max="3" (invalid)="Refused" /></Field>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Tags: ['elemenx', 'ui'],
	Note: '',

	Changed: function (value) {
		this.Tags = value;
		this.Note = 'Tags: ' + value.join(', ');
	},

	Refused: function (event) {
		this.Note = 'Refused "' + event.Text + '": ' + event.Reason;
	}
})
</script>
```
