<!-- generated -->
# *draggable

*draggable="{Data: item, Type: 'task', Handle: '.grip'}" (или просто *draggable="item") позволяет перетаскивать элемент указателем на элементы *droppable, принимающие Type. За указателем следует копия-призрак; Escape отменяет. Элемент отправляет "dragbegin" и "dragfinish" ({Dropped, Target}); цель отправляет "dropmove" (раз в кадр, пока предмет над ней) и "dropped". Над целью с Sort Index в их detail — место, которое предмет занял бы среди перетаскиваемых элементов этой цели (без самого перетаскиваемого), и его отмечает линия. OffsetX и OffsetY — точка элемента, за которую держит указатель, так что ClientX - OffsetX — левый край призрака. Disabled отключает перетаскивание; Handle ограничивает, откуда его можно начать. Hold (миллисекунды) оставляет палец странице: на сенсорном экране движение прокручивает её, а неподвижное нажатие такой длительности берёт элемент (он показывает, что взят). Перетаскивание переживает перерисовку своего элемента (список, который переносит предмет на другое место, пока его тащат): оно заканчивается, когда указатель отпущен.

## Пример

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

## Тесты

- [*draggable and *droppable: an item dragged by the pointer onto a target that accepts its type is dropped with its data](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-directives.test.js#L135) — `tests/regression/library-directives.test.js`
