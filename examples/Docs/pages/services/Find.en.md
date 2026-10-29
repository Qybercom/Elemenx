<!-- generated -->
# Find

Finds text in the DOM: what the find bar of a RichEditor or a Terminal looks through. Ranges(root, query, options) returns the matches of the query in the text of root as DOM Ranges (a match may cross elements), options {Case, Word, RegExp}; an expression that does not compile finds nothing. Show(owner, ranges, index) marks them with the highlights of the browser (::highlight(elemenx-find), and ::highlight(elemenx-find-current) for the one at index), so nothing is added to the text, and brings that one into view; Clear(owner) takes the marks of owner away. A browser without highlights selects the current match instead.

## Methods

- `Ranges(root, query, options)`
- `Show(owner, ranges, index)`
- `Clear(owner)`

## Example

```example
<span class="elemenx-input"><input class="elemenx-input-control" [(value)]="Query" placeholder="Find" /></span>
<Button Label="Find" Variant="primary" (click)="Search" />
<Button Label="Next" (click)="Next" />
<Button Label="Clear" Variant="ghost" (click)="Clear" />
<p class="docs-find-text">The quick brown fox jumps over the lazy dog. The dog sleeps; the fox runs into the woods, and the woods are quiet.</p>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Query: 'the',
	Note: '',
	Index: 0,

	Search: function () {
		var find = this.$Service('Find');

		this.Ranges = find.Ranges(this.$Element().querySelector('.docs-find-text'), this.Query, {Case: false});
		this.Index = 0;

		find.Show(this, this.Ranges, 0);

		this.Note = this.Ranges.length + ' found';
	},

	Next: function () {
		if (!this.Ranges || !this.Ranges.length) return;

		this.Index = (this.Index + 1) % this.Ranges.length;

		this.$Service('Find').Show(this, this.Ranges, this.Index);
		this.Note = (this.Index + 1) + ' of ' + this.Ranges.length;
	},

	Clear: function () {
		this.$Service('Find').Clear(this);
		this.Note = '';
	},

	$OnDestroy: function () {
		this.$Service('Find').Clear(this);
	}
})
</script>
```

## Tests

- [finds the text of another document and paints its highlights in that window](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/other-document.test.js#L121) — `tests/regression/other-document.test.js`
- [code editor finds and replaces, switches languages, wraps and prints through its methods](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L5978) — `tests/examples/ui-kit.spec.js`
