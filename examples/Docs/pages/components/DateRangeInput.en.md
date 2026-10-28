<!-- generated -->
# DateRangeInput

A range of dates. Value: [start, end] as 'YYYY-MM-DD' (or [] for none). The field shows the range in Locale; its button opens two months side by side: the first press picks the start, the second the end (the range shows while the pointer moves), in either order. Presets on the left pick a whole range at once: [{Label, Value: [start, end]} or {Label, Last: days (today included)} or {Label, Period: 'week', 'month', 'previous-month', 'year'}]. Min and Max bound the days; FirstDay is the first day of the week (0 Sunday, 1 Monday, the default; 'locale' for the one of Locale). Keys in the months: arrows move a day or a week, Page Up and Down a month, Enter or Space pick, Escape closes. Events: change ([start, end]).

## Properties

| Property | Default |
| --- | --- |
| `Value` | `[]` |
| `Min` | `''` |
| `Max` | `''` |
| `Locale` | `''` |
| `FirstDay` | `null` |
| `Placeholder` | `''` |
| `Presets` | `[…]` |
| `ClearLabel` | `''` |
| `Size` | `'medium'` |
| `Shape` | `'default'` |
| `Name` | `null` |
| `Disabled` | `false` |
| `Invalid` | `false` |

## Events

- `change`: A range was picked: [start, end]; [] when it was cleared.

## Example

```example
<Field Label="A stay" [hint]="Note"><DateRangeInput (change)="Changed" /></Field>
<script>
({
	Note: 'Pick the first day, then the last.',

	Changed: function (value) {
		this.Note = value.length ? value.join(' → ') : 'Cleared';
	}
})
</script>
```

## Tests

- [DateRangeInput: the day of the cursor](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/focus-on-open.test.js#L43) — `tests/regression/focus-on-open.test.js`
- [DateRangeInput picks a range by two presses in either order, and a preset picks a whole one](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-misc.test.js#L41) — `tests/regression/library-misc.test.js`
