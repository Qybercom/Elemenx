<!-- generated -->
# Pagination

Страницы списка из Count элементов по PageSize (10) на странице: показанный диапазон («11–20 из 57»), выбор PageSizes (нет, если пусто) и кнопки первой страницы, предыдущей, номеров (первый, последний и те, что вокруг Page, с разрывами между ними), следующей и последней. Page — с 1. Используется в Table; работает под любым списком. ShowRange, ShowPages, ShowFirstLast и ShowPrevNext включают диапазон, номера, кнопки первой и последней страницы и кнопки предыдущей и следующей. Siblings — сколько номеров видно с каждой стороны от Page (1), Boundaries — сколько на каждом конце (1); разрыв, который скрыл бы одну страницу, показывает её. События: page ({Page, PageSize}).

## Свойства

| Свойство | По умолчанию |
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

## События

`page`

## Пример

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
