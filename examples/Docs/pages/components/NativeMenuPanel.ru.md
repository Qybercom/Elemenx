<!-- generated -->
# NativeMenuPanel

Меню трея программы, нарисованное ElemenxUI: список, который NativeMenu с Target tray кладёт в своё окно (Native.TrayPopup), так же, как его рисует MenuList. Items: [{ID, Label, Icon, Shortcut, Disabled, Danger, Checked, Items, Separator, Group}]; пункт с Items открывает их на своём месте, со строкой назад; Choose(item) вызывается с выбранным пунктом, и окно прячется. Окно принимает размер списка; Escape прячет его или возвращает на уровень выше.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Choose` | `null` |
