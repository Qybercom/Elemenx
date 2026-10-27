<!-- generated -->
# SplitButton

A button with a main action and an arrow beside it that opens a menu of the other actions (Save, and Save as, Export... under the arrow). A press on the button emits click; an item of the menu emits select with the item, as in Menu. Items, and the MenuItems declared inside it after them. Placement says where the menu opens (bottom-end by default, under the arrow); Sheet shows it as a sheet from the bottom of the screen, as Menu does.

## Properties

| Property | Default |
| --- | --- |
| `Label` | `''` |
| `Icon` | `''` |
| `Items` | `[]` |
| `Variant` | `'primary'` |
| `Size` | `'medium'` |
| `Placement` | `'bottom-end'` |
| `Sheet` | `false` |
| `Disabled` | `false` |

## Events

- `click`: The main button was pressed.
- `select`: An item of the menu was chosen: the item.

## Slots

default

## Example

```example
<SplitButton Label="Save" Icon="save" [items]="Items" (click)="Saved" (select)="Picked" />
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Items: [{ID: 'copy', Label: 'Save a copy', Icon: 'copy'}, {ID: 'pdf', Label: 'Export PDF', Icon: 'download'}, {Separator: true}, {ID: 'discard', Label: 'Discard changes', Danger: true}],
	Note: 'Press Save, or the arrow for the other actions.',

	Saved: function () {
		this.Note = 'Saved';
	},

	Picked: function (item) {
		this.Note = item.Label;
	}
})
</script>
```
