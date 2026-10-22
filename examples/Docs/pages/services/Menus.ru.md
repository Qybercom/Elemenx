<!-- generated -->
# Menus

Пункты меню, объявленные в шаблоне через MenuItem (их используют Menu и ContextMenu). Read(container) возвращает пункты, объявленные его MenuItem, вложенные — как Items: [{ID, Label, Icon, Shortcut, Disabled, Danger, Checked, Separator, Group, Items, Source}], Source — объявление. Watch(container, callback) снова вызывает callback с пунктами всякий раз, когда объявление внутри появляется, исчезает или меняется, и возвращает функцию, прекращающую наблюдение. Pick(item) сообщает MenuItem объявленного пункта, что его выбрали (его select).

## Методы

- `Read(container)`
- `Watch(container, callback)`
- `Pick(item)`

## Пример

```example
<div class="docs-menu-source" hidden>
	<MenuItem ID="new" Label="New" Icon="add" Shortcut="Ctrl+N" />
	<MenuItem ID="export" Label="Export" Icon="download" [disabled]="Locked">
		<MenuItem ID="pdf" Label="PDF" />
		<MenuItem ID="png" Label="PNG" />
	</MenuItem>
	<MenuItem Separator="true" />
	<MenuItem ID="delete" Label="Delete" Icon="delete" Danger="true" />
</div>
<span class="elemenx-popup-anchor">
	<Button Label="The menu read from them" Icon="menu" (click)="Toggle" />
	<MenuList [items]="Items" [open]="Open" (select)="Picked" (dismiss)="Closed" />
</span>
<Toggle Label="Lock Export (the declaration changes; Watch reads it again)" [checked]="Locked" (change)="Lock" />
<pre class="elemenx-code">{{Read}}</pre>
<script>
({
	Items: [],
	Read: '',
	Open: false,
	Locked: false,

	$OnReady: function () {
		var self = this;

		this.Stop = this.$Service('Menus').Watch(this.$Element().querySelector('.docs-menu-source'), function (items) {
			self.Items = items;
			self.Read = JSON.stringify(items.map(function (item) {
				return item.Separator ? {Separator: true} : {ID: item.ID, Label: item.Label, Disabled: !!item.Disabled, Items: (item.Items || []).map(function (child) {
					return child.ID;
				})};
			}), null, 2);
		});
	},

	$OnDestroy: function () {
		if (this.Stop)
			this.Stop();
	},

	Toggle: function () {
		this.Open = !this.Open;
	},

	Closed: function () {
		this.Open = false;
	},

	Lock: function (value) {
		this.Locked = value;
	},

	Picked: function (item) {
		this.Open = false;
		this.$Service('Menus').Pick(item);
		this.Read = 'Picked: ' + item.ID;
	}
})
</script>
```
