<!-- generated -->
# NativeMenuPanel

Меню трея программы, нарисованное ElemenxUI: список, который NativeMenu с Target tray кладёт в своё окно (Native.TrayPopup), так же, как его рисует MenuList. Items: [{ID, Label, Icon, Shortcut, Disabled, Danger, Checked, Items, Separator, Group}]; пункт с Items открывает их на своём месте, со строкой назад; Choose(item) вызывается с выбранным пунктом, и окно прячется. Окно принимает размер списка; Escape прячет его или возвращает на уровень выше.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Choose` | `null` |

## Пример

```example
<div style="max-width: 260px;">
	<NativeMenuPanel [items]="Items" [choose]="Choose" />
</div>
<p class="elemenx-text small muted">The menu of the tray of a program, as its window shows it. Chosen: {{Chosen}}</p>
<script>
({
	Chosen: 'nothing yet',
	Items: [
		{ID: 'show', Label: 'Show the window', Icon: 'layout'},
		{Label: 'Status', Items: [{ID: 'online', Label: 'Online', Checked: true}, {ID: 'away', Label: 'Away'}]},
		{Separator: true},
		{ID: 'quit', Label: 'Quit', Danger: true}
	],

	$OnCreate: function () {
		var self = this;

		this.Choose = function (item) {
			self.Chosen = item.Label;
		};
	}
})
</script>
```
