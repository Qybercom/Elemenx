<!-- generated -->
# FindBar

The bar of find and replace of an editor (CodeEditor, RichEditor) or a terminal: a field for the text, the options Case, Word and RegExp, the place of the match ('3 of 12', from Index and Count) with the previous and the next one, and with Replacing a field for the replacement with Replace and Replace all (CanReplace: false leaves them out). It finds nothing itself: it emits find ({Query, Case, Word, RegExp}) as the text or an option changes, next and previous (Enter and Shift+Enter in the field), replace and replaceall ({Text}; Enter and Ctrl+Enter in its field), and close (Escape, or its button). Focus() puts the focus in its field and selects the text; Autofocus does it once the bar is ready.

## Properties

| Property | Default |
| --- | --- |
| `Query` | `''` |
| `Case` | `false` |
| `Word` | `false` |
| `RegExp` | `false` |
| `Replacing` | `false` |
| `CanReplace` | `true` |
| `Count` | `0` |
| `Index` | `-1` |
| `Label` | `''` |
| `Autofocus` | `false` |

## Events

- `find`: The text or an option changed: {Query, Case, Word, RegExp}, what to look for.
- `close`: Closed by Escape or its button.
- `next`: Go to the next match (Enter, or its button).
- `previous`: Go to the previous match (Shift+Enter, or its button).
- `replace`: Replace the current match: {Text}, the replacement.
- `replaceall`: Replace every match: {Text}, the replacement.

## Methods

- `Focus()`

## Example

```example
<FindBar [query]="Query" [count]="Count" [index]="Index" Replacing="true" (find)="Found" (next)="Next" (previous)="Previous" (replace)="Replaced" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Query: 'elemenx',
	Count: 12,
	Index: 2,
	Note: 'The bar of an editor: it only reports; the editor finds.',

	Found: function (event) {
		this.Note = 'Find: ' + JSON.stringify(event);
	},

	Next: function () {
		this.Index = (this.Index + 1) % this.Count;
	},

	Previous: function () {
		this.Index = (this.Index + this.Count - 1) % this.Count;
	},

	Replaced: function (event) {
		this.Note = 'Replace with ' + JSON.stringify(event);
	}
})
</script>
```

## Tests

- [FindBar tells what to find as the text and the options change, the next and previous match by Enter, and its close by Escape](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-pickers.test.js#L196) — `tests/regression/library-pickers.test.js`
