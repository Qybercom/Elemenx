<!-- generated -->
# *mount

*mount="source" places custom content in the element: source is a DOM node (moved in), a function (called once with the element) or an object with Element or Render(container, item). Used by ToastHost.

## Example

```example
<div *mount="Canvas"></div>
<div *mount="{Render: Draw}"></div>
<script>
({
	$OnCreate: function () {
		var canvas = document.createElement('canvas');
		var context;

		canvas.width = 160;
		canvas.height = 60;
		context = canvas.getContext('2d');
		context.fillStyle = '#e0a800';
		context.fillRect(10, 10, 140, 40);

		this.Canvas = canvas;
	},

	Draw: function (container) {
		container.textContent = 'Rendered by a function at ' + new Date().toLocaleTimeString();
	}
})
</script>
```
