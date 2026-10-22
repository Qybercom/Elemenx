<!-- generated -->
# Input

Текстовое поле. У поля пароля есть кнопка-глаз: Guarded спрашивает подтверждение, прежде чем показать пароль, HideAfter снова прячет его (см. сервис Reveal). Preset — формат сервиса Formats (email, url, semver, ipv4, ipv6, uuid, iban, postal-code, integer, decimal или зарегистрированный приложением): поле получает нужную клавиатуру и автозаполнение, пропускает только символы формата и проверяет значение при подтверждении — нормализует его, выглядит некорректным при ошибке и отправляет validate с {Valid, Value, Message} (Message можно положить в Error у Field); событие change несёт нормализованное значение. Country — страна для postal-code, Min и Max ограничивают integer или decimal.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Type` | `'text'` |
| `Value` | `''` |
| `Placeholder` | `''` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Icon` | `''` |
| `IconRight` | `''` |
| `Prefix` | `''` |
| `Suffix` | `''` |
| `Mask` | `''` |
| `Preset` | `''` |
| `Country` | `''` |
| `Name` | `null` |
| `Autocomplete` | `null` |
| `InputMode` | `null` |
| `MaxLength` | `null` |
| `Min` | `null` |
| `Max` | `null` |
| `Step` | `null` |
| `Disabled` | `false` |
| `ReadOnly` | `false` |
| `Invalid` | `false` |
| `Clearable` | `false` |
| `Revealed` | `false` |
| `Guarded` | `false` |
| `HideAfter` | `0` |

## События

`input`, `validate`, `change`

## Слоты

по умолчанию

## Пример

```example
<Field Label="Search"><Input Placeholder="Search" Icon="search" Clearable="true" [value]="Query" (input)="Typed" /></Field>
<Field Label="Password"><Input Type="password" Value="correct horse" /></Field>
<Field Label="Price"><Input Prefix="$" Suffix="USD" Value="42" /></Field>
<Field Label="A code" Hint="Mask ###-###"><Input Mask="###-###" Placeholder="123-456" /></Field>
<Field Label="Email" Hint="Preset email: the keyboard, the check and the format"><Input Preset="email" /></Field>
<div class="elemenx-container wrappable" style="gap: 8px;"><Input Size="small" Placeholder="Small" /><Input Placeholder="Medium" /><Input Size="large" Placeholder="Large" /><Input Shape="round" Placeholder="Round" /></div>
<p class="elemenx-text small muted">Typed: {{Query || '—'}}</p>
<script>
({
	Query: '',

	Typed: function (value) {
		this.Query = value;
	}
})
</script>
```
