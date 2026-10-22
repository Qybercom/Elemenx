<!-- generated -->
# Windows

The windows of the page (the Window component): their order and the active one. Front(window) puts a window over the others and makes it active; Active() is the active window, List() the open ones from the back to the front; Place() gives the next place of a new window without a place of its own (they go down and right in a cascade). OnChange(callback) / OffChange(callback) report a new order. The geometry of a window with Persist is remembered in localStorage under StorageKey.

## Methods

- `Front(entry)`
- `Active()`
- `List()`
- `Place()`
- `OnChange(callback)`
- `OffChange(callback)`

## Example

```example
<div class="docs-frame" style="height: 280px;">
	<div style="position: relative; flex: 1 1 auto;">
		<Window *for="name of Names" *key="name" [title]="name" Width="220" Height="140" (front)="Fronted"><p class="elemenx-text small">Press me to bring me to the front.</p></Window>
	</div>
</div>
<p class="elemenx-text small muted">From the back to the front: {{Order}}</p>
<script>
({
	Names: ['One', 'Two', 'Three'],
	Order: '',

	$OnCreate: function () {
		var self = this;
		var windows = this.$Service('Windows');

		this.Changed = function () {
			self.Order = windows.List().map(function (window) {
				return window.Title;
			}).join(' · ');
		};

		windows.OnChange(this.Changed);
	},

	$OnDestroy: function () {
		this.$Service('Windows').OffChange(this.Changed);
	},

	Fronted: function () {
		this.Changed();
	}
})
</script>
```
