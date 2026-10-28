<!-- generated -->
# *draggable

*draggable="{Data: item, Type: 'task', Handle: '.grip'}" (or just *draggable="item") lets the element be dragged with the pointer onto *droppable elements that accept Type. A ghost copy follows the pointer; Escape cancels. The element dispatches "dragbegin" and "dragfinish" ({Dropped, Target}); the target dispatches "dropmove" (once a frame while the item is over it) and "dropped". Over a target with Sort, Index in their detail is the place the item would take among the draggable items of that target (the dragged item left out), and a line marks it. OffsetX and OffsetY are the point of the element that the pointer holds, so ClientX - OffsetX is the left edge of the ghost. Disabled turns dragging off; Handle limits where the drag may start. Hold (milliseconds) leaves a finger to the page: on a touch screen a move scrolls it, and a press held still that long takes the element (it shows held). A drag outlives a new rendering of its element (a list that moves the item to another place while it is dragged): it ends on the release of the pointer.

## Example

```example
<div class="elemenx-container wrappable" style="gap: 8px; align-items: flex-start;">
	<div class="elemenx-card docs-stack" style="padding: 8px; min-width: 180px;" *droppable="{Accept: ['task'], Sort: 'vertical'}" (dropped)="DroppedTodo">
		<strong>To do</strong>
		<div class="elemenx-callout neutral" *for="task of Todo" *key="task" *draggable="{Data: task, Type: 'task'}">{{task}}</div>
	</div>
	<div class="elemenx-card docs-stack" style="padding: 8px; min-width: 180px;" *droppable="{Accept: ['task'], Sort: 'vertical'}" (dropped)="DroppedDone">
		<strong>Done</strong>
		<div class="elemenx-callout success" *for="task of Done" *key="task" *draggable="{Data: task, Type: 'task'}">{{task}}</div>
	</div>
</div>
<script>
({
	Todo: ['Write', 'Test', 'Ship'],
	Done: ['Plan'],

	Move: function (task, to, index) {
		var todo = this.Todo.filter(function (item) {
			return item !== task;
		});
		var done = this.Done.filter(function (item) {
			return item !== task;
		});
		var list = to === 'Todo' ? todo : done;

		list.splice(index < 0 ? list.length : index, 0, task);

		this.Todo = todo;
		this.Done = done;
	},

	DroppedTodo: function (event) {
		this.Move(event.detail.Data, 'Todo', event.detail.Index);
	},

	DroppedDone: function (event) {
		this.Move(event.detail.Data, 'Done', event.detail.Index);
	}
})
</script>
```

## Tests

- [*draggable and *droppable: an item dragged by the pointer onto a target that accepts its type is dropped with its data](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L135) — `tests/regression/library-directives.test.js`
