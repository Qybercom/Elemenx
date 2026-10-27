<!-- generated -->
# ContextMenu

Контекстное меню над содержимым: правый щелчок, клавиша Menu или Shift+F10 в слоте по умолчанию открывают многоуровневый MenuList у указателя (или под элементом в фокусе). Items — как в MenuList. Перед открытием событие open несёт {Target (нажатый элемент), X, Y}: владелец может поменять Items для этой цели. Событие select несёт {Item, Target}. MenuItem в слоте items объявляют пункты после Items (объявленный пункт отправляет select и на своём MenuItem). Disabled оставляет меню браузера. Sheet: true или 'auto' (на узком или сенсорном экране) показывает меню листом снизу экрана с его Title, как на телефоне. На сенсорном экране его открывает нажатие, удержанное на месте Hold миллисекунд (iOS не присылает contextmenu на долгое нажатие).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Disabled` | `false` |
| `Sheet` | `false` |
| `Title` | `''` |
| `Open` | `false` |
| `X` | `0` |
| `Y` | `0` |
| `Target` | `null` |
| `Hold` | `500` |

## События

- `open`: Сейчас откроется: {Target, X, Y}; владелец может изменить Items для этой цели.
- `select`: Выбран конечный пункт: {Item, Target}.

## Слоты

по умолчанию, `items`

## Пример

```example
<ContextMenu [items]="Menu" (open)="Opened" (select)="Picked">
	<ul class="elemenx-list divided">
		<li *for="file of Files" *key="file" class="docs-file" [attribute.data-file]="file" tabindex="0"><Icon Name="file" /> {{file}}</li>
	</ul>
</ContextMenu>
<p class="elemenx-text small muted">Right click a file (or press the Menu key on it): {{Note}}</p>
<script>
({
	File: '',
	Note: '—',
	Files: ['README.md', 'app.js', 'styles.css'],
	Menu: [
		{ID: 'open', Label: 'Open', Icon: 'external', Shortcut: 'Enter'},
		{ID: 'rename', Label: 'Rename', Icon: 'edit', Shortcut: 'F2'},
		{ID: 'share', Label: 'Share', Icon: 'share', Items: [
			{ID: 'link', Label: 'Copy a link', Icon: 'link'},
			{ID: 'mail', Label: 'By email', Icon: 'mail'}
		]},
		{Separator: true, ID: 'separator'},
		{ID: 'delete', Label: 'Delete', Icon: 'delete', Danger: true, Shortcut: 'Delete'}
	],

	Opened: function (event) {
		var row = event.Target && event.Target.closest ? event.Target.closest('[data-file]') : null;

		this.File = row ? row.getAttribute('data-file') : '';
	},

	Picked: function (event) {
		this.Note = event.Item.Label + (this.File ? ' ' + this.File : '');
	}
})
</script>
```
