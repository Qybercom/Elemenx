<!-- generated -->
# Input

Текстовое поле. У поля пароля есть кнопка-глаз: Guarded спрашивает подтверждение, прежде чем показать пароль, HideAfter снова прячет его (см. сервис Reveal). Preset — формат сервиса Formats (email, url, semver, ipv4, ipv6, uuid, iban, postal-code, integer, decimal или зарегистрированный приложением): поле получает нужную клавиатуру и автозаполнение, пропускает только символы формата и проверяет значение при подтверждении — нормализует его, выглядит некорректным при ошибке и отправляет validate с {Valid, Value, Message} (Message можно положить в Error у Field); событие change несёт нормализованное значение. Country — страна для postal-code, Min и Max ограничивают integer или decimal. Label — имя поля для скринридера, когда его не называет Field.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Type` | `'text'` |
| `Value` | `''` |
| `Label` | `''` |
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

- `input`: Текст изменился при вводе: Value.
- `validate`: Preset проверил зафиксированное значение: {Valid, Value, Message}.
- `change`: Значение зафиксировано (Enter, уход фокуса): Value, нормализованное Preset.

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

## Тесты

- [tree-shakes unused Library Components and keeps transitive Component dependencies](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/builder-multi-application.test.js#L226) — `tests/regression/builder-multi-application.test.js`
- [Form nests the values of Fields named by parts (user\[name\], items\[ID\]\[title\], tags\[\]) and follows the rows of a *for that come and go](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-forms.test.js#L270) — `tests/regression/library-forms.test.js`
- [Field names the control inside by its Label, unless the control has a name of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-forms.test.js#L327) — `tests/regression/library-forms.test.js`
- [serves the pages with their templates as scripts, and as files when the option is off](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/server.test.js#L424) — `tests/regression/server.test.js`
