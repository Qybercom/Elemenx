<!-- generated -->
# *resizable

*resizable="'right bottom'" добавляет элементу маркеры изменения размера: right, left, bottom, top и corner (правый нижний угол). Значение может быть и {Edges, MinWidth, MaxWidth, MinHeight, MaxHeight}. Маркер тянут указателем или двигают стрелками (с Shift — крупными шагами). Элемент отправляет "resize" во время изменения и "resizeend" после, оба с detail {Width, Height, Edge}.

## Пример

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

## Тесты

- [*resizable adds its handles, and the arrow keys on a handle resize the element within its bounds](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L108) — `tests/regression/library-directives.test.js`
