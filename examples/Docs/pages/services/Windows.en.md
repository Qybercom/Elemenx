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

## Tests

- [normalizes dot paths and Windows separators](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/cli-generator.test.js#L109) — `tests/regression/cli-generator.test.js`
- [shows a progress in its states, a count over the icon, the attention and the buttons under the thumbnail on the taskbar of Windows](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/electron.test.js#L919) — `tests/regression/electron.test.js`
- [finds the sections in a framework whose lines end in CRLF, as Git on Windows checks it out](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/shake.test.js#L42) — `tests/regression/shake.test.js`
- [a window with a trapezoid header is a folder: the title on a tab, its slot and buttons beyond the slope, and the header still moves it](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6550) — `tests/examples/ui-kit.spec.js`
- [picture-in-picture moves the body of a window into a window of its own and back, and a video into its window](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6645) — `tests/examples/ui-kit.spec.js`
- [windows move, resize, come to the front, minimize, maximize, follow the keys, close and remember their place](https://github.com/Qybercom/Elemenx/blob/main/tests/examples/ui-kit.spec.js#L6755) — `tests/examples/ui-kit.spec.js`
