<!-- generated -->
# *resizable

*resizable="'right bottom'" adds resize handles to the element: right, left, bottom, top and corner (bottom right). The value may also be {Edges, MinWidth, MaxWidth, MinHeight, MaxHeight}. A handle is dragged with the pointer or moved with the arrow keys (Shift for larger steps). The element dispatches "resize" while it changes and "resizeend" after, both with the detail {Width, Height, Edge}.

## Example

```example
<div class="elemenx-card" style="width: 240px; height: 120px; padding: 12px;" *resizable="{Edges: 'right bottom corner', MinWidth: 120, MaxWidth: 600, MinHeight: 60}" (resize)="Resized">
	<p class="elemenx-text">Drag an edge or the corner; focus a handle and use the arrows (Shift for big steps).</p>
</div>
<p class="elemenx-text small muted">{{Size}}</p>
<script>
({
	Size: '240 × 120',

	Resized: function (event) {
		this.Size = Math.round(event.detail.Width) + ' × ' + Math.round(event.detail.Height) + ' (' + event.detail.Edge + ')';
	}
})
</script>
```

## Tests

- [*resizable adds its handles, and the arrow keys on a handle resize the element within its bounds](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L139) — `tests/regression/library-directives.test.js`
