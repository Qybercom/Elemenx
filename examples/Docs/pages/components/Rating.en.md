<!-- generated -->
# Rating

A rating of Max stars (5). Value: 0 to Max, in halves with Half. The pointer shows the rating it would give; a press gives it (a press on the given rating clears it, unless Clearable is false). Keys: arrows (a step: one star, or half with Half), Home (0), End (Max), digits. ReadOnly shows a rating that cannot change. Icon names another shape. Events: change (Value).

## Properties

| Property | Default |
| --- | --- |
| `Value` | `0` |
| `Max` | `5` |
| `Half` | `false` |
| `Clearable` | `true` |
| `ReadOnly` | `false` |
| `Disabled` | `false` |
| `Icon` | `'star'` |
| `Size` | `'medium'` |
| `Label` | `''` |

## Events

- `change`: A rating was given or cleared: Value.

## Example

```example
<Rating [value]="Stars" Half="true" (change)="Rated" />
<Rating Value="4" ReadOnly="true" />
<Rating Value="2" Max="3" Icon="heart" />
<p class="elemenx-text small muted">Rating: {{Stars}} · press the given rating to clear it.</p>
<script>
({
	Stars: 3.5,

	Rated: function (value) {
		this.Stars = value;
	}
})
</script>
```

## Tests

- [takes the base a Component names in $Extends and the Traits of the project into the bundle, the Traits as their own type](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/build-inheritance.test.js#L52) — `tests/regression/build-inheritance.test.js`
