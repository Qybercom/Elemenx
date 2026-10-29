<!-- generated -->
# NativeMenu

Меню программы, описанное как меню страницы: <NativeMenu> с детьми MenuItem, как в Menu (MenuItem с MenuItem внутри — подменю). Это меню окна (Target window, по умолчанию: File, Edit... на его элементах верхнего уровня) или меню значка в трее (Target tray); оно следует за шаблоном. Look elemenx (по умолчанию) рисует их средствами ElemenxUI: меню окна — MenuBar там, где разметка ставит NativeMenu (в TitleBar, в шапке; Caret, Variant и Size — как в MenuBar; без него у программы нет системного меню), меню трея — маленькое окно у указателя по правой кнопке (Native.TrayPopup с NativeMenuPanel). Look system отдаёт их системе (Native.Menu, Native.TrayMenu). MenuItem с Role (undo, redo, cut, copy, paste, selectAll, reload, toggleDevTools, resetZoom, zoomIn, zoomOut, togglefullscreen, minimize, close, quit) делает то, что делает для него система (Native.Role), с обычным сочетанием роли, если своего нет; его Shortcut — сочетание клавиш программы (Ctrl+N, Mod+N — Ctrl или Cmd). Выбор — это select его MenuItem, как на странице, и select самого NativeMenu с пунктом. В вебе меню окна — полоса кнопок Menu с теми же пунктами, кроме системных (с Role), а их сочетания становятся горячими клавишами страницы; меню трея ничего не показывает.
События: select (выбранный пункт), apply ({Error}, когда система не приняла меню).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Target` | `'window'` |
| `Look` | `'elemenx'` |
| `Caret` | `false` |
| `Variant` | `'ghost'` |
| `Size` | `'small'` |

## События

- `apply`: Меню передано системе: {Error}, null, если всё прошло хорошо.
- `select`: Выбран пункт в меню программы: сам пункт.

## Слоты

по умолчанию

## Пример

```example
<TitleBar Title="Notes" Icon="file-text">
	<NativeMenu (select)="Selected">
		<MenuItem Label="File">
			<MenuItem ID="new" Label="New note" Shortcut="Alt+Shift+N" />
			<MenuItem ID="export" Label="Export..." />
			<MenuItem Separator="true" />
			<MenuItem Role="quit" Label="Quit" />
		</MenuItem>
		<MenuItem Label="Edit">
			<MenuItem Role="undo" Label="Undo" />
			<MenuItem ID="find" Label="Find" />
		</MenuItem>
	</NativeMenu>
</TitleBar>
<p class="elemenx-text small muted">On the web the menu is a MenuBar without the items of the system (Quit, Undo). Chosen: {{Chosen}}</p>
<script>
({
	Chosen: 'nothing yet',

	Selected: function (item) {
		this.Chosen = item.Label;
	}
})
</script>
```

## Тесты

- [gives the system the menu of its MenuItems with Look system, their shortcuts and roles, and tells a choice to its MenuItem](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-menu.test.js#L92) — `tests/regression/native-menu.test.js`
- [draws the menu of the window of a program with ElemenxUI by default: a bar, the menu of the system taken away, a role done by the system](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-menu.test.js#L137) — `tests/regression/native-menu.test.js`
- [draws the menu of the tray of a program in a window of its own at the right button, a choice told to its MenuItem](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-menu.test.js#L164) — `tests/regression/native-menu.test.js`
- [is a bar of menus on the web, without the items of the system, its shortcuts hotkeys of the page](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-menu.test.js#L250) — `tests/regression/native-menu.test.js`
- [gives the icon in the tray its menu of the system with Look system, and hears the choices of that menu only](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/native-menu.test.js#L286) — `tests/regression/native-menu.test.js`
