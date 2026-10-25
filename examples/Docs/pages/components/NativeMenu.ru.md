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

`apply`, `select`

## Слоты

по умолчанию
