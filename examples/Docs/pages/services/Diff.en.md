<!-- generated -->
# Diff

The differences between two texts (the algorithm of Myers: the shortest list of changes). CodeEditor shows them in its diff view; any component may use them.

- Lines(before, after) returns the lines of both texts in order: [{Type: 'same', 'remove' or 'add', Text, Old, New}] (Old and New: the numbers of the line in each text, from 1, or null where it has none).
- Words(before, after) returns where two versions of a line differ: {Before: [{Start, End}], After: [{Start, End}]} (offsets in each text; words, spaces and signs are the units).
- Hunks(lines, context) groups the lines into the changes with context lines around them (3 by default) and the unchanged runs between them: [{Type: 'change', Lines}] and [{Type: 'fold', Lines}].
- Stats(lines): {Added, Removed}.

## Methods

- `Lines(before, after)`
- `Words(before, after)`
- `Hunks(lines, context)`
- `Stats(lines)`

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px;">
	<TextArea Rows="5" [value]="Before" (input)="TypedBefore" />
	<TextArea Rows="5" [value]="After" (input)="TypedAfter" />
</div>
<p class="elemenx-text small muted">+{{Stats(Before, After).Added}} −{{Stats(Before, After).Removed}}</p>
<pre class="elemenx-code"><span *for="line of Lines(Before, After)" *key="$index" [style.color]="line.Type === 'add' ? 'var(--elemenx-success)' : line.Type === 'remove' ? 'var(--elemenx-danger)' : ''">{{line.Type === 'add' ? '+ ' : line.Type === 'remove' ? '- ' : '  '}}{{line.Text}}
</span></pre>
<script>
({
	Before: 'one\ntwo\nthree\nfour',
	After: 'one\n2\nthree\nfour\nfive',

	$OnCreate: function () {
		var diff = this.$Service('Diff');

		this.Lines = function (before, after) {
			return diff.Lines(before, after);
		};

		this.Stats = function (before, after) {
			return diff.Stats(diff.Lines(before, after));
		};
	},

	TypedBefore: function (value) {
		this.Before = value;
	},

	TypedAfter: function (value) {
		this.After = value;
	}
})
</script>
```

## Tests

- [lists the lines of two texts as kept, removed and added, with their numbers in each text](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/diff.test.js#L24) — `tests/regression/diff.test.js`
- [finds the shortest list of changes in long texts quickly](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/diff.test.js#L39) — `tests/regression/diff.test.js`
- [marks the words that differ in two versions of a line](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/diff.test.js#L60) — `tests/regression/diff.test.js`
- [groups the lines into changes with their context and the folds between them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/diff.test.js#L67) — `tests/regression/diff.test.js`
- [code editor shows a diff with the original text, in one column or side by side, with the words changed and folds that open](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5853) — `tests/examples/ui-kit.spec.js`
