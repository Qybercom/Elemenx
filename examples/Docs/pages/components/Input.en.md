<!-- generated -->
# Input

A text field. A password field has an eye button: Guarded asks before it shows the password, HideAfter hides it again (see the Reveal Service). Preset: a format of the FieldFormats Service (email, url, semver, ipv4, ipv6, uuid, iban, postal-code, integer, decimal, or one the Application registers): the field gets its keyboard and autofill, keeps only the characters the format holds, and checks the value when it is committed: it normalizes it, looks invalid when it is wrong and emits validate with {Valid, Value, Message} (put Message in the Error of a Field); the change event carries the normalized value. Country is the country of a postal-code, Min and Max bound an integer or a decimal.

## Properties

| Property | Default |
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

## Events

- `input`: The text changed while typing: Value.
- `validate`: A Preset checked the committed value: {Valid, Value, Message}.
- `change`: The value was committed (Enter, the focus left): Value, normalized by its Preset.

## Slots

default

## Example

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

## Tests

- [tree-shakes unused Library Components and keeps transitive Component dependencies](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/builder-multi-application.test.js#L226) — `tests/regression/builder-multi-application.test.js`
- [Form nests the values of Fields named by parts (user\[name\], items\[ID\]\[title\], tags\[\]) and follows the rows of a *for that come and go](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-forms.test.js#L270) — `tests/regression/library-forms.test.js`
- [Field names the control inside by its Label, unless the control has a name of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-forms.test.js#L327) — `tests/regression/library-forms.test.js`
- [serves the pages with their templates as scripts, and as files when the option is off](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/server.test.js#L424) — `tests/regression/server.test.js`
