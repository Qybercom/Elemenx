<!-- generated -->
# VirtualList

Длинный список, рисующий только видимые строки (и по Overscan с каждой стороны): сто тысяч элементов прокручиваются так же легко, как десять. Items: объекты (или строки); каждая строка высотой ItemHeight пикселей; Height — высота списка. Строка показывает Icon, Label (LabelKey) и Hint своего элемента или содержимое Render(container, item, index). Value — ключ (ItemKey) выбранного элемента. Клавиши: стрелки, Page Up и Down, Home, End; Enter выбирает. ScrollTo(index) прокручивает к элементу. События: select (элемент), range ({Start, End}: нарисованные строки).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `ItemHeight` | `32` |
| `Height` | `'320px'` |
| `Overscan` | `6` |
| `ItemKey` | `'ID'` |
| `LabelKey` | `'Label'` |
| `Render` | `null` |
| `Value` | `null` |
| `Label` | `''` |
| `Empty` | `''` |
| `Start` | `0` |

## События

- `range`: Изменились отрисованные строки: {Start, End}.
- `more`
- `select`: Выбран элемент: сам элемент.

## Методы

- `ScrollTo(index)`

## Пример

```example
<VirtualList [items]="Items" Height="300px" ItemHeight="36" Label="A hundred thousand rows" (select)="Picked" (range)="Ranged" />
<p class="elemenx-text small muted">{{Note}} · drawn rows {{Range}}</p>
<script>
({
	Note: 'Pick a row',
	Range: '',
	Items: [],

	$OnCreate: function () {
		var items = [];
		var i = 0;

		while (i < 100000) {
			items.push({ID: i, Label: 'Row ' + (i + 1), Hint: '#' + (i * 7919 % 100000), Icon: i % 3 ? 'file' : 'folder'});

			i++;
		}

		this.Items = items;
	},

	Picked: function (item) {
		this.Note = 'Picked: ' + item.Label;
	},

	Ranged: function (range) {
		this.Range = range.Start + '–' + range.End;
	}
})
</script>
```

## Тесты

- [*infinite asks once near the end, again when the list grew, never while Busy or Done, and at once when too short](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L297) — `tests/regression/library-directives.test.js`
- [*infinite up asks at the start, and keeps what the reader sees when rows come above](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L405) — `tests/regression/library-directives.test.js`
- [InfiniteList shows a spinner while busy and a word at its end, and tells more; up its spinner takes no room](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L446) — `tests/regression/library-directives.test.js`
- [VirtualList asks for more when its last rows are drawn, once for each length; Chat asks for its history at its start](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L490) — `tests/regression/library-directives.test.js`
- [VirtualList draws only the rows in view of a long list, tells their range, and selects one with the keys](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-pickers.test.js#L243) — `tests/regression/library-pickers.test.js`
