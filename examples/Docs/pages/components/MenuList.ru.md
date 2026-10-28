<!-- generated -->
# MenuList

Один уровень Menu. Items: [{ID, Label, Icon, Shortcut, Disabled, Danger, Checked, Items, Separator, Group}]. Open показывает его: всплывающий список под ближайшим elemenx-popup-anchor вокруг него (ваша кнопка и список в одном элементе с этим классом), расположенный по Placement ('bottom-start'; 'right-start' для подменю), шириной с якорь при MatchWidth. Нажатие вне списка или Escape отправляют «dismiss» с причиной: владелец возвращает Open в false. Пункт с Items открывает вложенный MenuList справа; конечный пункт отправляет «select» с пунктом. Sheet показывает меню как на телефоне: лист снизу экрана поверх затемнения, с крупными строками, своим Title и строкой «Отмена»; пункт с Items открывает свои пункты в том же листе со строкой «назад». Лист следует за пальцем, тянущим его верх (ручку и заголовок) вниз, а свайп вниз там его закрывает. Sheet: false (по умолчанию), true или 'auto' (лист на узком или сенсорном экране, иначе всплывающий список).

## Свойства

| Свойство | По умолчанию |
| --- | --- |
| `Items` | `[]` |
| `Open` | `false` |
| `Placement` | `'bottom-start'` |
| `MatchWidth` | `false` |
| `Sheet` | `false` |
| `Title` | `''` |

## События

- `select`: Выбран конечный пункт: сам пункт.
- `dismiss`: Просит закрыться (владелец ставит Open в false): причина — outside, escape, tab, back, swipe, backdrop или cancel.

## Пример

```example
<span class="elemenx-popup-anchor">
	<Button Label="Actions" Icon="more" (click)="Toggle" />
	<MenuList [items]="Items" [open]="Open" (select)="Picked" (dismiss)="Closed" />
</span>
<span class="elemenx-popup-anchor">
	<Button Label="As a sheet" (click)="ToggleSheet" />
	<MenuList [items]="Items" [open]="Sheet" Sheet="true" Title="Actions" (select)="Picked" (dismiss)="SheetClosed" />
</span>
<p class="elemenx-text small muted">{{Note}}</p>
<script>
({
	Open: false,
	Sheet: false,
	Note: 'One level of a menu under any element of your own: Share opens a level of its own.',
	Items: [
		{ID: 'open', Label: 'Open', Icon: 'external', Shortcut: 'Enter'},
		{ID: 'rename', Label: 'Rename', Icon: 'edit', Shortcut: 'F2'},
		{ID: 'share', Label: 'Share', Icon: 'share', Items: [
			{ID: 'link', Label: 'Copy a link', Icon: 'link'},
			{ID: 'mail', Label: 'By email', Icon: 'mail'}
		]},
		{ID: 'pin', Label: 'Pinned', Icon: 'pin', Checked: true},
		{Separator: true, ID: 'separator'},
		{ID: 'delete', Label: 'Delete', Icon: 'delete', Danger: true}
	],

	Toggle: function () {
		this.Open = !this.Open;
	},

	ToggleSheet: function () {
		this.Sheet = !this.Sheet;
	},

	Closed: function () {
		this.Open = false;
	},

	SheetClosed: function () {
		this.Sheet = false;
	},

	Picked: function (item) {
		this.Open = false;
		this.Sheet = false;
		this.Note = 'Chosen: ' + item.Label;
	}
})
</script>
```

## Тесты

- [MenuList as a sheet takes the focus when it opens, closes on Escape, and gives the focus back to what had it](https://github.com/Qybercom/Elemenx/blob/main/tests/regression/library-new.test.js#L624) — `tests/regression/library-new.test.js`
