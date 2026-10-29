<!-- generated -->
# *droppable

*droppable="{Accept: ['task'], Files: true, Text: true}" makes the element a drop target. Accept lists the Types of *draggable items it takes (true takes every item). Files and Text accept files and text dragged from outside the browser (native drag and drop). During a drag the element gets the class drop-target when it accepts the item and drop-over while the item is over it. Sort ('vertical', 'horizontal' or 'grid') makes the element an ordered list of its *draggable items: a line marks the place a dragged item would take (Marker: false hides it) and Index in the detail tells it. The element dispatches "dropenter", "dropleave", "dropmove" (items only) and "dropped" with {Kind ('item', 'files' or 'text'), Type, Data, Files, Text, Source, ClientX, ClientY, Index (-1 without Sort)}.

## Example

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

## Tests

- [*draggable and *droppable: an item dragged by the pointer onto a target that accepts its type is dropped with its data](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L138) — `tests/regression/library-directives.test.js`
