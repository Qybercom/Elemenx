<!-- generated -->
# DrawingLayers

The layers of a Drawing, the top one first: each shown or hidden, locked or not, named (a double press or F2 renames it), with the count of its items. Value is the model of the drawing (as Drawing takes and emits it), Layer the ID of the current one (where the new items go). The buttons add a layer over the current one, remove it (a drawing keeps one), and move it up or down. change emits the model, select the ID of the layer chosen; bind both to a Drawing.

## Properties

| Property | Default |
| --- | --- |
| `Value` | `null` |
| `Layer` | `''` |
| `ReadOnly` | `false` |

## Events

- `change`: The layers changed: the model of the drawing.
- `select`: A layer was chosen: its ID.

## Example

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

## Tests

- [draws a rectangle, an ellipse, a line, an arrow and a freehand stroke with the tools, each an item of the model it emits](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-drawing.test.js#L61) — `tests/regression/library-drawing.test.js`
- [selects by a press, by Shift and by a frame, moves and resizes the selection, and undoes and redoes it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-drawing.test.js#L148) — `tests/regression/library-drawing.test.js`
- [groups and ungroups, moves the selection up and down its layer, erases, and writes a text](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-drawing.test.js#L232) — `tests/regression/library-drawing.test.js`
- [DrawingLayers shows the layers, the top one first, hides, locks, adds, orders, renames and removes them, and the Drawing follows](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-drawing.test.js#L321) — `tests/regression/library-drawing.test.js`
