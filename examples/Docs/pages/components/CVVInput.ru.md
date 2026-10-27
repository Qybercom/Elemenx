<!-- generated -->
# CVVInput

Value хранит 3 или 4 цифры кода безопасности (Length). Код скрыт, пока не задано Revealed; Guarded спрашивает подтверждение, прежде чем глаз его покажет, а HideAfter снова прячет его (см. сервис Reveal).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `''` |
| `Length` | `3` |
| `Placeholder` | `''` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |
| `Revealed` | `false` |
| `Guarded` | `false` |
| `HideAfter` | `0` |

## События

- `input`: Цифры изменились: Value.
- `validate`: Код проверен: {Value, Complete, Valid}.
- `change`: Код зафиксирован: Value.

## Пример

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<Field Label="CVV"><CVVInput (validate)="Validated" /></Field>
	<Field Label="CVV of Amex" Hint="Length 4"><CVVInput Length="4" Value="1234" /></Field>
</div>
<p class="elemenx-text small muted">{{State}}</p>
<script>
({
	State: '',

	Validated: function (result) {
		this.State = result.Complete ? 'Complete' : 'Type the code';
	}
})
</script>
```
