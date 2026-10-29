<!-- generated -->
# DiffView

The differences between two texts, to read (the Diff Service): Before and After, line by line, with the words that changed marked in a line changed. Mode: unified (the lines removed then the ones added, one column) or split (the text before on the left, the text after on the right). Context lines around each change (3); the unchanged runs between them fold, and a press on a fold shows it. The header counts the lines added and removed, with Title (a name of a file). LineNumbers shows the numbers of each side.

## Properties

| Property | Default |
| --- | --- |
| `Before` | `''` |
| `After` | `''` |
| `Mode` | `'unified'` |
| `Context` | `3` |
| `LineNumbers` | `true` |
| `Title` | `''` |

## Example

```example
<DiffView Title="sum.js" [before]="Before" [after]="After" [mode]="Mode" Context="1" />
<RadioGroup Variant="segmented" Label="Mode" [options]="[{Value: 'unified', Label: 'Unified'}, {Value: 'split', Label: 'Side by side'}]" [value]="Mode" (change)="Moded" />
<script>
({
	Mode: 'unified',
	Before: 'function sum (list) {\n\tvar total = 0;\n\n\tfor (var i = 0; i < list.length; i++)\n\t\ttotal += list[i];\n\n\treturn total;\n}\n\nmodule.exports = sum;',
	After: 'function sum (list) {\n\tvar total = 0;\n\n\tlist.forEach(function (value) {\n\t\ttotal += value;\n\t});\n\n\treturn total;\n}\n\nmodule.exports = sum;',

	Moded: function (value) {
		this.Mode = value;
	}
})
</script>
```

## Tests

- [CastList, DiffView, MediaHero, MediaShelf and VideoTimeline are as wide as a column of flex-start](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/inline-size-width.test.js#L39) — `tests/regression/inline-size-width.test.js`
- [DiffView shows the lines removed and added with the words that changed, folds the unchanged runs and opens them](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L208) — `tests/regression/library-new.test.js`
