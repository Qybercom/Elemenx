<!-- generated -->
# Splitter

Two panes with a draggable divider. Direction: horizontal (side by side) or vertical (stacked). Size is the size of the first pane in pixels; Min and Max bound it. Slots: first, second. The resize event reports the new Size when the divider is released.

## Properties

| Property | Default |
| --- | --- |
| `Direction` | `'horizontal'` |
| `Size` | `240` |
| `Min` | `64` |
| `Max` | `null` |

## Events

- `resize`: The divider was released: Size, of the first pane.

## Slots

`first`, `second`

## Example

```example
<div class="docs-frame" style="height: 200px;">
	<Splitter Size="180" Min="80" Max="400" (resize)="Resized">
		<div slot="first" style="padding: 12px;"><strong>Files</strong><p class="elemenx-text small muted">Drag the divider.</p></div>
		<div slot="second" style="padding: 12px;"><strong>Editor</strong><p class="elemenx-text small muted">The first pane is {{Size}} pixels wide.</p></div>
	</Splitter>
</div>
<script>
({
	Size: 180,

	Resized: function (size) {
		this.Size = size;
	}
})
</script>
```

## Tests

- [builds with the classes of the layouts, the props of any component, its expressions and its named slots](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/builder.spec.js#L407) — `tests/examples/builder.spec.js`
