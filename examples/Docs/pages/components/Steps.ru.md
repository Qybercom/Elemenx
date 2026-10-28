<!-- generated -->
# Steps

Шаги, соединённые линиями. Items: [{ID, Label, Description, Icon, Status, Class, Disabled, Readonly, Element, Render}]; Status — done, active, error или pending, либо берётся из Active и Done (списки ID): активных шагов может быть несколько. Без Icon шаг показывает свой номер (галочку, когда выполнен). Element (узел DOM) или Render(container, item) добавляют своё содержимое под подписью; Class добавляет шагу классы. Direction: horizontal или vertical. Clickable (по умолчанию выключено) делает шаги кнопками, которые отправляют select с элементом; Disabled-шаг этого не делает и выглядит отключённым. Шаг без Clickable или с Readonly вовсе не элемент управления (временная шкала): он не принимает указатель, фокус и клавиши и выглядит как есть; его Status по-прежнему задаёт код.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Active` | `[]` |
| `Done` | `[]` |
| `Direction` | `'horizontal'` |
| `Size` | `'medium'` |
| `Clickable` | `false` |

## События

- `select`: Нажат шаг (Clickable): его элемент.

## Пример

```example
<Steps [items]="Items" [active]="[Items[Index].ID]" [done]="Done" Clickable="true" (select)="Selected" />
<div class="elemenx-container" style="gap: 8px;">
	<Button Label="Back" Icon="arrow-left" [disabled]="Index === 0" (click)="Back" />
	<Button Label="Next" Variant="primary" [disabled]="Index === Items.length - 1" (click)="Next" />
</div>
<Steps Direction="vertical" [items]="[{ID: 'a', Label: 'Ordered', Description: 'Monday, 10:42', Status: 'done'}, {ID: 'b', Label: 'Shipped', Description: 'Tuesday', Status: 'done'}, {ID: 'c', Label: 'Held at customs', Status: 'error'}, {ID: 'd', Label: 'Delivered'}]" />
<script>
({
	Index: 1,
	Items: [{ID: 'cart', Label: 'Cart', Icon: 'cart'}, {ID: 'address', Label: 'Address'}, {ID: 'pay', Label: 'Payment'}, {ID: 'done', Label: 'Done'}],
	Done: ['cart'],

	$OnCreate: function () {
		this.Mark();
	},

	Mark: function () {
		this.Done = this.Items.slice(0, this.Index).map(function (item) {
			return item.ID;
		});
	},

	Back: function () {
		this.Index--;
		this.Mark();
	},

	Next: function () {
		this.Index++;
		this.Mark();
	},

	/* The step pressed, by its ID: the item select gives is the copy of the Steps, not the object of this list. */
	Selected: function (item) {
		this.Index = this.Items.map(function (each) {
			return each.ID;
		}).indexOf(item.ID);
		this.Mark();
	}
})
</script>
```

## Тесты

- [Knob turns by its keys in Steps within Min and Max, tells input and change, and goes back to Default on a double click](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-controls.test.js#L37) — `tests/regression/library-controls.test.js`
- [Tour goes step by step with Next and Back, tells each step, finishes at the last, and closes with the reason](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-overlays.test.js#L97) — `tests/regression/library-overlays.test.js`
