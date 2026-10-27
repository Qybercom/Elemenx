<!-- generated -->
# Steps

Steps joined by lines. Items: [{ID, Label, Description, Icon, Status, Class, Disabled, Readonly, Element, Render}]; Status is done, active, error or pending, or comes from Active and Done (lists of IDs): several steps may be active at once. Without an Icon a step shows its number (a check when done). Element (a DOM node) or Render(container, item) add custom content under the label; Class adds classes to the step. Direction: horizontal or vertical. Clickable (off by default) makes the steps buttons that emit select with the item; a Disabled step does not, and looks disabled. A step that is not Clickable, or Readonly, is no control at all (a timeline): it takes no pointer, focus or key and looks as it is; its Status still comes from the code.

## Properties

| Property | Default |
| --- | --- |
| `Items` | `[]` |
| `Active` | `[]` |
| `Done` | `[]` |
| `Direction` | `'horizontal'` |
| `Size` | `'medium'` |
| `Clickable` | `false` |

## Events

- `select`: A Clickable step was pressed: its item.

## Example

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

	Selected: function (item) {
		this.Index = this.Items.indexOf(item);
		this.Mark();
	}
})
</script>
```
