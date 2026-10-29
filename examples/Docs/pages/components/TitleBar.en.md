<!-- generated -->
# TitleBar

The title bar of a window of a program drawn by the Application (Native.Desktop.Frame hidden, none or transparent), the header of the page on the web. Its empty places move the window (elemenx-native-drag; a double click maximizes it there), what it holds stays clickable. Icon (a name of an icon) or Image (the URL of a picture) and Title; the default slot holds its content after the icon (a NativeMenu or a MenuBar, a search...), the actions slot buttons before the buttons of the window. Controls: auto (by default) draws the buttons of the window (minimize, maximize or restore, close) where the system draws none (Frame none or transparent), true in every program, false never. With Frame hidden the buttons of the system stay over the bar, its content clear of them (env(titlebar-area-*)), and they take the colors of the bar, which follow the theme. Window: the ID of the window of OpenWindow it is the bar of (the first window without).

## Properties

| Property | Default |
| --- | --- |
| `Title` | `''` |
| `Icon` | `''` |
| `Image` | `''` |
| `Controls` | `'auto'` |
| `Window` | `''` |
| `Frame` | `'web'` |

## Slots

default, `actions`

## Example

```example
<div style="border: 1px solid var(--elemenx-border); border-radius: 8px; overflow: hidden;">
	<TitleBar Title="Notes" Icon="file-text" Controls="true">
		<MenuBar [items]="Menus" (select)="Selected" />
		<Button slot="actions" Icon="search" Title="Search" Variant="ghost" Size="small" />
	</TitleBar>
	<p class="elemenx-text small muted" style="padding: 12px;">On the web the buttons of the window do nothing; in a program of Electron they minimize, maximize and close it. Chosen: {{Chosen}}</p>
</div>
<script>
({
	Chosen: 'nothing yet',
	Menus: [
		{Label: 'File', Items: [{ID: 'new', Label: 'New note'}, {ID: 'export', Label: 'Export...'}]},
		{Label: 'View', Items: [{ID: 'zoom', Label: 'Zoom in'}]}
	],

	Selected: function (item) {
		this.Chosen = item.Label;
	}
})
</script>
```

## Tests

- [names the frame of the program, web on the web, and gives the buttons of the system the colors asked](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/title-bar.test.js#L72) — `tests/regression/title-bar.test.js`
- [gives the parts of the system in a program the scheme of the theme: its policy, or the one scheme of a theme](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/title-bar.test.js#L98) — `tests/regression/title-bar.test.js`
- [opens a window of the Application with a frame of its own, the frame on its <html>](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/title-bar.test.js#L122) — `tests/regression/title-bar.test.js`
- [empties a window of the name left by a page before (reloaded), and keeps its own frame as the page changes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/title-bar.test.js#L156) — `tests/regression/title-bar.test.js`
- [draws the buttons of the window where the system draws none, and they act on its window](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/title-bar.test.js#L208) — `tests/regression/title-bar.test.js`
- [with Frame hidden leaves the buttons to the system and gives them its colors](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/title-bar.test.js#L271) — `tests/regression/title-bar.test.js`
