<!-- generated -->
# AppIcon

The icon of the Application, wherever it runs: the favicon of the tab on the web, the icon of the windows (the taskbar, the dock) and of the tray in a native program (the Native Service). Every call takes callback(error) at the end.

- Set(icon, callback): the icon, a URL (or a path in the Application), the text of an SVG, a data URL, or {Light, Dark}, one for each scheme of the system (the tab of a browser follows the scheme of the system, not the one of the page); null brings back the icon of the page. In a program the windows take it (drawn into a PNG).
- Badge(count, callback): a count over the icon: the badge of the system in a program and in an installed web Application, and a red disc with the number drawn over the favicon (99+ past 99; 'dot' a disc alone; 0 removes it).
- Progress(value, callback): a part from 0 to 1, a ring around the favicon and the bar of the button of the window in a program; null removes it.
- Attention(on, callback): the window flashes in a program; on the web the favicon and the title blink while the page is hidden.
- Tray(icon, tooltip, callback): the picture (an icon as Set takes it) and the tooltip of the icon of the tray of a program (Native.Tray made it): online, offline, a count...
- Reset(callback): the icon of the page, no badge, no progress. Current() is {Icon, Badge, Progress}.

## Methods

- `Set(icon, callback)`
- `Badge(count, callback)`
- `Progress(value, callback)`
- `Attention(on, callback)`
- `Tray(icon, tooltip, callback)`
- `Reset(callback)`
- `Current()`

## Example

```example
<div class="docs-stack">
	<p class="elemenx-text small muted">Look at the icon of this tab while you press the buttons.</p>
	<div class="docs-row">
		<Button Label="A new icon" (click)="Changed" />
		<Button Label="One more message" Icon="comment" (click)="Counted" />
		<Button Label="Upload" Icon="upload" (click)="Uploaded" />
		<Button Label="As it was" Variant="ghost" (click)="Reset" />
	</div>
	<p class="elemenx-text small">Messages: {{Count}}, upload: {{Part === null ? 'none' : Math.round(Part * 100) + '%'}}.</p>
</div>
<script>
({
	Count: 0,
	Part: null,

	Changed: function () {
		this.$Service('AppIcon').Set({
			Light: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1a73e8"/><path d="M18 34l10 10 18-22" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/></svg>',
			Dark: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#8ab4f8"/><path d="M18 34l10 10 18-22" stroke="#202124" stroke-width="7" fill="none" stroke-linecap="round"/></svg>'
		});
	},

	Counted: function () {
		this.Count++;

		this.$Service('AppIcon').Badge(this.Count);
	},

	Uploaded: function () {
		var self = this;
		var timer;

		this.Part = 0;

		timer = window.setInterval(function () {
			self.Part = Math.min(1, self.Part + 0.1);

			self.$Service('AppIcon').Progress(self.Part);

			if (self.Part >= 1) {
				window.clearInterval(timer);

				window.setTimeout(function () {
					self.Part = null;

					self.$Service('AppIcon').Progress(null);
				}, 600);
			}
		}, 300);
	},

	Reset: function () {
		this.Count = 0;
		this.Part = null;

		this.$Service('AppIcon').Reset();
	}
})
</script>
```
