<!-- generated -->
# Pagination

Pages of a list of Count items, PageSize (10) on each: the range shown ('11–20 of 57'), a choice of PageSizes (none when empty), and the buttons of the first page, the previous one, the numbers (the first, the last and the ones around Page, with gaps between), the next one and the last. Page is from 1. Used by Table; works under any list. ShowRange, ShowPages, ShowFirstLast and ShowPrevNext switch the range, the numbers, the buttons of the first and the last page and those of the previous and the next one. Siblings is how many numbers show on each side of Page (1), Boundaries how many at each end (1); a gap that would hide a single page shows that page. Events: page ({Page, PageSize}).

## Properties

| Property | Default |
| --- | --- |
| `Page` | `1` |
| `Count` | `0` |
| `PageSize` | `10` |
| `PageSizes` | `[10, 25, 50, 100]` |
| `OfLabel` | `''` |
| `SizeLabel` | `''` |
| `Label` | `''` |
| `ShowRange` | `true` |
| `ShowPages` | `true` |
| `ShowFirstLast` | `true` |
| `ShowPrevNext` | `true` |
| `Siblings` | `1` |
| `Boundaries` | `1` |

## Events

- `page`: Another page or page size was chosen: {Page, PageSize}.

## Example

```example
<Pagination Count="240" [pagesize]="Size" [page]="Page" [pagesizes]="[10, 20, 50]" (page)="Paged" />
<ul class="elemenx-ul"><li *for="item of Items" *key="item">Item {{item}}</li></ul>
<Pagination Count="240" Page="7" PageSize="10" Siblings="2" ShowRange="false" ShowFirstLast="false" />
<script>
({
	Page: 3,
	Size: 10,
	Items: [],

	$OnCreate: function () {
		this.Fill();
	},

	Fill: function () {
		var first = (this.Page - 1) * this.Size + 1;
		var result = [];
		var i = 0;

		while (i < 3) {
			result.push(first + i);
			i++;
		}

		this.Items = result;
	},

	Paged: function (event) {
		this.Page = event.Page;
		this.Size = event.PageSize;
		this.Fill();
	}
})
</script>
```
