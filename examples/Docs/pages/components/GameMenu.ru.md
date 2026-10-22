<!-- generated -->
# GameMenu

Игровое меню: главное, пауза, список сохранений. Title и Subtitle над пунктами Items ([{ID, Label, Hint, Icon, Disabled}]). Стрелки вверх и вниз (и геймпад) двигают по пунктам по кругу; Enter или нажатие отправляют select ({ID, Item}); Escape отправляет back. AutoFocus (true) ставит фокус на первый пункт при показе.

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Title` | `''` |
| `Subtitle` | `''` |
| `Items` | `[]` |
| `AutoFocus` | `true` |

## События

`select`, `back`

## Слоты

по умолчанию

## Пример

```example
<div class="elemenx-game-panel">
	<GameMenu Title="Paused" Subtitle="Chapter II · The northern road" [items]="Items" (select)="Chose" />
</div>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Note: '',
	Items: [
		{ID: 'resume', Label: 'Resume', Hint: 'Esc'},
		{ID: 'save', Label: 'Save game'},
		{ID: 'settings', Label: 'Settings', Disabled: true},
		{ID: 'quit', Label: 'Quit to title'}
	],

	Chose: function (item) {
		this.Note = 'Chosen: ' + item.Item.Label;
	}
})
</script>
```
