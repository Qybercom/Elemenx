<!-- generated -->
# *droppable

*droppable="{Accept: ['task'], Files: true, Text: true}" делает элемент целью перетаскивания. Accept перечисляет Type предметов *draggable, которые он принимает (true принимает все). Files и Text принимают файлы и текст, перетащенные из-за пределов браузера (нативное перетаскивание). Во время перетаскивания элемент получает класс drop-target, когда принимает предмет, и drop-over, пока предмет над ним. Sort ('vertical', 'horizontal' или 'grid') делает элемент упорядоченным списком его предметов *draggable: линия отмечает место, которое занял бы перетаскиваемый предмет (Marker: false её скрывает), а Index в detail сообщает его. Элемент отправляет "dropenter", "dropleave", "dropmove" (только для предметов) и "dropped" с {Kind ('item', 'files' или 'text'), Type, Data, Files, Text, Source, ClientX, ClientY, Index (-1 без Sort)}.

## Пример

```example
<div class="elemenx-card" style="padding: 24px; text-align: center;" *droppable="{Files: true, Text: true}" (dropped)="Dropped">
	<Icon Name="upload" Size="24" />
	<p class="elemenx-text">Drop files or text from another window here</p>
</div>
<ul class="elemenx-ul"><li *for="line of Lines" *key="$index">{{line}}</li></ul>
<script>
({
	Lines: [],

	Dropped: function (event) {
		var detail = event.detail;

		if (detail.Kind === 'files')
			this.Lines = detail.Files.map(function (file) {
				return file.name + ' · ' + file.size + ' bytes';
			});
		else if (detail.Kind === 'text')
			this.Lines = ['Text: ' + detail.Text.slice(0, 120)];
	}
})
</script>
```

## Тесты

- [*draggable and *droppable: an item dragged by the pointer onto a target that accepts its type is dropped with its data](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L166) — `tests/regression/library-directives.test.js`
