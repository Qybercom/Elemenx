<!-- generated -->
# Select

A select: a button that opens a list of Options and shows the chosen one. Options: [{Value, Label, Hint, Icon, Group, Disabled}]; options of one Group are listed under its title. Value is the Value of the selected option, with its type, or null. Placeholder shows while nothing is chosen, Empty when a filter finds nothing. Searchable adds a filter field at the top of the list; Clearable adds a button that resets the value. Keys: the arrows move, Enter (Space without a filter) picks, Escape closes, a letter goes to the next option that starts with it. Icon, Size, Shape, Name, Disabled and Invalid as in Input. Events: change (Value; null when it is cleared).

## Properties

| Property | Default |
| --- | --- |
| `Options` | `[]` |
| `Value` | `null` |
| `Label` | `''` |
| `Placeholder` | `''` |
| `Empty` | `''` |
| `Icon` | `''` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Searchable` | `false` |
| `Clearable` | `false` |
| `Disabled` | `false` |
| `Invalid` | `false` |

## Events

- `change`: Another option was chosen: Value, with its type; null when it was cleared.

## Example

```example
<Field Label="Language"><Select [options]="Languages" [value]="Language" (change)="Changed" /></Field>
<Field Label="Time zone" Hint="Searchable, with groups; Clearable"><Select Placeholder="Pick a zone" [options]="Zones" Searchable="true" Clearable="true" (change)="Zoned" /></Field>
<p class="elemenx-text small muted">Language: {{Language}} · zone: {{Zone === null ? 'none' : Zone}}</p>
<script>
({
	Language: 'en',
	Zone: null,
	Languages: [{Value: 'en', Label: 'English', Icon: 'globe'}, {Value: 'ru', Label: 'Русский'}, {Value: 'de', Label: 'Deutsch', Disabled: true}],
	Zones: [
		{Value: 'Europe/London', Label: 'London', Group: 'Europe', Hint: 'UTC+0'},
		{Value: 'Europe/Berlin', Label: 'Berlin', Group: 'Europe', Hint: 'UTC+1'},
		{Value: 'Europe/Moscow', Label: 'Moscow', Group: 'Europe', Hint: 'UTC+3'},
		{Value: 'America/New_York', Label: 'New York', Group: 'America', Hint: 'UTC-5'},
		{Value: 'Asia/Tokyo', Label: 'Tokyo', Group: 'Asia', Hint: 'UTC+9'}
	],

	Changed: function (value) {
		this.Language = value;
	},

	Zoned: function (value) {
		this.Zone = value;
	}
})
</script>
```

## Tests

- [Select with Searchable: its search field](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/focus-on-open.test.js#L64) — `tests/regression/focus-on-open.test.js`
- [nested structural recreation keeps keyed Components and behavioral directives lifecycle-safe](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/component-directive-integration.test.js#L119) — `tests/regression/component-directive-integration.test.js`
- [a component named like a native element receives \[prop\] inputs that the element would refuse](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/directive-syntax.test.js#L244) — `tests/regression/directive-syntax.test.js`
- [chat messages: a tap opens the menu, a long press starts a choice of several, the bar counts and deletes them](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L1549) — `tests/examples/ui-kit.spec.js`
- [chat messages show their state, open their menu by a right click or the dots, and sum up reactions and views](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5611) — `tests/examples/ui-kit.spec.js`
- [drawing: a rectangle drawn with its tool, selected, layers chosen and hidden](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L10039) — `tests/examples/ui-kit.spec.js`
- [Field names the control inside by its Label, unless the control has a name of its own](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-forms.test.js#L327) — `tests/regression/library-forms.test.js`
