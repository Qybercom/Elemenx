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
