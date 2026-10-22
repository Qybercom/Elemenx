<!-- generated -->
# Badges

The badges of *badge and of the Badge of a Button. Describe(value) reads a value: a number (a count: 0 shows none, more than Max (99) shows 99+), 'dot' (something new), 'busy' (a task that runs), another text, or {Value, Tone, Max, Label}. It returns {Shown, Kind (count, dot, busy, text), Tone (accent, info, success, warning, danger: danger for a count by default, accent otherwise), Text (what the badge shows), Label (what a screen reader says instead: Label, or the phrase of a dot or a ring)}. Classes(value) are the classes of the badge for it.

## Methods

- `Describe(value)`
- `Classes(value)`

## Example

```example
<table class="elemenx-table compact">
	<tr><th>Value</th><th>Kind</th><th>Text</th><th>Tone</th><th>Label</th></tr>
	<tr *for="row of Rows" *key="row.Value"><td><code class="elemenx-code">{{row.Value}}</code></td><td>{{row.Kind}}</td><td>{{row.Text}}</td><td>{{row.Tone}}</td><td>{{row.Label}}</td></tr>
</table>
<script>
({
	Rows: [],

	$OnCreate: function () {
		var badges = this.$Service('Badges');

		this.Rows = [3, 120, 'dot', 'busy', 'new', {Value: 7, Tone: 'success', Label: '7 builds'}].map(function (value) {
			var badge = badges.Describe(value);

			return {Value: JSON.stringify(value), Kind: badge.Kind, Text: badge.Text, Tone: badge.Tone, Label: badge.Label};
		});
	}
})
</script>
```
