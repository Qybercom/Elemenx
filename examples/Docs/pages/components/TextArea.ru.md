<!-- generated -->
# TextArea

Поле из нескольких строк текста. Value, Placeholder, Rows (высота в строках), MaxLength. Resize: vertical (нижний край, по умолчанию), both (угол) или none; AutoSize вместо этого растит поле вместе с текстом. Shape, Name, Disabled, ReadOnly и Invalid — как в Input. События: input (Value, при вводе), change (Value, при подтверждении). Label — имя поля для скринридера, когда его не называет Field.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `''` |
| `Label` | `''` |
| `Placeholder` | `''` |
| `Rows` | `3` |
| `MaxLength` | `null` |
| `AutoSize` | `false` |
| `Resize` | `'vertical'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `ReadOnly` | `false` |
| `Invalid` | `false` |

## События

- `input`: Текст изменился при вводе: Value.
- `change`: Значение зафиксировано при уходе фокуса: Value.

## Пример

```example
<Field Label="A message" [hint]="Text.length + ' / 200'"><TextArea Placeholder="Write something" Rows="3" MaxLength="200" [value]="Text" (input)="Typed" /></Field>
<Field Label="Grows with its text"><TextArea AutoSize="true" Rows="1" Placeholder="Type several lines" /></Field>
<Field Label="Resizes by the corner"><TextArea Resize="both" Rows="2" /></Field>
<Field Label="Read only"><TextArea ReadOnly="true" Value="This text cannot change." Rows="1" /></Field>
<script>
({
	Text: '',

	Typed: function (value) {
		this.Text = value;
	}
})
</script>
```
