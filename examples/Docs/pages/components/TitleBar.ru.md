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
