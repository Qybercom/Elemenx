<!-- generated -->
# *mount

*mount="source" помещает в элемент своё содержимое: source — узел DOM (переносится внутрь), функция (вызывается один раз с элементом) или объект с Element или Render(container, item). Используется ToastHost.

## Пример

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
