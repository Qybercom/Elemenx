<!-- generated -->
# DrawingLayers

Слои рисунка Drawing, верхний первым: каждый показан или скрыт, заблокирован или нет, назван (двойное нажатие или F2 переименовывает) и с числом своих элементов. Value — модель рисунка (в том виде, в каком её принимает и отдаёт Drawing), Layer — ID текущего слоя (куда идут новые элементы). Кнопки добавляют слой над текущим, удаляют его (у рисунка остаётся хотя бы один) и двигают его вверх или вниз. change отдаёт модель, select — ID выбранного слоя; свяжите оба с Drawing.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `null` |
| `Layer` | `''` |
| `ReadOnly` | `false` |

## События

- `change`: Слои изменились: модель рисунка.
- `select`: Выбран слой: его ID.

## Пример

```example
<div class="docs-row">
	<DrawingLayers [value]="Model" [layer]="Layer" (change)="Changed" (select)="Picked" />
	<p class="elemenx-text small muted">Current: {{Layer}}. A double press renames a layer.</p>
</div>
<script>
({
	Layer: 'sketch',
	Model: {Width: 320, Height: 200, Layers: [
		{ID: 'paper', Name: 'Paper', Visible: true, Locked: true, Items: [{ID: 'a', Type: 'rect', X: 0, Y: 0, W: 320, H: 200}]},
		{ID: 'sketch', Name: 'Sketch', Visible: true, Locked: false, Items: []},
		{ID: 'notes', Name: 'Notes', Visible: false, Locked: false, Items: []}
	]},

	Changed: function (model) {
		this.Model = model;
	},

	Picked: function (id) {
		this.Layer = id;
	}
})
</script>
```

## Тесты

- [draws a rectangle, an ellipse, a line, an arrow and a freehand stroke with the tools, each an item of the model it emits](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-drawing.test.js#L61) — `tests/regression/library-drawing.test.js`
- [selects by a press, by Shift and by a frame, moves and resizes the selection, and undoes and redoes it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-drawing.test.js#L148) — `tests/regression/library-drawing.test.js`
- [groups and ungroups, moves the selection up and down its layer, erases, and writes a text](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-drawing.test.js#L232) — `tests/regression/library-drawing.test.js`
- [DrawingLayers shows the layers, the top one first, hides, locks, adds, orders, renames and removes them, and the Drawing follows](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-drawing.test.js#L321) — `tests/regression/library-drawing.test.js`
