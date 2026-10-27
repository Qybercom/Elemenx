<!-- generated -->
# SettingsMenu

Меню настроек, как на телефоне: строки в группах, у каждой Icon на плитке цвета Color, Label, Description под ней, Value и шеврон к подменю её Items. Строка с Toggle — переключатель (Checked); строка с Checked без Toggle показывает галочку, как варианты подменю. Badge — счётчик на строке. Подменю строки с Choice — выбор одного: нажатие отмечает нажатую строку, и её Label становится Value родительской строки.

- Items: [{ID, Label, Description, Icon, Color, Value, Badge, Items, Choice, Toggle, Checked, Disabled, Danger}]; элемент {Group, Note} начинает группу строк: её заголовок над ними (пустой — без заголовка), Note — под ними.
- Title — крупный заголовок верхнего меню; подменю берёт Label своей строки и показывает кнопку возврата к меню выше. Path — ID открытых подменю.
- Variant: 'auto' (ios на устройствах Apple, material на остальных), 'ios' (строки на скруглённых карточках, как в Настройках iPhone) или 'material' (строки во всю ширину с круглыми плитками, как в Настройках Android).
- Searchable показывает поле, которое ищет строки на всех уровнях по Label и Description; найденная строка показывает, где она находится, а нажатие на неё делает то же, что нажатие в её меню.
- Стрелки двигают между строками, Enter и пробел нажимают строку, стрелка вправо открывает подменю; стрелка влево, Escape и Backspace возвращают назад.
- События: select ({ID, Item, Path}) для строки без Items, toggle ({ID, Item, Checked}), navigate ({Path}).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Title` | `''` |
| `Variant` | `'auto'` |
| `Searchable` | `false` |
| `SearchLabel` | `''` |
| `Path` | `[]` |

## События

- `toggle`: Переключена строка-переключатель: {ID, Item, Checked}.
- `select`: Выбрана строка: {ID, Item, Path}.
- `navigate`: Открыто или покинуто подменю: {Path}, ID открытых подменю.

## Пример

```example
<div class="docs-frame">
	<SettingsMenu Variant="ios" Title="Settings" Searchable="true" [items]="Items" (select)="Picked" (toggle)="Toggled" />
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: '',
	Items: [
		{Group: 'Connections'},
		{ID: 'airplane', Label: 'Airplane mode', Icon: 'send', Color: '#ff9500', Toggle: true},
		{ID: 'wifi', Label: 'Wi-Fi', Icon: 'globe', Color: '#007aff', Value: 'Home', Choice: true, Items: [
			{Group: 'Networks', Note: 'Known networks join on their own.'},
			{ID: 'home', Label: 'Home', Checked: true},
			{ID: 'office', Label: 'Office'}
		]},
		{ID: 'notifications', Label: 'Notifications', Icon: 'bell', Color: '#ff3b30', Badge: 2, Items: [
			{ID: 'sounds', Label: 'Sounds', Toggle: true, Checked: true}
		]},
		{Group: 'Display', Note: 'Dark mode can follow the time of day.'},
		{ID: 'dark', Label: 'Dark mode', Icon: 'moon', Color: '#5856d6', Toggle: true},
		{ID: 'about', Label: 'About', Icon: 'info', Color: '#8e8e93'}
	],

	Picked: function (event) {
		this.Note = 'Selected: ' + event.ID;
	},

	Toggled: function (event) {
		this.Note = event.ID + ' is ' + (event.Checked ? 'on' : 'off');
	}
})
</script>
```
