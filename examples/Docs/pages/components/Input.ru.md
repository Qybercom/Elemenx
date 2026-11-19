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

- [bakes a body of noise by its graph: its Input blocks the uniforms of the bake, Formula and Ridge in it, a sea where the land is under 0](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneBlueprints/SceneBlueprints.test.js#L136) — `libraries/ElemenxGraphics/services/SceneBlueprints/SceneBlueprints.test.js`
- [maps a list and takes one result of each, the values of lists of numbers each by each](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L107) — `tests/regression/blueprints-ir.test.js`
- [takes vectors and choices, and says what of a graph is not of numbers](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L265) — `tests/regression/blueprints-ir.test.js`
- [computes what only the Value of When needs inside its if, a When in a When, the same everywhere](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L315) — `tests/regression/blueprints-ir.test.js`
- [takes the octaves of a noise as an input, the same as a noise of that many octaves, in js, wasm and its run](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L378) — `tests/regression/blueprints-ir.test.js`
- [runs a generator of numbers with the very noise of the shaders, its parameters and inputs given](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L438) — `tests/regression/blueprints.test.js`
- [reads a noise of the Noise Service by the spec of its block, in a generator and in a pass, the same numbers](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L665) — `tests/regression/blueprints.test.js`
- [makes a generator JavaScript that gives the very values of its Run, many times faster; a graph with a block of no code gives null](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L697) — `tests/regression/blueprints.test.js`
- [makes a generator of formulas JavaScript, the same values as its interpreter, lists part by part](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L831) — `tests/regression/blueprints.test.js`
- [has a Curve of keys over a number: straight, smooth through them or held between them, round a loop or held at its ends](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L1001) — `tests/regression/blueprints.test.js`
- [tree-shakes unused Library Components and keeps transitive Component dependencies](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/builder-multi-application.test.js#L226) — `tests/regression/builder-multi-application.test.js`
- [makes a graph of its blocks a function of numbers: the points a list given, the same run, js and wasm](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxCommon/services/Geometry/Geometry.test.js#L43) — `libraries/ElemenxCommon/services/Geometry/Geometry.test.js`

+10 ещё в тех же файлах
