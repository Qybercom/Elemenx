<!-- generated -->
# Find

Поиск текста в DOM: то, по чему ищет панель поиска RichEditor или Terminal. Ranges(root, query, options) возвращает совпадения запроса в тексте root в виде Range DOM (совпадение может пересекать элементы), options {Case, Word, RegExp}; некомпилируемое выражение ничего не находит. Show(owner, ranges, index) помечает их выделениями браузера (::highlight(elemenx-find) и ::highlight(elemenx-find-current) для совпадения с номером index), так что в текст ничего не добавляется, и прокручивает к текущему; Clear(owner) снимает пометки owner. Браузер без выделений вместо этого выделяет текущее совпадение.

## Методы

- `Ranges(root, query, options)`
- `Show(owner, ranges, index)`
- `Clear(owner)`

## Пример

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
