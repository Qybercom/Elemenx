<!-- generated -->
# TitleBar

Заголовок окна программы, нарисованный Приложением (Native.Desktop.Frame hidden, none или transparent), а в вебе — шапка страницы. Его пустые места перемещают окно (elemenx-native-drag; двойной щелчок разворачивает его), а то, что в нём лежит, остаётся кликабельным. Icon (имя иконки) или Image (URL картинки, иконка программы) и Title; слот по умолчанию — содержимое после иконки (NativeMenu или MenuBar, поиск...), слот actions — кнопки перед кнопками окна. Controls: auto (по умолчанию) рисует кнопки окна (свернуть, развернуть или восстановить, закрыть) там, где система их не рисует (Frame none или transparent), true — в любой программе, false — никогда. С Frame hidden кнопки системы остаются поверх полосы, её содержимое не заходит под них (env(titlebar-area-*)), а цвета они берут у полосы и следуют за темой. Window — ID окна OpenWindow, заголовком которого он служит (без него — первое окно).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Title` | `''` |
| `Icon` | `''` |
| `Image` | `''` |
| `Controls` | `'auto'` |
| `Window` | `''` |
| `Frame` | `'web'` |

## Слоты

по умолчанию, `actions`

## Пример

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

## Тесты

- [names the frame of the program, web on the web, and gives the buttons of the system the colors asked](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/title-bar.test.js#L72) — `tests/regression/title-bar.test.js`
- [gives the parts of the system in a program the scheme of the theme: its policy, or the one scheme of a theme](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/title-bar.test.js#L98) — `tests/regression/title-bar.test.js`
- [opens a window of the Application with a frame of its own, the frame on its <html>](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/title-bar.test.js#L122) — `tests/regression/title-bar.test.js`
- [empties a window of the name left by a page before (reloaded), and keeps its own frame as the page changes](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/title-bar.test.js#L156) — `tests/regression/title-bar.test.js`
- [draws the buttons of the window where the system draws none, and they act on its window](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/title-bar.test.js#L208) — `tests/regression/title-bar.test.js`
- [with Frame hidden leaves the buttons to the system and gives them its colors](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/title-bar.test.js#L271) — `tests/regression/title-bar.test.js`
