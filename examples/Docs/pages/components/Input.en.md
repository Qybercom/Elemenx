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

- [bakes a body of noise by its graph: its Input blocks the uniforms of the bake, Formula and Ridge in it, a sea where the land is under 0](https://github.com/Qybercom/Elemenx/blob/main/libraries/ElemenxGraphics/services/SceneBlueprints/SceneBlueprints.test.js#L137) — `libraries/ElemenxGraphics/services/SceneBlueprints/SceneBlueprints.test.js`
- [smooths a number between two in a formula of its run, its Code and its numbers; jitters cells as Noise does](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/bark-graphs.test.js#L79) — `tests/regression/bark-graphs.test.js`
- [maps a list and takes one result of each, the values of lists of numbers each by each](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L107) — `tests/regression/blueprints-ir.test.js`
- [takes vectors and choices, and says what of a graph is not of numbers](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L265) — `tests/regression/blueprints-ir.test.js`
- [computes what only the Value of When needs inside its if, a When in a When, the same everywhere](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L315) — `tests/regression/blueprints-ir.test.js`
- [takes the octaves of a noise as an input, the same as a noise of that many octaves, in js, wasm and its run](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L378) — `tests/regression/blueprints-ir.test.js`
- [runs a Reduce over a list of its parameters once for each item, the same of its Code, its js and its wasm](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L415) — `tests/regression/blueprints-ir.test.js`
- [finds the nearest of points and the next one, and its index (Other)](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints-ir.test.js#L452) — `tests/regression/blueprints-ir.test.js`
- [runs a generator of numbers with the very noise of the shaders, its parameters and inputs given](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L438) — `tests/regression/blueprints.test.js`
- [reads a noise of the Noise Service by the spec of its block, in a generator and in a pass, the same numbers](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L665) — `tests/regression/blueprints.test.js`
- [makes a generator JavaScript that gives the very values of its Run, many times faster; a graph with a block of no code gives null](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L697) — `tests/regression/blueprints.test.js`
- [makes a generator of formulas JavaScript, the same values as its interpreter, lists part by part](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/blueprints.test.js#L831) — `tests/regression/blueprints.test.js`

+24 more in the same files
