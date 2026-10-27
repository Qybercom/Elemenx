<!-- generated -->
# CardExpiryInput

Срок действия платёжной карты: Value хранит цифры MMYY ('0927'), показанные как MM/YY. Принимаются только цифры; при вводе месяц держится в пределах 01–12, а прошедшая дата некорректна. Placeholder (MM/YY), Size, Shape, Name, Disabled и Invalid — как в Input. События: input (Value), validate ({Value, Complete, Valid}), change (Value, при подтверждении).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `''` |
| `Placeholder` | `'MM/YY'` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |

## События

- `input`: Цифры изменились: Value (MMYY).
- `validate`: Дата проверена: {Value, Complete, Valid}.
- `change`: Дата зафиксирована: Value.

## Пример

```example
<Field Label="Expires"><CardExpiryInput (change)="Changed" /></Field>
<p class="elemenx-text small muted">Value: {{Value || '—'}}</p>
<script>
({
	Value: '',

	Changed: function (value) {
		this.Value = value;
	}
})
</script>
```
