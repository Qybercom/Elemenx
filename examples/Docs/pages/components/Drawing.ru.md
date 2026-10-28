<!-- generated -->
# Drawing

Векторный рисунок (SVG): фигуры, линии, стрелки, штрихи кистей от руки и тексты на слоях, сгруппированные или нет. Value — его модель в том виде, в каком её хранит JSON: {Width, Height, Background, Layers: [{ID, Name, Visible, Locked, Items}]}; элемент — {ID, Type, Stroke, Fill, Width, Opacity}, а по Type: rect и ellipse {X, Y, W, H}, line и arrow {Points: [{X, Y}, {X, Y}]}, path {Points: [{X, Y}], Brush}, text {X, Y, Text, Size} и group {Items}. Точки даны в единицах рисунка (Width на Height), каким бы ни был его размер на экране. change отдаёт модель после каждого действия, select — ID выделенных элементов.

Tool — инструмент в руке: select (нажатие выделяет элемент, Shift добавляет ещё один, протяжка по пустому месту выделяет то, что накрыла, протяжка двигает выделенное, ручки меняют размер выделенного элемента), rect, ellipse, line, arrow, path (от руки, кистью Brush: pen, marker, highlighter или calligraphy), text (нажатие пишет там текст; двойное нажатие правит текст) и eraser (убирает элементы, по которым прошёл). Stroke, Fill (none — без заливки) и StrokeWidth красят новые элементы и выделенные. Layer — ID слоя для новых элементов (без него — первый; слои показывает и упорядочивает DrawingLayers). Toolbar показывает над рисунком инструменты, цвета и действия. ReadOnly показывает только рисунок.

Клавиши на рисунке: Delete убирает выделенное, стрелки двигают его (с Shift — на 10), Ctrl+Z и Ctrl+Y (или Ctrl+Shift+Z) отменяют и повторяют, Ctrl+A выделяет элементы слоя, Ctrl+G группирует, Ctrl+Shift+G разгруппировывает, Escape снимает выделение. Методы: Undo(), Redo(), Delete(), Group(), Ungroup(), Forward(), Backward() (выделенное выше или ниже в своём слое), Select(ids), Selected(), Add(item, layer), Clear(), SVG() (текст SVG без скрытых слоёв) и PNG(callback, scale) (callback(error, data URL картинки)).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Value` | `null` |
| `Tool` | `'select'` |
| `Brush` | `'pen'` |
| `Stroke` | `'#1f2328'` |
| `Fill` | `'none'` |
| `StrokeWidth` | `3` |
| `Layer` | `''` |
| `Toolbar` | `true` |
| `ReadOnly` | `false` |
| `Label` | `''` |

## События

- `change`: Рисунок изменился: его модель.
- `select`: Выделение изменилось: ID выделенных элементов.

## Методы

- `Undo()`
- `Redo()`
- `Selected()`
- `Select(ids)`
- `Add(item, layer)`
- `Clear()`
- `Delete()`
- `Group()`
- `Ungroup()`
- `Forward()`
- `Backward()`
- `SVG()`
- `PNG(callback, scale)`

## Пример

```example
<div class="docs-drawing">
	<Drawing [value]="Model" [layer]="Layer" (change)="Changed" (select)="Selected" />
	<div class="docs-stack">
		<DrawingLayers [value]="Model" [layer]="Layer" (change)="Changed" (select)="Picked" />
		<div class="docs-row">
			<Button Label="SVG" Icon="download" Size="small" (click)="Svg" />
			<Button Label="PNG" Icon="image" Size="small" (click)="Png" />
		</div>
		<p class="elemenx-text small muted">{{Note}}</p>
	</div>
</div>
<style>
	.docs-drawing {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 200px;
		gap: 12px;
	}

	@media (max-width: 640px) {
		.docs-drawing {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
<script>
({
	Layer: 'sketch',
	Note: 'Draw with the tools, choose a layer on the right, press an item to select it.',
	Model: {
		Width: 640,
		Height: 400,
		Layers: [
			{ID: 'sky', Name: 'Sky', Visible: true, Locked: true, Items: [
				{ID: 'sky-back', Type: 'rect', X: 0, Y: 0, W: 640, H: 400, Stroke: 'none', Fill: '#dbe7f5', Width: 0},
				{ID: 'sun', Type: 'ellipse', X: 470, Y: 40, W: 90, H: 90, Stroke: '#d99a1e', Fill: '#f5c542', Width: 4}
			]},
			{ID: 'house', Name: 'House', Visible: true, Locked: false, Items: [
				{ID: 'walls', Type: 'rect', X: 140, Y: 200, W: 200, H: 150, Stroke: '#5b3a29', Fill: '#e8c39e', Width: 4},
				{ID: 'roof', Type: 'path', Points: [{X: 120, Y: 205}, {X: 240, Y: 110}, {X: 360, Y: 205}], Brush: 'marker', Stroke: '#c0392b', Width: 4},
				{ID: 'door', Type: 'rect', X: 215, Y: 270, W: 50, H: 80, Stroke: '#5b3a29', Fill: '#8e5b3a', Width: 3}
			]},
			{ID: 'sketch', Name: 'Sketch', Visible: true, Locked: false, Items: [
				{ID: 'note', Type: 'text', X: 400, Y: 300, Text: 'Home', Size: 32, Stroke: '#2f8f83'},
				{ID: 'pointer', Type: 'arrow', Points: [{X: 395, Y: 315}, {X: 345, Y: 290}], Stroke: '#2f8f83', Width: 3}
			]}
		]
	},

	Changed: function (model) {
		this.Model = model;
	},

	Picked: function (id) {
		this.Layer = id;
	},

	Selected: function (ids) {
		this.Note = ids.length ? 'Selected: ' + ids.length + ' (Ctrl+G groups them, Delete removes them)' : 'Nothing selected';
	},

	Drawing: function () {
		return Elemenx.Instance(this.$Element().querySelector('.elemenx-drawing'));
	},

	Svg: function () {
		var text = this.Drawing().SVG();

		this.Note = 'An SVG of ' + text.length + ' characters';
	},

	Png: function () {
		var self = this;

		this.Drawing().PNG(function (error, url) {
			self.Note = error ? error.message : 'A PNG of ' + Math.round(url.length * 3 / 4 / 1024) + ' KB';
		});
	}
})
</script>
```

## Тесты

- [draws a rectangle, an ellipse, a line, an arrow and a freehand stroke with the tools, each an item of the model it emits](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-drawing.test.js#L61) — `tests/regression/library-drawing.test.js`
- [selects by a press, by Shift and by a frame, moves and resizes the selection, and undoes and redoes it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-drawing.test.js#L148) — `tests/regression/library-drawing.test.js`
- [groups and ungroups, moves the selection up and down its layer, erases, and writes a text](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-drawing.test.js#L232) — `tests/regression/library-drawing.test.js`
- [DrawingLayers shows the layers, the top one first, hides, locks, adds, orders, renames and removes them, and the Drawing follows](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-drawing.test.js#L321) — `tests/regression/library-drawing.test.js`
- [drawing: a rectangle drawn with its tool, selected, layers chosen and hidden](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L9423) — `tests/examples/ui-kit.spec.js`
