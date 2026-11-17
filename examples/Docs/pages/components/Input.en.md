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

- [maps a list and takes one result of each, the values of lists of numbers each by each](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L107) — `tests/regression/blueprints-ir.test.js`
- [runs a generator of numbers with the very noise of the shaders, its parameters and inputs given](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L438) — `tests/regression/blueprints.test.js`
- [reads a noise of the Noise Service by the spec of its block, in a generator and in a pass, the same numbers](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L665) — `tests/regression/blueprints.test.js`
- [makes a generator JavaScript that gives the very values of its Run, many times faster; a graph with a block of no code gives null](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L697) — `tests/regression/blueprints.test.js`
- [makes a generator of formulas JavaScript, the same values as its interpreter, lists part by part](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L831) — `tests/regression/blueprints.test.js`
- [has a Curve of keys over a number: straight, smooth through them or held between them, round a loop or held at its ends](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L1001) — `tests/regression/blueprints.test.js`
- [tree-shakes unused Library Components and keeps transitive Component dependencies](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/builder-multi-application.test.js#L226) — `tests/regression/builder-multi-application.test.js`
- [makes what is finer than the scale of its rules by the rule of the place: of its land, a painted region over it](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js#L1435) — `libraries/ElemenxGraphics/services/ScenePlanet/ScenePlanet.test.js`
- [sows a rule of a graph: its library graph the very same things as the rule, a graph of its own its sizes, turns and shapes, in a worker too](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js#L244) — `libraries/ElemenxGraphics/services/SceneSower/SceneSower.test.js`
- [gives a prop its value and takes back what the Component tells at the event its $Model names](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/component-two-way.test.js#L41) — `tests/regression/component-two-way.test.js`
- [tells a prop the Component has not and an expression nothing can be given to](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/component-two-way.test.js#L89) — `tests/regression/component-two-way.test.js`
- [Form nests the values of Fields named by parts (user\[name\], items\[ID\]\[title\], tags\[\]) and follows the rows of a *for that come and go](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-forms.test.js#L270) — `tests/regression/library-forms.test.js`

+3 more in the same files
