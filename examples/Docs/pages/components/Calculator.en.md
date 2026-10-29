<!-- generated -->
# Calculator

A calculator: the keys of a basic one, or of a scientific one (Mode scientific: sin, cos, tan, their inverses with Shift, ln, log, roots and powers, factorial, pi and e, brackets, degrees or radians), read by the Calculations Service (no eval). The line above shows what is typed, the one below its value as it is typed; = keeps it, and the history (History, the last ten) brings one back by a press. The keyboard types too: digits, + - * / ^ % ( ), Enter or =, Backspace, Escape (clears), Delete. A number ends with % to be a hundredth of itself (50% is 0.5, and 200 + 10% is 220, as a calculator of a shop counts). Precision is the significant digits shown (12). Value is what is typed. Events: result ({Expression, Value}) at each =, change (Value) as it is typed.

## Properties

| Property | Default |
| --- | --- |
| `Mode` | `'basic'` |
| `Value` | `''` |
| `History` | `true` |
| `Precision` | `12` |
| `Label` | `''` |
| `Shift` | `false` |

## Events

- `change`: What is typed changed: Value.
- `result`: The value was kept by =: {Expression, Value}.

## Example

```example
<Calculator Mode="scientific" (result)="Counted" />
<p class="elemenx-text small muted">{{Text}}</p>
<script>
({
	Text: 'Type on the keys or the keyboard, then =.',

	Counted: function (result) {
		this.Text = result.Expression + ' = ' + result.Value;
	}
})
</script>
```

## Tests

- [reads formulas without eval: precedence, powers, conditions, functions, names, and tells a mistake by its place](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L41) — `tests/regression/library-calculators.test.js`
- [counts on its keys and on the keyboard, a percent as a shop does, and keeps its history](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L71) — `tests/regression/library-calculators.test.js`
- [computes its results from its fields, given and declared, each after the results it reads, and tells a cycle](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-calculators.test.js#L122) — `tests/regression/library-calculators.test.js`
